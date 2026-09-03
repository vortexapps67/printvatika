// ── SHARED UTILITIES ─────────────────────────────────────────

// Indian currency formatter
window.fmt = n => (n || 0).toLocaleString('en-IN');

// ── TOAST ─────────────────────────────────────────────────────
window.showToast = function (msg, type = 'success') {
  let wrap = document.getElementById('toast-root');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-root';
    wrap.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
};

// ── PRICE CALCULATOR ──────────────────────────────────────────
window.calcPrice = function (product, options, qty, dims) {
  if (!product || product.basePrice === 0) return { unit: 0, subtotal: 0, discount: 0, discPct: 0, total: 0 };

  let optMod = 0;
  (product.options || []).forEach(opt => {
    if (opt.type === 'select') {
      const c = (opt.choices || []).find(ch => ch.val === options[opt.key]);
      if (c) optMod += c.mod;
    }
  });

  const unit = product.basePrice + optMod;
  let subtotal;

  if (product.slug === 'flex-banners') {
    const sqft   = (dims?.w || 4) * (dims?.h || 3);
    const matMod = (product.options.find(o => o.key === 'material')?.choices.find(c => c.val === options.material)?.mod) || 0;
    const finMod = (product.options.find(o => o.key === 'finishing')?.choices.find(c => c.val === options.finishing)?.mod) || 0;
    subtotal = (product.basePrice + matMod) * sqft * qty + finMod;
  } else {
    subtotal = unit * qty;
  }

  const discFactor = Object.entries(product.qtyDiscounts || {})
    .filter(([q]) => qty >= +q)
    .sort(([a],[b]) => +b - +a)[0]?.[1] ?? 1.0;

  const discount = Math.round(subtotal * (1 - discFactor));
  const total    = Math.round(subtotal * discFactor);
  const discPct  = Math.round((1 - discFactor) * 100);
  return { unit, subtotal, discount, discPct, total };
};

// ── FUZZY & TYPO-TOLERANT SEARCH ENGINE ─────────────────────────
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const PRINT_SYNONYMS = {
  'tshirt': ['t-shirt', 't shirt', 'apparel', 'tee', 'tshirts', 'clothing', 'polos'],
  't-shirt': ['t-shirt', 't shirt', 'tshirt', 'tee', 'apparel', 'round neck', 'polo'],
  'shirt': ['t-shirt', 'tshirt', 'apparel', 'tee'],
  'tee': ['t-shirt', 'tshirt', 'apparel'],
  'card': ['business-cards', 'business card', 'visiting card', 'visiting', 'vcard', 'cards'],
  'vcard': ['business-cards', 'business card', 'visiting card'],
  'visiting': ['business-cards', 'business card', 'visiting card'],
  'banner': ['flex-banners', 'flex', 'banner', 'hoarding', 'standee', 'board', 'vinyl', 'signage'],
  'flex': ['flex-banners', 'banner', 'flex banner', 'hoarding', 'signage', 'vinyl'],
  'standee': ['flex-banners', 'banner', 'signage'],
  'board': ['flex-banners', 'banner', 'signage'],
  'flyer': ['flyers', 'flier', 'pamphlet', 'leaflet', 'handout', 'brochure', 'marketing'],
  'flier': ['flyers', 'flyer', 'pamphlet', 'leaflet'],
  'pamphlet': ['flyers', 'flyer', 'brochures', 'brochure', 'leaflet'],
  'poster': ['posters', 'poster', 'wall art', 'chart', 'signage'],
  'brochure': ['brochures', 'brochure', 'booklet', 'catalog', 'pamphlet', 'tri-fold', 'bi-fold'],
  'pamphlets': ['flyers', 'brochures', 'pamphlet'],
  'sticker': ['stickers', 'sticker', 'label', 'tag', 'decal', 'die cut', 'labels'],
  'label': ['stickers', 'labels', 'sticker', 'tag'],
  'tag': ['stickers', 'labels', 'business-cards'],
  'decal': ['stickers', 'sticker'],
  'custom': ['custom-print', 'specialty', 'quote', 'printing']
};

