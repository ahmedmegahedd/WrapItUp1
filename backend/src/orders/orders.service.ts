import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ProductsService } from '../products/products.service';
import { AddonsService } from '../addons/addons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private supabaseService: SupabaseService,
    private productsService: ProductsService,
    private addonsService: AddonsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.product_id);

      if (!product.is_active) {
        throw new BadRequestException(`Product ${product.title} is not available`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.title}`);
      }

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

      orderItemsData.push({
        product_id: product.id,
        product_title: product.title,
        product_sku: product.sku,
        base_price: product.base_price,
        discount_price: product.discount_price,
        quantity: item.quantity,
        selected_variations: variationSnapshot,
        selected_addons: addonsSnapshot,
        line_total: lineTotal,
      });

      // Decrease stock
      await this.productsService.decreaseStock(product.id, item.quantity);
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: createOrderDto.customer_name,
        customer_email: createOrderDto.customer_email,
        customer_phone: createOrderDto.customer_phone,
        delivery_date: createOrderDto.delivery_date,
        delivery_time_slot: createOrderDto.delivery_time_slot,
        card_message: createOrderDto.card_message,
        subtotal,
        total: subtotal, // Add shipping/tax if needed
        payment_status: 'pending',
        order_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    // Create order items
    const orderItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw new BadRequestException(itemsError.message);

    return this.findOne(order.id);
  }

  async findAll(filters?: {
    status?: string;
    paymentStatus?: string;
    deliveryDate?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .order('created_at', { ascending: false });

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

  async findOne(id: string) {
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

    return this.findOne(id);
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
