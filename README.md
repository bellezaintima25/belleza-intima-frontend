# Belleza Íntima — Frontend

Next.js 14 storefront + backoffice for the Belleza Íntima online shop.

## Stack

- **Next.js 14** (App Router) — React framework
- **TypeScript** — type safety
- **Tailwind CSS** — styling (pink/rose primary palette)
- **Heroicons** — icons
- **sharp** — image optimization (install for faster dev performance)

## Quick start

```powershell
cd belleza-intima-frontend

# 1. Install dependencies
npm install
npm install sharp   # optional but recommended — much faster image optimization

# 2. Configure environment
copy .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000  (default, change if backend port differs)

# 3. Start dev server
npm run dev
```

Or double-click **start-frontend.bat** (Windows shortcut in the projects root).

- Storefront: http://localhost:3000
- Backoffice: http://localhost:3000/admin

> The backend must be running first at http://localhost:8000

## Project structure

```
public/
  images/              # Product images served statically

src/
  app/
    page.tsx           # Catalog (home) — category filter + product grid
    products/[id]/     # Product detail — variant selector, image gallery
    checkout/          # Checkout form → creates order → opens WhatsApp
    checkout/success/  # Order confirmation page
    admin/
      page.tsx         # Dashboard — stats + low stock alerts
      layout.tsx       # Admin sidebar layout
      products/
        page.tsx       # Products table with edit/delete
        new/page.tsx   # Create new product
        [id]/page.tsx  # Edit product — info, variants, images
      orders/
        page.tsx       # Orders list with expandable detail rows

  components/
    Navbar.tsx         # Sticky top nav with cart badge
    ProductCard.tsx    # Product grid card (with priority LCP support)
    CartDrawer.tsx     # Slide-in cart sidebar
    admin/
      ProductForm.tsx  # Reusable create/edit product form

  context/
    CartContext.tsx    # Cart state (React context + useReducer)

  lib/
    api.ts             # Storefront API client + image helpers
    adminApi.ts        # Admin API client
    format.ts          # COP price formatter + category labels
```

## How the WhatsApp checkout works

1. Customer selects products, size and color, adds to cart
2. Fills name + phone in `/checkout`
3. Frontend calls `POST /orders` → order saved in backend
4. Frontend calls `POST /orders/{id}/send-whatsapp` → backend builds pre-filled message
5. WhatsApp opens in new tab with the full cart ready to send
6. Cart clears, customer lands on `/checkout/success`

## Admin backoffice (`/admin`)

| Page | Path | What you can do |
|---|---|---|
| Dashboard | `/admin` | See total products, stock, low-stock alerts, order counts |
| Products | `/admin/products` | List all products, quick edit/delete |
| Edit product | `/admin/products/{id}` | Edit info, manage variants + stock, upload images |
| New product | `/admin/products/new` | Create product (add variants + images after saving) |
| Orders | `/admin/orders` | View all orders with item breakdown and totals |

### Managing images

- Each product can have multiple images
- Each image can be linked to a **color** — the storefront automatically shows the right photo when a customer picks a color
- Images without a color tag act as fallback for any color
- Upload new images from the edit product page — type the color first, then click the `+` card

### Managing stock

- Edit stock inline in the variants table — change the number and click away (saves automatically)
- Low stock warning (⚠️) appears when stock < 2
- Dashboard shows total low-stock variants at a glance

## Image naming convention

When adding images manually to `public/images/`:
```
{CODE}-{Color}-{N}.jpeg
# examples:
ST001-Vino-tinto-1.jpeg
CT004-Rosa-1.jpeg
ST009-Azul-electrico-1.jpeg
```

## Deployment (Vercel — free tier)

1. Push repo to GitHub
2. Import on [vercel.com](https://vercel.com) → select `belleza-intima-frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```
4. Deploy — Vercel auto-detects Next.js and handles everything

> Note: images in `public/images/` are committed to the repo and served by Vercel's CDN. For production with frequent image changes, move to Cloudflare R2 or similar and serve via URL.

## TODO / future improvements

- [ ] Add password protection to `/admin` (Next.js middleware + env secret)
- [ ] Move product images to cloud storage (Cloudflare R2 / S3)
- [ ] Add product search bar
- [ ] Show "agotado" badge on product cards when all variants are out of stock
- [ ] Send order confirmation email/SMS to customer
- [ ] Analytics: track which products get viewed most
