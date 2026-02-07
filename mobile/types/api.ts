export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export interface ProductVariationOption {
  id: string;
  label: string;
  price_modifier: number;
  stock_quantity?: number;
}

export interface ProductVariation {
  id: string;
  name: string;
  display_order: number;
  product_variation_options: ProductVariationOption[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  base_price: number;
  discount_price?: number;
  is_active: boolean;
  product_images?: { image_url: string }[];
  product_variations?: ProductVariation[];
}

export interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface DeliveryTimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface DeliveryDestination {
  id: string;
  name: string;
  fee_egp: number;
  display_order: number;
}

export interface AvailableDay {
  date: string;
  status: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  delivery_date: string;
  delivery_time_slot: string;
  delivery_destination_name?: string;
  delivery_fee_egp?: number;
  delivery_address?: string;
  delivery_maps_link?: string;
  discount_amount_egp?: number;
  subtotal: number;
  total: number;
  payment_status: string;
  order_status: string;
  order_items?: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_title: string;
  quantity: number;
  line_total: number;
  selected_variations?: Record<string, string>;
  selected_addons?: { name: string; price: number }[];
}
