/* LYT Store: admin dashboard (dashboard, products, inventory, orders, customers, reports, messages) */
(function () {
  'use strict';
  const MS = (window.MS = window.MS || {});
  const { $, $$, esc, money, icon, DB } = MS;

  const TABS = [
    ['dashboard', 'Dashboard', 'grid'],
    ['products', 'Products', 'box'],
    ['inventory', 'Inventory', 'package'],
    ['orders', 'Orders', 'bag'],
    ['customers', 'Customers', 'users'],
    ['reports', 'Reports', 'chart'],
    ['messages', 'Messages', 'mail']
  ];

  const S = (MS.ADMIN = { tab: 'dashboard', orderFilter: 'All', orderQ: '', prodQ: '', prodBrand: '', editingId: null });

  /* ---------- small helpers ---------- */
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const liveOrders = () => DB.data.orders.filter((o) => o.status !== 'Cancelled');
  const revenue = () => sum(liveOrders(), (o) => o.total);
  const paidRevenue = () => sum(DB.data.payments.filter((p) => p.status === 'Paid'), (p) => p.amount);
  const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return d; });
  const dayKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const short = (d) => d.getDate() + '/' + (d.getMonth() + 1);

  /* ---------- SVG charts (no libraries) ---------- */
  function lineChart(values, labels) {
    const W = 640, H = 220, pad = 28;
    const max = Math.max(1, ...values), n = values.length;
    const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / Math.max(1, n - 1), H - pad - (v / max) * (H - pad * 2)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = d + ` L ${pts[n - 1][0].toFixed(1)} ${H - pad} L ${pts[0][0].toFixed(1)} ${H - pad} Z`;
    const grid = [0, 0.5, 1].map((t) => `<line x1="${pad}" x2="${W - pad}" y1="${H - pad - t * (H - pad * 2)}" y2="${H - pad - t * (H - pad * 2)}" class="gl"/>`).join('');
    const xl = labels.map((l, i) => (i % Math.ceil(n / 7) === 0 || i === n - 1 ? `<text x="${pts[i][0].toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>` : '')).join('');
    const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${values[i] ? 3.5 : 2}" class="dot"><title>${esc(labels[i])}: ${money(values[i])}</title></circle>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue over time">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eead4" stop-opacity=".45"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></linearGradient>
      <linearGradient id="gl2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#ga)"/><path d="${d}" class="line" stroke="url(#gl2)"/>${dots}${xl}</svg>`;
  }
  function barChart(items, unit) {
    const W = 640, H = 240, pad = 34;
    const max = Math.max(1, ...items.map((x) => x.value));
    const bw = (W - pad * 2) / items.length;
    const bars = items.map((it, i) => {
      const h = (it.value / max) * (H - pad * 2);
      const x = pad + i * bw + bw * 0.18, w = bw * 0.64, y = H - pad - h;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="8" class="bar" style="--d:${i * 60}ms"><title>${esc(it.label)}: ${unit === 'money' ? money(it.value) : it.value}</title></rect>
        <text x="${(x + w / 2).toFixed(1)}" y="${H - 12}" text-anchor="middle">${esc(it.short || it.label)}</text>
        <text x="${(x + w / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" class="val">${it.value ? (unit === 'money' ? '$' + Math.round(it.value) : it.value) : ''}</text>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${bars}</svg>`;
  }
  function donut(parts) {
    const total = Math.max(1, sum(parts, (p) => p.value));
    const R = 58, C = 2 * Math.PI * R;
    let off = 0;
    const colors = ['#5eead4', '#a78bfa', '#7dd3fc', '#f472b6', '#fbbf24'];
    const segs = parts.map((p, i) => {
      const len = (p.value / total) * C;
      const s = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${colors[i % colors.length]}" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 90 90)"><title>${esc(p.label)}: ${p.value}</title></circle>`;
      off += len;
      return s;
    }).join('');
    const legend = parts.map((p, i) => `<li><i style="background:${colors[i % colors.length]}"></i><span>${esc(p.label)}</span><b>${p.value}</b><em>${Math.round((p.value / total) * 100)}%</em></li>`).join('');
    return `<div class="donut-wrap"><svg viewBox="0 0 180 180" class="donut" role="img" aria-label="Breakdown"><circle r="${R}" cx="90" cy="90" fill="none" stroke="var(--line)" stroke-width="22"/>${segs}</svg><ul class="legend">${legend}</ul></div>`;
  }

  /* ---------- layout ---------- */
  MS.renderAdmin = function (tab, q, setPage) {
    const u = MS.Auth.user();
    if (!u) return MS.go('/login?next=/admin');
    if (u.role !== 'admin') {
      setPage(`<section class="container narrow page-pad"><div class="empty"><div class="empty-ic">${icon('shield')}</div><h3>Admins only</h3><p class="muted">You need an admin account to open this page.</p><a class="btn btn-primary" href="#/">Back to store</a></div></section>`, 'Admin');
      return;
    }
    S.tab = TABS.some((t) => t[0] === tab) ? tab : 'dashboard';
    const body = { dashboard, products, inventory, orders, customers, reports, messages }[S.tab];
    const nav = TABS.map(([k, l, ic]) => `<a href="#/admin/${k}" class="${k === S.tab ? 'on' : ''}">${icon(ic)}<span>${l}${k === 'messages' && DB.data.messages.length ? ` <em class="mini-count">${DB.data.messages.length}</em>` : ''}</span></a>`).join('');
    setPage(`<section class="container admin-wrap page-pad">
      <aside class="admin-nav glass"><div class="an-head"><span class="eyebrow">Admin</span><b>Store manager</b></div>${nav}
        <div class="an-foot"><button class="btn btn-ghost btn-sm btn-block" data-action="admin-reset">${icon('refresh')} Reset demo data</button></div></aside>
      <div class="admin-main" id="adminMain">${body()}</div></section>`, 'Admin · ' + TABS.find((t) => t[0] === S.tab)[1], '');
  };

  function pageHead(eyebrow, title, right) {
    return `<div class="page-head"><div><span class="eyebrow">${esc(eyebrow)}</span><h1 class="h-xl">${esc(title)}</h1></div><div class="head-tools">${right || ''}</div></div>`;
  }

  /* ---------- dashboard ---------- */
  function dashboard() {
    const days = lastDays(14);
    const byDay = days.map((d) => sum(liveOrders().filter((o) => dayKey(o.created) === d.getTime()), (o) => o.total));
    const today = byDay[byDay.length - 1], yday = byDay[byDay.length - 2];
    const pending = DB.data.orders.filter((o) => o.status === 'Processing').length;
    const lowStock = DB.data.products.filter((p) => p.stock > 0 && p.stock <= MS.LOW_STOCK).length;
    const outStock = DB.data.products.filter((p) => p.stock <= 0).length;
    const recent = DB.data.orders.slice().sort((a, b) => b.created - a.created).slice(0, 6);
    const change = yday ? Math.round(((today - yday) / yday) * 100) : null;
    return pageHead('Overview', 'Dashboard', `<span class="muted-sm">Updated ${MS.fmtDateTime(Date.now())}</span>`) + `
      <div class="kpis">
        <div class="kpi glass"><span class="kpi-ic">${icon('dollar')}</span><span class="muted-sm">Revenue (all time)</span><b>${money(revenue())}</b><em class="${change === null ? '' : change >= 0 ? 'up' : 'down'}">${change === null ? 'Today: ' + money(today) : (change >= 0 ? '▲ ' : '▼ ') + Math.abs(change) + '% vs yesterday'}</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('bag')}</span><span class="muted-sm">Orders</span><b>${DB.data.orders.length}</b><em>${pending} waiting to be processed</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('check')}</span><span class="muted-sm">Paid revenue</span><b>${money(paidRevenue())}</b><em>${DB.data.payments.filter((p) => p.status === 'Pending').length} payments pending</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('alert')}</span><span class="muted-sm">Stock alerts</span><b>${lowStock + outStock}</b><em>${outStock} sold out · ${lowStock} low</em></div>
      </div>
      <div class="dash-grid">
        <div class="glass panel span-2"><div class="panel-head"><h3>Revenue · last 14 days</h3><span class="muted-sm">${money(sum(byDay, (x) => x))} total</span></div>${lineChart(byDay, days.map(short))}</div>
        <div class="glass panel"><div class="panel-head"><h3>Order status</h3></div>${donut(MS.STATUSES.map((s) => ({ label: s, value: DB.data.orders.filter((o) => o.status === s).length })).concat([{ label: 'Cancelled', value: DB.data.orders.filter((o) => o.status === 'Cancelled').length }]))}</div>
        <div class="glass panel span-3"><div class="panel-head"><h3>Recent orders</h3><a class="link-arrow" href="#/admin/orders">All orders ${icon('arrow-right')}</a></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th class="num">Total</th></tr></thead><tbody>
          ${recent.map((o) => `<tr><td><a href="#/order/${o.id}"><b>${esc(o.code)}</b></a></td><td>${esc(o.customer.name)}</td><td>${MS.fmtDate(o.created)}</td><td>${MS.pill ? '' : ''}<span class="status st-${esc(o.status.toLowerCase())}">${esc(o.status)}</span></td><td class="num">${money(o.total)}</td></tr>`).join('')}
          </tbody></table></div></div>
        <div class="glass panel"><div class="panel-head"><h3>Top sellers</h3></div>${topSellers().slice(0, 5).map((t) => `<div class="rank"><span class="rank-art" style="--pc:${esc(t.hex)}"></span><div><b>${esc(t.name)}</b><em>${t.qty} sold</em></div><b>${money(t.revenue)}</b></div>`).join('') || '<p class="muted">No sales yet.</p>'}</div>
        <div class="glass panel"><div class="panel-head"><h3>Quick actions</h3></div><div class="qa">
          <button class="btn btn-primary btn-block" data-action="admin-new-product">${icon('plus')} Add a phone</button>
          <a class="btn btn-ghost btn-block" href="#/admin/inventory">${icon('package')} Update stock</a>
          <a class="btn btn-ghost btn-block" href="#/admin/orders">${icon('bag')} Process orders</a></div></div>
      </div>`;
  }

  function topSellers() {
    const map = {};
    DB.data.order_items.forEach((i) => {
      const o = DB.find('orders', i.order_id);
      if (!o || o.status === 'Cancelled') return;
      const k = i.product_id;
      map[k] = map[k] || { name: i.name, hex: i.color_hex, qty: 0, revenue: 0 };
      map[k].qty += i.quantity; map[k].revenue += i.price * i.quantity;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  /* ---------- products (CRUD) ---------- */
  function productRows() {
    const q = S.prodQ.trim().toLowerCase();
    return DB.data.products.filter((p) => (!q || (p.name + ' ' + p.brand).toLowerCase().includes(q)) && (!S.prodBrand || p.brand === S.prodBrand));
  }
  function products() {
    const list = productRows();
    const brands = MS.brands();
    return pageHead('Catalogue', 'Products', `<button class="btn btn-primary" data-action="admin-new-product">${icon('plus')} Add phone</button>`) + `
      <div class="toolbar glass"><div class="search-box">${icon('search')}<input class="input" data-input="a-prod-q" type="search" placeholder="Search products" value="${esc(S.prodQ)}" aria-label="Search products"></div>
        <select class="select" data-input="a-prod-brand" aria-label="Filter by brand"><option value="">All brands</option>${brands.map((b) => `<option ${S.prodBrand === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>
        <span class="muted-sm">${list.length} of ${DB.data.products.length}</span></div>
      <div class="glass table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Phone</th><th>Brand</th><th>Category</th><th class="num">Price</th><th class="num">Stock</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((p) => `<tr><td><div class="cell-prod"><span class="thumb" style="--pc:${esc((p.colors[0] || {}).hex)}">${MS.pimg(p, (p.colors[0] || {}).hex)}</span><div><b>${esc(p.name)}</b><em>${p.storages.length} storage · ${p.colors.length} colours</em></div></div></td>
          <td>${esc(p.brand)}</td><td>${esc(MS.categoryName(p.category_id))}</td><td class="num"><b>${money(p.price)}</b>${p.oldPrice ? `<s class="muted-sm">${money(p.oldPrice)}</s>` : ''}</td>
          <td class="num">${stockPill(p.stock)}</td><td>${p.featured ? '<span class="tag">Featured</span>' : ''}${p.isNew ? '<span class="tag">New</span>' : ''}</td>
          <td class="actions"><button class="icon-btn sm" data-action="admin-edit-product" data-id="${p.id}" aria-label="Edit">${icon('edit')}</button><button class="icon-btn sm danger" data-action="admin-del-product" data-id="${p.id}" aria-label="Delete">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="7" class="center muted">No products match.</td></tr>'}
      </tbody></table></div></div>`;
  }
  function stockPill(n) { return n <= 0 ? '<span class="status st-cancelled">Sold out</span>' : n <= MS.LOW_STOCK ? `<span class="status st-shipping">${n} low</span>` : `<span class="status st-delivered">${n}</span>`; }

  function productForm(p) {
    const isNew = !p;
    const d = p || { name: '', brand: 'iPhone', category_id: 1, price: '', oldPrice: '', stock: 10, featured: false, isNew: true, storages: [{ label: '128GB', add: 0 }], colors: [{ name: 'Black', hex: '#2a2b30' }], specs: { Display: '', Chip: '', Camera: '', Battery: '', Memory: '', OS: '', Connectivity: '' }, desc: '', image: null };
    const cats = DB.data.categories;
    const specKeys = ['Display', 'Chip', 'Camera', 'Battery', 'Memory', 'OS', 'Connectivity'];
    return `<h3>${isNew ? 'Add a phone' : 'Edit phone'}</h3>
      <form class="stack" data-form="admin-product" data-id="${isNew ? '' : p.id}" novalidate>
        <div class="grid-2">
          <label class="field span-2"><span>Model name</span><input class="input" name="name" value="${esc(d.name)}" required maxlength="60"></label>
          <label class="field"><span>Brand</span><input class="input" name="brand" list="brandList" value="${esc(d.brand)}" required><datalist id="brandList">${MS.BRANDS.map((b) => `<option>${esc(b)}</option>`).join('')}</datalist></label>
          <label class="field"><span>Category</span><select class="select" name="category_id">${cats.map((c) => `<option value="${c.id}" ${c.id === d.category_id ? 'selected' : ''}>${esc(c.category_name)}</option>`).join('')}</select></label>
          <label class="field"><span>Price (USD)</span><input class="input" type="number" min="1" step="0.01" name="price" value="${esc(d.price)}" required></label>
          <label class="field"><span>Old price (optional)</span><input class="input" type="number" min="0" step="0.01" name="oldPrice" value="${esc(d.oldPrice || '')}"></label>
          <label class="field"><span>Stock</span><input class="input" type="number" min="0" step="1" name="stock" value="${esc(d.stock)}" required></label>
          <label class="field"><span>Photo (optional, PNG/JPG)</span><input class="input" type="file" name="image" accept="image/*"></label>
          <label class="field span-2"><span>Description</span><textarea class="input" name="desc" rows="3">${esc(d.desc)}</textarea></label>
        </div>
        <div class="field"><span>Storage options <em class="muted-sm">(name, extra price)</em></span><div id="storageRows" class="dyn">${d.storages.map((s) => dynRow('storage', s.label, s.add)).join('')}</div><button type="button" class="btn btn-ghost btn-sm" data-action="admin-add-row" data-kind="storage">${icon('plus')} Add storage</button></div>
        <div class="field"><span>Colours <em class="muted-sm">(name, colour)</em></span><div id="colorRows" class="dyn">${d.colors.map((c) => dynRow('color', c.name, c.hex)).join('')}</div><button type="button" class="btn btn-ghost btn-sm" data-action="admin-add-row" data-kind="color">${icon('plus')} Add colour</button></div>
        <div class="grid-2">${specKeys.map((k) => `<label class="field"><span>${k}</span><input class="input" name="spec_${k}" value="${esc((d.specs || {})[k] || '')}"></label>`).join('')}</div>
        <div class="row-gap"><label class="check"><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}><span>Featured on home</span></label><label class="check"><input type="checkbox" name="isNew" ${d.isNew ? 'checked' : ''}><span>Mark as New</span></label></div>
        <div class="row-end"><button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${icon('check')} ${isNew ? 'Add phone' : 'Save changes'}</button></div>
      </form>`;
  }
  function dynRow(kind, a, b) {
    const isColor = kind === 'color';
    return `<div class="dyn-row"><input class="input" name="${kind}_name" value="${esc(a)}" placeholder="${isColor ? 'Colour name' : 'e.g. 256GB'}" required>${isColor ? `<input class="input color-in" type="color" name="${kind}_hex" value="${esc(b || '#888888')}">` : `<input class="input" type="number" min="0" step="1" name="${kind}_add" value="${esc(b || 0)}" placeholder="+$">`}<button type="button" class="icon-btn sm danger" data-action="admin-rm-row" aria-label="Remove">${icon('x')}</button></div>`;
  }

  MS.actions['admin-new-product'] = () => MS.modal(productForm(null), { wide: true });
  MS.actions['admin-edit-product'] = (el) => MS.modal(productForm(DB.find('products', Number(el.dataset.id))), { wide: true });
  MS.actions['admin-add-row'] = (el) => { const k = el.dataset.kind; const box = document.getElementById(k === 'color' ? 'colorRows' : 'storageRows'); box.insertAdjacentHTML('beforeend', k === 'color' ? dynRow('color', '', '#888888') : dynRow('storage', '', 0)); };
  MS.actions['admin-rm-row'] = (el) => { const box = el.closest('.dyn'); if (box.children.length > 1) el.closest('.dyn-row').remove(); else MS.toast('Keep at least one option.', 'error'); };
  MS.actions['admin-del-product'] = (el) => {
    const p = DB.find('products', Number(el.dataset.id));
    const used = DB.data.order_items.some((i) => i.product_id === p.id);
    MS.confirm('Delete ' + p.name + '?', used ? 'This phone appears in past orders, so it will be hidden from the store instead of deleted from order history.' : 'This removes the phone from the store.', () => {
      if (used) { DB.update('products', p.id, { stock: 0, hidden: true, featured: false }); MS.toast('Phone hidden from the store.'); }
      else { DB.remove('products', p.id); MS.toast('Phone deleted.'); }
      MS.renderAdmin('products', {}, MS.setPageRef);
    });
  };
  MS.actions['admin-reset'] = () => MS.confirm('Reset demo data?', 'All products, orders and accounts go back to the sample data. Your changes will be lost.', () => { DB.reset(); MS.Auth.logout(); MS.refreshChrome(); MS.toast('Demo data reset.'); MS.go('/admin/dashboard'); }, 'Reset');

  function readDyn(form, kind) {
    const names = [...form.querySelectorAll(`[name="${kind}_name"]`)];
    return names.map((n, i) => {
      const row = n.closest('.dyn-row');
      const v = row.querySelector(kind === 'color' ? '[name="color_hex"]' : '[name="storage_add"]').value;
      return kind === 'color' ? { name: n.value.trim(), hex: v } : { label: n.value.trim(), add: Math.max(0, Number(v) || 0) };
    }).filter((x) => (x.name || x.label));
  }

  MS.forms['admin-product'] = (form) => {
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim(), brand = (fd.get('brand') || '').trim();
    const price = Number(fd.get('price')), stock = Math.max(0, parseInt(fd.get('stock'), 10) || 0), oldPrice = Number(fd.get('oldPrice')) || null;
    const storages = readDyn(form, 'storage'), colors = readDyn(form, 'color');
    if (!name || !brand) return MS.toast('Please enter a name and brand.', 'error');
    if (!(price > 0)) return MS.toast('Price must be more than 0.', 'error');
    if (!storages.length || !colors.length) return MS.toast('Add at least one storage option and one colour.', 'error');
    const specs = {};
    MS.BRANDS.length && ['Display', 'Chip', 'Camera', 'Battery', 'Memory', 'OS', 'Connectivity'].forEach((k) => { const v = (fd.get('spec_' + k) || '').trim(); if (v) specs[k] = v; });
    const patch = { name, brand, category_id: Number(fd.get('category_id')), price, oldPrice: oldPrice && oldPrice > price ? oldPrice : null, stock, featured: fd.get('featured') === 'on', isNew: fd.get('isNew') === 'on', storages, colors, specs, desc: (fd.get('desc') || '').trim() };
    const file = form.querySelector('[name="image"]').files[0];
    const finish = (image) => {
      if (image !== undefined) patch.image = image;
      const id = form.dataset.id;
      if (id) { DB.update('products', Number(id), patch); MS.toast('Changes saved.'); }
      else { DB.insert('products', Object.assign({ oldPrice: null, image: null, created: Date.now() }, patch)); MS.toast('Phone added to the store.'); }
      MS.closeModal();
      MS.renderAdmin(S.tab, {}, MS.setPageRef);
    };
    if (file) {
      if (file.size > 400 * 1024) return MS.toast('Photo is too big. Please use an image under 400 KB.', 'error');
      const r = new FileReader(); r.onload = () => finish(r.result); r.readAsDataURL(file);
    } else finish();
  };

  /* ---------- inventory ---------- */
  function inventory() {
    const list = DB.data.products.slice().sort((a, b) => a.stock - b.stock);
    return pageHead('Stock', 'Inventory', `<span class="muted-sm">${DB.data.products.reduce((s, p) => s + p.stock, 0)} units in total</span>`) + `
      <div class="glass table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Phone</th><th class="num">Units in stock</th><th class="num">Sold</th><th>Adjust</th></tr></thead><tbody>
      ${list.map((p) => { const sold = sum(DB.data.order_items.filter((i) => i.product_id === p.id && (DB.find('orders', i.order_id) || {}).status !== 'Cancelled'), (i) => i.quantity); return `<tr><td><div class="cell-prod"><span class="thumb" style="--pc:${esc((p.colors[0] || {}).hex)}">${MS.pimg(p, (p.colors[0] || {}).hex)}</span><div><b>${esc(p.name)}</b><em>${esc(p.brand)}${p.hidden ? ' · hidden' : ''}</em></div></div></td>
        <td class="num">${stockPill(p.stock)}</td><td class="num">${sold}</td>
        <td><div class="stepper"><button class="icon-btn sm" data-action="stock-adj" data-id="${p.id}" data-d="-1" aria-label="Minus one">${icon('minus')}</button><input class="input stock-in" type="number" min="0" value="${p.stock}" data-input="stock-set" data-id="${p.id}" aria-label="Stock for ${esc(p.name)}"><button class="icon-btn sm" data-action="stock-adj" data-id="${p.id}" data-d="1" aria-label="Plus one">${icon('plus')}</button><button class="btn btn-ghost btn-sm" data-action="stock-adj" data-id="${p.id}" data-d="10">+10</button></div></td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  }
  MS.actions['stock-adj'] = (el) => { const p = DB.find('products', Number(el.dataset.id)); DB.update('products', p.id, { stock: Math.max(0, p.stock + Number(el.dataset.d)) }); MS.renderAdmin('inventory', {}, MS.setPageRef); };
  MS.inputs['stock-set'] = MS.debounce((el) => { const n = Math.max(0, parseInt(el.value, 10) || 0); DB.update('products', Number(el.dataset.id), { stock: n }); }, 350);
  MS.inputs['a-prod-q'] = MS.debounce((el) => { S.prodQ = el.value; MS.renderAdmin('products', {}, MS.setPageRef); }, 200);
  MS.inputs['a-prod-brand'] = (el) => { S.prodBrand = el.value; MS.renderAdmin('products', {}, MS.setPageRef); };
  MS.inputs['a-order-q'] = MS.debounce((el) => { S.orderQ = el.value; MS.renderAdmin('orders', {}, MS.setPageRef); }, 200);

  /* ---------- orders ---------- */
  function orders() {
    const q = S.orderQ.trim().toLowerCase();
    const list = DB.data.orders.slice().sort((a, b) => b.created - a.created).filter((o) => (S.orderFilter === 'All' || o.status === S.orderFilter) && (!q || (o.code + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase().includes(q)));
    const counts = ['All'].concat(MS.STATUSES, ['Cancelled']).map((s) => [s, s === 'All' ? DB.data.orders.length : DB.data.orders.filter((o) => o.status === s).length]);
    return pageHead('Fulfilment', 'Orders', `<button class="btn btn-ghost" data-action="export-orders">${icon('download')} Export CSV</button>`) + `
      <div class="toolbar glass"><div class="search-box">${icon('search')}<input class="input" data-input="a-order-q" type="search" placeholder="Search order, name or phone" value="${esc(S.orderQ)}" aria-label="Search orders"></div>
        <div class="chips">${counts.map(([s, n]) => `<button class="chip ${S.orderFilter === s ? 'on' : ''}" data-action="order-filter" data-v="${esc(s)}">${esc(s)} <em>${n}</em></button>`).join('')}</div></div>
      <div class="glass table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th class="num">Total</th><th>Update</th></tr></thead><tbody>
      ${list.map((o) => { const items = MS.Orders.items(o.id), pay = MS.Orders.payment(o.id); return `<tr><td><a href="#/order/${o.id}"><b>${esc(o.code)}</b></a><em class="muted-sm block">${MS.fmtDate(o.created)}</em></td>
        <td><b>${esc(o.customer.name)}</b><em class="muted-sm block">${esc(o.customer.phone)}</em></td>
        <td class="muted-sm">${items.map((i) => `${esc(i.name)} ${esc(i.storage)} ×${i.quantity}`).join('<br>')}</td>
        <td><span class="muted-sm">${esc(MS.PAYMENTS[pay.payment_method].label)}</span><br>${MS.pill ? '' : ''}<span class="status st-${esc(pay.status.toLowerCase().replace(/[^a-z]+/g, '-'))}">${esc(pay.status)}</span>${pay.status === 'Pending' || pay.status === 'Pay on delivery' ? ` <button class="link-btn" data-action="mark-paid" data-id="${o.id}">Mark paid</button>` : ''}</td>
        <td><span class="status st-${esc(o.status.toLowerCase())}">${esc(o.status)}</span></td><td class="num"><b>${money(o.total)}</b></td>
        <td><select class="select sm" data-input="order-status" data-id="${o.id}" aria-label="Status for ${esc(o.code)}">${['Processing', 'Shipping', 'Delivered', 'Cancelled'].map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`; }).join('') || '<tr><td colspan="7" class="center muted">No orders match.</td></tr>'}
      </tbody></table></div></div>`;
  }
  MS.actions['order-filter'] = (el) => { S.orderFilter = el.dataset.v; MS.renderAdmin('orders', {}, MS.setPageRef); };
  MS.actions['mark-paid'] = (el) => { MS.Orders.markPaid(Number(el.dataset.id)); MS.toast('Marked as paid.'); MS.renderAdmin('orders', {}, MS.setPageRef); };
  MS.inputs['order-status'] = (el) => {
    const id = Number(el.dataset.id);
    MS.Orders.setStatus(id, el.value);
    MS.toast('Order updated to ' + el.value + '.');
    MS.renderAdmin('orders', {}, MS.setPageRef);
  };
  MS.actions['export-orders'] = () => {
    const rows = [['Order', 'Date', 'Customer', 'Phone', 'Items', 'Payment', 'Payment status', 'Delivery', 'Status', 'Total (USD)']];
    DB.data.orders.forEach((o) => {
      const items = MS.Orders.items(o.id).map((i) => `${i.name} ${i.storage} x${i.quantity}`).join('; ');
      const pay = MS.Orders.payment(o.id);
      rows.push([o.code, MS.fmtDate(o.created), o.customer.name, o.customer.phone, items, MS.PAYMENTS[pay.payment_method].label, pay.status, MS.DELIVERY[o.delivery_method].label, o.status, o.total]);
    });
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'lytstore-orders.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    MS.toast('Orders exported to CSV.');
  };

  /* ---------- customers ---------- */
  function customers() {
    const rows = DB.data.users.filter((u) => u.role === 'customer').map((u) => {
      const os = DB.data.orders.filter((o) => o.user_id === u.id);
      return { u, count: os.length, spent: sum(os.filter((o) => o.status !== 'Cancelled'), (o) => o.total), last: os.length ? Math.max(...os.map((o) => o.created)) : null };
    }).sort((a, b) => b.spent - a.spent);
    return pageHead('People', 'Customers', `<span class="muted-sm">${rows.length} customers</span>`) + `
      <div class="glass table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Contact</th><th>Joined</th><th class="num">Orders</th><th>Last order</th><th class="num">Spent</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><div class="cell-prod"><span class="avatar sm">${esc(r.u.name.charAt(0))}</span><b>${esc(r.u.name)}</b></div></td><td><span class="block">${esc(r.u.email)}</span><span class="muted-sm">${esc(r.u.phone || '')}</span></td><td>${MS.fmtDate(r.u.created)}</td><td class="num">${r.count}</td><td>${r.last ? MS.fmtDate(r.last) : '<span class="muted-sm">—</span>'}</td><td class="num"><b>${money(r.spent)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="center muted">No customers yet.</td></tr>'}
      </tbody></table></div></div>`;
  }

  /* ---------- reports ---------- */
  function reports() {
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - (5 - i)); return d; });
    const monthRev = months.map((m) => ({ label: m.toLocaleString('en-US', { month: 'short' }), value: sum(liveOrders().filter((o) => { const d = new Date(o.created); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); }), (o) => o.total) }));
    const byBrand = MS.brands().map((b) => ({ label: b, value: sum(DB.data.order_items.filter((i) => i.brand === b && (DB.find('orders', i.order_id) || {}).status !== 'Cancelled'), (i) => i.price * i.quantity) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
    const byPay = Object.keys(MS.PAYMENTS).map((k) => ({ label: MS.PAYMENTS[k].label, value: DB.data.payments.filter((p) => p.payment_method === k && p.status !== 'Cancelled').length }));
    const avg = liveOrders().length ? revenue() / liveOrders().length : 0;
    const top = topSellers();
    return pageHead('Insights', 'Reports', `<button class="btn btn-ghost" data-action="print">${icon('printer')} Print</button>`) + `
      <div class="kpis">
        <div class="kpi glass"><span class="kpi-ic">${icon('dollar')}</span><span class="muted-sm">Net revenue</span><b>${money(revenue())}</b><em>excludes cancelled orders</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('bag')}</span><span class="muted-sm">Average order</span><b>${money(avg)}</b><em>${liveOrders().length} live orders</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('box')}</span><span class="muted-sm">Phones sold</span><b>${sum(liveOrders().flatMap((o) => MS.Orders.items(o.id)), (i) => i.quantity)}</b><em>${top.length} different models</em></div>
        <div class="kpi glass"><span class="kpi-ic">${icon('x')}</span><span class="muted-sm">Cancelled</span><b>${DB.data.orders.filter((o) => o.status === 'Cancelled').length}</b><em>stock was returned</em></div>
      </div>
      <div class="dash-grid">
        <div class="glass panel span-2"><div class="panel-head"><h3>Monthly revenue</h3></div>${barChart(monthRev.map((m) => ({ ...m, short: m.label })), 'money')}</div>
        <div class="glass panel"><div class="panel-head"><h3>Revenue by brand</h3></div>${byBrand.length ? barChart(byBrand.map((b) => ({ label: b.label, short: b.label.slice(0, 4), value: b.value })), 'money') : '<p class="muted">No sales yet.</p>'}</div>
        <div class="glass panel"><div class="panel-head"><h3>Payment methods</h3></div>${donut(byPay)}</div>
        <div class="glass panel span-3"><div class="panel-head"><h3>Best sellers</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Phone</th><th class="num">Units</th><th class="num">Revenue</th></tr></thead><tbody>
          ${top.slice(0, 8).map((t, i) => `<tr><td>${i + 1}</td><td><div class="cell-prod"><span class="thumb" style="--pc:${esc(t.hex)}"></span><b>${esc(t.name)}</b></div></td><td class="num">${t.qty}</td><td class="num"><b>${money(t.revenue)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="center muted">No sales yet.</td></tr>'}
        </tbody></table></div></div>
      </div>`;
  }

  /* ---------- messages ---------- */
  function messages() {
    const list = DB.data.messages.slice().sort((a, b) => b.created - a.created);
    return pageHead('Inbox', 'Messages', '') + (list.length ? `<div class="stack">${list.map((m) => `<article class="glass msg"><div class="msg-top"><b>${esc(m.name)}</b><span class="muted-sm">${esc(m.contact)} · ${MS.fmtDateTime(m.created)}</span></div><p>${esc(m.message)}</p><div class="row-end"><button class="btn btn-ghost btn-sm" data-action="msg-del" data-id="${m.id}">${icon('trash')} Delete</button></div></article>`).join('')}</div>` : `<div class="empty"><div class="empty-ic">${icon('mail')}</div><h3>No messages</h3><p class="muted">Messages from the contact form appear here.</p></div>`);
  }
  MS.actions['msg-del'] = (el) => { DB.remove('messages', Number(el.dataset.id)); MS.renderAdmin('messages', {}, MS.setPageRef); };

  /* admin needs setPage from app.js; app.js passes it through route() */
  MS.setPageRef = function (html, title, nav) {
    const a = document.getElementById('app');
    a.innerHTML = html;
    a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter');
    document.title = (title ? title + ' · ' : '') + 'LYT Store';
    document.body.classList.remove('menu-open');
  };
})();
