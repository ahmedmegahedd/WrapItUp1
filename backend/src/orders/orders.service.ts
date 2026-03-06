import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ProductsService } from '../products/products.service';
import { AddonsService } from '../addons/addons.service';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryDestinationsService } from '../delivery-destinations/delivery-destinations.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { MailService } from '../mail/mail.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { InventoryService } from '../inventory/inventory.service';
import { CollaboratorsService } from '../collaborators/collaborators.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private supabaseService: SupabaseService,
    private productsService: ProductsService,
    private collaboratorsService: CollaboratorsService,
    private addonsService: AddonsService,
    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService,
    private deliveryDestinationsService: DeliveryDestinationsService,
    private promoCodesService: PromoCodesService,
    private mailService: MailService,
    private loyaltyService: LoyaltyService,
    private notificationsService: NotificationsService,
    private analyticsService: AnalyticsService,
    private inventoryService: InventoryService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Validate products and calculate totals
    let subtotal = 0;
    let pointsEarned = 0;
    const orderItemsData = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.product_id);

      if (!product.is_active) {
        throw new BadRequestException(`Product ${product.title} is not available`);
      }

      await this.productsService.checkStockForOrderItem(
        product.id,
        item.quantity,
        item.selected_variations,
      );

      // Calculate price with variations
      let itemPrice = product.discount_price || product.base_price;

      if (item.selected_variations) {
        // Get variation price modifiers
        for (const variation of product.product_variations || []) {
          const selectedOptionId = item.selected_variations[variation.name];
          if (selectedOptionId) {
            const option = variation.product_variation_options?.find(
              (opt: any) => opt.id === selectedOptionId,
            );
            if (option) {
              itemPrice += parseFloat(option.price_modifier || 0);
            }
          }
        }
      }

      let lineTotal = itemPrice * item.quantity;

      // Store variation details for snapshot
      const variationSnapshot: any = {};
      if (item.selected_variations) {
        for (const variation of product.product_variations || []) {
          const selectedOptionId = item.selected_variations[variation.name];
          if (selectedOptionId) {
            const option = variation.product_variation_options?.find(
              (opt: any) => opt.id === selectedOptionId,
            );
            if (option) {
              variationSnapshot[variation.name] = option.label;
            }
          }
        }
      }

      // Process add-ons
      const addonsSnapshot: any[] = [];
      if (item.selected_addons && item.selected_addons.length > 0) {
        for (const addonId of item.selected_addons) {
          try {
            const addon = await this.addonsService.findOne(addonId);
            addonsSnapshot.push({
              id: addon.id,
              name: addon.name,
              price: addon.price,
            });
            // Add add-on price to line total
            lineTotal += parseFloat(addon.price || 0) * item.quantity;
          } catch (error) {
            // Add-on not found, skip it
            console.warn(`Add-on ${addonId} not found, skipping`);
          }
        }
      }

      subtotal += lineTotal;
      pointsEarned += ((product as any).points_value ?? 0) * item.quantity;

      const selectedVariationOptionIds = item.selected_variations || undefined;

      orderItemsData.push({
        product_id: product.id,
        product_title: product.title,
        product_sku: (product as any).sku ?? '',
        base_price: product.base_price,
        discount_price: product.discount_price,
        quantity: item.quantity,
        selected_variations: variationSnapshot,
        selected_addons: addonsSnapshot,
        selected_variation_option_ids: selectedVariationOptionIds,
        line_total: lineTotal,
        unit_price: itemPrice,
        collaborator_id: (product as any).collaborator_id ?? null,
      });
    }

    // Delivery destination (required for new flow)
    let deliveryDestinationName: string | null = null;
    let deliveryFeeEgp = 0;
    if (createOrderDto.delivery_destination_id) {
      const dest = await this.deliveryDestinationsService.findOne(createOrderDto.delivery_destination_id);
      deliveryDestinationName = dest.name;
      deliveryFeeEgp = parseFloat(String(dest.fee_egp || 0));
    } else if (createOrderDto.delivery_fee_egp != null) {
      deliveryFeeEgp = createOrderDto.delivery_fee_egp;
    }

    const discountAmountEgp = createOrderDto.discount_amount_egp ?? 0;
    const total = Math.max(0, subtotal - discountAmountEgp + deliveryFeeEgp);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Validate delivery time slot if ID is provided
    let deliveryTimeSlotText = createOrderDto.delivery_time_slot;
    if (createOrderDto.delivery_time_slot_id) {
      try {
        const timeSlot = await this.deliveryService.getTimeSlot(createOrderDto.delivery_time_slot_id);
        deliveryTimeSlotText = timeSlot.label;
      } catch (error) {
        throw new BadRequestException('Invalid delivery time slot ID');
      }
    }

    if (!deliveryTimeSlotText) {
      throw new BadRequestException('Delivery time slot is required');
    }

    const paymentMethod = createOrderDto.payment_method || 'card';
    const isCod = paymentMethod === 'cod';

    // Create order
    const insertPayload: Record<string, unknown> = {
      order_number: orderNumber,
      customer_name: createOrderDto.customer_name,
      payment_method: paymentMethod,
      customer_email: createOrderDto.customer_email,
      customer_phone: createOrderDto.customer_phone,
      delivery_date: createOrderDto.delivery_date,
      delivery_time_slot: deliveryTimeSlotText,
      delivery_time_slot_id: createOrderDto.delivery_time_slot_id || null,
      card_message: createOrderDto.card_message,
      delivery_destination_id: createOrderDto.delivery_destination_id || null,
      delivery_destination_name: deliveryDestinationName,
      delivery_fee_egp: deliveryFeeEgp,
      delivery_address: createOrderDto.delivery_address || null,
      delivery_maps_link: createOrderDto.delivery_maps_link || null,
      promo_code_id: createOrderDto.promo_code_id || null,
      discount_amount_egp: discountAmountEgp,
      subtotal,
      total,
      points_earned: pointsEarned,
      payment_status: isCod ? 'PENDING_CASH' : 'pending',
      order_status: 'pending',
    };
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const orderItems = orderItemsData.map((item) => {
      const { selected_variation_option_ids, ...rest } = item;
      return {
        ...rest,
        order_id: order.id,
        selected_variation_option_ids: selected_variation_option_ids || null,
      };
    });

    const { data: insertedOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select('id, product_id, quantity, line_total');
    if (itemsError) throw new BadRequestException(itemsError.message);

    try {
      await this.recordCommissionsForOrder(order.id, orderItemsData, insertedOrderItems || []);
    } catch (e) {
      console.warn('[Orders] recordCommissionsForOrder failed (non-blocking):', e);
    }

    try {
      const orderItemsForInventory = orderItemsData.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));
      await this.inventoryService.deductInventoryForOrder(order.id, orderItemsForInventory);
    } catch (e) {
      console.warn('[Orders] deductInventoryForOrder failed (non-blocking):', e);
    }

    if (isCod) {
      try {
        await this.onPaymentSuccess(order.id);
      } catch (e) {
        console.error('[Orders] COD onPaymentSuccess failed:', e);
      }
    }

    try {
      await this.analyticsService.markCheckoutConverted(createOrderDto.customer_email);
    } catch (e) {
      console.warn('[Orders] markCheckoutConverted failed:', e);
    }

    return this.findOne(order.id);
  }

  /** Called after Paymob webhook confirms payment: decrease stock, send email, increment promo usage. */
  async onPaymentSuccess(orderId: string): Promise<void> {
    const order = await this.findOne(orderId);
    const items = order.order_items || [];

    for (const item of items) {
      await this.productsService.decreaseStockForOrderItem(
        item.product_id,
        item.quantity,
        item.selected_variation_option_ids,
      );
    }

    if (order.promo_code_id) {
      try {
        await this.promoCodesService.incrementUsage(order.promo_code_id);
      } catch (e) {
        console.warn('[Orders] Failed to increment promo usage:', e);
      }
    }

    const pointsEarned = order.points_earned ?? 0;
    if (pointsEarned > 0) {
      try {
        await this.loyaltyService.grantPointsForOrder(order.id, order.customer_email, pointsEarned);
      } catch (e) {
        console.warn('[Orders] Failed to grant loyalty points:', e);
      }
    }

    const deliveryDateStr =
      typeof order.delivery_date === 'string'
        ? order.delivery_date
        : order.delivery_date
          ? new Date(order.delivery_date).toISOString().split('T')[0]
          : '';

    await this.mailService.sendOrderConfirmation({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      delivery_date: deliveryDateStr,
      delivery_time_slot: order.delivery_time_slot || '',
      delivery_destination_name: order.delivery_destination_name || undefined,
      delivery_address: order.delivery_address || undefined,
      delivery_maps_link: order.delivery_maps_link || undefined,
      items: items.map((i: any) => ({
        product_title: i.product_title,
        quantity: i.quantity,
        selected_variations: i.selected_variations,
        selected_addons: i.selected_addons,
        line_total: parseFloat(i.line_total),
      })),
      subtotal_egp: parseFloat(order.subtotal),
      discount_amount_egp: order.discount_amount_egp != null ? parseFloat(order.discount_amount_egp) : undefined,
      delivery_fee_egp: order.delivery_fee_egp != null ? parseFloat(order.delivery_fee_egp) : undefined,
      total_egp: parseFloat(order.total),
    });

    try {
      await this.notificationsService.sendOrderConfirmationPush(
        order.customer_email,
        order.order_number,
      );
    } catch (e) {
      console.warn('[Orders] Push notification failed:', e);
    }
  }

  async findAll(
    filters?: {
      status?: string;
      paymentStatus?: string;
      deliveryDate?: string;
      startDate?: string;
      endDate?: string;
    },
    collaboratorId?: string | null,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    let orderIds: string[] | null = null;
    if (collaboratorId) {
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('collaborator_id', collaboratorId);
      const productIds = (products || []).map((p) => p.id);
      if (productIds.length === 0) return [];
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds);
      orderIds = [...new Set((orderItems || []).map((oi) => oi.order_id))];
      if (orderIds.length === 0) return [];
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (orderIds) {
      query = query.in('id', orderIds);
    }
    if (filters?.status) {
      query = query.eq('order_status', filters.status);
    }
    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }
    if (filters?.deliveryDate) {
      query = query.eq('delivery_date', filters.deliveryDate);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string, collaboratorId?: string | null) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Order not found');
    }
    if (collaboratorId) {
      const productIds = (data.order_items || []).map((i: any) => i.product_id).filter(Boolean);
      if (productIds.length === 0) throw new NotFoundException('Order not found');
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds)
        .eq('collaborator_id', collaboratorId);
      if (!products?.length) throw new NotFoundException('Order not found');
    }
    return data;
  }

  /** Order with admin notes (for admin panel). Notes are internal only. */
  async findOneWithAdminNotes(id: string, collaboratorId?: string | null) {
    const order = await this.findOne(id, collaboratorId);
    const supabase = this.supabaseService.getAdminClient();
    const [notesRes, profileRes] = await Promise.all([
      supabase
        .from('order_admin_notes')
        .select('id, admin_id, admin_name, note, created_at')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
      order.customer_email
        ? supabase.from('profiles').select('id').eq('email', order.customer_email).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const admin_notes = notesRes.data ?? [];
    const customer_user_id = profileRes.data?.id ?? null;
    return { ...order, admin_notes, customer_user_id };
  }

  /** Add an internal admin note to an order. Admin-only. */
  async addAdminNote(
    orderId: string,
    payload: { admin_id: string; admin_name: string; note: string },
  ) {
    const supabase = this.supabaseService.getAdminClient();
    await this.findOne(orderId);
    const { data, error } = await supabase
      .from('order_admin_notes')
      .insert({
        order_id: orderId,
        admin_id: payload.admin_id,
        admin_name: payload.admin_name || null,
        note: payload.note.trim(),
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findByOrderNumber(orderNumber: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) {
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const supabase = this.supabaseService.getAdminClient();

    await this.findOne(id);

    if (updateOrderStatusDto.order_status === 'cancelled') {
      try {
        await this.inventoryService.refundInventoryForOrder(id);
      } catch (e) {
        console.warn('[Orders] refundInventoryForOrder failed (non-blocking):', e);
      }
    }

    const { error } = await supabase
      .from('orders')
      .update({ order_status: updateOrderStatusDto.order_status })
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return this.findOne(id);
  }

  async updatePaymentStatus(id: string, paymentStatus: string, stripePaymentIntentId?: string) {
    const supabase = this.supabaseService.getAdminClient();

    const updateData: any = { payment_status: paymentStatus };
    if (stripePaymentIntentId) {
      updateData.stripe_payment_intent_id = stripePaymentIntentId;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    if (paymentStatus === 'paid') {
      try {
        await this.onPaymentSuccess(id);
      } catch (e) {
        console.error('[Orders] onPaymentSuccess failed:', e);
      }
    }

    return this.findOne(id);
  }

  private async recordCommissionsForOrder(
    orderId: string,
    orderItemsData: Array<{
      product_id: string;
      product_title: string;
      quantity: number;
      line_total: number;
      unit_price: number;
      collaborator_id?: string | null;
    }>,
    insertedOrderItems: Array<{ id: string; product_id: string; quantity: number; line_total: number }>,
  ): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();
    for (const item of orderItemsData) {
      if (!item.collaborator_id) continue;
      const inserted = insertedOrderItems.find(
        (oi) => oi.product_id === item.product_id && oi.quantity === item.quantity,
      );
      if (!inserted) continue;
      const collaborator = await this.collaboratorsService.getCollaboratorById(item.collaborator_id);
      const rate = Number(collaborator.commission_rate ?? 0);
      const subtotal = Number(item.line_total);
      const commissionAmount = Math.round((subtotal * (rate / 100)) * 100) / 100;
      const wrapitupAmount = Math.round((subtotal - commissionAmount) * 100) / 100;
      await supabase.from('commission_records').insert({
        collaborator_id: item.collaborator_id,
        order_id: orderId,
        order_item_id: inserted.id,
        product_id: item.product_id,
        product_name: item.product_title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal,
        commission_rate: rate,
        commission_amount: commissionAmount,
        wrapitup_amount: wrapitupAmount,
        payout_status: 'pending',
      });
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const supabase = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Get count of orders today
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today.substring(0, 4)}-${today.substring(4, 6)}-${today.substring(6, 8)}T00:00:00`);

    const sequence = ((count || 0) + 1).toString().padStart(6, '0');
    return `WRP-${today}-${sequence}`;
  }
}
