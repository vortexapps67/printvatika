import fs from 'fs';
import path from 'path';
import { Coupon, Product, ProductOption, PricingRule, Order, OrderItem, OrderStatus, PaymentStatus, OrderStatusHistory } from '../types';
import { supabaseConfigured, supabaseStore } from './supabaseStore';

// Path for local file fallback database
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
function initLocalDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const seedData = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
}

// In-Memory / File-based Database implementation
function readLocalDb(): {
  products: Product[];
  product_options: ProductOption[];
  pricing_rules: PricingRule[];
  orders: Order[];
  order_items: OrderItem[];
  order_status_history: OrderStatusHistory[];
  admin_users: { email: string; passwordHash: string }[];
} {
  initLocalDbFile();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading fallback database, resetting with seed data:', error);
    const seed = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function writeLocalDb(data: any) {
  initLocalDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Seed data definition
function getSeedData() {
  const products: Product[] = [
    {
      id: 'p1',
      name: 'Business Cards',
      slug: 'business-cards',
      description: 'Premium visiting cards to make a lasting first impression. Single/Double sided on heavy cardstock.',
      category: 'Stationery',
      image_url: '/images/business-cards.jpg',
      base_price: 1.00,
      is_active: true,
    },
    {
      id: 'p2',
      name: 'Custom T-Shirts',
      slug: 't-shirts',
      description: 'High-quality cotton t-shirts with front, back, or double-sided printing. Choose colors & sizes.',
      category: 'Apparel',
      image_url: '/images/t-shirts.jpg',
      base_price: 249.00,
      is_active: true,
    },
    {
      id: 'p3',
      name: 'Flex Banners',
      slug: 'flex-banners',
      description: 'Weatherproof indoor/outdoor advertising flex banners. Enter custom dimensions and finishes.',
      category: 'Signage',
      image_url: '/images/flex-banners.jpg',
      base_price: 15.00, // per sqft
      is_active: true,
    },
    {
      id: 'p4',
      name: 'Flyers & Pamphlets',
      slug: 'flyers',
      description: 'Vibrant promotional flyers to spread the word. Perfect for distribution and letterbox drops.',
      category: 'Marketing',
      image_url: '/images/flyers.jpg',
      base_price: 2.00,
      is_active: true,
    },
    {
      id: 'p5',
      name: 'Posters',
      slug: 'posters',
      description: 'Large high-definition wall posters for events, announcements, or custom decor.',
      category: 'Marketing',
      image_url: '/images/posters.jpg',
      base_price: 49.00,
      is_active: true,
    },
    {
      id: 'p6',
      name: 'Brochures',
      slug: 'brochures',
      description: 'Professional folded bi-fold or tri-fold brochures to showcase your brand product catalog.',
      category: 'Marketing',
      image_url: '/images/brochures.jpg',
      base_price: 8.00,
      is_active: true,
    },
    {
      id: 'p7',
      name: 'Stickers & Labels',
      slug: 'stickers',
      description: 'Die-cut custom shape circle or square labels. Waterproof vinyl options available.',
      category: 'Stationery',
      image_url: '/images/stickers.svg',
      base_price: 3.00,
      is_active: true,
    },
    {
      id: 'p8',
      name: 'Custom Printing',
      slug: 'custom-print',
      description: 'Have a unique requirement? Upload your files and specify requirements for a custom quotation.',
      category: 'Specialty',
      image_url: '/images/custom-print.jpg',
      base_price: 99.00,
      is_active: true,
    }
  ];

  const product_options: ProductOption[] = [
    // Business Card options
    {
      id: 'o1',
      product_slug: 'business-cards',
      name: 'size',
      display_name: 'Select Size',
      type: 'select',
      options_json: [
        { value: 'standard', label: 'Standard (3.5" × 2.0")', price_modifier: 0 },
        { value: 'square', label: 'Square (2.0" × 2.0")', price_modifier: 0.20 },
        { value: 'slim', label: 'Slim (3.5" × 1.75")', price_modifier: 0.10 }
      ]
    },
    {
      id: 'o2',
      product_slug: 'business-cards',
      name: 'sides',
      display_name: 'Printing Sides',
      type: 'select',
      options_json: [
        { value: 'single', label: 'Single-sided', price_modifier: 0 },
        { value: 'double', label: 'Double-sided', price_modifier: 0.50 }
      ]
    },
    {
      id: 'o3',
      product_slug: 'business-cards',
      name: 'paper',
      display_name: 'Paper Stock',
      type: 'select',
      options_json: [
        { value: '300gsm', label: '300 GSM Art Card (Standard)', price_modifier: 0 },
        { value: '350gsm', label: '350 GSM Premium Card', price_modifier: 0.30 },
        { value: '400gsm', label: '400 GSM Ultra Heavy Card', price_modifier: 0.70 }
      ]
    },
    {
      id: 'o4',
      product_slug: 'business-cards',
      name: 'finish',
      display_name: 'Lamination Finish',
      type: 'select',
      options_json: [
        { value: 'none', label: 'No Lamination', price_modifier: 0 },
        { value: 'matte', label: 'Matte Lamination', price_modifier: 0.40 },
        { value: 'gloss', label: 'Gloss Lamination', price_modifier: 0.40 },
        { value: 'velvet', label: 'Velvet Soft Touch Lamination', price_modifier: 1.20 }
      ]
    },

    // T-Shirt options
    {
      id: 'o5',
      product_slug: 't-shirts',
      name: 'color',
      display_name: 'T-Shirt Color',
      type: 'select',
      options_json: [
        { value: 'white', label: 'Pure White', price_modifier: 0 },
        { value: 'black', label: 'Classic Black', price_modifier: 50.00 },
        { value: 'navy', label: 'Navy Blue', price_modifier: 50.00 },
        { value: 'grey', label: 'Sports Grey', price_modifier: 30.00 }
      ]
    },
    {
      id: 'o6',
      product_slug: 't-shirts',
      name: 'size',
      display_name: 'T-Shirt Size',
      type: 'select',
      options_json: [
        { value: 'S', label: 'Small (S)', price_modifier: 0 },
        { value: 'M', label: 'Medium (M)', price_modifier: 0 },
        { value: 'L', label: 'Large (L)', price_modifier: 0 },
        { value: 'XL', label: 'Extra Large (XL)', price_modifier: 20.00 },
        { value: 'XXL', label: 'Double Extra Large (XXL)', price_modifier: 40.00 }
      ]
    },
    {
      id: 'o7',
      product_slug: 't-shirts',
      name: 'position',
      display_name: 'Print Position',
      type: 'select',
      options_json: [
        { value: 'front', label: 'Front Only', price_modifier: 0 },
        { value: 'back', label: 'Back Only', price_modifier: 10.00 },
        { value: 'both', label: 'Front + Back', price_modifier: 100.00 }
      ]
    },
    {
      id: 'o8',
      product_slug: 't-shirts',
      name: 'print_size',
      display_name: 'Design Print Size',
      type: 'select',
      options_json: [
        { value: 'a4', label: 'Standard A4 Size', price_modifier: 0 },
        { value: 'a3', label: 'Oversized A3 Size', price_modifier: 50.00 },
        { value: 'pocket', label: 'Pocket Size (Chest)', price_modifier: -30.00 }
      ]
    },

    // Flex Banner options
    {
      id: 'o9',
      product_slug: 'flex-banners',
      name: 'dimensions',
      display_name: 'Enter Banner Size (Feet)',
      type: 'dimensions',
      options_json: [
        { value: 'width', label: 'Width (Feet)', price_modifier: 4 }, // Default width
        { value: 'height', label: 'Height (Feet)', price_modifier: 3 } // Default height
      ]
    },
    {
      id: 'o10',
      product_slug: 'flex-banners',
      name: 'material',
      display_name: 'Flex Material',
      type: 'select',
      options_json: [
        { value: 'normal', label: 'Standard Star Flex (Normal)', price_modifier: 0 }, // unit multiplier modifier relative to base
        { value: 'heavy', label: 'Black Back Heavy Flex (Opaque)', price_modifier: 10.00 }, // +₹10 per sqft
        { value: 'star', label: 'Premium Star Flex (Glossy)', price_modifier: 15.00 }, // +₹15 per sqft
        { value: 'vinyl', label: 'Eco-Solvent Vinyl Print', price_modifier: 25.00 } // +₹25 per sqft
      ]
    },
    {
      id: 'o11',
      product_slug: 'flex-banners',
      name: 'finishing',
      display_name: 'Grommets / Finishing',
      type: 'select',
      options_json: [
        { value: 'none', label: 'Cut to Size (No grommets)', price_modifier: 0 },
        { value: 'corners', label: 'Eyelets (Grommets) on 4 corners', price_modifier: 20.00 }, // Fixed cost
        { value: 'border', label: 'Eyelets every 2 feet on edges', price_modifier: 50.00 }, // Fixed cost
        { value: 'pockets', label: 'Hanger Pockets (Top & Bottom)', price_modifier: 35.00 } // Fixed cost
      ]
    },

    // Flyers options
    {
      id: 'o12',
      product_slug: 'flyers',
      name: 'size',
      display_name: 'Flyer Size',
      type: 'select',
      options_json: [
        { value: 'a4', label: 'A4 Size', price_modifier: 1.00 },
        { value: 'a5', label: 'A5 Size (Standard)', price_modifier: 0 },
        { value: 'a6', label: 'A6 Size (Pocket)', price_modifier: -0.50 }
      ]
    },
    {
      id: 'o13',
      product_slug: 'flyers',
      name: 'paper',
      display_name: 'Paper Grade',
      type: 'select',
      options_json: [
        { value: '130gsm', label: '130 GSM Gloss Art Paper', price_modifier: 0 },
        { value: '170gsm', label: '170 GSM Premium Gloss Art', price_modifier: 0.50 },
        { value: '300gsm', label: '300 GSM Heavy Art Card', price_modifier: 1.80 }
      ]
    },
    {
      id: 'o14',
      product_slug: 'flyers',
      name: 'sides',
      display_name: 'Printing Sides',
      type: 'select',
      options_json: [
        { value: 'single', label: 'Single-sided', price_modifier: 0 },
        { value: 'double', label: 'Double-sided', price_modifier: 0.80 }
      ]
    },

    // Posters options
    {
      id: 'o15',
      product_slug: 'posters',
      name: 'size',
      display_name: 'Poster Size',
      type: 'select',
      options_json: [
        { value: 'a3', label: 'A3 Size', price_modifier: 0 },
        { value: 'a2', label: 'A2 Size', price_modifier: 60.00 },
        { value: 'a1', label: 'A1 Large Size', price_modifier: 140.00 }
      ]
    },
    {
      id: 'o16',
      product_slug: 'posters',
      name: 'paper',
      display_name: 'Poster Finish',
      type: 'select',
      options_json: [
        { value: '170gsm', label: '170 GSM Matte Finish Paper', price_modifier: 0 },
        { value: '220gsm', label: '220 GSM High Gloss Photo Paper', price_modifier: 30.00 },
        { value: 'synthetic', label: 'Waterproof Non-Tearable Synthetic', price_modifier: 75.00 }
      ]
    },

    // Brochures options
    {
      id: 'o17',
      product_slug: 'brochures',
      name: 'folding',
      display_name: 'Fold Type',
      type: 'select',
      options_json: [
        { value: 'bifold', label: 'Bi-Fold (4 Pages)', price_modifier: 0 },
        { value: 'trifold', label: 'Tri-Fold (6 Pages)', price_modifier: 1.50 },
        { value: 'zfold', label: 'Z-Fold (6 Pages)', price_modifier: 2.00 }
      ]
    },
    {
      id: 'o18',
      product_slug: 'brochures',
      name: 'paper',
      display_name: 'Paper Type',
      type: 'select',
      options_json: [
        { value: '130gsm', label: '130 GSM Glossy Paper', price_modifier: 0 },
        { value: '170gsm', label: '170 GSM Premium Paper', price_modifier: 1.00 },
        { value: '250gsm', label: '250 GSM Heavy Brochure Card', price_modifier: 3.50 }
      ]
    },

    // Stickers options
    {
      id: 'o19',
      product_slug: 'stickers',
      name: 'shape',
      display_name: 'Sticker Shape',
      type: 'select',
      options_json: [
        { value: 'circle', label: 'Circular Shape', price_modifier: 0 },
        { value: 'square', label: 'Square Shape', price_modifier: 0 },
        { value: 'rectangle', label: 'Rectangle Shape', price_modifier: 0 },
        { value: 'custom', label: 'Custom Die-Cut Shape', price_modifier: 1.00 }
      ]
    },
    {
      id: 'o20',
      product_slug: 'stickers',
      name: 'material',
      display_name: 'Sticker Material',
      type: 'select',
      options_json: [
        { value: 'paper', label: 'Gloss Paper Sticker', price_modifier: 0 },
        { value: 'vinyl', label: 'Waterproof White Vinyl Sticker', price_modifier: 2.00 },
        { value: 'transparent', label: 'Transparent Vinyl Sticker', price_modifier: 2.50 }
      ]
    },
    {
      id: 'o21',
      product_slug: 'stickers',
      name: 'size',
      display_name: 'Sticker Size',
      type: 'select',
      options_json: [
        { value: '2x2', label: '2" × 2" inch size', price_modifier: 0 },
        { value: '3x3', label: '3" × 3" inch size', price_modifier: 1.50 },
        { value: '4x4', label: '4" × 4" inch size', price_modifier: 3.00 }
      ]
    },

    // Custom Print Options
    {
      id: 'o22',
      product_slug: 'custom-print',
      name: 'notes',
      display_name: 'Describe Your Printing Requirements',
      type: 'text',
      options_json: []
    }
  ];

  // Pricing rules (quantity discounts)
  const pricing_rules: PricingRule[] = [
    // Business cards quantity volume discounts
    { id: 'r1', product_slug: 'business-cards', option_key: 'quantity', option_value: '100', price_modifier: 0, tier_min_qty: 100, tier_discount_factor: 1.0 },
    { id: 'r2', product_slug: 'business-cards', option_key: 'quantity', option_value: '250', price_modifier: 0, tier_min_qty: 250, tier_discount_factor: 0.90 }, // 10% off
    { id: 'r3', product_slug: 'business-cards', option_key: 'quantity', option_value: '500', price_modifier: 0, tier_min_qty: 500, tier_discount_factor: 0.80 }, // 20% off
    { id: 'r4', product_slug: 'business-cards', option_key: 'quantity', option_value: '1000', price_modifier: 0, tier_min_qty: 1000, tier_discount_factor: 0.70 }, // 30% off

    // T-shirts quantity volume discounts
    { id: 'r5', product_slug: 't-shirts', option_key: 'quantity', option_value: '5', price_modifier: 0, tier_min_qty: 5, tier_discount_factor: 0.95 },
    { id: 'r6', product_slug: 't-shirts', option_key: 'quantity', option_value: '10', price_modifier: 0, tier_min_qty: 10, tier_discount_factor: 0.90 },
    { id: 'r7', product_slug: 't-shirts', option_key: 'quantity', option_value: '50', price_modifier: 0, tier_min_qty: 50, tier_discount_factor: 0.80 },

    // Flex banner square footage discount tier
    { id: 'r8', product_slug: 'flex-banners', option_key: 'sqft', option_value: '50', price_modifier: 0, tier_min_qty: 50, tier_discount_factor: 0.90 },
    { id: 'r9', product_slug: 'flex-banners', option_key: 'sqft', option_value: '100', price_modifier: 0, tier_min_qty: 100, tier_discount_factor: 0.80 },

    // Flyers quantity volume discounts
    { id: 'r10', product_slug: 'flyers', option_key: 'quantity', option_value: '500', price_modifier: 0, tier_min_qty: 500, tier_discount_factor: 0.85 },
    { id: 'r11', product_slug: 'flyers', option_key: 'quantity', option_value: '1000', price_modifier: 0, tier_min_qty: 1000, tier_discount_factor: 0.75 },
    { id: 'r12', product_slug: 'flyers', option_key: 'quantity', option_value: '5000', price_modifier: 0, tier_min_qty: 5000, tier_discount_factor: 0.65 }
  ];

  const orders: Order[] = [];
  const order_items: OrderItem[] = [];
  const order_status_history: OrderStatusHistory[] = [];

  const admin_users = [
    {
      email: 'admin@printerwala.com',
      passwordHash: 'admin123' // Simplified password check for local sandbox run
    }
  ];

  return {
    products,
    product_options,
    pricing_rules,
    orders,
    order_items,
    order_status_history,
    admin_users
  };
}

// Local JSON-file implementation. Used when no Supabase project is configured.
class LocalDb {
  static async getProducts(): Promise<Product[]> {
    const db = readLocalDb();
    return db.products.filter(p => p.is_active);
  }

  static async getProductBySlug(slug: string): Promise<Product | null> {
    const db = readLocalDb();
    const product = db.products.find(p => p.slug === slug);
    return product || null;
  }

  static async getProductOptions(slug: string): Promise<ProductOption[]> {
    const db = readLocalDb();
    return db.product_options.filter(o => o.product_slug === slug);
  }

  static async getPricingRules(slug: string): Promise<PricingRule[]> {
    const db = readLocalDb();
    return db.pricing_rules.filter(r => r.product_slug === slug);
  }

  /** Every tier, everywhere. The storefront uses this to show each product's
   *  deepest real discount instead of inventing a "was ₹X" price. */
  static async getAllPricingRules(): Promise<PricingRule[]> {
    const db = readLocalDb();
    return db.pricing_rules;
  }

  // Create an Order
  static async createOrder(
    orderInput: Omit<Order, 'created_at' | 'updated_at' | 'status_history' | 'items'>,
    itemsInput: Array<Omit<OrderItem, 'id' | 'order_id'>>
  ): Promise<Order> {
    const db = readLocalDb();
    const timestamp = new Date().toISOString();

    const newOrder: Order = {
      ...orderInput,
      created_at: timestamp,
      updated_at: timestamp
    };

    const newItems: OrderItem[] = itemsInput.map((item, index) => ({
      ...item,
      id: `item-${newOrder.id}-${index}-${Math.floor(Math.random() * 1000)}`,
      order_id: newOrder.id
    }));

    const statusHistory: OrderStatusHistory = {
      id: `sh-${newOrder.id}-${timestamp}`,
      order_id: newOrder.id,
      status: newOrder.order_status,
      notes: 'Order initiated',
      created_at: timestamp
    };

    db.orders.push(newOrder);
    db.order_items.push(...newItems);
    db.order_status_history.push(statusHistory);

    writeLocalDb(db);

    return {
      ...newOrder,
      items: newItems,
      status_history: [statusHistory]
    };
  }

  // Get order details with items and status logs
  static async getOrderById(orderId: string): Promise<Order | null> {
    const db = readLocalDb();
    const cleanId = orderId.toUpperCase().trim();
    const order = db.orders.find(o => o.id === cleanId || o.id === `#${cleanId}`);
    if (!order) return null;

    const items = db.order_items.filter(item => item.order_id === order.id);
    const status_history = db.order_status_history
      .filter(sh => sh.order_id === order.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      ...order,
      items,
      status_history
    };
  }

  // Check order by ID + Phone
  static async getOrderByIdAndPhone(orderId: string, phone: string): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    // Remove whitespace and check match
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanOrderPhone = order.customer_phone.replace(/\D/g, '');

    // Allow search if last 10 digits match to handle +91 codes
    if (cleanPhone.slice(-10) === cleanOrderPhone.slice(-10)) {
      return order;
    }
    return null;
  }

  // Get all orders (Admin views)
  static async getOrders(filters?: {
    status?: OrderStatus;
    search?: string;
    date?: string;
  }): Promise<Order[]> {
    const db = readLocalDb();
    let result = [...db.orders];

    if (filters) {
      if (filters.status) {
        result = result.filter(o => o.order_status === filters.status);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(o => 
          o.id.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_phone.includes(query) ||
          o.customer_email.toLowerCase().includes(query)
        );
      }
      if (filters.date) {
        // filter by YYYY-MM-DD
        result = result.filter(o => o.created_at.startsWith(filters.date!));
      }
    }

    // Attach items
    return result.map(o => ({
      ...o,
      items: db.order_items.filter(item => item.order_id === o.id),
      status_history: db.order_status_history.filter(sh => sh.order_id === o.id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Update Status
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    notes?: string
  ): Promise<Order | null> {
    const db = readLocalDb();
    const orderIndex = db.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    const timestamp = new Date().toISOString();
    db.orders[orderIndex].order_status = status;
    db.orders[orderIndex].updated_at = timestamp;

    if (paymentStatus) {
      db.orders[orderIndex].payment_status = paymentStatus;
    }

    const historyEntry: OrderStatusHistory = {
      id: `sh-${orderId}-${Date.now()}`,
      order_id: orderId,
      status,
      notes: notes || `Status updated to ${status}`,
      created_at: timestamp
    };

    db.order_status_history.push(historyEntry);
    writeLocalDb(db);

    return this.getOrderById(orderId);
  }

  // Update order payment code
  static async setOrderPaid(orderId: string, paymentId: string): Promise<Order | null> {
    const db = readLocalDb();
    const orderIndex = db.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    db.orders[orderIndex].payment_status = 'PAID';
    db.orders[orderIndex].order_status = 'PAID'; // transition from PAYMENT_PENDING to PAID
    db.orders[orderIndex].payment_id = paymentId;
    db.orders[orderIndex].updated_at = new Date().toISOString();

    const historyEntry: OrderStatusHistory = {
      id: `sh-${orderId}-${Date.now()}`,
      order_id: orderId,
      status: 'PAID',
      notes: `Payment verified. Transaction ID: ${paymentId}`,
      created_at: new Date().toISOString()
    };

    db.order_status_history.push(historyEntry);
    writeLocalDb(db);

    return this.getOrderById(orderId);
  }

  // Admin authenticate
  static async authenticateAdmin(email: string, passwordHash: string): Promise<boolean> {
    const db = readLocalDb();
    const admin = db.admin_users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!admin) return false;

    // Simple password check for local runs. In full production, this maps to bcrypt/Supabase Auth
    return admin.passwordHash === passwordHash;
  }

  /* The local JSON file has no `settings` table, so it has no discount codes
     either. Offline runs simply accept none — the live codes come from the shop's
     own settings row. */
  static async getCoupons(): Promise<Coupon[]> {
    return [];
  }

  // Admin updates
  static async updateProductPrice(slug: string, basePrice: number): Promise<boolean> {
    const db = readLocalDb();
    const idx = db.products.findIndex(p => p.slug === slug);
    if (idx === -1) return false;

    db.products[idx].base_price = Number(basePrice);
    writeLocalDb(db);
    return true;
  }

  static async updateProductOptions(slug: string, options: ProductOption[]): Promise<boolean> {
    const db = readLocalDb();
    // Filter out options for other products
    db.product_options = db.product_options.filter(o => o.product_slug !== slug);
    db.product_options.push(...options);
    writeLocalDb(db);
    return true;
  }

  static async updatePricingRules(slug: string, rules: PricingRule[]): Promise<boolean> {
    const db = readLocalDb();
    db.pricing_rules = db.pricing_rules.filter(r => r.product_slug !== slug);
    db.pricing_rules.push(...rules);
    writeLocalDb(db);
    return true;
  }

  static async addProduct(product: Product, options: ProductOption[]): Promise<boolean> {
    const db = readLocalDb();
    if (db.products.some(p => p.slug === product.slug)) {
      return false; // already exists
    }

    db.products.push(product);
    db.product_options.push(...options);
    writeLocalDb(db);
    return true;
  }

  static async toggleProductActive(slug: string): Promise<boolean> {
    const db = readLocalDb();
    const idx = db.products.findIndex(p => p.slug === slug);
    if (idx === -1) return false;

    db.products[idx].is_active = !db.products[idx].is_active;
    writeLocalDb(db);
    return true;
  }
}

/* ── Storage dispatch ─────────────────────────────────────────────────────────
   The live shop runs on Supabase, so that is the default everywhere. When no
   project is configured - a fresh clone, or CI - the local JSON file above
   keeps every route working, so development never needs real keys. */

export class DbClient {
  static async getProducts(): Promise<Product[]> {
    return supabaseConfigured() ? supabaseStore.getProducts() : LocalDb.getProducts();
  }

  static async getProductBySlug(slug: string): Promise<Product | null> {
    return supabaseConfigured() ? supabaseStore.getProductBySlug(slug) : LocalDb.getProductBySlug(slug);
  }

  static async getProductOptions(slug: string): Promise<ProductOption[]> {
    return supabaseConfigured() ? supabaseStore.getProductOptions(slug) : LocalDb.getProductOptions(slug);
  }

  static async getPricingRules(slug: string): Promise<PricingRule[]> {
    return supabaseConfigured() ? supabaseStore.getPricingRules(slug) : LocalDb.getPricingRules(slug);
  }

  static async getAllPricingRules(): Promise<PricingRule[]> {
    return supabaseConfigured() ? supabaseStore.getAllPricingRules() : LocalDb.getAllPricingRules();
  }

  static async createOrder(
    orderInput: Omit<Order, 'created_at' | 'updated_at' | 'status_history' | 'items'>,
    itemsInput: Array<Omit<OrderItem, 'id' | 'order_id'>>
  ): Promise<Order> {
    return supabaseConfigured()
      ? supabaseStore.createOrder(orderInput, itemsInput)
      : LocalDb.createOrder(orderInput, itemsInput);
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    return supabaseConfigured() ? supabaseStore.getOrderById(orderId) : LocalDb.getOrderById(orderId);
  }

  static async getOrderByIdAndPhone(orderId: string, phone: string): Promise<Order | null> {
    return supabaseConfigured()
      ? supabaseStore.getOrderByIdAndPhone(orderId, phone)
      : LocalDb.getOrderByIdAndPhone(orderId, phone);
  }

  static async getOrders(filters?: {
    status?: OrderStatus;
    search?: string;
    date?: string;
  }): Promise<Order[]> {
    return supabaseConfigured() ? supabaseStore.getOrders(filters) : LocalDb.getOrders(filters);
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    notes?: string
  ): Promise<Order | null> {
    return supabaseConfigured()
      ? supabaseStore.updateOrderStatus(orderId, status, paymentStatus, notes)
      : LocalDb.updateOrderStatus(orderId, status, paymentStatus, notes);
  }

  static async setOrderPaid(orderId: string, paymentId: string): Promise<Order | null> {
    return supabaseConfigured() ? supabaseStore.setOrderPaid(orderId, paymentId) : LocalDb.setOrderPaid(orderId, paymentId);
  }

  static async authenticateAdmin(email: string, passwordHash: string): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.authenticateAdmin(email, passwordHash)
      : LocalDb.authenticateAdmin(email, passwordHash);
  }

  static async updateProductPrice(slug: string, basePrice: number): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.updateProductPrice(slug, basePrice)
      : LocalDb.updateProductPrice(slug, basePrice);
  }

  static async updateProductOptions(slug: string, options: ProductOption[]): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.updateProductOptions(slug, options)
      : LocalDb.updateProductOptions(slug, options);
  }

  static async updatePricingRules(slug: string, rules: PricingRule[]): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.updatePricingRules(slug, rules)
      : LocalDb.updatePricingRules(slug, rules);
  }

  static async addProduct(product: Product, options: ProductOption[]): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.addProduct(product, options)
      : LocalDb.addProduct(product, options);
  }

  static async toggleProductActive(slug: string): Promise<boolean> {
    return supabaseConfigured()
      ? supabaseStore.toggleProductActive(slug)
      : LocalDb.toggleProductActive(slug);
  }

  /** Discount codes from the shop's settings. */
  static async getCoupons(): Promise<Coupon[]> {
    return supabaseConfigured() ? supabaseStore.getCoupons() : LocalDb.getCoupons();
  }
}
