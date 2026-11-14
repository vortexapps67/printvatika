import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const DEFAULT_SETTINGS = {
  admin_password: process.env.ADMIN_PASSWORD || '',
  sale_active: 'true',
  sale_title: 'Deal of the Day · Up to 35% Bulk Discount on Business Cards & Flex Banners!',
  sale_badge: 'Deal of the Day',
  sale_hours: '6',
  shop_name: 'Print Vatika',
  phone: '09811427517',
  whatsapp: '919811427517',
  upi_id: '09811427517@oksbi',
  address: 'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi - 110030',
  delivery_charge: '50',
  announcement_text: 'Commercial printing press near Saket Metro · 24–48 hour dispatch · Free store pickup · Flat ₹50 courier across India',
  announcement_link: '/catalog',
  hero_banners: JSON.stringify([
    {
      id: 'banner-signage',
      image: '/images/banner-signage.jpg',
      eyebrow: 'Signage · priced by the foot',
      title: 'Flex banners from ₹15 a sq ft.',
      body: 'Enter the exact feet, pick the finish and the eyelets, and watch the price update. Weatherproof star flex, dispatched in 24–48 hours.',
      chip: { label: 'Starting at', value: '₹15/sqft' },
      href: '/catalog?category=Signage',
      cta: 'Shop signage',
      href2: '/customize/flex-banners',
      cta2: 'Upload artwork',
    },
    {
      id: 'banner-cards',
      image: '/images/banner-cards.jpg',
      eyebrow: 'Stationery · proofed first',
      title: 'Business cards from ₹299 for 100.',
      body: '300–400 GSM stock, matte through velvet lamination. Line your artwork up against the real trim size, approve that exact file, then pay.',
      chip: { label: 'Starting at', value: '₹299 for 100' },
      href: '/customize/business-cards',
      cta: 'Design your card',
      href2: '/catalog?category=Stationery',
      cta2: 'All stationery',
    },
    {
      id: 'banner-tshirts',
      image: '/images/banner-tshirts.jpg',
      eyebrow: 'Apparel · printed in-house',
      title: 'Custom t-shirts from ₹249.',
      body: 'Cotton tees screen printed at the counter — front, back or both, in the colour and size you pick. Ten or ten thousand.',
      chip: { label: 'Starting at', value: '₹249' },
      href: '/customize/t-shirts',
      cta: 'Print a tee',
      href2: '/catalog?category=Apparel',
      cta2: 'All apparel',
    },
    {
      id: 'banner-posters',
      image: '/images/banner-posters.jpg',
      eyebrow: 'Marketing · event ready',
      title: 'Posters from ₹49, flyers from ₹199 for 500.',
      body: 'A3 to A1 on matte, gloss or waterproof synthetic. The collateral for a launch, a sale or an event, cut and ready to hand out.',
      chip: { label: 'Starting at', value: '₹49' },
      href: '/catalog?category=Marketing',
      cta: 'Shop marketing',
      href2: '/customize/custom-print',
      cta2: 'Quote a custom job',
    },
  ]),
  promo_banners: JSON.stringify([
    {
      id: 'promo-marketing',
      image: '/images/brochures.jpg',
      eyebrow: 'Marketing',
      title: 'Brochures, flyers & posters',
      body: 'Everything for a launch or an event, from A6 handouts to A1 posters.',
      href: '/catalog?category=Marketing',
      cta: 'Shop marketing',
      featured: true,
    },
    {
      id: 'promo-specialty',
      image: '/images/custom-print.jpg',
      eyebrow: 'Specialty',
      title: 'Not on the shelf?',
      body: 'Upload the artwork, describe the job, get a quote back from the counter.',
      href: '/customize/custom-print',
      cta: 'Get a quote',
      featured: false,
    },
    {
      id: 'promo-counter',
      image: '/images/hero-bg-light.png',
      eyebrow: 'The counter',
      title: 'Feel the stock first',
      body: 'Card weights, laminates and flex swatches to hand, Mon–Sat.',
      href: '#visit',
      cta: 'Find us',
      featured: false,
    },
  ]),
  offer_tickets: JSON.stringify([
    {
      id: 'offer-pickup',
      title: 'Free store pickup',
      body: 'Collect from F-298, Himmat Singh Marg, Near Saket Metro. No minimum order, nothing added to the price.',
      tag: 'No code needed',
      href: '#visit',
      cta: 'Find the counter',
    },
    {
      id: 'offer-courier',
      title: 'Flat ₹50 courier',
      body: 'Home delivery anywhere in India at one flat rate, shown before you pay.',
      tag: 'All India',
      href: '/catalog',
      cta: 'Start an order',
    },
    {
      id: 'offer-bulk',
      title: 'Up to 35% off in bulk',
      body: 'Quantity tiers apply themselves as you raise the count — the basket price is the invoice price.',
      tag: 'Applied automatically',
      href: '/catalog',
      cta: 'See the catalog',
    },
    {
      id: 'offer-proof',
      title: 'Proof before you pay',
      body: 'Position the artwork on the real trim size, check it on screen, approve that exact file.',
      tag: 'Every order',
      href: '/customize/custom-print',
      cta: 'Upload artwork',
    },
  ]),
};

