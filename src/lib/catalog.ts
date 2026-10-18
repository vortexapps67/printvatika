/**
 * Category registry.
 *
 * The `db` field is the literal `product.category` string stored in db.json.
 * Everything else — display name, blurb, accent wash — is presentation, and
 * lives here rather than being re-invented in the nav, the category tiles and
 * the catalog filter chips.
 *
 * Order is deliberate: it is the order a customer walks the shop, from the
 * things they buy often to the things they have to ask about.
 */

import type { Product, PricingRule } from '../types';

export interface Category {
  /** URL-safe key, used nowhere except as a stable React key. */
  key: string;
  /** Exact `product.category` value in db.json. */
  db: string;
  /** Human name for menus, tiles and headings. */
  name: string;
  /** One line, written to answer "what actually lives in here?". */
  blurb: string;
  /** Tint for the tile wash, so a photo grid still reads as one sheet. */
  wash: 'aqua' | 'mint' | 'sand' | 'sage' | 'haze';
}

export const CATEGORIES: readonly Category[] = [
  {
    key: 'stationery',
    db: 'Stationery',
    name: 'Stationery',
    blurb: 'Business cards, stickers and everything that leaves the shop in a wallet.',
    wash: 'aqua',
  },
  {
    key: 'marketing',
    db: 'Marketing',
    name: 'Marketing',
    blurb: 'Flyers, posters and brochures — the collateral for a launch or an event.',
    wash: 'mint',
  },
  {
    key: 'apparel',
    db: 'Apparel',
    name: 'Apparel',
    blurb: 'Custom t-shirts, screen printed and stitched in-house.',
    wash: 'sand',
  },
  {
    key: 'signage',
    db: 'Signage',
    name: 'Signage',
    blurb: 'Flex banners and standees, priced by the square foot.',
    wash: 'sage',
  },
  {
    key: 'specialty',
    db: 'Specialty',
    name: 'Specialty',
    blurb: 'Something not on this list? Send the artwork and we will quote it.',
    wash: 'haze',
  },
] as const;

/** Fast lookup from a raw `product.category` to its presentation metadata. */
const BY_DB = new Map(CATEGORIES.map((c) => [c.db, c]));

/** Presentation metadata for a product, or a neutral fallback for a
 *  category that exists in db.json but not in this registry. */
export function categoryOf(product: Pick<Product, 'category'>): Category {
  return (
    BY_DB.get(product.category) ?? {
      key: product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      db: product.category,
      name: product.category,
      blurb: '',
      wash: 'aqua',
    }
  );
}

/** Canonical link for a category, so `/catalog?category=` is written in one
 *  place and every entry point produces the same URL. */
export function categoryHref(category: Category | string): string {
  const name = typeof category === 'string' ? category : category.db;
  return `/catalog?category=${encodeURIComponent(name)}`;
}

/** The categories actually present in the product list, in registry order.
 *  Used so we never render an empty category tile. */
export function presentCategories(products: Pick<Product, 'category'>[]): Category[] {
  const seen = new Set(products.map((p) => p.category));
  return CATEGORIES.filter((c) => seen.has(c.db));
}

/* ---- Discounts -----------------------------------------------------------
   The storefront shows "save X% at N+" badges, and the only numbers it is
   allowed to show are the ones the press will actually honour at checkout.
   So the badge is derived from the quantity tiers themselves rather than
   from a hard-coded "was" price. */

export interface Deal {
  /** Deepest percentage off, across every tier for this product. */
  pct: number;
  /** The quantity at which that deepest tier begins. */
  minQty: number;
}

/** Deepest tier discount per product slug, e.g. `{ 'business-cards': { pct: 30, minQty: 1000 } }`. */export function dealsBySlug(rules: PricingRule[]): Record<string, Deal> {
  const out: Record<string, Deal> = {};
  for (const rule of rules) {
    const pct = Math.round((1 - rule.tier_discount_factor) * 100);
    if (pct <= 0) continue;
    const current = out[rule.product_slug];
    if (!current || pct > current.pct) {
      out[rule.product_slug] = { pct, minQty: rule.tier_min_qty };
    }
  }
  return out;
}

/** What the deal's quantity is counted in — banners are sold by area, the
 *  rest by the piece. */
export function dealUnit(slug: string): string {
  return slug === 'flex-banners' ? 'sq ft' : 'pcs';
}

/* ---- The quoted unit price -------------------------------------------------
   The shop stores prices the way it sells them ({ base_price: 299,
   base_unit: '/ 100 pcs' }) while this app works per piece, so the price on a
   card has to be rebuilt rather than printed straight from the row. Everything
   a customer sees comes from here, which means the hero, the card grid and the
   configurator can never quote three different numbers for the same job. */

export interface UnitQuote {
  /** Money for one quoted unit — ₹299 for "/ 100 pcs", ₹15 for a square foot. */
  amount: number;
  /** Pieces in that unit (1 for single pieces and for per-square-foot pricing). */
  qty: number;
  /** The per-piece price, for a "₹2.99 a card" style line. */
  perPiece: number;
  /** True when the product is sold by area rather than by piece. */
  isArea: boolean;
  /** True when the shop prices this by hand instead of from the catalogue. */
  isQuote: boolean;
  /** The shop's own unit, e.g. "/ 100 pcs". Absent for single pieces. */
  unitLabel?: string;
}

/** The shop's price for one unit of a product, at its cheapest configuration. */
export function unitQuote(product: Product): UnitQuote {
  const perPiece = product.from_price ?? product.base_price;
  const qty = product.base_qty && product.base_qty > 1 ? product.base_qty : 1;
  return {
    amount: Math.round(perPiece * qty),
    qty,
    perPiece,
    isArea: /sq\.?\s*ft/i.test(product.base_unit ?? ''),
    // A base price of 0 means "quoted by hand", which is how the shop lists
    // bespoke jobs — never a free product.
    isQuote: !(perPiece > 0),
    unitLabel: qty > 1 ? product.base_unit : undefined,
  };
}

/** Money the way the shop writes it: ₹299, ₹2.99, ₹1,226. */
export function money(value: number): string {
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Order money, to the rupee.
 *
 *  The press bills in whole rupees and its order records are kept that way, so
 *  every figure the checkout shows is put through here. Rounding at the end —
 *  rather than nowhere — is what stops a screen total of ₹687.70 becoming a
 *  recorded (and charged) ₹688. Per-unit prices stay exact: a card is ₹2.99 and
 *  the breakdown on the product page still adds up the way it always did. */
export function payable(value: number): number {
  return Math.round(Number(value) || 0);
}
