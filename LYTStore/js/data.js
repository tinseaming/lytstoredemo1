/* LYT Store: constants + sample data. Everything here is DEMO data; edit it from the admin dashboard. */
(function () {
  'use strict';
  const MS = (window.MS = window.MS || {});

  MS.BRANDS = ['iPhone', 'Samsung', 'Xiaomi', 'OPPO'];
  MS.STATUSES = ['Processing', 'Shipping', 'Delivered'];
  MS.FREE_DELIVERY_OVER = 300;
  MS.LOW_STOCK = 5;
  MS.DELIVERY = {
    standard: { label: 'Standard delivery', note: '2–3 days · free over $300', fee: 3 },
    express: { label: 'Express (Phnom Penh)', note: 'Same day · order before 3 PM', fee: 6 },
    pickup: { label: 'Store pickup', note: 'Ready in 2 hours · free', fee: 0 }
  };
  MS.deliveryFee = (method, subtotal) => {
    if (method === 'pickup') return 0;
    if (method === 'express') return 6;
    return subtotal >= MS.FREE_DELIVERY_OVER ? 0 : 3;
  };
  MS.PAYMENTS = {
    aba: { label: 'ABA Pay', note: 'Pay with the ABA Mobile app' },
    khqr: { label: 'KHQR', note: 'Scan with any Bakong-enabled bank app' },
    cod: { label: 'Cash on Delivery', note: 'Pay when your phone arrives' },
    bank: { label: 'Bank Transfer', note: 'Transfer, then send us the receipt' }
  };
  MS.PROVINCES = ['Phnom Penh', 'Kandal', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Kampong Cham', 'Kampot', 'Takeo', 'Other'];
  MS.STORE = { name: 'LYT Store', address: 'Street 271, Phnom Penh, Cambodia', city: 'Phnom Penh, Cambodia', phoneLink: '+85512345678', phone: '+855 12 345 678', email: 'hello@lytstore.com', hours: 'Every day · 8:00 – 20:00', telegram: '@lytstore_kh' };

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const C = (name, hex) => ({ name, hex });
  const S = (label, add) => ({ label, add });
  const pad = (n, l) => String(n).padStart(l, '0');
  MS.orderCode = (id, ts) => { const d = new Date(ts); return 'MS-' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + '-' + pad(id, 4); };

  MS.seed = function () {
    const now = Date.now(), day = 86400000;
    const categories = [
      { id: 1, category_name: 'Flagship' }, { id: 2, category_name: 'Mid-range' },
      { id: 3, category_name: 'Budget' }, { id: 4, category_name: 'Foldable' }
    ];
    let pid = 0;
    const P = (o) => Object.assign({ id: ++pid, type: 'phone', condition: null, oldPrice: null, featured: false, isNew: false, image: null, created: now - (40 - pid) * day }, o);
    const products = [
      P({ name: 'iPhone 16 Pro Max', brand: 'iPhone', category_id: 1, price: 1199, stock: 14, featured: true, isNew: true,
        storages: [S('256GB', 0), S('512GB', 200), S('1TB', 400)],
        colors: [C('Black Titanium', '#2b2b2e'), C('White Titanium', '#e8e5de'), C('Natural Titanium', '#b9ad9c'), C('Desert Titanium', '#c6a78c')],
        specs: { Display: '6.9-inch Super Retina XDR OLED · 120Hz', Chip: 'Apple A18 Pro', Camera: '48MP Fusion + 48MP Ultra Wide + 12MP 5× Telephoto', Battery: 'Up to 33 hours video playback', Memory: '8GB RAM', OS: 'iOS 18', Connectivity: '5G · Wi-Fi 7 · USB-C' },
        desc: 'The biggest iPhone display yet, a pro camera system and all-day battery life in a light titanium design.' }),
      P({ name: 'iPhone 16 Pro', brand: 'iPhone', category_id: 1, price: 999, stock: 18, featured: true, isNew: true,
        storages: [S('128GB', 0), S('256GB', 100), S('512GB', 300), S('1TB', 500)],
        colors: [C('Black Titanium', '#2b2b2e'), C('White Titanium', '#e8e5de'), C('Natural Titanium', '#b9ad9c'), C('Desert Titanium', '#c6a78c')],
        specs: { Display: '6.3-inch Super Retina XDR OLED · 120Hz', Chip: 'Apple A18 Pro', Camera: '48MP Fusion + 48MP Ultra Wide + 12MP 5× Telephoto', Battery: 'Up to 27 hours video playback', Memory: '8GB RAM', OS: 'iOS 18', Connectivity: '5G · Wi-Fi 7 · USB-C' },
        desc: 'Pro performance and a powerful camera system in a compact size.' }),
      P({ name: 'iPhone 16', brand: 'iPhone', category_id: 1, price: 799, stock: 25, isNew: true,
        storages: [S('128GB', 0), S('256GB', 100), S('512GB', 300)],
        colors: [C('Black', '#2a2b30'), C('White', '#f1f1ee'), C('Pink', '#f4b8cf'), C('Teal', '#7fc4c2'), C('Ultramarine', '#6f8cff')],
        specs: { Display: '6.1-inch Super Retina XDR OLED', Chip: 'Apple A18', Camera: '48MP Fusion + 12MP Ultra Wide', Battery: 'Up to 22 hours video playback', Memory: '8GB RAM', OS: 'iOS 18', Connectivity: '5G · Wi-Fi 7 · USB-C' },
        desc: 'Colourful, fast and easy to love. A18 chip, a great camera and a day-long battery.' }),
      P({ name: 'iPhone 15', brand: 'iPhone', category_id: 1, price: 699, oldPrice: 799, stock: 11, condition: 'Used · 98% battery',
        storages: [S('128GB', 0), S('256GB', 100), S('512GB', 300)],
        colors: [C('Black', '#2a2b30'), C('Blue', '#a9c4de'), C('Green', '#bcd3b5'), C('Pink', '#efc7cc')],
        specs: { Display: '6.1-inch Super Retina XDR OLED', Chip: 'Apple A16 Bionic', Camera: '48MP main + 12MP Ultra Wide', Battery: 'Up to 20 hours video playback', Memory: '6GB RAM', OS: 'iOS 17', Connectivity: '5G · Wi-Fi 6 · USB-C' },
        desc: 'USB-C, the 48MP camera and the Dynamic Island at a friendlier price.' }),

      P({ name: 'Galaxy S25 Ultra', brand: 'Samsung', category_id: 1, price: 1299, stock: 12, featured: true, isNew: true,
        storages: [S('256GB', 0), S('512GB', 120), S('1TB', 320)],
        colors: [C('Titanium Black', '#26272b'), C('Titanium Silverblue', '#9fb3c8'), C('Titanium Gray', '#7d7f84'), C('Titanium Whitesilver', '#e3e4e6')],
        specs: { Display: '6.9-inch Dynamic AMOLED 2X · 120Hz', Chip: 'Snapdragon 8 Elite for Galaxy', Camera: '200MP main + 50MP Ultra Wide + 50MP 5× + 10MP 3×', Battery: '5000 mAh · 45W charging', Memory: '12GB RAM', OS: 'Android 15 · One UI 7', Connectivity: '5G · Wi-Fi 7 · S Pen' },
        desc: 'Galaxy AI, the S Pen and a 200MP camera in a titanium frame.' }),
      P({ name: 'Galaxy S25', brand: 'Samsung', category_id: 1, price: 799, oldPrice: 899, stock: 20, featured: true,
        storages: [S('128GB', 0), S('256GB', 60), S('512GB', 180)],
        colors: [C('Navy', '#2a3550'), C('Icyblue', '#b8d8ee'), C('Mint', '#bfe5d3'), C('Silver Shadow', '#c9cbd0')],
        specs: { Display: '6.2-inch Dynamic AMOLED 2X · 120Hz', Chip: 'Snapdragon 8 Elite for Galaxy', Camera: '50MP main + 12MP Ultra Wide + 10MP 3×', Battery: '4000 mAh · 25W charging', Memory: '12GB RAM', OS: 'Android 15 · One UI 7', Connectivity: '5G · Wi-Fi 7' },
        desc: 'Compact flagship with Galaxy AI and a bright, smooth display.' }),
      P({ name: 'Galaxy Z Flip6', brand: 'Samsung', category_id: 4, price: 1099, stock: 6,
        storages: [S('256GB', 0), S('512GB', 120)],
        colors: [C('Silver Shadow', '#c9cbd0'), C('Yellow', '#f2d86b'), C('Blue', '#7fa6e0'), C('Mint', '#a9dcc6')],
        specs: { Display: '6.7-inch foldable AMOLED + 3.4-inch cover screen', Chip: 'Snapdragon 8 Gen 3 for Galaxy', Camera: '50MP main + 12MP Ultra Wide', Battery: '4000 mAh · 25W charging', Memory: '12GB RAM', OS: 'Android 14 · One UI 6.1.1', Connectivity: '5G · Wi-Fi 6E' },
        desc: 'Pocketable foldable that opens to a full-size screen. Capture hands-free with FlexCam.' }),
      P({ name: 'Galaxy A55 5G', brand: 'Samsung', category_id: 2, price: 449, oldPrice: 499, stock: 22,
        storages: [S('128GB', 0), S('256GB', 50)],
        colors: [C('Awesome Navy', '#2d3a5c'), C('Awesome Iceblue', '#b9d3e8'), C('Awesome Lilac', '#c7b6e3'), C('Awesome Lemon', '#e8e29a')],
        specs: { Display: '6.6-inch Super AMOLED · 120Hz', Chip: 'Exynos 1480', Camera: '50MP main + 12MP Ultra Wide + 5MP Macro', Battery: '5000 mAh · 25W charging', Memory: '8GB RAM', OS: 'Android 14 · One UI 6.1', Connectivity: '5G · Wi-Fi 6' },
        desc: 'A flagship-style design with a bright 120Hz display and a long-lasting battery.' }),
      P({ name: 'Galaxy A35 5G', brand: 'Samsung', category_id: 3, price: 349, stock: 0,
        storages: [S('128GB', 0), S('256GB', 40)],
        colors: [C('Awesome Navy', '#2d3a5c'), C('Awesome Lilac', '#c7b6e3'), C('Awesome Lemon', '#e8e29a')],
        specs: { Display: '6.6-inch Super AMOLED · 120Hz', Chip: 'Exynos 1380', Camera: '50MP main + 8MP Ultra Wide + 5MP Macro', Battery: '5000 mAh · 25W charging', Memory: '6GB RAM', OS: 'Android 14 · One UI 6.1', Connectivity: '5G · Wi-Fi 6' },
        desc: 'A reliable everyday phone with a vivid display and a long battery life.' }),

      P({ name: 'Xiaomi 15', brand: 'Xiaomi', category_id: 1, price: 899, stock: 9, featured: true, isNew: true,
        storages: [S('256GB', 0), S('512GB', 100)],
        colors: [C('Black', '#232427'), C('White', '#ececec'), C('Green', '#8fb59f')],
        specs: { Display: '6.36-inch LTPO AMOLED · 120Hz', Chip: 'Snapdragon 8 Elite', Camera: '50MP Leica triple camera system', Battery: '5000 mAh class · 90W wired', Memory: '12GB RAM', OS: 'Xiaomi HyperOS 2', Connectivity: '5G · Wi-Fi 7' },
        desc: 'Compact flagship with Leica optics and very fast charging.' }),
      P({ name: 'Xiaomi 14T Pro', brand: 'Xiaomi', category_id: 2, price: 649, oldPrice: 749, stock: 15,
        storages: [S('256GB', 0), S('512GB', 80)],
        colors: [C('Titan Black', '#26272b'), C('Titan Blue', '#4c6a8c'), C('Titan Gray', '#8a8c90')],
        specs: { Display: '6.67-inch AMOLED · 144Hz', Chip: 'MediaTek Dimensity 9300+', Camera: '50MP Leica triple camera system', Battery: '5000 mAh · 120W wired', Memory: '12GB RAM', OS: 'Xiaomi HyperOS', Connectivity: '5G · Wi-Fi 7' },
        desc: 'Flagship speed and a fast-charging battery at a mid-range price.' }),
      P({ name: 'Redmi Note 13 Pro+ 5G', brand: 'Xiaomi', category_id: 2, price: 399, oldPrice: 449, stock: 30,
        storages: [S('256GB', 0), S('512GB', 60)],
        colors: [C('Midnight Black', '#202125'), C('Moonlight White', '#ececec'), C('Fusion Purple', '#8d73c9')],
        specs: { Display: '6.67-inch curved AMOLED · 120Hz', Chip: 'MediaTek Dimensity 7200 Ultra', Camera: '200MP main + 8MP Ultra Wide + 2MP Macro', Battery: '5000 mAh · 120W wired', Memory: '12GB RAM', OS: 'Xiaomi HyperOS', Connectivity: '5G · Wi-Fi 6' },
        desc: 'A 200MP camera, a curved display and 120W charging for the price of a mid-ranger.' }),
      P({ name: 'POCO F6', brand: 'Xiaomi', category_id: 3, price: 349, stock: 4,
        storages: [S('256GB', 0), S('512GB', 50)],
        colors: [C('Black', '#202125'), C('Titanium', '#a9aab0'), C('Green', '#7fa58f')],
        specs: { Display: '6.67-inch AMOLED · 120Hz', Chip: 'Snapdragon 8s Gen 3', Camera: '50MP main + 8MP Ultra Wide', Battery: '5000 mAh · 90W wired', Memory: '8GB RAM', OS: 'Xiaomi HyperOS', Connectivity: '5G · Wi-Fi 7' },
        desc: 'Performance-first phone for gaming and everyday speed.' }),

      P({ name: 'OPPO Find X8 Pro', brand: 'OPPO', category_id: 1, price: 1099, stock: 7, featured: true, isNew: true,
        storages: [S('256GB', 0), S('512GB', 100)],
        colors: [C('Space Black', '#202125'), C('Pearl White', '#ecebe8')],
        specs: { Display: '6.78-inch LTPO AMOLED · 120Hz', Chip: 'MediaTek Dimensity 9400', Camera: '50MP Hasselblad quad camera system', Battery: '5900 mAh class · 80W wired', Memory: '16GB RAM', OS: 'ColorOS 15 (Android 15)', Connectivity: '5G · Wi-Fi 7' },
        desc: 'Hasselblad cameras with two periscope zoom lenses and a huge battery.' }),
      P({ name: 'OPPO Find X8', brand: 'OPPO', category_id: 1, price: 799, stock: 10,
        storages: [S('256GB', 0), S('512GB', 90)],
        colors: [C('Space Black', '#202125'), C('Star Grey', '#8c8e94'), C('Pearl White', '#ecebe8')],
        specs: { Display: '6.59-inch AMOLED · 120Hz', Chip: 'MediaTek Dimensity 9400', Camera: '50MP Hasselblad triple camera system', Battery: '5600 mAh class · 80W wired', Memory: '12GB RAM', OS: 'ColorOS 15 (Android 15)', Connectivity: '5G · Wi-Fi 7' },
        desc: 'A compact flagship with a bright display and Hasselblad colour.' }),
      P({ name: 'OPPO Reno12 5G', brand: 'OPPO', category_id: 2, price: 449, oldPrice: 499, stock: 17,
        storages: [S('256GB', 0), S('512GB', 60)],
        colors: [C('Sunset Peach', '#f0b49a'), C('Astro Silver', '#c9cbd0'), C('Matte Brown', '#6b5545')],
        specs: { Display: '6.7-inch AMOLED · 120Hz', Chip: 'MediaTek Dimensity 7300-Energy', Camera: '50MP main + 8MP Ultra Wide + 2MP Macro', Battery: '5000 mAh · 80W wired', Memory: '12GB RAM', OS: 'ColorOS 14 (Android 14)', Connectivity: '5G · Wi-Fi 6' },
        desc: 'Slim, stylish and great for portraits, with 80W fast charging.' }),
      P({ name: 'OPPO A3 Pro 5G', brand: 'OPPO', category_id: 3, price: 249, stock: 28,
        storages: [S('128GB', 0), S('256GB', 30)],
        colors: [C('Starry Purple', '#7c6fc4'), C('Sparkle Black', '#25262b')],
        specs: { Display: '6.67-inch LCD · 120Hz', Chip: 'MediaTek Dimensity 6300', Camera: '50MP main + 2MP depth', Battery: '5100 mAh · 45W wired', Memory: '8GB RAM', OS: 'ColorOS 14 (Android 14)', Connectivity: '5G · Wi-Fi 5' },
        desc: 'A tough, affordable 5G phone with a big battery.' }),
      /* ---------- watches ---------- */
      P({ name: 'Apple Watch Series 10', type: 'watch', brand: 'Apple', category_id: 2, price: 399, oldPrice: 449, stock: 9, featured: true, isNew: true,
        storages: [S('42mm', 0), S('46mm', 40)],
        colors: [C('Jet Black', '#1d1d1f'), C('Silver', '#d7d9dc'), C('Rose Gold', '#e8c2b5')],
        specs: { Display: 'Always-On Retina · 42mm or 46mm', Health: 'ECG, blood oxygen, sleep score', Battery: 'Up to 18 hours', Water: '50 m water resistant', Connectivity: 'GPS + Cellular or GPS' },
        desc: 'Thinner, bigger display and fast charging. Track health and fitness every day.' }),
      P({ name: 'Apple Watch SE', type: 'watch', brand: 'Apple', category_id: 3, price: 249, stock: 14,
        storages: [S('40mm', 0), S('44mm', 30)],
        colors: [C('Midnight', '#2b2e36'), C('Starlight', '#f1ead9'), C('Silver', '#d7d9dc')],
        specs: { Display: 'Retina · 40mm or 44mm', Health: 'Heart rate, crash detection', Battery: 'Up to 18 hours', Water: '50 m water resistant', Connectivity: 'GPS' },
        desc: 'Essential health and safety features at a friendly price.' }),
      P({ name: 'Galaxy Watch7', type: 'watch', brand: 'Samsung', category_id: 2, price: 299, oldPrice: 329, stock: 0,
        storages: [S('40mm', 0), S('44mm', 30)],
        colors: [C('Green', '#7fa58f'), C('Cream', '#efe6d2'), C('Black', '#222326')],
        specs: { Display: 'Super AMOLED · 40mm or 44mm', Health: 'Body composition, sleep coaching', Battery: 'Up to 40 hours', Water: '5 ATM', Connectivity: 'Wear OS · GPS' },
        desc: 'A slim smartwatch with Wear OS and detailed health tracking.' }),

      /* ---------- AirPods ---------- */
      P({ name: 'AirPods Pro (2nd gen, USB-C)', type: 'airpod', brand: 'Apple', category_id: 2, price: 249, oldPrice: 279, stock: 16, featured: true,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Chip: 'H2 chip', Noise: 'Active Noise Cancellation · Transparency', Battery: 'Up to 6 hours (30 with case)', Charging: 'USB-C · MagSafe', Water: 'IP54 earbuds' },
        desc: 'Adaptive noise cancellation and spatial audio in a compact case.' }),
      P({ name: 'AirPods 4', type: 'airpod', brand: 'Apple', category_id: 3, price: 129, stock: 22,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Chip: 'H2 chip', Noise: 'Personalised Spatial Audio', Battery: 'Up to 5 hours (30 with case)', Charging: 'USB-C', Water: 'IP54 earbuds' },
        desc: 'Open-ear comfort with clear sound and a smart case.' }),

      /* ---------- AirTags ---------- */
      P({ name: 'AirTag (2nd generation)', type: 'airtag', brand: 'Apple', category_id: 3, price: 30, oldPrice: 40, stock: 40,
        storages: [S('Single', 0), S('4-pack', 85)],
        colors: [C('White', '#f2f2f4')],
        specs: { Tracking: 'Find My network · precision finding', Battery: 'Replaceable, lasts over a year', Water: 'IP67', Compatibility: 'iPhone and iPad with iOS 17 or later' },
        desc: 'Keep track of keys, bags and more with Find My.' }),

      /* ---------- accessories ---------- */
      P({ name: '20W USB-C Power Adapter', type: 'accessory', brand: 'Apple', category_id: 3, price: 20, oldPrice: 25, stock: 37,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Output: '20W USB-C', Compatibility: 'iPhone, iPad, AirPods', Certification: 'Genuine Apple' },
        desc: 'Fast, compact charging for iPhone and iPad.' }),
      P({ name: '60W USB-C Charge Cable (1 m)', type: 'accessory', brand: 'Apple', category_id: 3, price: 15, oldPrice: 20, stock: 74,
        storages: [S('1 m', 0), S('2 m', 6)], colors: [C('White', '#f2f2f4')],
        specs: { Power: 'Up to 60W', Length: '1 m or 2 m', Connector: 'USB-C to USB-C' },
        desc: 'Genuine cable for fast charging and data sync.' }),
      P({ name: 'Apple Pencil (USB-C)', type: 'accessory', brand: 'Apple', category_id: 2, price: 65, oldPrice: 99, stock: 6, featured: true,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Compatibility: 'iPad (USB-C) and iPad Air', Charging: 'USB-C', Latency: 'Low latency drawing' },
        desc: 'Precise drawing and note-taking on compatible iPads.' }),
      P({ name: 'EarPods (USB-C)', type: 'accessory', brand: 'Apple', category_id: 3, price: 30, oldPrice: 40, stock: 12,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Connector: 'USB-C', Controls: 'Play, pause, volume, calls', Cable: '1.2 m' },
        desc: 'Wired earphones with a USB-C plug for iPhone 15 and later.' }),
      P({ name: 'Lightning to USB Cable (1 m)', type: 'accessory', brand: 'Apple', category_id: 3, price: 10, oldPrice: 15, stock: 30,
        storages: [S('Standard', 0)], colors: [C('White', '#f2f2f4')],
        specs: { Connector: 'Lightning to USB', Length: '1 m' },
        desc: 'Genuine Lightning cable for older iPhones, iPads and AirPods.' })
    ];

    /* ---------- users (demo accounts: admin123 / demo123) ---------- */
    const users = [
      { id: 1, name: 'Store Admin', email: 'admin@lytstore.com', phone: '+855 12 345 678', password: MS.hashPw('admin123'), role: 'admin', created: now - 60 * day },
      { id: 2, name: 'Sokha Chan', email: 'sokha@example.com', phone: '012 345 678', password: MS.hashPw('demo123'), role: 'customer', created: now - 40 * day },
      { id: 3, name: 'Dara Kim', email: 'dara@example.com', phone: '096 222 3344', password: MS.hashPw('demo123'), role: 'customer', created: now - 30 * day },
      { id: 4, name: 'Vanna Sok', email: 'vanna@example.com', phone: '077 889 900', password: MS.hashPw('demo123'), role: 'customer', created: now - 22 * day }
    ];

    /* ---------- sample past orders so the dashboard has something to show ---------- */
    const rand = rng(2026);
    const streets = ['Street 63, Sangkat Boeng Keng Kang', 'Street 271, Sangkat Tuol Tumpung', 'Street 310, Sangkat Beoung Raing', 'Norodom Blvd, Sangkat Chey Chumneah'];
    const methods = ['aba', 'khqr', 'cod', 'bank', 'aba', 'cod'];
    const drafts = [];
    for (let i = 0; i < 18; i++) {
      const created = now - Math.floor(rand() * 19) * day - Math.floor(rand() * 10) * 3600000;
      const uid = 2 + Math.floor(rand() * 3);
      const n = rand() > 0.72 ? 2 : 1;
      const items = [];
      for (let k = 0; k < n; k++) {
        const p = products[Math.floor(rand() * products.length)];
        if (!p.stock || items.find((x) => x.p === p)) continue;
        const st = p.storages[Math.floor(rand() * Math.min(2, p.storages.length))];
        items.push({ p, st, col: p.colors[Math.floor(rand() * p.colors.length)] });
      }
      if (!items.length) { i--; continue; }
      drafts.push({ created, uid, items, method: methods[i % methods.length], delivery: rand() > 0.7 ? 'express' : rand() > 0.85 ? 'pickup' : 'standard', ageDays: (now - created) / day });
    }
    drafts.sort((a, b) => a.created - b.created);
    const orders = [], order_items = [], payments = [], deliveries = [];
    drafts.forEach((d, idx) => {
      const id = idx + 1, user = users.find((u) => u.id === d.uid);
      const subtotal = d.items.reduce((s, x) => s + x.p.price + x.st.add, 0);
      const fee = MS.deliveryFee(d.delivery, subtotal);
      let status = d.ageDays > 9 ? 'Delivered' : d.ageDays > 4 ? (rand() > 0.35 ? 'Delivered' : 'Shipping') : d.ageDays > 1.5 ? 'Shipping' : 'Processing';
      if (idx === 5) status = 'Cancelled';
      const paid = status === 'Delivered' || (status === 'Shipping' && d.method !== 'cod');
      orders.push({ id, code: MS.orderCode(id, d.created), user_id: user.id, customer: { name: user.name, phone: user.phone, email: user.email }, subtotal, delivery_fee: fee, delivery_method: d.delivery, total: subtotal + fee, status, created: d.created, note: '' });
      d.items.forEach((x, k) => order_items.push({ id: order_items.length + 1, order_id: id, product_id: x.p.id, name: x.p.name, brand: x.p.brand, storage: x.st.label, color: x.col.name, color_hex: x.col.hex, quantity: 1, price: x.p.price + x.st.add }));
      payments.push({ id, order_id: id, payment_method: d.method, status: status === 'Cancelled' ? 'Cancelled' : paid ? 'Paid' : d.method === 'cod' ? 'Pay on delivery' : 'Pending', amount: subtotal + fee, created: d.created });
      deliveries.push({ id, order_id: id, address: { province: 'Phnom Penh', street: streets[idx % streets.length] }, delivery_status: status });
    });

    return { meta: { version: 1 }, users, categories, products, carts: [], cart_items: [], orders, order_items, payments, deliveries, messages: [] };
  };
})();