function readDb() {
  const dbDir = path.join(root, '.data');
  const dbPath = path.join(dbDir, 'db.json');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const init = { products: [], orders: [], order_items: [], order_status_history: [], admin_users: [], settings: DEFAULT_SETTINGS };
    fs.writeFileSync(dbPath, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(raw);
    if (!db.settings) {
      db.settings = { ...DEFAULT_SETTINGS };
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    }
    return db;
  } catch (e) {
    return { products: [], orders: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

function writeDb(db) {
  const dbPath = path.join(root, '.data', 'db.json');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Default route
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // ── API: Coupons ──────────────────────────────────────────────────────────
  if (pathname === '/api/coupons') {
    const code = (parsedUrl.searchParams.get('code') || '').toUpperCase();
    const subtotal = Number(parsedUrl.searchParams.get('subtotal')) || 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (code === 'VATIKA50' && subtotal >= 500) {
      return res.end(JSON.stringify({ valid: true, discount: 50, deliveryWaived: false, reason: '₹50 discount applied.' }));
    }
    if (code === 'BULK100' && subtotal >= 1000) {
      return res.end(JSON.stringify({ valid: true, discount: 100, deliveryWaived: false, reason: '₹100 bulk discount applied.' }));
    }
    if (code === 'FREEDEL' && subtotal >= 300) {
      return res.end(JSON.stringify({ valid: true, discount: 0, deliveryWaived: true, reason: 'Free delivery applied.' }));
    }
    return res.end(JSON.stringify({ valid: false, reason: 'Invalid or ineligible coupon code.' }));
  }

  // ── API: Public Settings ───────────────────────────────────────────────────
  if (pathname === '/api/settings' && req.method === 'GET') {
    const db = readDb();
    const settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
    delete settings.admin_password; // safe
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(settings));
  }

  // ── API: Admin Login ───────────────────────────────────────────────────────
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const db = readDb();
    const settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
    const masterPassword = process.env.ADMIN_PASSWORD || settings.admin_password || '';
    const isMatch = Boolean(masterPassword) && body.password === masterPassword;

    if (isMatch) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'admin_token=printer_wala_vatika_authorized_token; Path=/; HttpOnly; Max-Age=86400',
      });
      return res.end(JSON.stringify({ success: true, message: 'Logged in successfully.' }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid admin credentials.' }));
    }
  }

  // ── API: Admin Settings ────────────────────────────────────────────────────
  if (pathname === '/api/admin/settings') {
    const db = readDb();
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ...DEFAULT_SETTINGS, ...(db.settings || {}) }));
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await parseBody(req);
      if (!db.settings) db.settings = { ...DEFAULT_SETTINGS };

      if (body.key && body.value !== undefined) {
        db.settings[body.key] = typeof body.value === 'string' ? body.value : JSON.stringify(body.value);
      } else if (body.settings && typeof body.settings === 'object') {
        for (const [k, v] of Object.entries(body.settings)) {
          db.settings[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
      } else {
        for (const [k, v] of Object.entries(body)) {
          if (k !== 'key' && k !== 'value') {
            db.settings[k] = typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
      }
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Settings updated.' }));
    }
  }

  // ── API: Orders & Products Catalog ─────────────────────────────────────────
  if (pathname === '/api/orders/products' && req.method === 'GET') {
    const db = readDb();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db.products || []));
  }

  if (pathname === '/api/admin/products' && (req.method === 'PUT' || req.method === 'POST')) {
    const body = await parseBody(req);
    const db = readDb();
    const { action, slug, basePrice, updates } = body;
    const idx = (db.products || []).findIndex(p => p.slug === slug);

    if (idx !== -1) {
      if (action === 'toggleActive') {
        db.products[idx].is_active = !db.products[idx].is_active;
      } else if (action === 'updatePrice') {
        db.products[idx].base_price = Number(basePrice);
      } else if (action === 'update' || action === 'updateProduct') {
        const patch = updates || body;
        delete patch.action;
        delete patch.slug;
        db.products[idx] = { ...db.products[idx], ...patch };
      }
      writeDb(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, product: db.products[idx] }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Product not found.' }));
    }
  }

  if (pathname === '/api/admin/orders') {
    const db = readDb();
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(db.orders || []));
    }
    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const { orderId, orderStatus, notes } = body;
      const idx = (db.orders || []).findIndex(o => o.id === orderId);
      if (idx !== -1) {
        db.orders[idx].order_status = orderStatus;
        db.orders[idx].updated_at = new Date().toISOString();
        if (!db.order_status_history) db.order_status_history = [];
        db.order_status_history.push({
          id: `sh-${orderId}-${Date.now()}`,
          order_id: orderId,
          status: orderStatus,
          notes: notes || `Moved to ${orderStatus}`,
          created_at: new Date().toISOString(),
        });
        writeDb(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, order: db.orders[idx] }));
      }
    }
  }

  // ── Static Files & Routing ────────────────────────────────────────────────
  let filePath = path.join(root, pathname);

  // Manifest & Service Worker routing
  if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
    filePath = path.join(root, 'public', 'manifest.json');
  } else if (pathname === '/sw.js') {
    filePath = path.join(root, 'public', 'sw.js');
  }

  // Image aliases (/images/* -> public/images/* or imgs/*)
  if (pathname.startsWith('/images/')) {
    const pubImg = path.join(root, 'public', pathname);
    const rawImg = path.join(root, 'imgs', pathname.slice(8));
    if (fs.existsSync(pubImg)) filePath = pubImg;
    else if (fs.existsSync(rawImg)) filePath = rawImg;
  }

  // Extensionless routing (e.g. /cart -> /cart.html)
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Check if file exists and is a file
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFoundPath = path.join(root, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Print Vatika local server running at http://localhost:${PORT}`);
  console.log(`Access in your browser: http://localhost:${PORT}`);
});
