// Parity check between the two storefronts, run against the live database.
//
// It compiles the real shipped modules (src/lib/supabaseMap.ts,
// src/lib/priceCalculator.ts) and feeds them the shop's real rows, then prices
// every product at every quantity tier twice:
//
//   * with the NEW app's engine  -> calculatePricing().subtotal
//   * with the OLD engine still serving printvatika.vercel.app -> calcPrice().total
//
// If the two ever disagree, the shop is quoting two different prices for the
// same job - the bug that produced those cancelled ₹68,770 orders. This script
// exists so that can never happen silently again.
//
// Usage:
//   node scripts/verify-db-parity.mjs            catalogue pricing only (read only)
//   node scripts/verify-db-parity.mjs --orders   also create + delete a test order
//
// Requires .env.local (SUPABASE_URL + a key). Read-only unless --orders is given.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const withOrders = process.argv.includes('--orders');

/* ── environment ─────────────────────────────────────────────────────────── */

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    const line = fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim();
  }
  return '';
}

const url = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL');
const anon = env('SUPABASE_PUBLISHABLE_KEY') || env('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const secret = env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !anon) {
  console.error('Missing SUPABASE_URL / publishable key in .env.local');
  process.exit(1);
}
process.env.SUPABASE_URL = url;
process.env.SUPABASE_SECRET_KEY = secret;

/* ── compile the real modules, then load them ────────────────────────────── */

const outDir = path.join(root, '.tmp-verify');
console.log('Compiling the app\'s real pricing + mapping modules…');
execSync(
  [
    'npx tsc',
    'src/lib/supabaseMap.ts',
    'src/lib/supabaseStore.ts',
    'src/lib/priceCalculator.ts',
    '--outDir .tmp-verify',
    '--rootDir src',
    '--module commonjs',
    '--target es2020',
    '--moduleResolution node',
    '--esModuleInterop',
    '--skipLibCheck',
    '--lib es2020,dom',
  ].join(' '),
  { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] }
);

const map = require(path.join(outDir, 'lib', 'supabaseMap.js'));
const { calculatePricing } = require(path.join(outDir, 'lib', 'priceCalculator.js'));

/* ── the OLD engine, loaded exactly as the browser loads it ──────────────── */

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
require(path.join(root, 'js', 'utils.js'));
const calcPrice = globalThis.window.calcPrice;

/* ── the shop's real catalogue ───────────────────────────────────────────── */

const rows = await fetch(`${url}/rest/v1/products?select=*&order=slug.asc`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
}).then((r) => r.json());

if (!Array.isArray(rows) || !rows.length) {
  console.error('No products returned from the database.');
  process.exit(1);
}

const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const money = (n) => Math.round(Number(n) * 100) / 100;

/** Cheapest / priciest combination of every option choice, for the two engines. */
function combos(row) {
  const out = [];
  const selects = (row.options ?? []).filter((o) => (o.type ?? 'select') === 'select');
  const build = (pick) => {
    const selection = {};
    selects.forEach((o) => {
      const choices = o.choices ?? [];
      if (!choices.length) return;
      const choice = pick(choices);
      selection[o.key] = choice.val;
    });
    return selection;
  };
  out.push(['cheapest options', build((c) => c[0])]);
  if (selects.length) out.push(['priciest options', build((c) => c.reduce((a, b) => (Number(b.mod) || 0) > (Number(a.mod) || 0) ? b : a, c[0]))]);
  return out;
}

let checks = 0;
let failures = 0;
const report = [];

for (const row of rows) {
  if (Number(row.base_price) === 0) {
    report.push({ slug: row.slug, name: row.name, lines: ['quote based — not priced automatically'], note: 'skipped' });
    continue;
  }

  const product = map.rowToProduct(row);
  const options = map.rowToOptions(row);
  const rules = map.rowToPricingRules(row);

  // the OLD engine wants the raw shop shape
  const legacyProduct = {
    slug: row.slug,
    name: row.name,
    basePrice: Number(row.base_price),
    baseUnit: row.base_unit,
    options: row.options ?? [],
    qtyDiscounts: row.qty_discounts ?? {},
  };

  const isDim = product.slug === 'flex-banners';
  const dims = isDim ? { w: 4, h: 3 } : undefined;

  const quantities = Array.from(
    new Set([...(row.quantities ?? []), ...Object.keys(row.qty_discounts ?? {}).map(Number)])
  )
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const perPiece = product.base_price;
  const lines = [
    `db quotes ${rupee(row.base_price)} ${row.base_unit}  ->  app charges ${rupee(perPiece)} per ${
      isDim ? 'sq.ft' : 'piece'
    }`,
  ];

  for (const [label, selection] of combos(row)) {
    for (const qty of quantities) {
      const legacy = Math.round(calcPrice(legacyProduct, selection, qty, dims).total);
      const next = money(
        calculatePricing(product, options, rules, selection, qty, dims, 'pickup').subtotal
      );
      checks++;
      const ok = Math.abs(legacy - next) <= 1;
      if (!ok) failures++;
      lines.push(
        `  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(17)} qty ${String(qty).padStart(5)}  ` +
          `new ${rupee(next).padStart(10)}   old ${rupee(legacy).padStart(10)}`
      );
    }
  }

  report.push({ slug: row.slug, name: row.name, lines });
}

for (const entry of report) {
  console.log(`\n${entry.name}  (${entry.slug})`);
  entry.lines.forEach((l) => console.log(l.startsWith('  ') ? l : `  db quotes ${l.replace('db quotes ', '')}`));
}

/* ── optional: a real order round trip ───────────────────────────────────── */