function fuzzyTokenMatch(queryToken, targetTokens) {
  if (!queryToken) return { match: true, score: 100 };
  const qLen = queryToken.length;

  // For very short 1-2 letter tokens (e.g. 't', '3d')
  if (qLen <= 2) {
    for (const target of targetTokens) {
      if (target === queryToken) return { match: true, score: 100 };
      if (target.startsWith(queryToken)) return { match: true, score: 85 };
    }
    return { match: false, score: 0 };
  }

  for (const target of targetTokens) {
    if (!target) continue;
    // 1. Exact match
    if (target === queryToken) return { match: true, score: 100 };
    // 2. Substring match
    if (target.includes(queryToken)) return { match: true, score: 92 };
    if (queryToken.includes(target) && target.length >= 3) return { match: true, score: 88 };

    // 3. Subsequence match (e.g. 'bc' -> 'business-cards')
    let qIdx = 0;
    for (let i = 0; i < target.length && qIdx < qLen; i++) {
      if (target[i] === queryToken[qIdx]) qIdx++;
    }
    if (qIdx === qLen && qLen >= 3) return { match: true, score: 80 };

    // 4. Typo tolerance (Levenshtein distance)
    const maxAllowedDistance = qLen <= 3 ? 1 : qLen <= 6 ? 2 : 3;
    const dist = levenshteinDistance(queryToken, target);
    if (dist <= maxAllowedDistance) {
      return { match: true, score: Math.max(50, 85 - dist * 15) };
    }

    // 5. Sliding window sub-word typo check
    if (target.length > qLen + 1 && qLen >= 4) {
      for (let i = 0; i <= target.length - qLen; i++) {
        const sub = target.substring(i, i + qLen);
        if (levenshteinDistance(queryToken, sub) <= 1) {
          return { match: true, score: 65 };
        }
      }
    }
  }
  return { match: false, score: 0 };
}

window.matchProductSearch = function(product, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return { match: true, score: 100 };
  const query = rawQuery.trim().toLowerCase();

  // Extract all searchable text fields from product
  const rawFields = [
    product.name || '',
    product.slug || '',
    product.category || '',
    product.desc || '',
    ...(product.tags || []),
    ...(product.options ? product.options.flatMap(o => [o.label, ...(o.choices || []).map(c => c.label)]) : [])
  ].join(' ').toLowerCase();

  const productTokens = rawFields.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

  // Normalize query tokens (combine 't' + 'shirt' -> 'tshirt')
  let queryTokens = query.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  if (!queryTokens.length) return { match: true, score: 100 };

  // Handle special compound queries like "t shirt", "v card"
  if (queryTokens.length >= 2 && queryTokens[0] === 't' && (queryTokens[1].startsWith('sh') || queryTokens[1] === 'shirt')) {
    queryTokens = ['tshirt', ...queryTokens.slice(2)];
  }

  let totalScore = 0;
  for (const qToken of queryTokens) {
    const tokenSynonyms = PRINT_SYNONYMS[qToken] || [];
    const allQueryVariations = [qToken, ...tokenSynonyms];

    let bestTokenScore = 0;
    for (const variation of allQueryVariations) {
      const { match, score } = fuzzyTokenMatch(variation, productTokens);
      if (match && score > bestTokenScore) {
        bestTokenScore = score;
      }
    }

    if (bestTokenScore === 0) {
      return { match: false, score: 0 };
    }
    totalScore += bestTokenScore;
  }

  return { match: true, score: Math.round(totalScore / queryTokens.length) };
};

// ── PRODUCT CARD HTML ─────────────────────────────────────────
window.productCardHTML = function (p) {
  const price = p.basePrice === 0 ? 'Custom Quote' : '₹' + fmt(p.basePrice);
  const unit  = p.basePrice === 0 ? '' : `<small style="font-size:0.75rem;font-weight:600;color:var(--ink-mute);"> ${p.baseUnit}</small>`;
  return `<div class="product-card" onclick="location.href='product.html?slug=${p.slug}'">
    <div class="product-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='imgs/business-cards.jpg';">
      <span class="product-cat-tag">${p.category}</span>
    </div>
    <div class="product-body">
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-footer">
        <div class="product-price-wrap">
          <div class="product-price-from">Starting from</div>
          <div class="product-price">${price}${unit}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();location.href='product.html?slug=${p.slug}'">Customise →</button>
      </div>
    </div>
  </div>`;
};

