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

// ── SHARED HEADER / FOOTER ────────────────────────────────────
window.renderHeader = function (activePage) {
  const el = document.getElementById('site-header');
  if (!el) return;
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
      <input type="text" name="q" placeholder="Search products..." aria-label="Search products" style="padding:0.35rem 0.75rem 0.35rem 1.8rem;border-radius:20px;border:1px solid var(--border);font-size:0.75rem;background:var(--paper);color:var(--ink);width:130px;transition:all 0.2s;" onfocus="this.style.width='180px';this.style.borderColor='var(--cyan)';" onblur="if(!this.value)this.style.width='130px';this.style.borderColor='var(--border)';">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="position:absolute;left:0.6rem;color:var(--ink-mute);pointer-events:none;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    </form>

    <div class="header-phone">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54A16 16 0 0 0 14 15.59l.95-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <a href="tel:09811427517">098114 27517</a>
    </div>
    
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
      <input type="text" name="q" placeholder="Search products..." style="width:100%;padding:0.45rem 0.75rem;border-radius:8px;border:1px solid var(--border);font-size:0.8rem;background:var(--paper);">
    </form>
    <a href="index.html"   class="mobile-nav-link ${activePage==='home'    ? 'active':''}">Home</a>
    <a href="catalog.html" class="mobile-nav-link ${activePage==='catalog' ? 'active':''}">Catalog</a>
    <a href="track.html"   class="mobile-nav-link ${activePage==='track'   ? 'active':''}">Track Order</a>
    <div id="mobile-auth-zone-drawer" style="margin-top:0.75rem; border-top:1px solid var(--border); padding-top:0.75rem; display:flex; flex-direction:column; gap:0.5rem; width:100%; align-items:center;"></div>
  </div>`;
  
  Cart.updateBadge();
  updateHeaderAuth();
};

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
