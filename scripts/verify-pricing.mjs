// Verifies the shared price calculator against the catalogue's intended pricing
// (base price per base unit). Runs the real browser files in Node.
//
// Usage: node scripts/verify-pricing.mjs

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const noop = () => {};
const el = () =>
  new Proxy(
    { style: {}, classList: { add: noop, remove: noop }, appendChild: noop, remove: noop, setAttribute: noop },
    { get: (t, k) => (k in t ? t[k] : noop) }
  );
globalThis.window = {};
globalThis.document = {
  createElement: el,
  getElementById: () => null,
  body: el(),
  documentElement: el(),
  addEventListener: noop,
  querySelector: () => null,
  querySelectorAll: () => [],
};

const require = createRequire(import.meta.url);
require(path.join(root, 'js', 'products.js'));
require(path.join(root, 'js', 'utils.js'));

const products = globalThis.window.PRODUCTS;
const { calcPrice, baseQtyOf } = globalThis.window;
const rupee = (n) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

let failures = 0;
const rows = [];
for (const p of products) {
  if (p.basePrice === 0) {
    rows.push([p.name, 'custom quote', '-']);
    continue;
  }
  const baseQty = baseQtyOf(p.baseUnit);
  // expected per-piece price straight from the catalogue definition
  const perPiece = p.basePrice / baseQty;
  const isArea = /sq\.?\s*ft/i.test(p.baseUnit || ''); // banners price per square foot
  const parts = (p.quantities || []).map((q) => {
    const disc = Object.entries(p.qtyDiscounts || {})
      .filter(([dq]) => q >= Number(dq))
      .sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1] ?? 1;
    const raw = isArea ? p.basePrice * (4 * 3) * q : perPiece * q;
    const expected = Math.round(raw * disc);
    const got = calcPrice(p, {}, q, { w: 4, h: 3 }).total;
    if (Math.abs(got - expected) > 1) {
      failures++;
      return `${q}: MISMATCH got ${rupee(got)} expected ${rupee(expected)}`;
    }
    return `${q}=${rupee(got)}`;
  });
  rows.push([p.name, `${rupee(perPiece)} / pc (base ${p.basePrice} ${p.baseUnit})`, parts.join('  ')]);
}

const width = [0, 1, 2].map((i) => Math.max(...rows.map((r) => String(r[i]).length)));
for (const r of rows) {
  console.log('  ' + String(r[0]).padEnd(width[0] + 2) + String(r[1]).padEnd(width[1] + 2) + r[2]);
}

console.log('');
const cards = products.find((p) => p.slug === 'business-cards');
const before = Math.round(cards.basePrice * cards.defaultQty * cards.qtyDiscounts[cards.defaultQty]);
const after = calcPrice(cards, {}, cards.defaultQty, {}).total;
console.log(`Business cards @ ${cards.defaultQty} pcs (default quantity):`);
console.log(`  before fix (live site today): ${rupee(before)}   <- matches the cancelled orders in your database`);
console.log(`  after fix:                    ${rupee(after)}`);
console.log('');
console.log(failures === 0 ? 'OK - every product matches the intended pricing.' : `FAIL - ${failures} mismatch(es)`);
process.exit(failures === 0 ? 0 : 1);