// ── THEME SWITCHER (Dark / Light) ──────────────────────────────
window.initTheme = function () {
  const saved = localStorage.getItem('pv_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleUI(theme);
};

window.toggleTheme = function () {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('pv_theme', next);
  updateThemeToggleUI(next);
};

function updateThemeToggleUI(theme) {
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  });
}

// ── SCROLL REVEAL OBSERVER ────────────────────────────────────
window.initScrollReveal = function () {
  if (typeof IntersectionObserver === 'undefined') return;

  const targets = document.querySelectorAll('.reveal-init, .reveal-on-scroll, .process-step, .review-card, .faq-item');
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 50px 0px'
  });

  targets.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    // If element is already in or near viewport on load, reveal immediately!
    if (rect.top < windowHeight * 1.1) {
      el.classList.add('is-revealed');
    } else {
      if (!el.classList.contains('reveal-init')) {
        el.classList.add('reveal-init');
        if (index % 3 === 1) el.classList.add('delay-1');
        if (index % 3 === 2) el.classList.add('delay-2');
      }
      observer.observe(el);
    }
  });
};

// ── ANNOUNCEMENT TICKER ───────────────────────────────────────
window.getAnnouncementTicker = async function() {
  try {
    const { data, error } = await db.from('settings').select('value').eq('key', 'announcement_ticker').single();
    if (data && data.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return parsed;
    }
  } catch (e) {}
  try {
    const local = localStorage.getItem('pv_ticker');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return {
    text: "⚡ SAME-DAY PORTER DISPATCH IN DELHI-NCR • Use code FIRST10 for 10% OFF • 📞 Call/WhatsApp: 098114 27517",
    enabled: true,
    theme: "cyan"
  };
};

window.renderAnnouncementTicker = async function() {
  const existing = document.getElementById('announcement-ticker');
  if (existing) existing.remove();

  const cfg = await window.getAnnouncementTicker();
  if (!cfg || cfg.enabled === false || !cfg.text) return;

  const header = document.getElementById('site-header');
  if (!header) return;

  const ticker = document.createElement('div');
  ticker.id = 'announcement-ticker';
  ticker.className = 'announcement-ticker';
  ticker.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;max-width:1200px;margin:0 auto;width:100%;justify-content:center;">
      <span class="ticker-tag">Notice</span>
      <span style="font-size:0.75rem;font-weight:700;color:#FFFFFF;letter-spacing:0.02em;">${cfg.text}</span>
    </div>
  `;
  header.parentNode.insertBefore(ticker, header);
};

// ── DYNAMIC COUPON ENGINE ─────────────────────────────────────
window.DEFAULT_COUPONS = [
  { code: 'FIRST10', type: 'percent', value: 10, label: '10% OFF Welcome Discount', minOrder: 0, active: true },
  { code: 'WELCOME10', type: 'percent', value: 10, label: '10% OFF Welcome Discount', minOrder: 0, active: true },
  { code: 'VATIKA50', type: 'flat', value: 50, label: '₹50 OFF on Orders > ₹500', minOrder: 500, active: true },
  { code: 'FREEDEL', type: 'delivery', value: 50, label: 'Free Porter Delivery', minOrder: 300, active: true },
  { code: 'BULK100', type: 'flat', value: 100, label: '₹100 OFF on Orders > ₹1000', minOrder: 1000, active: true }
];

window.getAvailableCoupons = async function() {
  try {
    const { data, error } = await db.from('settings').select('value').eq('key', 'discount_coupons').single();
    if (data && data.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  try {
    const local = localStorage.getItem('pv_coupons');
    if (local) return JSON.parse(local);
  } catch (e) {}
  return window.DEFAULT_COUPONS;
};

// ── SHARED HEADER / FOOTER ────────────────────────────────────
window.renderHeader = function (activePage) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';

  el.innerHTML = `<div class="header-inner">
    <a href="index.html" class="brand" style="display:flex; align-items:center;">
      <img src="imgs/logo-nobg.png" alt="Print Vatika" style="height:38px; max-height:38px; width:auto; object-fit:contain;" onerror="this.onerror=null; this.outerHTML='<div class=&quot;brand-mark&quot;>PV</div>Print Vatika';">
    </a>
    <nav class="header-nav">
      <a href="index.html"   class="nav-link ${activePage==='home'    ? 'active':''}" >Home</a>
      <a href="catalog.html" class="nav-link ${activePage==='catalog' ? 'active':''}">Catalog</a>
      <a href="track.html"   class="nav-link ${activePage==='track'   ? 'active':''}">Track Order</a>
    </nav>
    
    <!-- Quick Search -->
    <form action="catalog.html" method="GET" class="header-search-form" style="display:flex;align-items:center;position:relative;margin:0 0.5rem;">
      <input type="text" name="q" placeholder="Search products..." aria-label="Search products" style="padding:0.35rem 0.75rem 0.35rem 1.8rem;border-radius:20px;border:1px solid var(--border);font-size:0.75rem;background:var(--bg-input);color:var(--ink);width:130px;transition:all 0.2s;" onfocus="this.style.width='180px';this.style.borderColor='var(--cyan)';" onblur="if(!this.value)this.style.width='130px';this.style.borderColor='var(--border)';">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="position:absolute;left:0.6rem;color:var(--ink-mute);pointer-events:none;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    </form>

    <div class="header-phone">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54A16 16 0 0 0 14 15.59l.95-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <a href="tel:09811427517">098114 27517</a>
    </div>

    <!-- Theme Switcher Button -->
    <button class="theme-toggle-btn desktop-auth-only" onclick="toggleTheme()" aria-label="Toggle Theme" title="Switch Theme">${themeIcon}</button>
    
    <!-- Dynamic Auth Zone -->
    <div id="header-auth-zone" class="desktop-auth-only" style="display:flex;align-items:center;gap:0.75rem;"></div>

    <a href="cart.html" class="cart-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Cart <span class="cart-badge" style="display:none;">0</span>
    </a>
    
    <!-- Mobile Hamburger Toggle -->
    <button class="menu-toggle-btn" id="menu-toggle-btn" onclick="toggleMobileMenu()" aria-label="Toggle Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  </div>
  
  <!-- Mobile Navigation Dropdown Drawer -->
  <div id="mobile-nav-menu" class="mobile-nav-menu">
    <form action="catalog.html" method="GET" style="width:100%;margin-bottom:0.5rem;padding:0 0.5rem;">
      <input type="text" name="q" placeholder="Search products..." style="width:100%;padding:0.45rem 0.75rem;border-radius:8px;border:1px solid var(--border);font-size:0.8rem;background:var(--bg-input);color:var(--ink);">
    </form>
    <a href="index.html"   class="mobile-nav-link ${activePage==='home'    ? 'active':''}">Home</a>
    <a href="catalog.html" class="mobile-nav-link ${activePage==='catalog' ? 'active':''}">Catalog</a>
    <a href="track.html"   class="mobile-nav-link ${activePage==='track'   ? 'active':''}">Track Order</a>
    <a href="admin.html"   class="mobile-nav-link ${activePage==='admin'   ? 'active':''}">Admin Portal</a>
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:0.5rem;border-top:1px solid var(--border);margin-top:0.5rem;">
      <span style="font-size:0.85rem;font-weight:700;color:var(--ink);">Appearance</span>
      <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle Theme">${themeIcon}</button>
    </div>
    <div id="mobile-auth-zone-drawer" style="margin-top:0.5rem; border-top:1px solid var(--border); padding-top:0.75rem; display:flex; flex-direction:column; gap:0.5rem; width:100%; align-items:center;"></div>
  </div>`;
  
  Cart.updateBadge();
  updateHeaderAuth();
  initScrollReveal();
  renderMobileBottomNav(activePage);
  renderAnnouncementTicker();
};

// ── MOBILE BOTTOM NAVIGATION DOCK ────────────────────────────
window.renderMobileBottomNav = function (activePage) {
  let el = document.getElementById('mobile-bottom-dock');
  if (!el) {
    el = document.createElement('nav');
    el.id = 'mobile-bottom-dock';
    el.className = 'mobile-bottom-dock';
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <a href="index.html" class="dock-item ${activePage==='home' ? 'active':''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Home</span>
    </a>
    <a href="catalog.html" class="dock-item ${activePage==='catalog' ? 'active':''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
      <span>Catalog</span>
    </a>
    <a href="cart.html" class="dock-item ${activePage==='cart' ? 'active':''}">
      <div style="position:relative;display:inline-flex;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        <span class="dock-cart-badge cart-badge" style="display:none;">0</span>
      </div>
      <span>Cart</span>
    </a>
    <a href="track.html" class="dock-item ${activePage==='track' ? 'active':''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>Track</span>
    </a>
    <a href="admin.html" class="dock-item ${activePage==='admin' ? 'active':''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      <span>Admin</span>
    </a>
    <a href="https://wa.me/919811427517?text=Hi%20Print%20Vatika%2C%20I%20have%20a%20printing%20inquiry" target="_blank" class="dock-item dock-item-wa">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.112 1.524 5.84L0 24l6.318-1.524A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.373l-.36-.214-3.73.978.994-3.638-.234-.374A9.818 9.818 0 1 1 12 21.818z"/></svg>
      <span>WhatsApp</span>
    </a>
  `;
  Cart.updateBadge();
};

// ── PINCODE DELIVERY & ESTIMATOR ─────────────────────────────
window.checkPincodeDelivery = function(pincode) {
  const pin = (pincode || '').toString().trim().replace(/\D/g, '');
  if (pin.length !== 6) {
    return { valid: false, message: 'Please enter a valid 6-digit Indian PIN code.' };
  }

  const num = parseInt(pin, 10);
  
  // Local South Delhi (Saket, Hauz Khas, Malviya Nagar, Mehrauli, Nai Basti)
  const southDelhiPins = [110030, 110017, 110016, 110029, 110049, 110062, 110070, 110068, 110074];
  if (southDelhiPins.includes(num)) {
    return {
      valid: true,
      zone: 'Local South Delhi (Press Hub)',
      speed: '⚡ Lightning 2–3 Hour Porter Dispatch',
      badge: 'Local Press Delivery',
      color: '#10B981',
      details: 'Same-day instant dispatch directly from our Lado Sarai press near Saket Metro. Porter pickup ready in 120 mins.'
    };
  }

  // Delhi NCT (110001 - 110096)
  if (num >= 110001 && num <= 110096) {
    return {
      valid: true,
      zone: 'Delhi NCT Express',
      speed: '🛵 Same-Day / Next-Day Morning Porter',
      badge: 'Delhi Express',
      color: '#00B2EC',
      details: 'Fast doorstep Porter courier delivery across all Delhi districts. Order before 4 PM for today\'s press run.'
    };
  }

  // NCR Suburbs (Gurugram, Noida, Ghaziabad, Faridabad)
  if ((num >= 122001 && num <= 122505) || (num >= 201301 && num <= 201318) || (num >= 201001 && num <= 201017) || (num >= 121001 && num <= 121010)) {
    return {
      valid: true,
      zone: 'Delhi NCR (Gurugram / Noida / Faridabad)',
      speed: '🚚 Express 24-Hour NCR Dispatch',
      badge: 'NCR Porter Dispatch',
      color: '#8B5CF6',
      details: 'Direct Porter / WeFast courier connection. Delivered to your office/home within 24 hours of printing.'
    };
  }

  // Rest of India
  return {
    valid: true,
    zone: 'All-India Shipping',
    speed: '📦 2–3 Business Days Air Express',
    badge: 'National Express',
    color: '#3B82F6',
    details: 'Dispatched via BlueDart / Delhivery Express with live courier tracking number.'
  };
};

// ── REORDER PREVIOUS JOB ─────────────────────────────────────
window.reorderJob = function(order) {
  if (!order || !order.items || !order.items.length) {
    showToast('Unable to load items from this order.', 'error');
    return;
  }
  
  order.items.forEach(item => {
    Cart.add({
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      productId: item.productId || item.id,
      name: item.name,
      category: item.category || 'Printing',
      price: item.total || (item.unitPrice * (item.qty || 100)),
      qty: item.qty || 100,
      options: item.options || {},
      dims: item.dims || null,
      artwork: item.artwork || null,
      slug: item.slug || 'custom-print'
    });
  });

  showToast('✓ ' + order.items.length + ' item(s) added to cart!', 'success');
  setTimeout(() => {
    location.href = 'cart.html';
  }, 400);
};

// Initialize theme immediately on script execution
if (typeof window !== 'undefined' && typeof window.initTheme === 'function') {
  try {
    window.initTheme();
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.initTheme === 'function') window.initTheme();
        if (typeof window.initScrollReveal === 'function') window.initScrollReveal();
      });
    }
  } catch (e) {}
}

