/**
 * Merchandising.
 *
 * Which lines get pulled to the front of the store. This is an editorial
 * decision, not a data one — the shop owner re-ranks the storefront by
 * editing this list, and nothing else in the codebase needs to change.
 *
 * It feeds two things: the "Bestseller" ribbon on a product card, and the
 * Bestsellers strip on the homepage.
 */

/** Slugs in display order, best first. */
export const BESTSELLERS: readonly string[] = [
  'business-cards',
  't-shirts',
  'flex-banners',
  'posters',
] as const;

/** How many lines the homepage strip shows. */
export const BESTSELLER_LIMIT = 4;

export function isBestseller(slug: string): boolean {
  return BESTSELLERS.includes(slug);
}

/** The bestseller lines, in merchandising order, capped and de-duplicated
 *  against whatever is actually active in the catalog. */
export function bestsellersOf<T extends { slug: string }>(products: T[]): T[] {
  const bySlug = new Map(products.map(p => [p.slug, p]));
  return BESTSELLERS.slice(0, BESTSELLER_LIMIT)
    .map(slug => bySlug.get(slug))
    .filter((p): p is T => Boolean(p));
}
