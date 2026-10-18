// End-to-end checkout check, run against the running app and the live database.
//
// It posts real orders through /api/orders exactly as the cart does, then reads
// the rows back out of Supabase and deletes them. What it is really testing:
//
//   * the server prices the job itself, so a request that carries its own
//     (wrong) prices cannot change what the shop charges;
//   * the shop's own discount codes apply, refuse, or waive delivery according
//     to the rules in settings.discount_coupons;
//   * a bespoke job (base price 0) is ordered as a quote request, not as a free
//     product;
//   * what lands in the database is what the existing admin reads.
//
// Usage:
//   npm run dev          (in one terminal)
//   node scripts/verify-checkout.mjs [--url http://localhost:3000]
//
// The script places a handful of orders in a row, which trips the order API's
// rate limiter (5 a minute by default). To run it in one go, put
// ORDER_RATE_LIMIT=25 in .env.local and restart the app; production keeps
// whatever limit is set there, or 5 if none is.
//
// Requires SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to read and clean up.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const urlFlag = process.argv.indexOf('--url');
const appUrl = (urlFlag > -1 ? process.argv[urlFlag + 1] : '') || 'http://localhost:3000';

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

const supabaseUrl = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL');
const secret = env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
const auth = { apikey: secret, Authorization: `Bearer ${secret}` };

if (!supabaseUrl || !secret) {
  console.error('Needs SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local) to check results.');
  process.exitCode = 1;
} else {
  await main();
}