window.toggleMobileMenu = function () {
  const menu = document.getElementById('mobile-nav-menu');
  if (menu) menu.classList.toggle('open');
};

window.updateHeaderAuth = async function () {
  const zone = document.getElementById('header-auth-zone');
  const drawerZone = document.getElementById('mobile-auth-zone-drawer');
  if (!zone) return;

  try {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
      const user = session.user;
      const name = user.user_metadata?.full_name || user.email.split('@')[0];
      const html = `
        <span style="font-size:0.8rem;font-weight:700;color:var(--ink);">Hi, ${name}</span>
        <button onclick="handleHeaderLogout()" class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:0.7rem;border:1px solid var(--border);border-radius:4px;">Logout</button>
      `;
      zone.innerHTML = html;
      if (drawerZone) drawerZone.innerHTML = html;
    } else {
      const html = `
        <a href="login.html" class="nav-link" style="font-weight:700;color:var(--cyan-dark);margin:0;">Sign In</a>
      `;
      zone.innerHTML = html;
      if (drawerZone) drawerZone.innerHTML = html;
    }
  } catch (e) {
    console.warn('Auth check failed', e);
  }
};

window.handleHeaderLogout = async function () {
  await db.auth.signOut();
  showToast('Logged out successfully', 'info');
  setTimeout(() => location.reload(), 500);
};