if (withOrders) {
  const store = require(path.join(outDir, 'lib', 'supabaseStore.js'));
  if (!store.supabaseConfigured()) {
    console.error('\nOrder test needs a server key. Set SUPABASE_SECRET_KEY in .env.local.');
    process.exit(1);
  }

  const testId = 'PV-9001';
  const auth = { apikey: secret, Authorization: `Bearer ${secret}` };

  // clear any leftover from an earlier failed run
  await fetch(`${url}/rest/v1/orders?id=eq.${testId}`, { method: 'DELETE', headers: auth });
  await fetch(`${url}/rest/v1/order_history?order_id=eq.${testId}`, { method: 'DELETE', headers: auth });

  console.log('\nOrder round trip (writes one clearly labelled test order, then deletes it)…');

  const created = await store.supabaseStore.createOrder(
    {
      id: `#${testId}`, // the app sends it with a '#', as its own route does
      customer_name: 'Parity Test',
      customer_email: 'parity-test@example.com',
      customer_phone: '9000000001',
      fulfillment_type: 'delivery',
      delivery_address: '1 Test Marg',
      delivery_city: 'New Delhi',
      delivery_pincode: '110030',
      delivery_charge: 50,
      subtotal: 299,
      total_amount: 349,
      payment_status: 'PENDING',
      order_status: 'PAYMENT_PENDING',
      payment_id: undefined,
      notes: 'Automated parity test — safe to delete',
    },
    [
      {
        product_slug: 'business-cards',
        product_name: 'Business Cards',
        quantity: 100,
        selected_options: { size: 'standard', sides: 'single' },
        unit_price: 2.99,
        total_price: 299,
        selected_artwork_label: 'artwork.pdf',
      },
    ]
  );

  const raw = await fetch(`${url}/rest/v1/orders?id=eq.${testId}&select=*`, { headers: auth }).then((r) => r.json());
  const rawOrder = raw?.[0];

  const orderChecks = [
    ['id is stored without the #', created.id === testId],
    ['name/phone/email reach the shop columns', rawOrder?.name === 'Parity Test' && rawOrder?.phone === '9000000001'],
    ['address is one shop-style string', typeof rawOrder?.address === 'string' && rawOrder.address.includes('110030')],
    ['items use the shop item shape', Array.isArray(rawOrder?.items) && rawOrder.items[0]?.qty === 100 && rawOrder.items[0]?.price === 299],
    ['artwork is stored as a name, never the file', rawOrder?.items?.[0]?.file?.name === 'artwork.pdf'],
    ['money columns are integers', Number.isInteger(rawOrder?.total) && rawOrder.total === 349],
    ['a history row was written', (await fetch(`${url}/rest/v1/order_history?order_id=eq.${testId}&select=status`, { headers: auth }).then((r) => r.json())).length > 0],
    ['reading it back rebuilds the app order', created.items.length === 1 && created.items[0].quantity === 100 && created.total_amount === 349],
    ['delivery address survives the round trip', created.delivery_city === 'New Delhi' && created.delivery_pincode === '110030'],
    ['status starts as PAYMENT_PENDING', created.order_status === 'PAYMENT_PENDING'],
  ];

  /* The shop's existing orders and its shared admin password. The password is
     read from the settings table rather than written here, so this check never
     puts the real password in the repository. */
  const allOrders = await store.supabaseStore.getOrders();
  const existing = allOrders.filter((o) => o.id !== testId);
  orderChecks.push([
    `the shop's existing orders load and map (${existing.length} found)`,
    existing.length > 0 && existing.every((o) => /^PV-\d+$/.test(o.id) && Array.isArray(o.items)),
  ]);

  const { value: adminPassword } = await fetch(
    `${url}/rest/v1/settings?key=eq.admin_password&select=value`,
    { headers: auth }
  )
    .then((r) => r.json())
    .then((rows) => rows?.[0] ?? {});

  orderChecks.push([
    'admin login accepts the password stored in settings',
    Boolean(adminPassword) && (await store.supabaseStore.authenticateAdmin('admin@printvatika.com', adminPassword)),
  ]);
  orderChecks.push([
    'admin login rejects a wrong password',
    !(await store.supabaseStore.authenticateAdmin('admin@printvatika.com', `${adminPassword}-wrong`)),
  ]);
  orderChecks.push([
    'the catalogue is readable through the store (cards quote per 100 pcs)',
    (await store.supabaseStore.getProducts()).some(
      (p) => p.slug === 'business-cards' && p.base_qty === 100 && Math.abs(p.base_price - 2.99) < 0.001
    ),
  ]);

  for (const [label, pass] of orderChecks) {
    checks++;
    if (!pass) failures++;
    console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${label}`);
  }

  await fetch(`${url}/rest/v1/orders?id=eq.${testId}`, { method: 'DELETE', headers: auth });
  await fetch(`${url}/rest/v1/order_history?order_id=eq.${testId}`, { method: 'DELETE', headers: auth });
  const leftovers = await fetch(`${url}/rest/v1/orders?id=eq.${testId}&select=id`, { headers: auth }).then((r) => r.json());
  checks++;
  const cleaned = Array.isArray(leftovers) && leftovers.length === 0;
  if (!cleaned) failures++;
  console.log(`  ${cleaned ? 'ok  ' : 'FAIL'} test order removed again`);
}

/* ── report ──────────────────────────────────────────────────────────────── */

console.log(
  `\n${failures === 0 ? 'OK' : 'FAIL'} — ${checks} price comparison${checks === 1 ? '' : 's'}, ${failures} mismatch${
    failures === 1 ? '' : 'es'
  }`
);
// Set the code rather than calling process.exit(): on Windows, exiting while the
// compiler's child process and the HTTP sockets are still closing trips a libuv
// assertion and buries the result.
process.exitCode = failures === 0 ? 0 : 1;
