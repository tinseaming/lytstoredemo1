/* LYT Store: "database" in localStorage, with the same tables as the workflow:
   users, products, categories, carts, cart_items, orders, order_items, payments, deliveries (+ messages). */
(function () {
  'use strict';
  const MS = (window.MS = window.MS || {});
  const KEY = 'lytstore_db_v1', SESSION = 'lytstore_session';

  const store = (() => {
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
    catch (e) { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; }
  })();

  const DB = (MS.DB = {
    data: null,
    load() {
      try { this.data = JSON.parse(store.getItem(KEY)); } catch (e) { this.data = null; }
      if (!this.data || !this.data.products || !this.data.users) this.reset();
      return this.data;
    },
    save() {
      try { store.setItem(KEY, JSON.stringify(this.data)); }
      catch (e) { MS.toast && MS.toast('Browser storage is full. Use smaller product images.', 'error'); }
    },
    reset() { this.data = MS.seed(); this.save(); },
    find(t, id) { return this.data[t].find((r) => r.id === id); },
    insert(t, row) { row.id = row.id == null ? this.nextId(t) : row.id; this.data[t].push(row); this.save(); return row; },
    update(t, id, patch) { const r = this.find(t, id); if (r) { Object.assign(r, patch); this.save(); } return r; },
    remove(t, id) { this.data[t] = this.data[t].filter((r) => r.id !== id); this.save(); },
    nextId(t) { return this.data[t].reduce((m, r) => Math.max(m, r.id || 0), 0) + 1; }
  });

  /* ---------- selectors ---------- */
  MS.priceOf = (p, storageLabel) => {
    const st = (p.storages || []).find((s) => s.label === storageLabel) || (p.storages || [])[0];
    return p.price + (st ? st.add : 0);
  };
  MS.product = (id) => DB.find('products', Number(id));
  MS.visible = () => DB.data.products.filter((p) => !p.hidden);
  MS.categoryName = (id) => { const c = DB.find('categories', id); return c ? c.category_name : '—'; };
  MS.discount = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  MS.brands = () => { const set = new Set(MS.BRANDS); MS.visible().forEach((p) => set.add(p.brand)); return [...set]; };

  /* ---------- auth ---------- */
  const Auth = (MS.Auth = {
    user() { const id = Number(store.getItem(SESSION)); return id ? DB.find('users', id) || null : null; },
    isAdmin() { const u = this.user(); return !!u && u.role === 'admin'; },
    login(email, pw) {
      const u = DB.data.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
      if (!u || u.password !== MS.hashPw(pw)) return { ok: false, error: 'Wrong email or password.' };
      store.setItem(SESSION, u.id);
      Cart.mergeGuest(u.id);
      return { ok: true, user: u };
    },
    register({ name, email, phone, password }) {
      email = String(email).trim().toLowerCase();
      if (DB.data.users.some((x) => x.email.toLowerCase() === email)) return { ok: false, error: 'This email is already registered.' };
      const u = DB.insert('users', { name: name.trim(), email, phone: phone.trim(), password: MS.hashPw(password), role: 'customer', created: Date.now() });
      store.setItem(SESSION, u.id);
      Cart.mergeGuest(u.id);
      return { ok: true, user: u };
    },
    logout() { store.removeItem(SESSION); }
  });

  /* ---------- cart (carts + cart_items tables; user_id 0 = guest) ---------- */
  const Cart = (MS.Cart = {
    listeners: [],
    onChange(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach((f) => f()); },
    ownerId() { const u = Auth.user(); return u ? u.id : 0; },
    row(ownerId = this.ownerId()) {
      let c = DB.data.carts.find((x) => x.user_id === ownerId);
      if (!c) c = DB.insert('carts', { user_id: ownerId });
      return c;
    },
    items() { const c = this.row(); return DB.data.cart_items.filter((i) => i.cart_id === c.id); },
    lines() {
      return this.items().map((item) => {
        const product = MS.product(item.product_id);
        if (!product) return null;
        const unit = MS.priceOf(product, item.storage);
        const col = product.colors.find((c) => c.name === item.color) || product.colors[0] || { name: '', hex: '#444' };
        return { item, product, unit, color: col, total: unit * item.quantity };
      }).filter(Boolean);
    },
    count() { return this.items().reduce((s, i) => s + i.quantity, 0); },
    subtotal() { return this.lines().reduce((s, l) => s + l.total, 0); },
    add(productId, qty, storage, color) {
      const p = MS.product(productId);
      if (!p || p.hidden) return { ok: false, error: 'This phone is no longer available.' };
      if (p.stock <= 0) return { ok: false, error: 'Sorry, this phone is sold out.' };
      const c = this.row();
      let it = DB.data.cart_items.find((i) => i.cart_id === c.id && i.product_id === p.id && i.storage === storage && i.color === color);
      const already = DB.data.cart_items.filter((i) => i.cart_id === c.id && i.product_id === p.id).reduce((s, i) => s + i.quantity, 0);
      if (already + qty > p.stock) return { ok: false, error: `Only ${p.stock} in stock.` };
      if (it) { it.quantity += qty; DB.save(); }
      else DB.insert('cart_items', { cart_id: c.id, product_id: p.id, quantity: qty, storage, color });
      this.emit();
      return { ok: true };
    },
    setQty(itemId, qty) {
      const it = DB.find('cart_items', itemId);
      if (!it) return { ok: false };
      const p = MS.product(it.product_id);
      if (qty <= 0) { DB.remove('cart_items', itemId); this.emit(); return { ok: true }; }
      const others = DB.data.cart_items.filter((i) => i.cart_id === it.cart_id && i.product_id === it.product_id && i.id !== it.id).reduce((s, i) => s + i.quantity, 0);
      if (p && others + qty > p.stock) return { ok: false, error: `Only ${p.stock} in stock.` };
      DB.update('cart_items', itemId, { quantity: qty });
      this.emit();
      return { ok: true };
    },
    remove(itemId) { DB.remove('cart_items', itemId); this.emit(); },
    clear() { const c = this.row(); DB.data.cart_items = DB.data.cart_items.filter((i) => i.cart_id !== c.id); DB.save(); this.emit(); },
    mergeGuest(userId) {
      const guest = DB.data.carts.find((x) => x.user_id === 0);
      if (!guest) return;
      const mine = this.row(userId);
      DB.data.cart_items.filter((i) => i.cart_id === guest.id).forEach((g) => {
        const ex = DB.data.cart_items.find((i) => i.cart_id === mine.id && i.product_id === g.product_id && i.storage === g.storage && i.color === g.color);
        const p = MS.product(g.product_id);
        if (ex) ex.quantity = Math.min(ex.quantity + g.quantity, p ? p.stock : 99);
        else g.cart_id = mine.id;
      });
      DB.data.cart_items = DB.data.cart_items.filter((i) => i.cart_id !== guest.id || false);
      DB.save();
    }
  });

  /* ---------- orders ---------- */
  const Orders = (MS.Orders = {
    forUser(userId) { return DB.data.orders.filter((o) => o.user_id === userId).sort((a, b) => b.created - a.created); },
    items(orderId) { return DB.data.order_items.filter((i) => i.order_id === orderId); },
    payment(orderId) { return DB.data.payments.find((p) => p.order_id === orderId); },
    delivery(orderId) { return DB.data.deliveries.find((d) => d.order_id === orderId); },
    place({ customer, address, deliveryMethod, paymentMethod, note }) {
      const user = Auth.user();
      const lines = Cart.lines();
      if (!user) return { ok: false, error: 'Please sign in first.' };
      if (!lines.length) return { ok: false, error: 'Your cart is empty.' };
      for (const l of lines) {
        const total = lines.filter((x) => x.product.id === l.product.id).reduce((s, x) => s + x.item.quantity, 0);
        if (total > l.product.stock) return { ok: false, error: `${l.product.name}: only ${l.product.stock} left in stock.` };
      }
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const fee = MS.deliveryFee(deliveryMethod, subtotal);
      const created = Date.now();
      const id = DB.nextId('orders');
      const order = DB.insert('orders', { id, code: MS.orderCode(id, created), user_id: user.id, customer, subtotal, delivery_fee: fee, delivery_method: deliveryMethod, total: subtotal + fee, status: 'Processing', created, note: note || '' });
      lines.forEach((l) => {
        DB.insert('order_items', { order_id: id, product_id: l.product.id, name: l.product.name, brand: l.product.brand, storage: l.item.storage, color: l.item.color, color_hex: l.color.hex, quantity: l.item.quantity, price: l.unit });
        l.product.stock -= l.item.quantity;
      });
      DB.insert('payments', { order_id: id, payment_method: paymentMethod, status: paymentMethod === 'cod' ? 'Pay on delivery' : 'Pending', amount: order.total, created });
      DB.insert('deliveries', { order_id: id, address, delivery_status: 'Processing' });
      Cart.clear();
      DB.save();
      return { ok: true, order };
    },
    setStatus(orderId, status) {
      const o = DB.find('orders', orderId);
      if (!o || o.status === status) return;
      const wasCancelled = o.status === 'Cancelled';
      if (status === 'Cancelled' && !wasCancelled) this.items(orderId).forEach((i) => { const p = MS.product(i.product_id); if (p) p.stock += i.quantity; });
      if (wasCancelled && status !== 'Cancelled') this.items(orderId).forEach((i) => { const p = MS.product(i.product_id); if (p) p.stock = Math.max(0, p.stock - i.quantity); });
      o.status = status;
      const d = this.delivery(orderId); if (d) d.delivery_status = status;
      const pay = this.payment(orderId);
      if (pay) {
        if (status === 'Cancelled') pay.status = 'Cancelled';
        else if (status === 'Delivered' && pay.payment_method === 'cod') pay.status = 'Paid';
        else if (wasCancelled) pay.status = pay.payment_method === 'cod' ? 'Pay on delivery' : 'Pending';
      }
      DB.save();
    },
    markPaid(orderId) { const p = this.payment(orderId); if (p && p.status !== 'Cancelled') { p.status = 'Paid'; DB.save(); } }
  });
})();