window.renderFooter = function () {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `<div class="footer-inner">
    <div class="footer-brand" style="display:flex; align-items:center;">
      <img src="imgs/logo-nobg.png" alt="Print Vatika" style="height:32px; width:auto; object-fit:contain; filter:brightness(0) invert(1);" onerror="this.onerror=null; this.outerHTML='Print Vatika';">
    </div>
    <div class="footer-links">
      <a href="index.html"   class="footer-link">Home</a>
      <a href="catalog.html" class="footer-link">Catalog</a>
      <a href="track.html"   class="footer-link">Track Order</a>
      <a href="privacy.html" class="footer-link">Privacy</a>
      <a href="terms.html"   class="footer-link">Terms</a>
      <a href="admin.html"   class="footer-link" style="color:rgba(255,255,255,.25)">Admin →</a>
    </div>
    <div class="footer-copy">© ${new Date().getFullYear()} Print Vatika · F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi 110030 · 098114 27517</div>
  </div>`;
};

// ── CANVAS ENGINE ─────────────────────────────────────────────
window.CE = {
  draw(canvas, product, options, dims, imageObj, designPos) {
    if (!canvas || !product) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    this.base(ctx, W, H, product, options, dims);
    if (imageObj) {
      ctx.save();
      this.clip(ctx, W, H, product, options, dims);
      ctx.translate(W/2 + designPos.x, H/2 + designPos.y);
      ctx.rotate(designPos.rot * Math.PI / 180);
      const dw = imageObj.width * designPos.scale, dh = imageObj.height * designPos.scale;
      ctx.drawImage(imageObj, -dw/2, -dh/2, dw, dh);
      ctx.restore();
      this.safetyLines(ctx, W, H, product, options);
    } else {
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 12px Outfit,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Upload a design to preview here', W/2, H/2);
    }
  },

  base(ctx, W, H, product, options, dims) {
    switch (product.slug) {
      case 'business-cards': this._card(ctx, W, H);               break;
      case 't-shirts':       this._shirt(ctx, W, H, options);     break;
      case 'flex-banners':   this._banner(ctx, W, H, dims);       break;
      case 'stickers':       this._sticker(ctx, W, H, options);   break;
      default:               this._generic(ctx, W, H);            break;
    }
  },

  clip(ctx, W, H, product, options, dims) {
    ctx.beginPath();
    switch (product.slug) {
      case 'business-cards': { const cw=300,ch=170,rx=(W-cw)/2,ry=(H-ch)/2; ctx.roundRect(rx,ry,cw,ch,6); break; }
      case 't-shirts':       ctx.rect((W-120)/2, H/2-80, 120, 160); break;
      case 'flex-banners':   { const r=this._bannerRect(W,H,dims); ctx.rect(r.x,r.y,r.w,r.h); break; }
      case 'stickers':       { const sh=options.shape||'circle'; if(sh==='circle') ctx.arc(W/2,H/2,110,0,Math.PI*2); else ctx.roundRect((W-220)/2,(H-220)/2,220,220,10); break; }
      default:               ctx.rect(25,25,W-50,H-50);
    }
    ctx.clip();
  },

  safetyLines(ctx, W, H, product, options) {
    ctx.save();
    ctx.strokeStyle='rgba(239,68,68,.45)'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    if (product.slug==='business-cards') ctx.strokeRect((W-280)/2,(H-150)/2,280,150);
    if (product.slug==='stickers') {
      ctx.beginPath();
      const sh=options.shape||'circle';
      if(sh==='circle') ctx.arc(W/2,H/2,98,0,Math.PI*2); else ctx.rect((W-200)/2,(H-200)/2,200,200);
      ctx.stroke();
    }
    ctx.restore();
  },

  _card(ctx, W, H) {
    const cw=300,ch=170,rx=(W-cw)/2,ry=(H-ch)/2;
    ctx.fillStyle='#F5F0E8'; ctx.fillRect(0,0,W,H);
    ctx.shadowColor='rgba(0,0,0,.12)'; ctx.shadowBlur=20; ctx.shadowOffsetY=4;
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.roundRect(rx,ry,cw,ch,6); ctx.fill();
    ctx.shadowColor='transparent'; ctx.strokeStyle='#D8D4CC'; ctx.lineWidth=1; ctx.stroke();
  },

  _shirt(ctx, W, H, options) {
    const cm={white:'#FFF',black:'#1f1f23',navy:'#1B263B',grey:'#CBD5E1'};
    const c=cm[options.color||'white']||'#FFF';
    ctx.fillStyle='#F5F0E8'; ctx.fillRect(0,0,W,H);
    ctx.shadowColor='rgba(0,0,0,.1)'; ctx.shadowBlur=12; ctx.shadowOffsetY=4;
    ctx.fillStyle=c; const cx=W/2;
    ctx.beginPath();
    ctx.moveTo(cx-40,35); ctx.quadraticCurveTo(cx,48,cx+40,35);
    ctx.lineTo(cx+90,48); ctx.lineTo(cx+115,95); ctx.lineTo(cx+78,108); ctx.lineTo(cx+68,88);
    ctx.lineTo(cx+68,H-40); ctx.lineTo(cx-68,H-40); ctx.lineTo(cx-68,88);
    ctx.lineTo(cx-78,108); ctx.lineTo(cx-115,95); ctx.lineTo(cx-90,48); ctx.closePath(); ctx.fill();
    ctx.shadowColor='transparent';
    if(c==='#FFF'){ctx.strokeStyle='#D8D4CC';ctx.lineWidth=1;ctx.stroke();}
  },

  _bannerRect(W, H, dims) {
    const pad=30, asp=(dims?.w||4)/(dims?.h||3);
    let bw=W-pad*2, bh=bw/asp;
    if(bh>H-pad*2){bh=H-pad*2;bw=bh*asp;}
    return {x:(W-bw)/2,y:(H-bh)/2,w:bw,h:bh};
  },

  _banner(ctx, W, H, dims) {
    const r=this._bannerRect(W,H,dims);
    ctx.fillStyle='#CBD5E1'; ctx.fillRect(0,0,W,H);
    ctx.shadowColor='rgba(0,0,0,.1)'; ctx.shadowBlur=10;
    ctx.fillStyle='#FFF'; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.shadowColor='transparent'; ctx.strokeStyle='#1A1A1A'; ctx.lineWidth=1.5; ctx.strokeRect(r.x,r.y,r.w,r.h);
    [[r.x+7,r.y+7],[r.x+r.w-7,r.y+7],[r.x+7,r.y+r.h-7],[r.x+r.w-7,r.y+r.h-7]].forEach(([ex,ey])=>{
      ctx.beginPath(); ctx.arc(ex,ey,4,0,Math.PI*2);
      ctx.fillStyle='#94A3B8'; ctx.fill(); ctx.strokeStyle='#475569'; ctx.lineWidth=1; ctx.stroke();
    });
  },

  _sticker(ctx, W, H, options) {
    ctx.fillStyle='#F5F0E8'; ctx.fillRect(0,0,W,H);
    ctx.shadowColor='rgba(0,0,0,.08)'; ctx.shadowBlur=12;
    ctx.fillStyle='#FFF'; ctx.beginPath();
    const sh=options.shape||'circle';
    if(sh==='circle') ctx.arc(W/2,H/2,110,0,Math.PI*2);
    else ctx.roundRect((W-220)/2,(H-220)/2,220,220,10);
    ctx.fill(); ctx.shadowColor='transparent'; ctx.strokeStyle='#D8D4CC'; ctx.lineWidth=1; ctx.stroke();
  },

  _generic(ctx, W, H) {
    ctx.fillStyle='#F5F0E8'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#D8D4CC'; ctx.lineWidth=1.5; ctx.strokeRect(25,25,W-50,H-50);
  },
};

