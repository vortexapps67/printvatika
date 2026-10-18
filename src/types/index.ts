// TypeScript definitions for Print Vatika

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image_url: string;
  /** Price for one piece (or one square foot for banners). */
  base_price: number;
  is_active: boolean;
  /** The shop's quoted unit, e.g. "/ 100 pcs". Comes from the live database. */
  base_unit?: string;
  /** Pieces included in one quoted price, e.g. 100 for "/ 100 pcs". */
  base_qty?: number;
  /** Lowest price per piece across every option combination (the "from" price). */
  from_price?: number;
  /** The run size the shop suggests first, e.g. 100 for business cards. */
  default_qty?: number;
}

export interface OptionChoice {
  value: string;
  label: string;
  price_modifier?: number; // Optional inline price modifier for quick setup
}

export interface ProductOption {
  id: string;
  product_slug: string;
  name: string; // e.g., 'size', 'paper_type'
  display_name: string; // e.g., 'Select Size', 'Paper Type'
  type: 'select' | 'number' | 'text' | 'dimensions';
  options_json: OptionChoice[]; // Choices for 'select', or sizing instructions for other types
}

export interface PricingRule {
  id: string;
  product_slug: string;
  option_key: string;
  option_value: string;
  price_modifier: number;
  tier_min_qty: number;
  tier_discount_factor: number; // e.g., 0.90 for 10% discount
}

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PRINTING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type FulfillmentType = 'pickup' | 'delivery';

/** A discount code from the shop's settings table. */
export interface Coupon {
  code: string;
  /** `flat` takes money off, `delivery` waives the courier charge. */
  type: 'flat' | 'delivery';
  /** Rupees off for `flat`; the delivery charge covered for `delivery`. */
  value: number;
  label?: string;
  /** Minimum order subtotal, in rupees, before the code unlocks. */
  minOrder?: number;
  active: boolean;
}

export interface Order {
  id: string; // Unique order ID (e.g. PV-1048)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_pincode?: string;
  delivery_charge: number;
  subtotal: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_id?: string;
  user_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_slug: string;
  product_name: string;
  quantity: number;
  selected_options: Record<string, string>; // e.g., { size: 'A4', paper: '300gsm' }
  unit_price: number;
  total_price: number;
  original_file_url?: string;
  preview_file_url?: string;
  design_config?: DesignConfig;
  /** Banner jobs carry their width/height so the press sees the finished size. */
  dimensions?: { width: number; height: number };
  /** Name of the artwork file the customer uploaded (the file itself is never stored). */
  selected_artwork_label?: string;
}

export interface DesignConfig {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  side?: 'front' | 'back';
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface CartItem {
  id: string; // temp unique identifier in cart
  product: Product;
  quantity: number;
  selected_options: Record<string, string>;
  dimensions?: { width: number; height: number }; // For flex/banners
  original_file?: {
    name: string;
    size: number;
    type: string;
    base64: string; // Store base64 representation of original file locally in mock DB
  };
  preview_base64?: string; // Interactive canvas visual state
  design_config?: DesignConfig;
  unit_price: number;
  total_price: number;
}
