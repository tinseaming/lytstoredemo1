/* LYT Store: storefront (router, pages, cart drawer, checkout, orders, auth) */
(function () {
  'use strict';
  const MS = (window.MS = window.MS || {});
  const { $, $$, esc, money, icon, DB } = MS;
  MS.actions = MS.actions || {};
  MS.forms = MS.forms || {};
  MS.inputs = MS.inputs || {};

  const app = () => document.getElementById('app');

  /* ===================== visuals ===================== */
  const statusClass = (s) => 'st-' + String(s).toLowerCase().replace(/[^a-z]+/g, '-');
  const pill = (s) => `<span class="status ${statusClass(s)}">${esc(s)}</span>`;
  const TYPE_LABEL = { phone: 'Phones', watch: 'Watches', airpod: 'AirPods', airtag: 'AirTags', accessory: 'Accessories' };
  const TYPE_ICON = { phone: 'phone', watch: 'clock', airpod: 'headset', airtag: 'tag', accessory: 'zap' };
  const PAGE = 12;

  function pimg(p, hex, view) {
    if (p.image) return `<img class="p-photo" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`;
    if (p.type && p.type !== 'phone') return MS.art.product(p, hex || (p.colors[0] || {}).hex);
    return MS.art.phone({ brand: p.brand, color: hex || (p.colors[0] || {}).hex, view: view || 'front', title: p.name });
  }
  MS.pimg = pimg;

  function phone3D(p, hex, opts = {}) {
    const layers = Array.from({ length: 10 }, (_, i) => `<div class="ph-layer" style="transform:translateZ(${-(i + 1) * 1.3}px)">${MS.art.silhouette(hex)}</div>`).join('');
    return `<div class="phone3d ${opts.flip ? 'is-back' : ''} ${opts.still ? 'still' : ''}" data-tilt><div class="phone3d-inner">
      <div class="ph-face ph-front">${MS.art.phone({ brand: p.brand, color: hex, view: 'front', title: p.name })}</div>${layers}
      <div class="ph-face ph-back">${MS.art.phone({ brand: p.brand, color: hex, view: 'back', title: p.name })}</div></div></div>`;
  }

  function badge(p) {
    const d = MS.discount(p);
    if (p.stock <= 0) return '<span class="badge badge-out">Sold out</span>';
    if (d) return `<span class="badge badge-deal">-${d}%</span>`;
    if (p.isNew) return '<span class="badge badge-new">New</span>';
    return '';
  }
  function condPill(p) {
    if (p.condition) return `<span class="cond">${esc(p.condition)}</span>`;
    return '<span class="cond cond-new">New</span>';
  }
  function stockText(p) {
    if (p.stock <= 0) return '<span class="st-txt out">Out of stock</span>';
    if (p.stock <= MS.LOW_STOCK) return `<span class="st-txt low">Only ${p.stock} left</span>`;
    return `<span class="st-txt">${p.stock} in stock</span>`;
  }

  function card(p) {
    const col = p.colors[0] || { hex: '#444' };
    return `<article class="p-card ${p.stock <= 0 ? 'is-out' : ''}" style="--pc:${esc(col.hex)}">
      <a class="p-media" href="#/product/${p.id}" aria-label="${esc(p.name)}">${badge(p)}${condPill(p)}<div class="p-art">${pimg(p, col.hex)}</div></a>
      <div class="p-body"><span class="p-brand">${esc(p.brand)}</span>
        <h3 class="p-name"><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
        <div class="p-meta">${stockText(p)}${p.colors.length > 1 ? `<span class="swatches">${p.colors.slice(0, 4).map((c) => `<i style="background:${esc(c.hex)}" title="${esc(c.name)}"></i>`).join('')}</span>` : ''}</div>
        <div class="p-foot"><div class="p-price"><b>${money(p.price)}</b>${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
          <button class="icon-btn add-btn" data-action="quick-add" data-id="${p.id}" aria-label="Add ${esc(p.name)} to cart" ${p.stock <= 0 ? 'disabled' : ''}>${icon('plus')}</button></div></div></article>`;
  }

  /* ===================== chrome: header, footer, drawer ===================== */
  const NAV = [['home', 'Home', '#/'], ['phone', 'Phones', '#/products/phone'], ['watch', 'Watches', '#/products/watch'], ['airpod', 'AirPods', '#/products/airpod'], ['airtag', 'AirTags', '#/products/airtag'], ['accessory', 'Accessories', '#/products/accessory'], ['service', 'Repair', '#/service']];

  function brandHTML() { return `<span class="brand-mark">${icon('phone')}</span><span>LYT <b>Store</b></span>`; }

  function renderHeader() {
    const u = MS.Auth.user();
    const theme = document.documentElement.getAttribute('data-theme');
    const s = MS.STORE;
    $('#siteHeader').innerHTML = `<div class="topbar"><div class="container tb-in">
        <a href="tel:${esc(s.phoneLink)}">${icon('phone')} ${esc(s.phone)}</a>
        <span class="tb-hide">${icon('clock')} ${esc(s.hours)}</span>
        <a class="tb-hide" href="#/contact">${icon('pin')} ${esc(s.city)}</a></div></div>
      <div class="container nav">
      <a class="brand" href="#/" aria-label="LYT Store home">${brandHTML()}</a>
      <nav class="nav-links" id="navLinks" aria-label="Main">
        ${NAV.map(([k, l, h]) => `<a href="${h}" data-nav="${k}">${l}</a>`).join('')}
        ${u && u.role === 'admin' ? '<a href="#/admin" data-nav="admin">Admin</a>' : ''}
      </nav>
      <div class="nav-actions">
        <div class="search" id="searchBox"><span class="search-ic">${icon('search')}</span>
          <input id="searchInput" data-input="search" type="search" placeholder="Search phones, watches, accessories…" autocomplete="off" aria-label="Search products">
          <div class="search-results" id="searchResults"></div></div>
        <button class="icon-btn" data-action="theme" aria-label="Toggle theme">${icon(theme === 'light' ? 'moon' : 'sun')}</button>
        <button class="icon-btn cart-btn" data-action="open-cart" aria-label="Open cart">${icon('bag')}<span class="count" id="cartCount">0</span></button>
        <div class="user-menu" id="userMenu">${u
          ? `<button class="avatar" data-action="user-menu" aria-label="Account menu">${esc(u.name.trim().charAt(0).toUpperCase())}</button>
             <div class="menu-pop glass"><div class="menu-head"><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div>
               <a href="#/orders">${icon('package')} My orders</a>${u.role === 'admin' ? `<a href="#/admin">${icon('chart')} Admin dashboard</a>` : ''}
               <button data-action="logout">${icon('logout')} Sign out</button></div>`
          : `<a class="btn btn-ghost btn-sm" href="#/login">Sign in</a>`}</div>
        <button class="icon-btn menu-btn" data-action="menu" aria-label="Open menu">${icon('menu')}</button>
      </div></div>`;
    updateCartBadge();
    renderTabbar();
  }

  function renderTabbar() {
    const el = document.getElementById('tabbar');
    if (!el) return;
    const u = MS.Auth.user();
    const n = MS.Cart.count();
    const cur = (location.hash || '#/').split('?')[0];
    const tabs = [
      ['#/', 'home', 'Home'],
      ['#/products', 'grid', 'Shop'],
      ['#/cart', 'bag', 'Cart', n],
      [u ? '#/orders' : '#/login', 'user', u ? 'Account' : 'Sign in'],
      ['https://t.me/lytstore', 'headset', 'Support']
    ];
    el.innerHTML = tabs.map(([h, ic, l, c]) => {
      const active = h === cur || (h === '#/products' && cur.startsWith('#/products'));
      const ext = h.startsWith('http');
      return `<a href="${h}" class="${active ? 'on' : ''}" ${ext ? 'target="_blank" rel="noopener"' : ''}>${icon(ic)}<span>${l}</span>${c ? `<em class="tab-count">${c}</em>` : ''}</a>`;
    }).join('');
  }

  function updateCartBadge() {
    const n = MS.Cart.count();
    const el = $('#cartCount');
    if (el) { el.textContent = n; el.classList.toggle('on', n > 0); }
    renderTabbar();
  }

  function renderFooter() {
    const s = MS.STORE;
    $('#siteFooter').innerHTML = `<div class="container foot-grid">
      <div class="foot-brand"><a class="brand" href="#/">${brandHTML()}</a>
        <p class="muted">Genuine iPhone, Samsung, watches, AirPods and accessories in Cambodia, plus repair services. Pay with ABA, KHQR or cash on delivery.</p>
        <div class="socials">
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
          <a href="https://t.me/lytstore" aria-label="Telegram" target="_blank" rel="noopener"><i class="fab fa-telegram"></i></a>
          <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        </div></div>
      <div><h4>Shop</h4>${NAV.slice(1, 6).map(([k, l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>
      <div><h4>Information</h4><a href="#/service">Repair service</a><a href="#/contact">About us</a><a href="#/contact">Contact us</a><a href="#/orders">My orders</a><a href="#/cart">Cart</a></div>
      <div><h4>Contact us</h4>
        <a class="foot-line" href="tel:${esc(s.phoneLink)}">${icon('phone')} ${esc(s.phone)}</a>
        <a class="foot-line" href="https://t.me/lytstore" target="_blank" rel="noopener">${icon('headset')} Telegram: @lytstore</a>
        <a class="foot-line" href="https://maps.google.com/?q=Phnom+Penh+Cambodia" target="_blank" rel="noopener">${icon('pin')} ${esc(s.city)}</a>
        <span class="foot-line muted">${icon('clock')} ${esc(s.hours)}</span></div>
    </div>
    <div class="container pay-row"><span class="muted-sm">We accept</span>
      <span class="pay-badge">ABA Pay</span><span class="pay-badge">KHQR</span><span class="pay-badge">Bank transfer</span><span class="pay-badge">Cash on delivery</span></div>
    <div class="container foot-bottom"><span>© ${new Date().getFullYear()} LYT Store. Demo project — products, prices and contact details are sample data.</span><span>Built with HTML · CSS · JavaScript</span></div>`;
  }

  function cartLineHTML(l, compact) {
    const p = l.product;
    return `<div class="cart-line">
      <a class="cl-art" href="#/product/${p.id}" style="--pc:${esc(l.color.hex)}">${pimg(p, l.color.hex)}</a>
      <div class="cl-info"><a class="cl-name" href="#/product/${p.id}">${esc(p.name)}</a>
        <span class="muted-sm">${esc(l.item.storage)} · ${esc(l.item.color)}</span>
        <div class="qty"><button data-action="cart-dec" data-id="${l.item.id}" aria-label="Decrease">${icon('minus')}</button><span>${l.item.quantity}</span><button data-action="cart-inc" data-id="${l.item.id}" aria-label="Increase">${icon('plus')}</button></div></div>
      <div class="cl-price"><b>${money(l.total)}</b>${l.item.quantity > 1 ? `<span class="muted-sm">${money(l.unit)} each</span>` : ''}<button class="link-danger" data-action="cart-rm" data-id="${l.item.id}">${compact ? icon('trash') : icon('trash') + ' Remove'}</button></div></div>`;
  }

  function renderDrawer() {
    const lines = MS.Cart.lines();
    const sub = MS.Cart.subtotal();
    const left = Math.max(0, MS.FREE_DELIVERY_OVER - sub);
    $('#cartDrawer').innerHTML = `<div class="drawer-head"><h3>Your cart <span class="muted-sm">(${MS.Cart.count()})</span></h3><button class="icon-btn" data-action="close-cart" aria-label="Close cart">${icon('x')}</button></div>
      <div class="drawer-body">${lines.length ? `<div class="free-bar">${left > 0 ? `Add <b>${money(left)}</b> more for free delivery` : `${icon('check')} You get free delivery!`}<i><u style="width:${Math.min(100, (sub / MS.FREE_DELIVERY_OVER) * 100)}%"></u></i></div>${lines.map((l) => cartLineHTML(l, true)).join('')}`
        : `<div class="empty"><div class="empty-ic">${icon('bag')}</div><h4>Your cart is empty</h4><p class="muted">Find a phone you love.</p><a class="btn btn-primary" href="#/products" data-action="close-cart">Browse phones</a></div>`}</div>
      ${lines.length ? `<div class="drawer-foot"><div class="sum-row"><span>Subtotal</span><b>${money(sub)}</b></div><div class="row-gap"><a class="btn btn-ghost" href="#/cart" data-action="close-cart">View cart</a><a class="btn btn-primary" href="#/checkout" data-action="close-cart">Checkout</a></div></div>` : ''}`;
  }

  /* ===================== router ===================== */
  function parseHash() {
    let h = location.hash.replace(/^#/, '') || '/';
    const [path, qs = ''] = h.split('?');
    const query = {};
    qs.split('&').filter(Boolean).forEach((kv) => { const [k, v = ''] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); });
    return { path: path || '/', query };
  }

  function setPage(html, title, nav) {
    const a = app();
    a.innerHTML = html;
    a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter');
    document.title = (title ? title + ' · ' : '') + 'LYT Store';
    window.scrollTo(0, 0);
    $$('#navLinks a').forEach((x) => x.classList.toggle('active', x.dataset.nav === nav));
    document.body.classList.remove('menu-open');
    closeCart();
  }

  const routes = [
    [/^\/$/, (m, q) => home(q)],
    [/^\/products(?:\/(phone|watch|airpod|airtag|accessory))?$/, (m, q) => productsPage(Object.assign({}, q, { type: m[1] || '' }))],
    [/^\/service$/, () => servicePage()],
    [/^\/product\/(\d+)$/, (m) => productPage(Number(m[1]))],
    [/^\/cart$/, () => cartPage()],
    [/^\/checkout$/, () => checkoutPage()],
    [/^\/order\/(\d+)$/, (m, q) => orderPage(Number(m[1]), q)],
    [/^\/orders$/, () => ordersPage()],
    [/^\/login$/, (m, q) => authPage('login', q)],
    [/^\/register$/, (m, q) => authPage('register', q)],
    [/^\/contact$/, () => contactPage()],
    [/^\/admin(?:\/(\w+))?$/, (m, q) => (MS.renderAdmin ? MS.renderAdmin(m[1] || 'dashboard', q, setPage) : notFound())]
  ];

  function route() {
    const { path, query } = parseHash();
    for (const [re, fn] of routes) {
      const m = path.match(re);
      if (m) { fn(m, query); return; }
    }
    notFound();
  }
  function notFound() {
    setPage(`<section class="container narrow center page-pad"><div class="empty"><div class="empty-ic">${icon('alert')}</div><h2>Page not found</h2><p class="muted">The page you are looking for does not exist.</p><a class="btn btn-primary" href="#/">Back to home</a></div></section>`, 'Not found');
  }
  MS.route = route;

  /* ===================== home ===================== */
  const SLIDE_TAG = [
    { tag: 'New arrivals', title: 'iPhone 16 Pro. Pro performance.', text: 'Titanium design, A18 Pro chip and a pro camera system.', cta: 'Shop phones', href: '#/products/phone', cls: 's1' },
    { tag: 'Accessories', title: 'Genuine chargers & cables', text: 'Fast 20W and 60W charging for iPhone and iPad.', cta: 'Shop accessories', href: '#/products/accessory', cls: 's2' },
    { tag: 'Repair service', title: 'Screen, battery & more', text: 'Apple and Samsung repairs with a quick turnaround.', cta: 'Book a repair', href: '#/service', cls: 's3' }
  ];
  function slideVisual(i) {
    if (i === 0) return MS.art.phone({ brand: 'iPhone', color: '#2a2a2c', view: 'front' });
    const want = i === 1 ? '60W' : null;
    const p = want ? MS.visible().find((x) => x.name.startsWith(want)) : null;
    if (p) return MS.pimg(p, (p.colors[0] || {}).hex);
    return `<span class="slide-ic">${icon('refresh')}</span>`;
  }
  function setSlide(i) {
    $$('.slide').forEach((s, k) => s.classList.toggle('on', k === i));
    $$('.dot-b').forEach((d, k) => d.classList.toggle('on', k === i));
  }
  function startBanner() {
    clearInterval(MS._bt);
    let i = 0;
    MS._bt = setInterval(() => {
      if (!document.getElementById('banner')) { clearInterval(MS._bt); return; }
      i = (i + 1) % SLIDE_TAG.length; setSlide(i);
    }, 5200);
  }
  MS.actions['banner-go'] = (el) => { setSlide(Number(el.dataset.i)); startBanner(); };

  function pager(total, page, base) {
    const pages = Math.ceil(total / PAGE);
    if (pages <= 1) return '';
    const link = (n) => base + (base.includes('?') ? '&' : '?') + 'page=' + n;
    const nums = [];
    for (let n = 1; n <= pages; n++) {
      if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
      else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    return `<nav class="pager" aria-label="Pages">
      ${page > 1 ? `<a class="pg" href="${link(page - 1)}">${icon('chevron')}<span>Previous</span></a>` : '<span class="pg disabled">Previous</span>'}
      ${nums.map((n) => n === '…' ? '<span class="pg dots">…</span>' : `<a class="pg ${n === page ? 'on' : ''}" href="${link(n)}" aria-current="${n === page ? 'page' : 'false'}">${n}</a>`).join('')}
      ${page < pages ? `<a class="pg" href="${link(page + 1)}"><span>Next</span>${icon('chevron')}</a>` : '<span class="pg disabled">Next</span>'}
    </nav>`;
  }
  MS.pager = pager;

  function home(query) {
    const page = Math.max(1, parseInt((query || {}).page, 10) || 1);
    const ps = MS.visible();
    const inStock = (arr) => arr.filter((p) => p.stock > 0);
    const popular = inStock(ps.filter((p) => p.featured)).slice(0, 8);
    const accessories = inStock(ps.filter((p) => p.type === 'accessory')).slice(0, 4);
    const sorted = ps.slice().sort((a, b) => (b.featured - a.featured) || (a.id - b.id));
    const pages = Math.ceil(sorted.length / PAGE);
    const pageItems = sorted.slice((Math.min(page, pages) - 1) * PAGE, Math.min(page, pages) * PAGE);
    const counts = (t) => ps.filter((p) => p.type === t).length;
    const tiles = ['phone', 'watch', 'airpod', 'airtag', 'accessory'].map((t) => `<a class="cat-tile glass" href="#/products/${t}"><span class="cat-ic">${icon(TYPE_ICON[t])}</span><b>${TYPE_LABEL[t]}</b><em>${counts(t)} items</em></a>`).join('')
      + `<a class="cat-tile glass cat-service" href="#/service"><span class="cat-ic">${icon('refresh')}</span><b>Repair</b><em>Apple &amp; Samsung</em></a>`;
    setPage(`
    <section class="container home-top">
      <div class="banner" id="banner" aria-roledescription="carousel">
        ${SLIDE_TAG.map((s, i) => `<div class="slide ${s.cls} ${i === 0 ? 'on' : ''}">
          <div class="slide-copy"><span class="pill"><i class="dot"></i> ${esc(s.tag)}</span><h1>${esc(s.title)}</h1><p>${esc(s.text)}</p><a class="btn btn-light btn-lg" href="${s.href}">${esc(s.cta)} ${icon('arrow-right')}</a></div>
          <div class="slide-art">${slideVisual(i)}</div></div>`).join('')}
        <div class="dots">${SLIDE_TAG.map((_, i) => `<button class="dot-b ${i === 0 ? 'on' : ''}" data-action="banner-go" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>
      </div>
      <div class="trust-strip">
        <span>${icon('shield')} Genuine products</span><span>${icon('truck')} Free delivery over $300</span><span>${icon('card')} ABA · KHQR · COD</span><span>${icon('headset')} Telegram support</span>
      </div>
    </section>
    <section class="container section"><div class="cat-grid">${tiles}</div></section>
    <section class="container section"><div class="sec-head"><div><h2>Popular products</h2></div><a class="link-arrow" href="#/products">View all ${icon('arrow-right')}</a></div>
      <div class="p-grid">${popular.map(card).join('')}</div></section>
    ${accessories.length ? `<section class="container section"><div class="sec-head"><div><h2>Accessories</h2></div><a class="link-arrow" href="#/products/accessory">View all ${icon('arrow-right')}</a></div><div class="p-grid">${accessories.map(card).join('')}</div></section>` : ''}
    <section class="container section"><div class="repair-band glass">
      <div><span class="eyebrow">Repair service</span><h2>Broken screen or weak battery?</h2><p class="muted">Apple and Samsung repairs with genuine parts. Book online and we will confirm your time by Telegram.</p></div>
      <a class="btn btn-primary btn-lg" href="#/service">Book a repair ${icon('arrow-right')}</a></div></section>
    <section class="container section" id="all">
      <div class="sec-head"><div><h2>All products</h2><span class="muted-sm">${sorted.length} items · page ${Math.min(page, pages)} of ${pages}</span></div></div>
      <div class="p-grid">${pageItems.map(card).join('')}</div>
      ${pager(sorted.length, Math.min(page, pages), '#/')}
    </section>`, 'LYT Store · Phones, watches & accessories in Cambodia', 'home');
    startBanner();
  }

  /* ===================== products list ===================== */
  const F = (MS.F = { q: '', type: '', brands: [], min: '', max: '', storage: [], stock: false, deals: false, sort: 'featured', page: 1 });

  function filterFromQuery(q) {
    F.q = q.q || ''; F.type = q.type || ''; F.brands = q.brand ? q.brand.split(',').filter(Boolean) : []; F.min = q.min || ''; F.max = q.max || '';
    F.storage = q.storage ? q.storage.split(',').filter(Boolean) : []; F.stock = q.stock === '1'; F.deals = q.deals === '1'; F.sort = q.sort || 'featured';
    F.page = Math.max(1, parseInt(q.page, 10) || 1);
  }
  function buildHash(withPage) {
    const p = [];
    if (F.q) p.push('q=' + encodeURIComponent(F.q));
    if (F.brands.length) p.push('brand=' + encodeURIComponent(F.brands.join(',')));
    if (F.min !== '') p.push('min=' + F.min);
    if (F.max !== '') p.push('max=' + F.max);
    if (F.storage.length) p.push('storage=' + encodeURIComponent(F.storage.join(',')));
    if (F.stock) p.push('stock=1');
    if (F.deals) p.push('deals=1');
    if (F.sort !== 'featured') p.push('sort=' + F.sort);
    if (withPage && F.page > 1) p.push('page=' + F.page);
    return '#/products' + (F.type ? '/' + F.type : '') + (p.length ? '?' + p.join('&') : '');
  }
  function filterToHash() { history.replaceState(null, '', buildHash(true)); }
  function filtered() {
    const q = F.q.trim().toLowerCase();
    let list = MS.visible().filter((p) => {
      if (F.type && p.type !== F.type) return false;
      if (q && !(p.name + ' ' + p.brand).toLowerCase().includes(q)) return false;
      if (F.brands.length && !F.brands.includes(p.brand)) return false;
      if (F.min !== '' && p.price < Number(F.min)) return false;
      if (F.max !== '' && p.price > Number(F.max)) return false;
      if (F.storage.length && !p.storages.some((s) => F.storage.includes(s.label))) return false;
      if (F.stock && p.stock <= 0) return false;
      if (F.deals && !p.oldPrice) return false;
      return true;
    });
    const by = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, newest: (a, b) => b.created - a.created, name: (a, b) => a.name.localeCompare(b.name), featured: (a, b) => (b.featured - a.featured) || (a.id - b.id) };
    return list.sort(by[F.sort] || by.featured);
  }
  function renderResults() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (F.page > pages) F.page = pages;
    const items = list.slice((F.page - 1) * PAGE, F.page * PAGE);
    const chips = [];
    F.brands.forEach((b) => chips.push(`<button class="chip on" data-action="rm-brand" data-v="${esc(b)}">${esc(b)} ${icon('x')}</button>`));
    F.storage.forEach((s) => chips.push(`<button class="chip on" data-action="rm-storage" data-v="${esc(s)}">${esc(s)} ${icon('x')}</button>`));
    if (F.min !== '' || F.max !== '') chips.push(`<button class="chip on" data-action="rm-price">${F.min !== '' ? money(F.min) : '$0'} – ${F.max !== '' ? money(F.max) : 'any'} ${icon('x')}</button>`);
    if (F.deals) chips.push(`<button class="chip on" data-action="rm-deals">Deals ${icon('x')}</button>`);
    if (F.stock) chips.push(`<button class="chip on" data-action="rm-stock">In stock ${icon('x')}</button>`);
    if (F.q) chips.push(`<button class="chip on" data-action="rm-q">“${esc(F.q)}” ${icon('x')}</button>`);
    $('#pcount').textContent = list.length + ' item' + (list.length === 1 ? '' : 's');
    $('#pchips').innerHTML = chips.join('');
    $('#plist').innerHTML = items.length ? items.map(card).join('') : `<div class="empty wide"><div class="empty-ic">${icon('search')}</div><h4>No products match</h4><p class="muted">Try removing a filter or searching for another name.</p><button class="btn btn-ghost" data-action="clear-filters">Clear filters</button></div>`;
    $('#ppager').innerHTML = pager(list.length, F.page, buildHash(false));
    filterToHash();
  }
  function productsPage(q) {
    filterFromQuery(q);
    const all = MS.visible();
    const storages = [...new Set(all.flatMap((p) => p.storages.map((s) => s.label)))].sort((a, b) => parseInt(a) * (/TB/.test(a) ? 1000 : 1) - parseInt(b) * (/TB/.test(b) ? 1000 : 1));
    const prices = [['Under $300', '', 300], ['$300 – $800', 300, 800], ['$800 +', 800, '']];
    const title = F.type ? TYPE_LABEL[F.type] : 'All products';
    setPage(`<section class="container page-pad"><div class="page-head"><div><span class="eyebrow">Shop</span><h1 class="h-xl">${esc(title)}</h1></div>
      <div class="head-tools"><span class="muted" id="pcount"></span>
        <select class="select" data-input="f-sort" aria-label="Sort">${[['featured', 'Featured'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['newest', 'Newest'], ['name', 'Name A–Z']].map(([v, l]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm filter-toggle" data-action="toggle-filters">${icon('sliders')} Filters</button></div></div>
      <div class="cat-pills">${[['', 'All', 'grid'], ...Object.keys(TYPE_LABEL).map((t) => [t, TYPE_LABEL[t], TYPE_ICON[t]])].map(([t, l, ic]) => `<a class="cat-pill ${F.type === t ? 'on' : ''}" href="#/products${t ? '/' + t : ''}">${icon(ic)} ${l}</a>`).join('')}</div>
      <div class="shop-grid">
        <aside class="filters glass" id="filters">
          <div class="f-group"><label class="f-title" for="fq">Search</label><input id="fq" class="input" data-input="f-q" type="search" value="${esc(F.q)}" placeholder="Name or brand"></div>
          <div class="f-group"><span class="f-title">Brand</span>${MS.brands().map((b) => `<label class="check"><input type="checkbox" data-input="f-brand" value="${esc(b)}" ${F.brands.includes(b) ? 'checked' : ''}><span>${esc(b)}</span><em>${all.filter((p) => p.brand === b).length}</em></label>`).join('')}</div>
          <div class="f-group"><span class="f-title">Price (USD)</span><div class="price-row"><input class="input" data-input="f-min" type="number" min="0" placeholder="Min" value="${esc(F.min)}" aria-label="Minimum price"><span>–</span><input class="input" data-input="f-max" type="number" min="0" placeholder="Max" value="${esc(F.max)}" aria-label="Maximum price"></div>
            <div class="chips">${prices.map(([l, a, b]) => `<button class="chip" data-action="price-chip" data-min="${a}" data-max="${b}">${l}</button>`).join('')}</div></div>
          <div class="f-group"><span class="f-title">Storage / size</span><div class="chips">${storages.map((s) => `<button class="chip ${F.storage.includes(s) ? 'on' : ''}" data-action="storage-chip" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
          <div class="f-group"><label class="check"><input type="checkbox" data-input="f-stock" ${F.stock ? 'checked' : ''}><span>In stock only</span></label><label class="check"><input type="checkbox" data-input="f-deals" ${F.deals ? 'checked' : ''}><span>Deals only</span></label></div>
          <button class="btn btn-ghost btn-block" data-action="clear-filters">Clear all filters</button>
        </aside>
        <div><div class="chips applied" id="pchips"></div><div class="p-grid" id="plist"></div><div id="ppager"></div></div></div></section>`, title, F.type || 'products');
    renderResults();
  }
  function resetFilters() { Object.assign(F, { q: '', brands: [], min: '', max: '', storage: [], stock: false, deals: false, sort: 'featured' }); }
  function refreshFilterUI() {
    // re-render the sidebar controls without rebuilding the page
    const { query } = { query: {} };
    productsPage({ q: F.q, brand: F.brands.join(','), min: F.min, max: F.max, storage: F.storage.join(','), stock: F.stock ? '1' : '', deals: F.deals ? '1' : '', sort: F.sort });
  }

  /* ===================== product details ===================== */
  const PD = (MS.PD = { id: 0, color: 0, storage: 0, qty: 1, view: 'front' });

  function pdStage(p) {
    const col = p.colors[PD.color] || p.colors[0] || { hex: '#444', name: '' };
    const isPhone = !p.type || p.type === 'phone';
    const stage = p.image
      ? `<div class="pd-photo">${pimg(p, col.hex)}</div>`
      : isPhone ? phone3D(p, col.hex, { flip: PD.view === 'back', still: true }) : `<div class="pd-prod">${pimg(p, col.hex)}</div>`;
    return `<div class="pd-glow" style="--pc:${esc(col.hex)}"></div>${badge(p)}${stage}
      ${p.image || !isPhone ? '' : `<div class="view-toggle"><button class="${PD.view === 'front' ? 'on' : ''}" data-action="pick-view" data-v="front">Front</button><button class="${PD.view === 'back' ? 'on' : ''}" data-action="pick-view" data-v="back">Back</button></div>`}
      <span class="stage-name">${esc(col.name)}</span>`;
  }
  function pdInfo(p) {
    const price = MS.priceOf(p, (p.storages[PD.storage] || {}).label);
    const d = MS.discount(p);
    const out = p.stock <= 0;
    return `<span class="p-brand">${esc(p.brand)} · ${esc(MS.categoryName(p.category_id))}</span>
      <h1 class="h-xl pd-name">${esc(p.name)}</h1><p class="muted">${esc(p.desc)}</p>
      <div class="pd-price"><b>${money(price)}</b>${p.oldPrice ? `<s>${money(p.oldPrice + (price - p.price))}</s><span class="save-tag">Save ${d}%</span>` : ''}</div>
      <div class="stock-line ${out ? 'out' : p.stock <= MS.LOW_STOCK ? 'low' : 'in'}"><i></i>${out ? 'Sold out' : p.stock <= MS.LOW_STOCK ? `Only ${p.stock} left in stock` : `In stock · ${p.stock} available`}</div>
      ${p.storages.length > 1 ? '' : '<!--'}<div class="opt"><span class="f-title">Storage</span><div class="chips">${p.storages.map((s, i) => `<button class="chip lg ${i === PD.storage ? 'on' : ''}" data-action="pick-storage" data-i="${i}">${esc(s.label)}${s.add ? `<em>+${money(s.add)}</em>` : ''}</button>`).join('')}</div></div>${p.storages.length > 1 ? '' : '-->'}
      <div class="opt"><span class="f-title">Colour · <b>${esc((p.colors[PD.color] || {}).name || '')}</b></span><div class="color-pick">${p.colors.map((c, i) => `<button class="sw ${i === PD.color ? 'on' : ''}" style="--c:${esc(c.hex)}" data-action="pick-color" data-i="${i}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join('')}</div></div>
      <div class="buy-row"><div class="qty lg"><button data-action="pd-dec" aria-label="Decrease">${icon('minus')}</button><span>${PD.qty}</span><button data-action="pd-inc" aria-label="Increase">${icon('plus')}</button></div>
        <button class="btn btn-primary btn-lg grow" data-action="add-cart" data-id="${p.id}" ${out ? 'disabled' : ''}>${icon('bag')} Add to cart</button><button class="btn btn-ghost btn-lg" data-action="buy-now" data-id="${p.id}" ${out ? 'disabled' : ''}>Buy now</button></div>
      <ul class="perks"><li>${icon('truck')} Delivery in 2–3 days · same-day in Phnom Penh</li><li>${icon('shield')} Genuine, sealed and covered by warranty</li><li>${icon('card')} Pay with ABA, KHQR, bank transfer or cash on delivery</li></ul>`;
  }
  function productPage(id) {
    const p = MS.product(id);
    if (!p || p.hidden) return notFound();
    Object.assign(PD, { id, color: 0, storage: 0, qty: 1, view: 'front' });
    const related = MS.visible().filter((x) => x.id !== p.id && (x.brand === p.brand || x.category_id === p.category_id)).slice(0, 4);
    setPage(`<section class="container page-pad pd">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a>${icon('chevron')}<a href="#/products">Phones</a>${icon('chevron')}<a href="#/products?brand=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a>${icon('chevron')}<span>${esc(p.name)}</span></nav>
      <div class="pd-grid"><div class="pd-stage glass" id="pdStage">${pdStage(p)}</div><div class="pd-info" id="pdInfo">${pdInfo(p)}</div></div>
      <div class="pd-detail"><div class="glass spec-card"><h3>Specifications</h3><dl class="specs">${Object.entries(p.specs || {}).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
        <div class="glass spec-card"><h3>In the box</h3><ul class="box-list"><li>${icon('check')} ${esc(p.name)}</li><li>${icon('check')} USB-C cable</li><li>${icon('check')} SIM ejector tool</li><li>${icon('check')} Quick start guide &amp; warranty card</li></ul><p class="muted-sm">Charger availability depends on the model.</p></div></div>
      ${related.length ? `<div class="sec-head"><div><span class="eyebrow">You may also like</span><h2>Related phones</h2></div></div><div class="p-grid">${related.map(card).join('')}</div>` : ''}</section>`, p.name, 'products');
  }
  function pdRefresh(what) {
    const p = MS.product(PD.id); if (!p || p.hidden) return;
    if (what !== 'info') $('#pdStage').innerHTML = pdStage(p);
    $('#pdInfo').innerHTML = pdInfo(p);
  }

  /* ===================== cart page ===================== */
  function cartPage() {
    const lines = MS.Cart.lines();
    const sub = MS.Cart.subtotal();
    const fee = MS.deliveryFee('standard', sub);
    setPage(`<section class="container page-pad"><div class="page-head"><div><span class="eyebrow">Shopping cart</span><h1 class="h-xl">Your cart</h1></div></div>
      ${lines.length ? `<div class="cart-grid"><div class="glass cart-list">${lines.map((l) => cartLineHTML(l)).join('')}</div>
        <aside class="glass summary"><h3>Order summary</h3><div class="sum-row"><span>Subtotal</span><b>${money(sub)}</b></div>
          <div class="sum-row"><span>Delivery (standard)</span><b>${fee ? money(fee) : 'Free'}</b></div><div class="sum-row total"><span>Total</span><b>${money(sub + fee)}</b></div>
          <a class="btn btn-primary btn-lg btn-block" href="#/checkout">Checkout ${icon('arrow-right')}</a><a class="btn btn-ghost btn-block" href="#/products">Continue shopping</a>
          <p class="muted-sm">Delivery options and payment are chosen at checkout.</p></aside></div>`
        : `<div class="empty"><div class="empty-ic">${icon('bag')}</div><h3>Your cart is empty</h3><p class="muted">Looks like you haven't added a phone yet.</p><a class="btn btn-primary" href="#/products">Browse phones</a></div>`}</section>`, 'Cart', '');
  }

  /* ===================== repair service ===================== */
  const SERVICES = [
    { name: 'iPhone screen replacement', price: 35, time: '30–60 min', note: 'Genuine or high-quality display, tested before you leave' },
    { name: 'iPhone battery replacement', price: 25, time: '30 min', note: 'Restores battery health, same-day in most cases' },
    { name: 'Samsung screen replacement', price: 45, time: '60 min', note: 'Galaxy S and A series displays' },
    { name: 'Charging port repair', price: 20, time: '30–45 min', note: 'Fixes slow or loose charging' },
    { name: 'Camera repair', price: 40, time: '45 min', note: 'Front or rear camera module' },
    { name: 'Water damage check', price: 10, time: '20 min', note: 'Inspection and clean-up of liquid damage' },
    { name: 'Apple Watch screen or battery', price: 39, time: '45 min', note: 'Parts and labour, with a 30-day warranty' },
    { name: 'Software and data recovery', price: 8, time: '30 min', note: 'Reset, update and backup support' }
  ];
  function servicePage() {
    const u = MS.Auth.user();
    setPage(`<section class="container page-pad">
      <div class="page-head"><div><span class="eyebrow">Repair service</span><h1 class="h-xl">Fast, genuine repairs</h1><p class="muted lead-sm">Apple and Samsung repairs by our technicians. Prices are starting prices; we confirm the final cost before we start.</p></div>
        <a class="btn btn-ghost" href="#/contact">${icon('pin')} Visit the store</a></div>
      <div class="svc-grid">${SERVICES.map((s) => `<article class="glass svc"><span class="cat-ic">${icon('refresh')}</span><h3>${esc(s.name)}</h3><p class="muted">${esc(s.note)}</p>
        <div class="svc-foot"><span><b>from ${money(s.price)}</b></span><span class="muted-sm">${icon('clock')} ${esc(s.time)}</span></div></article>`).join('')}</div>
      <div class="cols-2 section">
        <form class="glass form-card" data-form="repair" novalidate>
          <h3>Book a repair</h3>
          <div class="grid-2">
            <label class="field"><span>Your name</span><input class="input" name="name" value="${esc(u ? u.name : '')}" required autocomplete="name"></label>
            <label class="field"><span>Phone number</span><input class="input" name="phone" placeholder="012 345 678" value="${esc(u ? u.phone || '' : '')}" required autocomplete="tel"></label>
            <label class="field span-2"><span>Device</span><input class="input" name="device" placeholder="e.g. iPhone 13 Pro, Galaxy A54" required></label>
            <label class="field span-2"><span>Repair needed</span><select class="select" name="service">${SERVICES.map((s) => `<option>${esc(s.name)}</option>`).join('')}</select></label>
            <label class="field"><span>Preferred date</span><input class="input" type="date" name="date" required></label>
            <label class="field"><span>Preferred time</span><select class="select" name="time"><option>Morning (9:00 – 12:00)</option><option>Afternoon (13:00 – 17:00)</option><option>Evening (17:00 – 20:00)</option></select></label>
            <label class="field span-2"><span>Describe the problem (optional)</span><textarea class="input" name="note" rows="3"></textarea></label>
          </div>
          <button class="btn btn-primary btn-lg" type="submit">Send booking ${icon('arrow-right')}</button>
        </form>
        <div class="stack">
          <div class="glass info-card"><span class="b-ic">${icon('shield')}</span><div><b>Genuine parts</b><p class="muted">We use genuine or tested high-quality parts, with a warranty on every repair.</p></div></div>
          <div class="glass info-card"><span class="b-ic">${icon('clock')}</span><div><b>Most repairs in one visit</b><p class="muted">Many screen and battery repairs are finished while you wait.</p></div></div>
          <div class="glass info-card"><span class="b-ic">${icon('headset')}</span><div><b>Track by Telegram</b><p class="muted">We confirm your booking and update you on <a class="link-arrow" href="https://t.me/lytstore" target="_blank" rel="noopener">@lytstore</a>.</p></div></div>
        </div>
      </div></section>`, 'Repair service', 'service');
  }
  MS.forms.repair = (form) => {
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim(), device = (fd.get('device') || '').trim(), date = fd.get('date');
    if (name.length < 2) return MS.toast('Please enter your name.', 'error');
    if (!validPhone(phone)) return MS.toast('Please enter a valid phone number.', 'error');
    if (device.length < 2) return MS.toast('Please tell us the device.', 'error');
    if (!date) return MS.toast('Please choose a date.', 'error');
    const text = `REPAIR BOOKING · ${fd.get('service')} · ${device} · ${date} ${fd.get('time')}${fd.get('note') ? ' · ' + fd.get('note') : ''}`;
    DB.insert('messages', { name, contact: phone, message: text, created: Date.now() });
    form.reset();
    MS.toast('Booking sent. We will confirm on Telegram or by phone.');
  };

  /* ===================== checkout ===================== */
  const CO = (MS.CO = { delivery: 'standard', payment: 'aba' });

  function fakeQR(seed) {
    let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    const n = 25, cell = 8; let rects = '';
    const finder = (x, y) => `<rect x="${x * cell}" y="${y * cell}" width="${7 * cell}" height="${7 * cell}" fill="#000"/><rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${5 * cell}" height="${5 * cell}" fill="#fff"/><rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${3 * cell}" height="${3 * cell}" fill="#000"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
      if (rnd() > 0.52) rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`;
    }
    return `<svg viewBox="-8 -8 ${n * cell + 16} ${n * cell + 16}" class="qr" role="img" aria-label="Demo KHQR code"><rect x="-8" y="-8" width="${n * cell + 16}" height="${n * cell + 16}" fill="#fff"/><g fill="#000">${rects}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }
  MS.fakeQR = fakeQR;

  function payPanel(method, amount, ref) {
    if (method === 'aba') return `<div class="pay-panel"><h4>ABA Pay</h4><p class="muted">Open the ABA Mobile app → <b>Pay</b> → enter the account below.</p><dl class="kv"><div><dt>Account name</dt><dd>LYT STORE CO., LTD</dd></div><div><dt>Account number</dt><dd>000 123 456</dd></div><div><dt>Amount</dt><dd>${money(amount)}</dd></div><div><dt>Reference</dt><dd>${esc(ref)}</dd></div></dl><p class="muted-sm">Demo details. Replace them with your real ABA account.</p></div>`;
    if (method === 'khqr') return `<div class="pay-panel qr-wrap">${fakeQR(ref)}<div><h4>KHQR</h4><p class="muted">Scan with ABA, ACLEDA, Wing or any Bakong-enabled app.</p><dl class="kv"><div><dt>Amount</dt><dd>${money(amount)}</dd></div><div><dt>Reference</dt><dd>${esc(ref)}</dd></div></dl><p class="muted-sm">Demo QR, not scannable. Real KHQR needs an approved payment provider.</p></div></div>`;
    if (method === 'bank') return `<div class="pay-panel"><h4>Bank transfer</h4><dl class="kv"><div><dt>Bank</dt><dd>ABA Bank</dd></div><div><dt>Account name</dt><dd>LYT STORE CO., LTD</dd></div><div><dt>Account number</dt><dd>000 123 456</dd></div><div><dt>Amount</dt><dd>${money(amount)}</dd></div><div><dt>Reference</dt><dd>${esc(ref)}</dd></div></dl><p class="muted-sm">After transferring, send the receipt to ${esc(MS.STORE.telegram)} on Telegram.</p></div>`;
    return `<div class="pay-panel"><h4>Cash on delivery</h4><p class="muted">Pay <b>${money(amount)}</b> in cash to our courier when you receive your phone. Please check the device before paying.</p></div>`;
  }

  function checkoutSummary() {
    const lines = MS.Cart.lines();
    const sub = MS.Cart.subtotal();
    const fee = MS.deliveryFee(CO.delivery, sub);
    return `<h3>Order summary</h3>${lines.map((l) => `<div class="mini-line"><span class="mini-art" style="--pc:${esc(l.color.hex)}">${pimg(l.product, l.color.hex)}</span><div><b>${esc(l.product.name)}</b><span class="muted-sm">${esc(l.item.storage)} · ${esc(l.item.color)} × ${l.item.quantity}</span></div><b>${money(l.total)}</b></div>`).join('')}
      <div class="sum-row"><span>Subtotal</span><b>${money(sub)}</b></div><div class="sum-row"><span>Delivery</span><b>${fee ? money(fee) : 'Free'}</b></div><div class="sum-row total"><span>Total</span><b>${money(sub + fee)}</b></div>`;
  }

  function checkoutPage() {
    const u = MS.Auth.user();
    if (!MS.Cart.count()) { setPage(`<section class="container narrow page-pad"><div class="empty"><div class="empty-ic">${icon('bag')}</div><h3>Your cart is empty</h3><a class="btn btn-primary" href="#/products">Browse phones</a></div></section>`, 'Checkout'); return; }
    if (!u) { setPage(`<section class="container narrow page-pad"><div class="glass gate"><div class="empty-ic">${icon('user')}</div><h2>Sign in to continue</h2><p class="muted">Create a free account or sign in to place your order and track your delivery.</p><div class="row-gap"><a class="btn btn-primary" href="#/login?next=/checkout">Sign in</a><a class="btn btn-ghost" href="#/register?next=/checkout">Create account</a></div></div></section>`, 'Checkout'); return; }
    CO.delivery = 'standard'; CO.payment = 'aba';
    const sub = MS.Cart.subtotal();
    setTimeout(() => MS.refreshPayPanel && MS.refreshPayPanel(), 0);
    setPage(`<section class="container page-pad"><div class="page-head"><div><span class="eyebrow">Checkout</span><h1 class="h-xl">Almost there</h1></div></div>
      <form class="cart-grid" data-form="checkout" novalidate>
        <div class="stack">
          <div class="glass form-card"><h3><span class="step-n sm">1</span> Customer information</h3><div class="grid-2">
            <label class="field"><span>Full name</span><input class="input" name="name" value="${esc(u.name)}" required autocomplete="name"></label>
            <label class="field"><span>Phone number</span><input class="input" name="phone" value="${esc(u.phone || '')}" placeholder="012 345 678" required autocomplete="tel"></label>
            <label class="field span-2"><span>Email</span><input class="input" type="email" name="email" value="${esc(u.email)}" required autocomplete="email"></label></div></div>
          <div class="glass form-card"><h3><span class="step-n sm">2</span> Delivery address</h3><div class="grid-2">
            <label class="field"><span>Province / city</span><select class="select" name="province">${MS.PROVINCES.map((x) => `<option>${esc(x)}</option>`).join('')}</select></label>
            <label class="field"><span>Street, house no., sangkat</span><input class="input" name="street" placeholder="Street 271, Sangkat Tuol Tumpung" required autocomplete="street-address"></label>
            <label class="field span-2"><span>Note for the courier (optional)</span><input class="input" name="note" placeholder="e.g. call before arriving"></label></div>
            <div class="radio-grid" role="radiogroup" aria-label="Delivery method">${Object.entries(MS.DELIVERY).map(([k, d]) => `<label class="radio-card ${k === CO.delivery ? 'on' : ''}"><input type="radio" name="delivery" value="${k}" data-input="co-delivery" ${k === CO.delivery ? 'checked' : ''}><span class="rc-ic">${icon(k === 'pickup' ? 'pin' : k === 'express' ? 'zap' : 'truck')}</span><span><b>${esc(d.label)}</b><em>${esc(d.note)}</em></span><b class="rc-price" data-fee="${k}">${MS.deliveryFee(k, sub) ? money(MS.deliveryFee(k, sub)) : 'Free'}</b></label>`).join('')}</div></div>
          <div class="glass form-card"><h3><span class="step-n sm">3</span> Payment method</h3>
            <div class="radio-grid" role="radiogroup" aria-label="Payment method">${Object.entries(MS.PAYMENTS).map(([k, d]) => `<label class="radio-card ${k === CO.payment ? 'on' : ''}"><input type="radio" name="payment" value="${k}" data-input="co-payment" ${k === CO.payment ? 'checked' : ''}><span class="rc-ic">${icon(k === 'cod' ? 'dollar' : 'card')}</span><span><b>${esc(d.label)}</b><em>${esc(d.note)}</em></span></label>`).join('')}</div>
            <div id="payPanel"><div class="pay-panel"><p class="muted">Payment details will be shown after you place the order.</p></div></div></div>
        </div>
        <aside class="glass summary sticky" id="coSummary">${checkoutSummary()}<button class="btn btn-primary btn-lg btn-block" type="submit">Place order ${icon('arrow-right')}</button><p class="muted-sm">By placing your order you agree to our terms. This is a demo store; no real payment is taken.</p></aside></form></section>`, 'Checkout', '');
  }

  function validPhone(v) { const d = String(v).replace(/\D/g, ''); return (d.startsWith('0') && d.length >= 8 && d.length <= 10) || (d.startsWith('855') && d.length >= 10 && d.length <= 12); }

  MS.forms.checkout = (form) => {
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim(), email = (fd.get('email') || '').trim(), street = (fd.get('street') || '').trim();
    if (!name) return MS.toast('Please enter your name.', 'error');
    if (!validPhone(phone)) return MS.toast('Please enter a valid Cambodian phone number (e.g. 012 345 678).', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return MS.toast('Please enter a valid email.', 'error');
    if (fd.get('delivery') !== 'pickup' && street.length < 4) return MS.toast('Please enter your delivery address.', 'error');
    const res = MS.Orders.place({ customer: { name, phone, email }, address: { province: fd.get('province'), street: street || 'Store pickup' }, deliveryMethod: fd.get('delivery'), paymentMethod: fd.get('payment'), note: fd.get('note') });
    if (!res.ok) return MS.toast(res.error, 'error');
    MS.toast('Order placed. Thank you!');
    MS.go('/order/' + res.order.id + '?new=1');
  };

  /* ===================== order / invoice ===================== */
  function timeline(status) {
    if (status === 'Cancelled') return `<div class="timeline cancelled"><div class="tl-step on bad"><i>${icon('x')}</i><span>Cancelled</span></div></div>`;
    const idx = MS.STATUSES.indexOf(status);
    return `<div class="timeline">${MS.STATUSES.map((s, i) => `<div class="tl-step ${i <= idx ? 'on' : ''} ${i === idx ? 'now' : ''}"><i>${i < idx || (i === idx && status === 'Delivered') ? icon('check') : i + 1}</i><span>${s}</span></div>`).join('')}</div>`;
  }
  function orderTotalsHTML(o) {
    return `<div class="sum-row"><span>Subtotal</span><b>${money(o.subtotal)}</b></div><div class="sum-row"><span>Delivery · ${esc(MS.DELIVERY[o.delivery_method].label)}</span><b>${o.delivery_fee ? money(o.delivery_fee) : 'Free'}</b></div><div class="sum-row total"><span>Total</span><b>${money(o.total)}</b></div>`;
  }
  function orderPage(id, q) {
    const u = MS.Auth.user();
    const o = DB.find('orders', id);
    if (!u) return MS.go('/login?next=/order/' + id);
    if (!o || (o.user_id !== u.id && u.role !== 'admin')) return notFound();
    const items = MS.Orders.items(id), pay = MS.Orders.payment(id), del = MS.Orders.delivery(id);
    const pm = MS.PAYMENTS[pay.payment_method];
    const showPay = pay.payment_method !== 'cod' && pay.status === 'Pending' && o.status !== 'Cancelled';
    setPage(`<section class="container page-pad">
      ${q.new ? `<div class="success glass"><span class="success-ic">${icon('check')}</span><div><h2>Thank you, ${esc(o.customer.name.split(' ')[0])}!</h2><p class="muted">Your order <b>${esc(o.code)}</b> has been placed. We sent the confirmation to ${esc(o.customer.email)}.</p></div></div>` : ''}
      <div class="page-head"><div><span class="eyebrow">Order</span><h1 class="h-xl">${esc(o.code)}</h1></div><div class="head-tools"><button class="btn btn-ghost" data-action="print">${icon('printer')} Print invoice</button><a class="btn btn-ghost" href="${u.role === 'admin' && o.user_id !== u.id ? '#/admin/orders' : '#/orders'}">All orders</a></div></div>
      <div class="glass track-card"><div class="track-top"><span>Placed ${MS.fmtDateTime(o.created)}</span>${pill(o.status)}</div>${timeline(o.status)}</div>
      ${showPay ? `<div class="glass form-card pay-now"><h3>Complete your payment</h3>${payPanel(pay.payment_method, o.total, o.code)}<button class="btn btn-primary" data-action="pay-done" data-id="${o.id}">${icon('check')} I have paid (demo)</button></div>` : ''}
      <div class="invoice glass" id="invoice"><div class="inv-head"><div><div class="brand static"><span class="brand-mark">${icon('phone')}</span><span>LYT <b>Store</b></span></div><p class="muted-sm">${esc(MS.STORE.address)}<br>${esc(MS.STORE.phone)} · ${esc(MS.STORE.email)}</p></div><div class="inv-meta"><b>INVOICE</b><span>${esc(o.code)}</span><span>${MS.fmtDate(o.created)}</span></div></div>
        <div class="inv-cols"><div><h4>Billed to</h4><p>${esc(o.customer.name)}<br>${esc(o.customer.phone)}<br>${esc(o.customer.email)}</p></div><div><h4>Delivery address</h4><p>${esc(del.address.street)}<br>${esc(del.address.province)}${o.note ? `<br><i>“${esc(o.note)}”</i>` : ''}</p></div><div><h4>Payment</h4><p>${esc(pm.label)}<br>${pill(pay.status)}</p></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>Options</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead><tbody>${items.map((i) => `<tr><td><b>${esc(i.name)}</b></td><td>${esc(i.storage)} · ${esc(i.color)}</td><td class="num">${i.quantity}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.price * i.quantity)}</td></tr>`).join('')}</tbody></table></div>
        <div class="inv-total">${orderTotalsHTML(o)}</div></div>
      <div class="row-gap"><a class="btn btn-primary" href="#/products">Continue shopping</a></div></section>`, o.code, '');
  }

  function ordersPage() {
    const u = MS.Auth.user();
    if (!u) return MS.go('/login?next=/orders');
    const list = MS.Orders.forUser(u.id);
    setPage(`<section class="container page-pad"><div class="page-head"><div><span class="eyebrow">Account</span><h1 class="h-xl">My orders</h1></div></div>
      ${list.length ? `<div class="stack">${list.map((o) => {
        const items = MS.Orders.items(o.id), pay = MS.Orders.payment(o.id);
        return `<article class="glass order-card"><div class="oc-top"><div><b>${esc(o.code)}</b><span class="muted-sm">${MS.fmtDateTime(o.created)} · ${items.reduce((s, i) => s + i.quantity, 0)} item(s)</span></div><div class="oc-right">${pill(o.status)}<b>${money(o.total)}</b></div></div>
          ${timeline(o.status)}<div class="oc-items">${items.map((i) => `<span class="oc-item"><i class="dot" style="background:${esc(i.color_hex)}"></i>${esc(i.name)} · ${esc(i.storage)} × ${i.quantity}</span>`).join('')}</div>
          <div class="oc-foot"><span class="muted-sm">${esc(MS.PAYMENTS[pay.payment_method].label)} · ${pill(pay.status)}</span><div class="row-gap"><a class="btn btn-ghost btn-sm" href="#/order/${o.id}">${icon('eye')} View invoice</a>${o.status === 'Processing' ? `<button class="btn btn-danger-ghost btn-sm" data-action="cancel-order" data-id="${o.id}">Cancel order</button>` : ''}</div></div></article>`;
      }).join('')}</div>` : `<div class="empty"><div class="empty-ic">${icon('package')}</div><h3>No orders yet</h3><p class="muted">When you place an order it will show up here.</p><a class="btn btn-primary" href="#/products">Shop phones</a></div>`}</section>`, 'My orders', '');
  }

  /* ===================== auth + contact ===================== */
  function authPage(mode, q) {
    if (MS.Auth.user()) return MS.go(q.next || '/');
    const reg = mode === 'register';
    const next = q.next ? esc(q.next) : '';
    setPage(`<section class="container narrow page-pad"><div class="glass auth-card"><span class="eyebrow">${reg ? 'Create account' : 'Welcome back'}</span><h1 class="h-xl">${reg ? 'Join LYT Store' : 'Sign in'}</h1>
      <form class="stack" data-form="${mode}" novalidate><input type="hidden" name="next" value="${next}">
        ${reg ? `<label class="field"><span>Full name</span><input class="input" name="name" required autocomplete="name"></label><label class="field"><span>Phone number</span><input class="input" name="phone" placeholder="012 345 678" required autocomplete="tel"></label>` : ''}
        <label class="field"><span>Email</span><input class="input" type="email" name="email" required autocomplete="email"></label>
        <label class="field"><span>Password</span><input class="input" type="password" name="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'At least 6 characters' : ''}"></label>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${reg ? 'Create account' : 'Sign in'}</button></form>
      <p class="muted center">${reg ? 'Already have an account?' : 'New here?'} <a href="#/${reg ? 'login' : 'register'}${next ? '?next=' + next : ''}">${reg ? 'Sign in' : 'Create an account'}</a></p>
      ${reg ? '' : `<div class="demo-box"><b>Demo accounts</b><span>Admin: admin@lytstore.com · admin123</span><span>Customer: sokha@example.com · demo123</span></div>`}</div></section>`, reg ? 'Create account' : 'Sign in', '');
  }
  MS.forms.login = (form) => {
    const fd = new FormData(form);
    const r = MS.Auth.login(fd.get('email'), fd.get('password'));
    if (!r.ok) return MS.toast(r.error, 'error');
    MS.toast('Welcome back, ' + r.user.name.split(' ')[0] + '!');
    renderHeader(); renderDrawer();
    MS.go(fd.get('next') || (r.user.role === 'admin' ? '/admin' : '/'));
  };
  MS.forms.register = (form) => {
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim(), email = (fd.get('email') || '').trim(), password = fd.get('password') || '';
    if (name.length < 2) return MS.toast('Please enter your name.', 'error');
    if (!validPhone(phone)) return MS.toast('Please enter a valid phone number.', 'error');
    if (!/^\S+@\S+\.\S+$/.test(email)) return MS.toast('Please enter a valid email.', 'error');
    if (password.length < 6) return MS.toast('Password must be at least 6 characters.', 'error');
    const r = MS.Auth.register({ name, email, phone, password });
    if (!r.ok) return MS.toast(r.error, 'error');
    MS.toast('Account created. Welcome!');
    renderHeader(); renderDrawer();
    MS.go(fd.get('next') || '/');
  };

  function contactPage() {
    const s = MS.STORE;
    setPage(`<section class="container page-pad"><div class="page-head"><div><span class="eyebrow">Contact</span><h1 class="h-xl">We're here to help</h1></div></div>
      <div class="contact-grid"><div class="stack">
        <div class="glass info-card"><span class="b-ic">${icon('pin')}</span><div><b>Visit the store</b><p class="muted">${esc(s.address)}</p></div></div>
        <div class="glass info-card"><span class="b-ic">${icon('phone')}</span><div><b>Call us</b><p class="muted">${esc(s.phone)}</p></div></div>
        <div class="glass info-card"><span class="b-ic">${icon('mail')}</span><div><b>Email</b><p class="muted">${esc(s.email)}</p></div></div>
        <div class="glass info-card"><span class="b-ic">${icon('headset')}</span><div><b>Telegram</b><p class="muted">${esc(s.telegram)}</p></div></div>
        <div class="glass info-card"><span class="b-ic">${icon('clock')}</span><div><b>Opening hours</b><p class="muted">${esc(s.hours)}</p></div></div></div>
        <form class="glass form-card" data-form="contact" novalidate><h3>Send us a message</h3>
          <label class="field"><span>Your name</span><input class="input" name="name" required></label><label class="field"><span>Email or phone</span><input class="input" name="contact" required></label>
          <label class="field"><span>Message</span><textarea class="input" name="message" rows="5" required placeholder="Which phone are you interested in?"></textarea></label>
          <button class="btn btn-primary btn-lg" type="submit">Send message ${icon('arrow-right')}</button></form></div></section>`, 'Contact', 'contact');
  }
  MS.forms.contact = (form) => {
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim(), contact = (fd.get('contact') || '').trim(), message = (fd.get('message') || '').trim();
    if (!name || !contact || message.length < 5) return MS.toast('Please fill in all fields.', 'error');
    DB.insert('messages', { name, contact, message, created: Date.now() });
    form.reset();
    MS.toast('Message sent. We will get back to you soon!');
  };

  /* ===================== search suggestions ===================== */
  function renderSuggestions(q) {
    const box = $('#searchResults');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (!q) { box.classList.remove('open'); box.innerHTML = ''; return; }
    const hits = MS.visible().filter((p) => (p.name + ' ' + p.brand).toLowerCase().includes(q)).slice(0, 5);
    box.innerHTML = hits.length
      ? hits.map((p) => `<a href="#/product/${p.id}" class="sg"><span class="sg-art" style="--pc:${esc((p.colors[0] || {}).hex)}">${pimg(p, (p.colors[0] || {}).hex)}</span><span><b>${esc(p.name)}</b><em>${esc(p.brand)}</em></span><b>${money(p.price)}</b></a>`).join('') + `<a class="sg-all" href="#/products?q=${encodeURIComponent(q)}">See all results for “${esc(q)}” ${icon('arrow-right')}</a>`
      : `<div class="sg-none">No phones found for “${esc(q)}”</div>`;
    box.classList.add('open');
  }

  /* ===================== drawer / theme / menus ===================== */
  function openCart() { renderDrawer(); $('#cartDrawer').classList.add('open'); $('#scrim').classList.add('open'); document.body.classList.add('no-scroll'); }
  function closeCart() { const d = $('#cartDrawer'); if (d) d.classList.remove('open'); const s = $('#scrim'); if (s) s.classList.remove('open'); if (!$('#modalRoot').classList.contains('open')) document.body.classList.remove('no-scroll'); }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('lytstore_theme', t); } catch (e) {}
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'light' ? '#f4fbfa' : '#04060c');
  }

  /* ===================== actions (click delegation) ===================== */
  const A = MS.actions;
  A.theme = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    const apply = () => { setTheme(next); renderHeader(); };
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(apply); else apply();
  };
  A['open-cart'] = openCart;
  A['close-cart'] = closeCart;
  A.menu = () => document.body.classList.toggle('menu-open');
  A['user-menu'] = () => $('#userMenu').classList.toggle('open');
  A.logout = () => { MS.Auth.logout(); renderHeader(); renderDrawer(); MS.toast('Signed out.'); MS.go('/'); };
  A['close-modal'] = () => MS.closeModal();
  A.print = () => window.print();
  A['quick-add'] = (el) => {
    const p = MS.product(el.dataset.id);
    const r = MS.Cart.add(p.id, 1, p.storages[0].label, p.colors[0].name);
    if (!r.ok) return MS.toast(r.error, 'error');
    MS.toast(p.name + ' added to cart');
    el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 500);
  };
  A['add-cart'] = (el) => {
    const p = MS.product(el.dataset.id);
    const r = MS.Cart.add(p.id, PD.qty, p.storages[PD.storage].label, p.colors[PD.color].name);
    if (!r.ok) return MS.toast(r.error, 'error');
    MS.toast(`${PD.qty} × ${p.name} added to cart`);
    openCart();
  };
  A['buy-now'] = (el) => {
    const p = MS.product(el.dataset.id);
    const r = MS.Cart.add(p.id, PD.qty, p.storages[PD.storage].label, p.colors[PD.color].name);
    if (!r.ok) return MS.toast(r.error, 'error');
    MS.go('/checkout');
  };
  A['pick-color'] = (el) => { PD.color = Number(el.dataset.i); pdRefresh(); };
  A['pick-storage'] = (el) => { PD.storage = Number(el.dataset.i); pdRefresh('info'); };
  A['pick-view'] = (el) => { PD.view = el.dataset.v; pdRefresh(); };
  A['pd-inc'] = () => { const p = MS.product(PD.id); if (PD.qty < p.stock) PD.qty++; else MS.toast(`Only ${p.stock} in stock.`, 'error'); pdRefresh('info'); };
  A['pd-dec'] = () => { if (PD.qty > 1) PD.qty--; pdRefresh('info'); };
  const cartChanged = () => { renderDrawer(); if (parseHash().path === '/cart') cartPage(); };
  A['cart-inc'] = (el) => { const it = DB.find('cart_items', Number(el.dataset.id)); const r = MS.Cart.setQty(it.id, it.quantity + 1); if (!r.ok && r.error) MS.toast(r.error, 'error'); cartChanged(); };
  A['cart-dec'] = (el) => { const it = DB.find('cart_items', Number(el.dataset.id)); MS.Cart.setQty(it.id, it.quantity - 1); cartChanged(); };
  A['cart-rm'] = (el) => { MS.Cart.remove(Number(el.dataset.id)); cartChanged(); };
  A['cancel-order'] = (el) => MS.confirm('Cancel this order?', 'The phones go back into stock. You can place a new order any time.', () => { MS.Orders.setStatus(Number(el.dataset.id), 'Cancelled'); MS.toast('Order cancelled.'); ordersPage(); }, 'Cancel order');
  A['pay-done'] = (el) => { MS.Orders.markPaid(Number(el.dataset.id)); MS.toast('Payment marked as received (demo).'); orderPage(Number(el.dataset.id), {}); };
  A['toggle-filters'] = () => $('#filters').classList.toggle('open');
  A['clear-filters'] = () => { resetFilters(); refreshFilterUI(); };
  A['price-chip'] = (el) => { F.min = el.dataset.min; F.max = el.dataset.max; refreshFilterUI(); };
  A['storage-chip'] = (el) => { const v = el.dataset.v; F.storage = F.storage.includes(v) ? F.storage.filter((x) => x !== v) : [...F.storage, v]; el.classList.toggle('on'); renderResults(); };
  A['rm-brand'] = (el) => { F.brands = F.brands.filter((x) => x !== el.dataset.v); refreshFilterUI(); };
  A['rm-storage'] = (el) => { F.storage = F.storage.filter((x) => x !== el.dataset.v); refreshFilterUI(); };
  A['rm-price'] = () => { F.min = ''; F.max = ''; refreshFilterUI(); };
  A['rm-deals'] = () => { F.deals = false; refreshFilterUI(); };
  A['rm-stock'] = () => { F.stock = false; refreshFilterUI(); };
  A['rm-q'] = () => { F.q = ''; refreshFilterUI(); };

  /* ===================== inputs (input/change delegation) ===================== */
  const I = MS.inputs;
  I['f-q'] = MS.debounce((el) => { F.q = el.value; renderResults(); }, 150);
  I['f-brand'] = (el) => { F.brands = $$('input[data-input="f-brand"]:checked').map((x) => x.value); renderResults(); };
  I['f-min'] = MS.debounce((el) => { F.min = el.value; renderResults(); }, 250);
  I['f-max'] = MS.debounce((el) => { F.max = el.value; renderResults(); }, 250);
  I['f-stock'] = (el) => { F.stock = el.checked; renderResults(); };
  I['f-deals'] = (el) => { F.deals = el.checked; renderResults(); };
  I['f-sort'] = (el) => { F.sort = el.value; renderResults(); };
  I.search = (el) => renderSuggestions(el.value);
  I['co-delivery'] = (el) => { CO.delivery = el.value; $$('input[name="delivery"]').forEach((r) => r.closest('.radio-card').classList.toggle('on', r.checked)); refreshPayPanel(); $('#coSummary').firstElementChild && ($('#coSummary').innerHTML = checkoutSummary() + `<button class="btn btn-primary btn-lg btn-block" type="submit">Place order ${icon('arrow-right')}</button><p class="muted-sm">By placing your order you agree to our terms. This is a demo store; no real payment is taken.</p>`); };
  I['co-payment'] = (el) => { CO.payment = el.value; $$('input[name="payment"]').forEach((r) => r.closest('.radio-card').classList.toggle('on', r.checked)); refreshPayPanel(); };
  function refreshPayPanel() {
    const box = document.getElementById('payPanel');
    if (!box) return;
    const sub = MS.Cart.subtotal();
    const total = sub + MS.deliveryFee(CO.delivery, sub);
    box.innerHTML = payPanel(CO.payment, total, 'Shown after you place your order');
  }
  MS.refreshPayPanel = refreshPayPanel;

  /* ===================== boot ===================== */
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]');
      if (a) {
        const fn = MS.actions[a.dataset.action];
        if (fn) {
          // only stop real buttons; links (e.g. drawer "Checkout") must still navigate
          if (a.tagName === 'BUTTON') e.preventDefault();
          fn(a, e);
        }
      }
      if (!e.target.closest('#userMenu')) { const um = $('#userMenu'); if (um) um.classList.remove('open'); }
      if (!e.target.closest('#searchBox')) { const sr = $('#searchResults'); if (sr) sr.classList.remove('open'); }
      if (e.target.closest('#searchResults a')) { const si = $('#searchInput'); if (si) si.value = ''; }
      if (e.target.closest('#navLinks a')) document.body.classList.remove('menu-open');
    });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('[data-form]');
      if (!f) return;
      e.preventDefault();
      const fn = MS.forms[f.dataset.form];
      if (fn) fn(f, e);
    });
    const onInput = (e) => { const el = e.target.closest('[data-input]'); if (el && MS.inputs[el.dataset.input]) MS.inputs[el.dataset.input](el, e); };
    document.addEventListener('input', onInput);
    document.addEventListener('change', (e) => { const el = e.target.closest('[data-input]'); if (el && el.type !== 'text' && el.type !== 'search' && el.type !== 'number' && MS.inputs[el.dataset.input]) MS.inputs[el.dataset.input](el, e); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeCart(); MS.closeModal(); document.body.classList.remove('menu-open'); }
      if (e.key === 'Enter' && e.target.id === 'searchInput') { const v = e.target.value.trim(); if (v) { MS.go('/products?q=' + encodeURIComponent(v)); $('#searchResults').classList.remove('open'); } }
    });
    // 3D tilt for the phone
    document.addEventListener('pointermove', (e) => {
      const t = e.target.closest && e.target.closest('[data-tilt]');
      if (!t || e.pointerType === 'touch') return;
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      t.style.setProperty('--ry', (x * 26).toFixed(1) + 'deg'); t.style.setProperty('--rx', (-y * 18).toFixed(1) + 'deg');
    });
    document.addEventListener('pointerout', (e) => { const t = e.target.closest && e.target.closest('[data-tilt]'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--ry', '0deg'); t.style.setProperty('--rx', '0deg'); } });
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', () => document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 8), { passive: true });
  }

  MS.refreshChrome = () => { renderHeader(); renderDrawer(); };
  MS.start = function () {
    DB.load();
    let theme = 'dark';
    try { theme = localStorage.getItem('lytstore_theme') || 'dark'; } catch (e) {}
    setTheme(theme);
    MS.Cart.onChange(() => { updateCartBadge(); });
    renderHeader(); renderFooter(); renderDrawer();
    bindGlobal();
    route();
  };
})();