// ── ORDER ID GENERATOR ────────────────────────────────────────
window.genOrderId = async function () {
  try {
    const { count } = await db.from('orders').select('*', { count: 'exact', head: true });
    return 'PV-' + (1001 + (count || 0));
  } catch {
    return 'PV-' + (1001 + Math.floor(Math.random() * 9000));
  }
};

// ── DATE HELPERS ──────────────────────────────────────────────
window.fmtDate = d => new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
window.fmtDateShort = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

// ── STATUS BADGE ──────────────────────────────────────────────
window.statusBadge = function (status) {
  const map = {
    PAYMENT_PENDING: ['Pending Payment',  'badge-pending'  ],
    CONFIRMED:       ['Confirmed',         'badge-confirmed'],
    PRINTING:        ['Printing',          'badge-printing' ],
    READY:           ['Ready / Dispatch',  'badge-ready'    ],
    DELIVERED:       ['Delivered',         'badge-done'     ],
    CANCELLED:       ['Cancelled',         'badge-cancelled'],
  };
  const [label, cls] = map[status] || [status, ''];
  return `<span class="status-badge ${cls}">${label}</span>`;
};

// ── PRINT INVOICE GENERATOR ──────────────────────────────────
window.printInvoice = function (order) {
  const w = window.open('', '_blank');
  if (!w) { alert('Popup blocked. Please allow popups to view the invoice.'); return; }
  
  const itemsHtml = (order.items || []).map(i => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; font-size: 14px;">
        <strong>${i.name}</strong>
        ${i.dims ? `<br><small style="color: #64748B;">Size: ${i.dims.w} × ${i.dims.h} ft</small>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 14px;">${i.qty}</td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 14px; font-weight: 600;">₹${(i.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1E293B; margin: 0; padding: 40px; background: #FFFFFF; }
        .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; padding: 40px; }
        .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #1E293B; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 24px; font-weight: 800; font-family: Georgia, serif; }
        .meta { text-align: right; }
        .title { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #F8FAFC; padding: 10px 8px; text-align: left; border-bottom: 2px solid #E2E8F0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; }
        .summary-box { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; border-top: 2px solid #E2E8F0; padding-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; width: 280px; font-size: 14px; }
        .summary-total { font-size: 18px; font-weight: 800; color: #0F172A; border-top: 1px solid #E2E8F0; padding-top: 8px; margin-top: 4px; }
        @media print {
          body { padding: 0; }
          .invoice-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="invoice-header">
          <div>
            <div class="brand">Print Vatika</div>
            <div style="font-size: 13px; color: #64748B; margin-top: 4px; line-height: 1.4;">
              F-298, Himmat Singh Marg, Near Saket Metro<br>
              Lado Sarai, New Delhi – 110030<br>
              Phone: 098114 27517
            </div>
          </div>
          <div class="meta">
            <div class="title">INVOICE</div>
            <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px;">ID: ${order.id}</div>
            <div style="font-size: 13px; color: #64748B;">Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <div class="section-title">Billed To</div>
            <div style="font-size: 14px; line-height: 1.5;">
              <strong>${order.name}</strong><br>
              ${order.phone}<br>
              ${order.email}
            </div>
          </div>
          <div>
            <div class="section-title">Fulfillment</div>
            <div style="font-size: 14px; line-height: 1.5; text-transform: capitalize;">
              <strong>${order.fulfillment}</strong><br>
              ${order.address}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Product Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Price</th></tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row"><span>Subtotal</span><span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
          <div class="summary-row"><span>Fulfillment / Delivery</span><span>${order.delivery > 0 ? '₹' + order.delivery.toLocaleString('en-IN') : 'Free'}</span></div>
          <div class="summary-row summary-total"><span>Total Amount</span><span>₹${(order.total || 0).toLocaleString('en-IN')}</span></div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  w.document.close();
};
