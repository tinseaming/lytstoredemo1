# LYT Store — phone shop (demo project)

A complete phone-selling website with a customer storefront and an admin dashboard.
Plain HTML, CSS and JavaScript, so it deploys to Vercel as a static site, like your portfolio.

## Open it
Double-click `index.html`, or deploy the folder to Vercel (no build step).

## Demo accounts
| Role     | Email                    | Password |
|----------|--------------------------|----------|
| Admin    | admin@lytstore.com      | admin123 |
| Customer | sokha@example.com        | demo123  |

## What is included (matches the workflow)
- **Storefront:** home, products with filters (brand, price, storage, stock, deals) and sorting,
  product details (storage and colour options, front/back 3D phone), cart drawer and cart page,
  checkout (delivery method, ABA / KHQR / bank transfer / cash on delivery), order confirmation,
  invoice with status timeline, my orders (cancel), login / register, contact form, search.
- **Admin dashboard:** KPIs, 14-day revenue chart, order-status donut, products (add / edit / delete
  with storage and colour options and photo upload), inventory (stock adjust), orders (status updates,
  mark paid, filter, search, CSV export), customers, reports (monthly revenue, brand breakdown,
  payment methods, best sellers) and contact messages.
- **Database tables** (in `js/data.js`, `js/db.js`): users, products, categories, carts, cart_items,
  orders, order_items, payments, deliveries, messages.

## Store sections (layout inspired by selastores.com)
- **Top bar:** phone number, opening hours and location.
- **Category menu:** Phones, Watches, AirPods, AirTags, Accessories and Repair.
- **Home:** promo banner carousel, category tiles, "Popular products", "Accessories", a repair call-out, and "All products" with pagination (12 per page).
- **Product cards:** discount badge, condition label (New, or used with battery health), stock count and price with the old price struck through.
- **Repair service page:** price list (starting prices) and a booking form. Bookings appear in the admin Messages tab.
- **Mobile:** a bottom tab bar (Home, Shop, Cart, Account, Support).
- **Footer:** social links, quick links, contact details and payment badges.

Product types are set with the `type` field in `js/data.js` (`phone`, `watch`, `airpod`, `airtag`, `accessory`).
Social media links are placeholders (`#`); put your real pages there in `index.html`'s footer code in `js/app.js`.

## Important: what is demo-only
- **Data is stored in the browser (localStorage).** Only the person using a given browser sees its
  orders, so an admin and a customer on different devices will not see each other's data. A real
  store needs a server database — the workflow suggests Next.js + MongoDB or React + PHP + MySQL.
- **Payments are not real.** ABA, KHQR and bank details are placeholders. Real KHQR/ABA needs an
  approved payment provider and a backend to confirm payments.
- **Prices, phones and account details are sample data.**
- Passwords are hashed in the browser (SHA-256) for demonstration only. Real sites hash on the server.

## Edit the content
- Products, categories and sample orders: `js/data.js` (or use the admin dashboard, which saves to the browser).
- Store name, address, phone, hours: `MS.STORE` in `js/data.js`.
- Delivery fees and free-delivery threshold: `MS.DELIVERY`, `MS.FREE_DELIVERY_OVER` in `js/data.js`.
- Bank / ABA account shown at checkout: `payPanel()` in `js/app.js`.
- Colours and look: the variables at the top of `css/store.css`.
- Reset everything to the sample data: Admin → "Reset demo data".

## Files
- `index.html` — page shell
- `css/store.css` — glass / aurora styling, responsive layout
- `js/util.js` — helpers, icons, toasts, modal, SHA-256
- `js/art.js` — drawn phone illustrations (no photos needed)
- `js/data.js` — constants and sample data
- `js/db.js` — data layer: auth, cart, orders, stock
- `js/app.js` — storefront pages, router, checkout
- `js/admin.js` — admin dashboard
- `js/bg.js` — aurora background (WebGL, same as your portfolio)
- `fonts/` — Sora heading font (SIL Open Font License)
