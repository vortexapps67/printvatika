/* ─────────────────────────────────────────────────────────────────────────────
   Translation between the live Supabase schema and this app's model.

   The live database (shared with the existing static site and its admin) stores
   products in the shop's own shape:

     base_price 299, base_unit '/ 100 pcs', options[{ key, label, type, choices[{ val, label, mod }] }],
     quantities [100, 250, 500, 1000], qty_discounts { '250': 0.92 }

   This app prices per piece and per tier:

     base_price 2.99, ProductOption.options_json[{ value, label, price_modifier }],
     PricingRule{ tier_min_qty, tier_discount_factor }

   So base prices and option modifiers are divided by the base unit on the way in
   (₹299 per 100 pcs -> ₹2.99 per piece) and multiplied back on the way out. That
   keeps one catalogue, editable from either admin, with both sites quoting the
   same money.

   Money is kept to 4 decimals internally: ₹199 per 500 pcs is ₹0.398 per piece,
   and rounding that to ₹0.40 would misprice 500 pcs by ₹1.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  Product,
  ProductOption,
  PricingRule,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  FulfillmentType,
} from '../types';

/* ── Legacy row shapes ─────────────────────────────────────────────────────── */

export interface LegacyChoice {
  val: string;
  label: string;
  mod?: number;
}

export interface LegacyOption {
  key: string;
  label?: string;
  type?: string;
  choices?: LegacyChoice[];
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  description?: string | null;
  image?: string | null;
  base_price: number;
  base_unit?: string | null;
  options?: LegacyOption[] | null;
  quantities?: number[] | null;
  qty_discounts?: Record<string, number> | null;
  default_qty?: number | null;
  active?: boolean | null;
  sort_order?: number | null;
}

export interface LegacyOrderItem {
  productId?: string;
  slug?: string;
  name?: string;
  qty?: number;
  options?: Record<string, string>;
  dims?: { w: number; h: number } | null;
  price?: number;
  preview?: string | null;
  file?: { name?: string; size?: number } | null;
}

export interface OrderRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  fulfillment?: string | null;
  address?: string | null;
  notes?: string | null;
  items?: LegacyOrderItem[] | null;
  subtotal?: number | null;
  delivery?: number | null;
  total?: number | null;
  payment?: string | null;
  status?: string | null;
  utr?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HistoryRow {
  id?: number;
  order_id: string;
  status: string;
  note?: string | null;
  created_at?: string | null;
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

const r4 = (n: number) => Math.round(n * 10000) / 10000;
const int = (n: number) => Math.round(n);

/** Pieces per quoted price. '/ 100 pcs' -> 100, '/ piece' -> 1, '/ sq.ft' -> 1. */
export function baseQtyOf(baseUnit?: string | null): number {
  const m = String(baseUnit ?? '').match(/(\d[\d,]*)\s*(pcs|pieces|pc|units|nos?)\b/i);
  if (!m) return 1;
  return Number(m[1].replace(/,/g, '')) || 1;
}

/** True when the product is sold by area rather than by piece. */
export function isAreaPriced(baseUnit?: string | null): boolean {
  return /sq\.?\s*ft/i.test(String(baseUnit ?? ''));
}

/** The database stores images as `imgs/foo.jpg` (the static site's folder);
 *  this app serves the same pictures from `/images/foo.jpg`. */
export function publicImage(image?: string | null): string {
  const v = String(image ?? '').trim();
  if (!v) return '/images/logo-mark.png';
  if (v.startsWith('imgs/')) return `/images/${v.slice(5)}`;
  if (v.startsWith('/imgs/')) return `/images/${v.slice(6)}`;
  return v;
}

/** ...and back again, for products created from this app's admin. */
export function legacyImage(imageUrl: string): string {
  const v = String(imageUrl ?? '').trim();
  if (v.startsWith('/images/')) return `imgs/${v.slice(8)}`;
  return v;
}

/* ── Products ──────────────────────────────────────────────────────────────── */

export function rowToProduct(row: ProductRow): Product {
  const baseQty = baseQtyOf(row.base_unit);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category ?? 'Other',
    image_url: publicImage(row.image),
    base_price: r4(Number(row.base_price) / baseQty),
    is_active: row.active !== false,
    base_unit: row.base_unit ?? '/ piece',
    base_qty: baseQty,
    from_price: r4(cheapestConfigPrice(row) / baseQty),
    default_qty: Number(row.default_qty) > 0 ? Math.round(Number(row.default_qty)) : undefined,
  };
}