async function main() {
  try {
    await fetch(`${appUrl}/api/orders/products?slug=business-cards`);
  } catch {
    console.error(`The app is not answering at ${appUrl}. Start it first (npm run dev).`);
    process.exitCode = 1;
    return;
  }

  let checks = 0;
  let failures = 0;
  let rateLimited = false;
  const created = [];
  const ok = (label, pass, detail) => {
    checks++;
    if (!pass) failures++;
    console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${label}${detail ? `  (${detail})` : ''}`);
  };

  const rupee = (n) => '₹' + Number(n).toLocaleString('en-IN');

  const placeOrder = async (payload) =>
    fetch(`${appUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Checkout Test',
        customerEmail: 'checkout-test@example.com',
        customerPhone: '9000000002',
        fulfillmentType: 'delivery',
        deliveryAddress: '1 Test Marg',
        deliveryCity: 'New Delhi',
        deliveryState: 'Delhi',
        deliveryPincode: '110030',
        ...payload,
      }),
    }).then(async (r) => {
      if (r.status === 429) rateLimited = true;
      return { status: r.status, body: await r.json() };
    });

  const readRow = async (id) =>
    fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${id}&select=*`, { headers: auth })
      .then((r) => r.json())
      .then((rows) => rows?.[0]);

  const cardItem = (overrides = {}) => ({
    product_slug: 'business-cards',
    product_name: 'Business Cards',
    quantity: 250,
    // The shop's cheapest configuration: every choice that adds cost left at zero.
    selected_options: { size: 'standard', sides: 'single', paper: '300gsm', finish: 'none' },
    ...overrides,
  });

  /* 1. A plain delivery order. 250 cards is 2.99 x 250 = 747.50, less the 250
        tier's 8%, so 687.70, billed to the rupee as 688, plus the flat 50
        courier — 738, and that is the figure the shop's ledger keeps. */
  console.log('\nPriced on the server, not by the browser');
  const plain = await placeOrder({ items: [cardItem()] });
  ok('order accepted', plain.status === 201, `HTTP ${plain.status}`);
  if (plain.status === 201) {
    created.push(plain.body.id);
    const row = await readRow(plain.body.id);
    ok('subtotal ignores the browser and prices the tier', row?.subtotal === 688, `subtotal ${rupee(row?.subtotal)}`);
    ok('courier charge is the shop flat rate', row?.delivery === 50, `delivery ${rupee(row?.delivery)}`);
    ok('total is subtotal + delivery', row?.total === 738, `total ${rupee(row?.total)}`);
    ok('item total is the tiered price', row?.items?.[0]?.price === 688, `item ${rupee(row?.items?.[0]?.price)}`);
    ok(
      'the amount shown to the customer is the amount recorded',
      plain.body.totals?.total === row?.total,
      `screen ${rupee(plain.body.totals?.total)} vs ledger ${rupee(row?.total)}`
    );
  }

  /* 2. The same order, sent with a tampered price. The shop must still bill its
        own number — this is the hole the old route had. */
  const tampered = await placeOrder({
    items: [cardItem({ unit_price: 0.01, total_price: 0.01 })],
    subtotal: 0.01,
    deliveryCharge: 0,
    totalAmount: 0.01,
  });
  if (tampered.status === 201) {
    created.push(tampered.body.id);
    const row = await readRow(tampered.body.id);
    ok('a request cannot set its own price', row?.total === 738, `asked for ₹0.01, billed ${rupee(row?.total)}`);
    ok('the tampered order is not payable at ₹0.01', tampered.body.totals?.total === 738);
  } else {
    ok('a request cannot set its own price', false, `rejected with HTTP ${tampered.status}`);
  }

  /* 3. The shop's coupons. First the cart's own check, which is what the
        customer sees before committing — including that the rupee sign survives
        the trip to the browser. */
  console.log('\nThe shop coupon codes (settings.discount_coupons)');
  const checkCode = (code, subtotal) =>
    fetch(`${appUrl}/api/coupons?code=${code}&subtotal=${subtotal}`).then((r) => r.json());

  const goodCode = await checkCode('VATIKA50', 688);
  ok('a good code reports its discount', goodCode.valid === true && goodCode.discount === 50);
  ok('and says so in rupees, not mojibake', /₹50/.test(String(goodCode.reason)), String(goodCode.reason));

  const smallCode = await checkCode('BULK100', 688);
  ok('a code the order is too small for is refused', smallCode.valid === false && smallCode.minOrder === 1000);

  const unknownCode = await checkCode('NOPE', 688);
  ok('an invented code is refused', unknownCode.valid === false);

  const freeDelCode = await checkCode('FREEDEL', 400);
  ok(
    'a delivery code reports a waived charge, not a discount',
    freeDelCode.valid === true && freeDelCode.deliveryWaived === true && freeDelCode.discount === 0
  );

  const vatika50 = await placeOrder({ items: [cardItem()], couponCode: 'vatika50' });
  if (vatika50.status === 201) {
    created.push(vatika50.body.id);
    const row = await readRow(vatika50.body.id);
    ok('VATIKA50 comes off a ₹688 order', row?.total === 688, `total ${rupee(row?.total)}`);
    ok('the code is recorded for the admin', String(row?.notes ?? '').includes('[COUPON: VATIKA50]'));
  } else {
    ok('VATIKA50 comes off a ₹688 order', false, `HTTP ${vatika50.status}`);
  }

  const tooSmall = await placeOrder({ items: [cardItem()], couponCode: 'BULK100' });
  if (tooSmall.status === 201) {
    created.push(tooSmall.body.id);
    const row = await readRow(tooSmall.body.id);
    ok('BULK100 is refused under ₹1000', row?.total === 738, `total ${rupee(row?.total)}`);
    ok('the refusal is explained in the notes', String(row?.notes ?? '').includes('NOT APPLIED'));
  } else {
    ok('BULK100 is refused under ₹1000', false, `HTTP ${tooSmall.status}`);
  }

  const fake = await placeOrder({ items: [cardItem()], couponCode: 'FREE1000' });
  if (fake.status === 201) {
    created.push(fake.body.id);
    const row = await readRow(fake.body.id);
    ok('an invented code does nothing', row?.total === 738, `total ${rupee(row?.total)}`);
    ok('and is flagged as unrecognised', String(row?.notes ?? '').includes('NOT RECOGNISED'));
  } else {
    ok('an invented code does nothing', false, `HTTP ${fake.status}`);
  }

  const freeDelivery = await placeOrder({
    items: [{ product_slug: 't-shirts', product_name: 'Custom T-Shirts', quantity: 10, selected_options: {} }],
    couponCode: 'FREEDEL',
  });
  if (freeDelivery.status === 201) {
    created.push(freeDelivery.body.id);
    const row = await readRow(freeDelivery.body.id);
    ok('FREEDEL waives the courier charge', row?.delivery === 0, `delivery ${rupee(row?.delivery)}`);
    ok('but does not touch the goods', row?.subtotal === 2490, `subtotal ${rupee(row?.subtotal)}`);
    ok('total is the goods alone', row?.total === 2490, `total ${rupee(row?.total)}`);
  } else {
    ok('FREEDEL waives the courier charge', false, `HTTP ${freeDelivery.status}`);
  }

  /* 4. A bespoke job: priced by hand, so it must order at zero and never be
        handed a gateway order to pay. */
  console.log('\nA bespoke job is a quote request, not a free product');
  const quote = await placeOrder({
    items: [
      {
        product_slug: 'custom-print',
        product_name: 'Custom Printing',
        quantity: 1,
        selected_options: {},
      },
    ],
  });
  if (quote.status === 201) {
    created.push(quote.body.id);
    ok('the quote request is saved', Boolean(quote.body.id));
    ok('nothing is charged for it', quote.body.totals?.total === 0, `total ${rupee(quote.body.totals?.total)}`);
    ok('and no courier charge is added to a hand-quoted job', quote.body.totals?.delivery === 0);
    ok('no gateway order is created for it', !quote.body.razorpay_order_id);
  } else {
    ok('the quote request is saved', false, `HTTP ${quote.status}`);
  }

  /* 5. A product that is not in the catalogue must not be orderable. */
  const unknown = await placeOrder({
    items: [{ product_slug: 'gold-plated-nonsense', product_name: 'Nonsense', quantity: 1, selected_options: {} }],
  });
  ok('an unknown product is refused', unknown.status === 400, `HTTP ${unknown.status}`);

  /* Clean up: the shop's order list is left exactly as it was found. */
  if (rateLimited) {
    console.log(
      '\nNote: the order API rate limiter refused some requests. Put ORDER_RATE_LIMIT=25 in\n' +
        '.env.local and restart the app to run the whole script in one go.'
    );
  }
  console.log('\nCleaning up');
  for (const id of created) {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${id}`, { method: 'DELETE', headers: auth });
    await fetch(`${supabaseUrl}/rest/v1/order_history?order_id=eq.${id}`, { method: 'DELETE', headers: auth });
  }
  const leftovers = await fetch(
    `${supabaseUrl}/rest/v1/orders?select=id&id=in.(${created.map((id) => `"${id}"`).join(',')})`,
    { headers: auth }
  )
    .then((r) => r.json())
    .catch(() => []);
  ok(
    `all ${created.length} test orders removed`,
    !Array.isArray(leftovers) || leftovers.length === 0,
    Array.isArray(leftovers) && leftovers.length ? leftovers.map((r) => r.id).join(', ') : undefined
  );

  console.log(
    `\n${failures === 0 ? 'OK' : 'FAIL'} — ${checks} checks, ${failures} failure${failures === 1 ? '' : 's'}`
  );
  process.exitCode = failures === 0 ? 0 : 1;
}
