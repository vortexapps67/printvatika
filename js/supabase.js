// ── SUPABASE CLIENT ──────────────────────────────────────────
// Uses the publishable (anon) key — safe for client-side code.
// The SECRET key should NEVER appear here or in any JS file.
// Include Supabase CDN before this script in every HTML page.

const SUPABASE_URL = (typeof window !== 'undefined' && window.ENV?.SUPABASE_URL) || 'https://vbbcijydjuziocfbcagn.supabase.co';
const SUPABASE_KEY = (typeof window !== 'undefined' && window.ENV?.SUPABASE_ANON_KEY) || 'sb_publishable_pRjENfyp4wRDPhSITiPNRg_7ymjGJpj';

window.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SETTINGS CACHE ────────────────────────────────────────────
window.SETTINGS = {};

window.loadSettings = async function () {
  try {
    const { data } = await db.from('settings').select('key, value');
    if (data) data.forEach(r => { SETTINGS[r.key] = r.value; });
  } catch (e) {
    console.warn('Could not load settings from Supabase — using defaults.', e);
  }
  // Merge defaults for any missing keys
  const defaults = {
    shop_name:     'Print Vatika',
    upi_id:        '09811427517@oksbi',
    phone:         '09811427517',
    whatsapp:      '919811427517',
    address:       'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi – 110030',
    hours_weekday: 'Mon–Sat: 9 AM – 8 PM',
    hours_weekend: 'Sunday: 10 AM – 5 PM',
    admin_password:'vatika2026',
  };
  Object.entries(defaults).forEach(([k, v]) => { if (!SETTINGS[k]) SETTINGS[k] = v; });
};

// ── PRODUCTS CACHE ────────────────────────────────────────────
window.loadProducts = async function () {
  try {
    const { data, error } = await db.from('products').select('*').order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) {
      const dbProds = data.map(dp => ({
        id: dp.id,
        slug: dp.slug,
        name: dp.name,
        category: dp.category,
        desc: dp.description,
        image: dp.image,
        basePrice: dp.base_price,
        baseUnit: dp.base_unit,
        options: dp.options,
        quantities: dp.quantities,
        qtyDiscounts: dp.qty_discounts,
        defaultQty: dp.default_qty,
        active: dp.active !== false
      }));

      // Merge: Keep all defaults, overwrite details for matches from DB
      window.PRODUCTS = window.PRODUCTS.map(defaultProd => {
        const dbProd = dbProds.find(dp => dp.id === defaultProd.id);
        return dbProd ? dbProd : defaultProd;
      });

      // Append any new custom products created directly in the DB
      dbProds.forEach(dp => {
        if (!window.PRODUCTS.some(p => p.id === dp.id)) {
          window.PRODUCTS.push(dp);
        }
      });
    }
  } catch (e) {
    console.warn('Could not load products from Supabase — using local defaults.', e);
  }
};
