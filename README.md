# Billsy — Billing & Barcode App for Small Businesses

Scan barcodes, bill customers, generate receipts, and share them on WhatsApp —
all from a phone. Multi-business login, Cloudinary product photos, and Razorpay
subscriptions are built in.

## Stack
- **Next.js 15** (App Router, TypeScript, Tailwind v4)
- **MongoDB** (Mongoose) — business accounts, products, orders
- **Cloudinary** — product photo storage
- **Razorpay** — Pro plan subscriptions (₹499/mo)
- **NextAuth v5** — credentials login, one account per business
- **html5-qrcode** — live camera barcode scanning
- **JsBarcode** — generates a real, scannable CODE128 barcode per product and per receipt

## 1. Install dependencies
```bash
npm install
```

## 2. Set up environment variables
Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → create a free cluster → "Connect" → driver connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your production URL when deployed |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | [Cloudinary dashboard](https://cloudinary.com/console) → Account Details |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | [Razorpay dashboard](https://dashboard.razorpay.com/) → Settings → API Keys (use test keys first) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` (exposed to the browser for checkout) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your real domain in production (used for SEO tags and shareable receipt links) |

## 3. Run locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

## 4. Try the flow
1. Go to `/register` and create a business account (free plan, up to 30 products).
2. Go to **Products** → add a product with a photo. Billsy generates its barcode automatically.
3. Go to **Bill now** → tap **Scan barcode** (allow camera access) or search a product by name, build the cart, enter the customer's WhatsApp number, and tap **Generate receipt**.
4. Tap **Share on WhatsApp** — it opens WhatsApp with the receipt link pre-filled, ready to send.
5. Go to **Plan** to test the Razorpay Pro upgrade (use Razorpay's test card `4111 1111 1111 1111`, any future expiry, any CVV).

## Project structure
```
src/
  app/
    page.tsx              → marketing landing page
    login/ register/      → auth pages
    dashboard/             → protected app (overview, products, billing, orders, subscription)
    receipt/[id]/          → public shareable receipt page (no login)
    api/                   → auth, products, orders, upload, subscription routes
  components/               → BarcodeCanvas, BarcodeScanner, ProductManager, BillingCounter, DashboardNav
  models/                    → Business, Product, Order (Mongoose)
  lib/                       → mongodb, cloudinary, razorpay, auth, utils
```

## Notes & next steps for production
- **Multi-business login** is already supported — each business is its own account/tenant; products, receipts, and plans are scoped per business.
- **Receipt sharing** currently uses a free WhatsApp `wa.me` deep link (no API key needed). To send actual SMS instead/also, plug a provider like Twilio into `src/app/api/orders/route.ts` after an order is created.
- **Free plan limit** (30 products) is enforced in `src/app/api/products/route.ts` — change `FREE_PRODUCT_LIMIT` to adjust.
- **Razorpay** currently activates Pro for 30 days on successful payment. For recurring auto-renewal, swap the one-time Order API for Razorpay Subscriptions and add a webhook handler.
- Deploy easily to **Vercel** (recommended for Next.js) — add the same environment variables in the Vercel project settings.
