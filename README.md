# MrNobody — E-commerce Store

React + Vite + Tailwind storefront and private admin dashboard, backed by Supabase (Postgres, Auth, Storage) and Netlify serverless functions. Prices in PKR, Cash on Delivery checkout, guest ordering.

```
src/
  pages/            Home, Shop, ProductDetails, Cart, Checkout, OrderConfirmation, Wishlist, ContentPage
  components/       layout/ homepage/ products/ cart/ ui/
  admin/            AdminLogin, Dashboard, Products, ProductEditor, Categories, Inventory,
                    Orders, OrderDetail, Customers, Banners, Promotions, Content, Settings
  contexts/         Store (settings/categories/banners), Cart, Wishlist
  services/         catalog.js — all public data access
  data/demo.js      demo catalogue (source for supabase/seed.sql)
netlify/functions/  place-order.mjs (server-side orders), sitemap.mjs
supabase/
  migrations/       schema + RLS + storage + place_order()/admin_stats() functions
  seed.sql          8 categories, 26 demo products, banners, settings, pages
  admin-setup.sql   links your auth user to the admin role
```

## How security works

- The browser only ever has the **anon** key. Every table has **Row Level Security**.
- Public visitors can read active products, visible categories, active banners, settings and published pages — nothing else. They can submit a review (held for approval) and a newsletter email.
- All store writes require `public.is_admin()` — true only for users listed in `admin_users`. That table has **no write policy**, so it can only be changed from the Supabase SQL editor.
- Orders are created only by `public.place_order()`, which only the **service role** may execute. The Netlify function `place-order` calls it with `SUPABASE_SERVICE_ROLE_KEY` (server-side env var). The function recalculates prices from the database, locks variant rows, rejects overselling, applies promo codes and the configured delivery fee, then deducts stock — all in one transaction.
- Cancelling or returning an order restores stock automatically and removes it from revenue.
- No password exists anywhere in this code. The admin account lives in Supabase Auth (bcrypt-hashed).

## 1. Supabase setup

1. Create a project at supabase.com.
2. **SQL Editor** → run, in order:
   1. `supabase/migrations/20261021000001_schema.sql`
   2. `supabase/seed.sql` (demo content — optional but recommended to start)
3. **Authentication → Providers → Email**: turn **off** “Allow new users to sign up” (only you need an account).
4. **Authentication → URL Configuration**: set Site URL to your Netlify URL and add `https://YOUR-SITE/admin/reset-password` to Redirect URLs.

### Create the admin account (do this in the dashboard, not in code)

1. **Authentication → Users → Add user → Create new user**
   - Email: `muhammadeanas5@gmail.com`
   - Password: your initial password · tick **Auto Confirm User**
2. **SQL Editor** → run `supabase/admin-setup.sql`. It should return one row.
3. After your first login, go to **Admin → Settings → Account** and change to a strong password (12+ characters, mixed case, a number). Do this before launch.

## 2. Environment variables

Supabase → Project Settings → API.

| Variable | Where | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Netlify (and local `.env`) | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify (and local `.env`) | `anon` public key |
| `SUPABASE_URL` | Netlify only | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Netlify only — secret** | `service_role` key |
| `SITE_URL` | Netlify | e.g. `https://mrnobody.netlify.app` |

Never prefix the service role key with `VITE_` — anything with `VITE_` is shipped to browsers. `.env` is git-ignored.

Without `VITE_SUPABASE_*` the site runs in **demo preview**: sample products show, checkout is disabled, and `/admin` shows a setup screen instead of a login.

## 3. Run locally

```bash
npm install
cp .env.example .env      # fill in the VITE_ values
npm run dev               # storefront + admin at http://localhost:5173
```

To test checkout locally you need the serverless function too:

```bash
npm i -g netlify-cli
netlify dev               # serves the app + /api/place-order, reads .env
```

## 4. Deploy (GitHub → Netlify)

1. Push this folder to a new GitHub repository.
2. Netlify → **Add new site → Import an existing project** → choose the repo.
3. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`, functions `netlify/functions`).
4. Add the environment variables above under **Site configuration → Environment variables**, then **Deploys → Trigger deploy**.
5. `netlify.toml` includes the SPA fallback, so refreshing `/shop`, `/product/…` or `/admin/login` works.

## 5. Day-to-day use

- **Products**: Admin → Products → Add product. Upload images (compressed in-browser, stored in Supabase Storage), set prices, generate size/colour variants, set stock per variant, tick Featured / New Arrival / Best Seller, set Active.
- **Demo content** is flagged `DEMO`. Remove it all with the “Remove demo products” button, or edit a demo product (saving it converts it to a real product).
- **Homepage**: Admin → Homepage Banners (hero slider, the 4-card category collage, promo banner). Section order/visibility and the trust row: Settings → Homepage.
- **Orders**: Admin → Orders. Update status, courier, tracking, notes; print invoice; export CSV.
- **WhatsApp**: Settings → Contact & Social. Enter your real number and enable the button.
- **Top Rated** fills from approved customer reviews (Website Content → Reviews). Stars are never shown without real reviews.

## 6. Test checklist

| # | Test | How |
|---|---|---|
| 1 | Product creation | Admin → add product with name, price, stock, image, Active → appears in /shop |
| 2 | Persistence | Reload / open in another browser — product still there |
| 3 | Editing | Change price + photo → storefront shows new values |
| 4 | COD order | Add to cart → checkout → order number shown → appears in Admin → Orders, stock reduced |
| 5 | Admin security | Visit /admin logged out → redirected to login. Sign in with a non-admin account → refused |
| 6 | Stock validation | Set a variant to stock 1, try ordering 2 → rejected with “Only 1 left…” |
| 7 | Deployment routing | Open /shop, /product/<slug>, /admin/login directly and refresh — no 404 |
| 8 | Mobile | Phone width: menu drawer, hero, collage, product grid, cart drawer, checkout |

To check RLS directly, run in the browser console on the live site (should fail / return nothing):
```js
await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }).then(r => r.json()) // []
```

## Notes

- Demo photos are loaded from Unsplash (free licence). Replace them with your own product photography from the admin.
- To add an online payment gateway later, add a method in `PAYMENT_METHODS` (`src/pages/Checkout.jsx`) and handle it in `netlify/functions/place-order.mjs`; orders already store `payment_method` and `payment_status`.
- Regenerate `supabase/seed.sql` after editing `src/data/demo.js` with `npm run seed:sql`.