/** The cheapest configuration of a product, per base unit.
 *
 *  Some options cost less than the base one (A5 flyers are ₹80 per 500 cheaper
 *  than A4), so a "starts at" figure taken from `base_price` alone would
 *  overstate the floor. Summing the cheapest choice of every option gives the
 *  real minimum. */
function cheapestConfigPrice(row: ProductRow): number {
  const area = isAreaPriced(row.base_unit);
  let extra = 0;
  (row.options ?? []).forEach((opt) => {
    if ((opt.type ?? 'select') !== 'select') return;
    const mods = (opt.choices ?? []).map((c) => Number(c.mod ?? 0)).filter((n) => Number.isFinite(n));
    if (!mods.length) return;
    // On banners the finishing charge is flat per order, not per square foot,
    // so it has no place in a per-square-foot floor.
    if (area && opt.key !== 'material') return;
    extra += Math.min(...mods);
  });
  return Math.max(0, Number(row.base_price) + extra);
}

const OPTION_TYPES: Record<string, ProductOption['type']> = {
  select: 'select',
  dimensions: 'dimensions',
  textarea: 'text',
  text: 'text',
  number: 'number',
};

export function rowToOptions(row: ProductRow): ProductOption[] {
  const baseQty = baseQtyOf(row.base_unit);
  return (row.options ?? []).map((opt, i) => ({
    id: `${row.slug}-${opt.key || i}`,
    product_slug: row.slug,
    name: opt.key,
    display_name: opt.label || opt.key,
    type: OPTION_TYPES[String(opt.type ?? 'select')] ?? 'select',
    options_json: (opt.choices ?? []).map((c) => ({
      value: c.val,
      label: c.label,
      price_modifier: r4(Number(c.mod ?? 0) / baseQty),
    })),
  }));
}

/** Quantity tiers and their real discounts, as PricingRule rows.
 *  Includes every quantity (even undiscounted ones) because the storefront
 *  builds its quantity picker from these. */
export function rowToPricingRules(row: ProductRow): PricingRule[] {
  const discounts = row.qty_discounts ?? {};
  const tiers = new Set<number>();
  (row.quantities ?? []).forEach((q) => tiers.add(Number(q)));
  Object.keys(discounts).forEach((q) => tiers.add(Number(q)));

  const key = isAreaPriced(row.base_unit) ? 'sqft' : 'quantity';

  return Array.from(tiers)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
    .map((qty) => {
      const raw = discounts[String(qty)];
      const factor = Number(raw);
      return {
        id: `${row.slug}-tier-${qty}`,
        product_slug: row.slug,
        option_key: key,
        option_value: String(qty),
        price_modifier: 0,
        tier_min_qty: qty,
        tier_discount_factor: Number.isFinite(factor) && factor > 0 ? factor : 1,
      };
    });
}

/* ── Writes: this app's model -> legacy columns ────────────────────────────── */

export function perPieceToBasePrice(perPiece: number, row: ProductRow): number {
  return int(Number(perPiece) * baseQtyOf(row.base_unit));
}

export function optionsToLegacy(row: ProductRow, options: ProductOption[]): LegacyOption[] {
  const baseQty = baseQtyOf(row.base_unit);
  return options.map((opt) => {
    const type = opt.type === 'text' ? 'textarea' : opt.type;
    const out: LegacyOption = { key: opt.name, label: opt.display_name, type };
    if (opt.options_json?.length) {
      out.choices = opt.options_json.map((c) => ({
        val: c.value,
        label: c.label,
        mod: int(Number(c.price_modifier ?? 0) * baseQty),
      }));
    }
    return out;
  });
}

export function rulesToLegacy(rules: PricingRule[]): {
  quantities: number[];
  qty_discounts: Record<string, number>;
} {
  const tiers = rules
    .filter((r) => r.option_key !== 'sqft')
    .map((r) => Number(r.tier_min_qty))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const quantities = Array.from(new Set(tiers));
  const qty_discounts: Record<string, number> = {};
  rules.forEach((r) => {
    const qty = Number(r.tier_min_qty);
    const factor = Number(r.tier_discount_factor);
    if (!Number.isFinite(qty) || qty <= 0) return;
    if (Number.isFinite(factor) && factor > 0 && factor < 1) {
      qty_discounts[String(qty)] = factor;
    }
  });

  return { quantities: quantities.length ? quantities : [1], qty_discounts };
}

