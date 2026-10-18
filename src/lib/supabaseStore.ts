/* ─────────────────────────────────────────────────────────────────────────────
   Supabase-backed store.

   Talks to the shop's existing Supabase project - the same `products`, `orders`,
   `order_history` and `settings` tables the static site and its admin use - so
   there is one catalogue and one order list, not two.

   Runs server-side only. It authenticates with the secret key, which bypasses
   row level security; that key must never be exposed to the browser, which is
   why every method here is called from API routes, server components, or the
   DbClient facade in db.ts.
   ───────────────────────────────────────────────────────────────────────────── */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Coupon,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  PricingRule,
  Product,
  ProductOption,
} from '../types';
import {
  HistoryRow,
  OrderRow,
  ProductRow,
  composeAddress,
  localItemsToLegacy,
  optionsToLegacy,
  parseCoupons,
  perPieceToBasePrice,
  rowToOptions,
  rowToOrder,
  rowToPricingRules,
  rowToProduct,
  rulesToLegacy,
  legacyImage,
} from './supabaseMap';

let cached: SupabaseClient | null = null;

/** The raw service URL (falls back to the public one for local dev). */
function url(): string {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/** Server-side key. Accepts both the new name and the legacy one. */
function key(): string {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/** True when a project URL and a server-side key are both present. */
export function supabaseConfigured(): boolean {
  const k = key();
  return Boolean(url() && k && !/YOUR_|your-|placeholder/i.test(k));
}

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  if (!supabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  cached = createClient(url(), key(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

function fail(what: string, error: { message?: string } | null): never {
  throw new Error(`Supabase ${what} failed: ${error?.message ?? 'unknown error'}`);
}

/** Run one read, retrying a couple of times.
 *
 *  PostgREST occasionally answers a request in a fresh process with a transient
 *  auth complaint ("JWT issued at future" while the clocks settle). A storefront
 *  that fails a customer's checkout on that would lose the sale for no reason,
 *  so a read is given two more chances before it is called a failure. */
async function read<T>(
  what: string,
  run: () => PromiseLike<{ data: T; error: { message?: string } | null }>
): Promise<T> {
  let last: { message?: string } | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await run();
    if (!error) return data;
    last = error;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
  }

  fail(what, last);
}

async function productRow(slug: string): Promise<ProductRow | null> {
  const data = await read('lookup of product "' + slug + '"', () =>
    getSupabase().from('products').select('*').eq('slug', slug).maybeSingle()
  );
  return (data as ProductRow) ?? null;
}

export const supabaseStore = {
  /* ── Catalogue ─────────────────────────────────────────────────────────── */

  async getProducts(): Promise<Product[]> {
    const data = await read('product list', () =>
      getSupabase()
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
    );
    return ((data ?? []) as ProductRow[]).map(rowToProduct);
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const row = await productRow(slug);
    return row ? rowToProduct(row) : null;
  },

  async getProductOptions(slug: string): Promise<ProductOption[]> {
    const row = await productRow(slug);
    return row ? rowToOptions(row) : [];
  },

  async getPricingRules(slug: string): Promise<PricingRule[]> {
    const row = await productRow(slug);
    return row ? rowToPricingRules(row) : [];
  },

  async getAllPricingRules(): Promise<PricingRule[]> {
    const data = await read('pricing tier list', () =>
      getSupabase()
        .from('products')
        .select('id, slug, name, base_unit, quantities, qty_discounts')
        .eq('active', true)
    );
    return ((data ?? []) as ProductRow[]).flatMap(rowToPricingRules);
  },

  /* ── Orders ────────────────────────────────────────────────────────────── */

  async createOrder(
    orderInput: Omit<Order, 'created_at' | 'updated_at' | 'status_history' | 'items'>,
    itemsInput: Array<Omit<OrderItem, 'id' | 'order_id'>>
  ): Promise<Order> {
    const supabase = getSupabase();
    const id = String(orderInput.id).replace(/^#/, '').trim().toUpperCase();

    const row = {
      id,
      name: orderInput.customer_name,
      phone: orderInput.customer_phone,
      email: orderInput.customer_email,
      fulfillment: orderInput.fulfillment_type,
      address:
        orderInput.fulfillment_type === 'delivery'
          ? composeAddress({
              delivery_address: orderInput.delivery_address,
              delivery_city: orderInput.delivery_city,
              delivery_pincode: orderInput.delivery_pincode,
            })
          : null,
      notes: orderInput.notes ?? null,
      items: localItemsToLegacy(itemsInput as Array<Partial<OrderItem>>),
      subtotal: Math.round(Number(orderInput.subtotal) || 0),
      delivery: Math.round(Number(orderInput.delivery_charge) || 0),
      total: Math.round(Number(orderInput.total_amount) || 0),
      payment: orderInput.payment_status === 'PAID' ? 'PAID' : 'PENDING',
      status: orderInput.order_status,
      utr: orderInput.payment_id ?? null,
      user_id: null,
    };

    const { error } = await supabase.from('orders').insert(row);
    if (error) fail(`insert of order ${id}`, error);

    await supabase.from('order_history').insert({
      order_id: id,
      status: row.status,
      note: 'Order placed on the new storefront',
    });

    const created = await this.getOrderById(id);
    if (!created) throw new Error(`Order ${id} was saved but could not be read back.`);
    return created;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const supabase = getSupabase();
    const id = String(orderId).replace(/^#/, '').trim().toUpperCase();
    if (!id) return null;

    const data = await read(`lookup of order ${id}`, () =>
      supabase.from('orders').select('*').eq('id', id).maybeSingle()
    );
    if (!data) return null;

    const { data: history } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    return rowToOrder(data as OrderRow, (history ?? []) as HistoryRow[]);
  },

  async getOrderByIdAndPhone(orderId: string, phone: string): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;
    const wanted = String(phone ?? '').replace(/\D/g, '').slice(-10);
    const actual = String(order.customer_phone ?? '').replace(/\D/g, '').slice(-10);
    return wanted && wanted === actual ? order : null;
  },

  async getOrders(filters?: { status?: OrderStatus; search?: string; date?: string }): Promise<Order[]> {
    const supabase = getSupabase();
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.date) query = query.gte('created_at', `${filters.date}T00:00:00`).lt('created_at', `${filters.date}T23:59:59.999`);
    if (filters?.search) {
      const term = filters.search.replace(/[%,()]/g, '').trim();
      if (term) {
        query = query.or(
          `id.ilike.%${term}%,name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`
        );
      }
    }

    const data = await read('order list', () => query);
    const rows = (data ?? []) as OrderRow[];
    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    const { data: history } = await supabase
      .from('order_history')
      .select('*')
      .in('order_id', ids)
      .order('created_at', { ascending: true });

    const byOrder = new Map<string, HistoryRow[]>();
    ((history ?? []) as HistoryRow[]).forEach((h) => {
      const list = byOrder.get(h.order_id) ?? [];
      list.push(h);
      byOrder.set(h.order_id, list);
    });

    return rows.map((row) => rowToOrder(row, byOrder.get(row.id) ?? []));
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    notes?: string
  ): Promise<Order | null> {
    const supabase = getSupabase();
    const id = String(orderId).replace(/^#/, '').trim().toUpperCase();

    const patch: Record<string, unknown> = { status };
    if (paymentStatus) patch.payment = paymentStatus;

    const { error } = await supabase.from('orders').update(patch).eq('id', id);
    if (error) fail(`status update for order ${id}`, error);

    await supabase.from('order_history').insert({
      order_id: id,
      status,
      note: notes || `Status updated to ${status}`,
    });

    return this.getOrderById(id);
  },

  async setOrderPaid(orderId: string, paymentId: string): Promise<Order | null> {
    const supabase = getSupabase();
    const id = String(orderId).replace(/^#/, '').trim().toUpperCase();

    const { error } = await supabase
      .from('orders')
      .update({ payment: 'PAID', status: 'PAID', utr: paymentId })
      .eq('id', id);
    if (error) fail(`payment update for order ${id}`, error);

    await supabase.from('order_history').insert({
      order_id: id,
      status: 'PAID',
      note: `Payment verified. Transaction ID: ${paymentId}`,
    });

    return this.getOrderById(id);
  },

  /* ── Admin ─────────────────────────────────────────────────────────────── */

  /** The shop runs a single shared admin password, stored in `settings`. */
  async authenticateAdmin(_email: string, passwordHash: string): Promise<boolean> {
    const data = await read('admin login check', () =>
      getSupabase().from('settings').select('value').eq('key', 'admin_password').maybeSingle()
    );

    const expected = String((data as { value?: string } | null)?.value ?? '');
    return Boolean(expected) && expected === String(passwordHash ?? '');
  },

  async updateProductPrice(slug: string, basePrice: number): Promise<boolean> {
    const row = await productRow(slug);
    if (!row) return false;
    const { error } = await getSupabase()
      .from('products')
      .update({ base_price: perPieceToBasePrice(basePrice, row) })
      .eq('slug', slug);
    if (error) fail(`price update for ${slug}`, error);
    return true;
  },

  async updateProductOptions(slug: string, options: ProductOption[]): Promise<boolean> {
    const row = await productRow(slug);
    if (!row) return false;
    const { error } = await getSupabase()
      .from('products')
      .update({ options: optionsToLegacy(row, options) })
      .eq('slug', slug);
    if (error) fail(`option update for ${slug}`, error);
    return true;
  },

  async updatePricingRules(slug: string, rules: PricingRule[]): Promise<boolean> {
    const row = await productRow(slug);
    if (!row) return false;
    const { quantities, qty_discounts } = rulesToLegacy(rules);
    const { error } = await getSupabase()
      .from('products')
      .update({ quantities, qty_discounts })
      .eq('slug', slug);
    if (error) fail(`tier update for ${slug}`, error);
    return true;
  },

  async addProduct(product: Product, options: ProductOption[]): Promise<boolean> {
    const supabase = getSupabase();
    const existing = await productRow(product.slug);
    if (existing) return false;

    const { data: last } = await supabase
      .from('products')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const baseUnit = product.base_unit || '/ piece';
    const row: ProductRow = {
      id: product.id || `p${Date.now()}`,
      slug: product.slug,
      name: product.name,
      category: product.category,
      description: product.description,
      image: legacyImage(product.image_url),
      base_price: Math.round(Number(product.base_price) * (product.base_qty ?? 1)),
      base_unit: baseUnit,
      options: optionsToLegacy({ base_unit: baseUnit } as ProductRow, options),
      quantities: [1],
      qty_discounts: {},
      default_qty: 1,
      active: product.is_active !== false,
      sort_order: (Number((last as { sort_order?: number } | null)?.sort_order) || 0) + 1,
    };

    const { error } = await supabase.from('products').insert(row);
    if (error) fail(`insert of product ${product.slug}`, error);
    return true;
  },

  async toggleProductActive(slug: string): Promise<boolean> {
    const row = await productRow(slug);
    if (!row) return false;
    const { error } = await getSupabase()
      .from('products')
      .update({ active: row.active === false })
      .eq('slug', slug);
    if (error) fail(`activation toggle for ${slug}`, error);
    return true;
  },

  /* ── Shop settings ─────────────────────────────────────────────────────── */

  /** The discount codes the shop maintains in `settings.discount_coupons`. */
  async getCoupons(): Promise<Coupon[]> {
    const data = await read('coupon lookup', () =>
      getSupabase().from('settings').select('value').eq('key', 'discount_coupons').maybeSingle()
    );

    return parseCoupons((data as { value?: string } | null)?.value);
  },
};