/* ── Orders ────────────────────────────────────────────────────────────────── */

/** "F-298, Lado Sarai – 110030" -> { city, pincode, street } (best effort). */
function splitAddress(address?: string | null) {
  const value = String(address ?? '').trim();
  if (!value) return { street: '', city: '', pincode: '' };
  const m = value.match(/^(.*?),\s*([^,]+?)\s*[–—-]\s*(\d{6})\s*$/);
  if (m) return { street: m[1].trim(), city: m[2].trim(), pincode: m[3].trim() };
  return { street: value, city: '', pincode: '' };
}

export function composeAddress(order: {
  delivery_address?: string;
  delivery_city?: string;
  delivery_pincode?: string;
}): string {
  const parts = [order.delivery_address, order.delivery_city].filter(Boolean) as string[];
  const head = parts.join(', ');
  return order.delivery_pincode ? `${head} – ${order.delivery_pincode}` : head;
}

function legacyItemToLocal(orderId: string, item: LegacyOrderItem, index: number): OrderItem {
  const qty = Number(item.qty ?? 1) || 1;
  const total = Number(item.price ?? 0) || 0;
  return {
    id: `${orderId}-item-${index}`,
    order_id: orderId,
    product_slug: item.slug || item.productId || 'custom-print',
    product_name: item.name || 'Custom Print',
    quantity: qty,
    selected_options: item.options ?? {},
    unit_price: r4(total / qty),
    total_price: total,
    original_file_url: item.file?.name ? `uploaded://${item.file.name}` : undefined,
    preview_file_url: item.preview ?? undefined,
    dimensions: item.dims ? { width: item.dims.w, height: item.dims.h } : undefined,
    selected_artwork_label: item.file?.name,
  };
}

export function rowToOrder(row: OrderRow, history: HistoryRow[] = []): Order {
  const { street, city, pincode } = splitAddress(row.address);
  const created = row.created_at ?? new Date().toISOString();
  return {
    id: row.id,
    customer_name: row.name ?? '',
    customer_email: row.email ?? '',
    customer_phone: row.phone ?? '',
    fulfillment_type: (row.fulfillment === 'delivery' ? 'delivery' : 'pickup') as FulfillmentType,
    delivery_address: street || undefined,
    delivery_city: city || undefined,
    delivery_state: undefined,
    delivery_pincode: pincode || undefined,
    delivery_charge: Number(row.delivery ?? 0) || 0,
    subtotal: Number(row.subtotal ?? 0) || 0,
    total_amount: Number(row.total ?? 0) || 0,
    payment_status: (row.payment ?? 'PENDING') as PaymentStatus,
    order_status: (row.status ?? 'PAYMENT_PENDING') as OrderStatus,
    payment_id: row.utr ?? undefined,
    notes: row.notes ?? undefined,
    created_at: created,
    updated_at: row.updated_at ?? created,
    items: (row.items ?? []).map((item, i) => legacyItemToLocal(row.id, item, i)),
    status_history: history
      .map((h, i) => ({
        id: String(h.id ?? `${h.order_id}-${i}`),
        order_id: h.order_id,
        status: h.status as OrderStatus,
        notes: h.note ?? undefined,
        created_at: h.created_at ?? '',
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  };
}

/** Keep a single order's items well under any request-size limit. Artwork is
 *  never stored (only its file name), matching the existing admin's behaviour. */
const MAX_PREVIEW_CHARS = 220_000;

export function localItemsToLegacy(items: Array<Partial<OrderItem>>): LegacyOrderItem[] {
  return items.map((item) => {
    const preview = item.preview_file_url;
    const fileLabel = item.selected_artwork_label;
    return {
      productId: item.product_slug,
      slug: item.product_slug,
      name: item.product_name,
      qty: item.quantity,
      options: item.selected_options ?? {},
      dims: item.dimensions ? { w: item.dimensions.width, h: item.dimensions.height } : null,
      price: item.total_price,
      preview: preview && preview.length <= MAX_PREVIEW_CHARS ? preview : null,
      file: fileLabel ? { name: fileLabel } : null,
    };
  });
}

/** Next serial after the highest existing PV-nnnn, so ids stay unique. */
export function nextOrderSerial(existingIds: string[]): number {
  let max = 1000;
  for (const id of existingIds) {
    const m = String(id).match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}
