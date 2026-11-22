# Panchalii — Saree Store (Next.js + Razorpay)

A custom storefront for Panchalii sarees: home page, shop with filters, product pages, bag, checkout and Razorpay payments.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Plain CSS (`app/globals.css`) with CSS variables |
| Fonts | `next/font/google`: Playfair Display, Cormorant Garamond, Montserrat, Great Vibes |
| Cart | React context + `localStorage` (`lib/cart.tsx`) |
| Payments | Razorpay Standard Checkout + Orders API, called directly over REST (no SDK) |
| Hosting | Netlify or Vercel (both run Next.js API routes) |

## Run it locally

Needs Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local    # then paste your Razorpay TEST keys
npm run dev                   # http://localhost:3000
```

## How payment works

1. **Checkout page** sends the bag (`slug` + `qty` only) and the delivery address to `POST /api/checkout`.
2. **Server** looks up every price in `lib/products.ts` (the browser never sets the amount), adds shipping, and creates a Razorpay order for the total in paise. The customer details and items are saved in the order's `notes`.
3. **Browser** opens Razorpay Checkout with that `order_id`. The customer pays by UPI, card, netbanking or wallet.
4. **Server** checks the payment at `POST /api/checkout/verify` using HMAC-SHA256 of `order_id|payment_id` with your key secret. Only then does the customer see the success page.
5. **Webhook** at `POST /api/razorpay/webhook` records `payment.captured`, `order.paid` and `payment.failed` events, so you don't miss an order if the customer closes the tab.

## Project map

```
app/
  page.tsx                  Home (hero, arches, explore, best sellers, handloom, new arrivals, story)
  sarees/page.tsx           Shop with filters (collection, occasion, price, colour) + sort
  sarees/[slug]/page.tsx    Product page
  cart/page.tsx             Bag
  checkout/page.tsx         Address form + Razorpay Checkout
  order/success/page.tsx    Thank-you page
  api/checkout/route.ts            Creates the Razorpay order (prices from server)
  api/checkout/verify/route.ts     Verifies payment signature
  api/razorpay/webhook/route.ts    Razorpay webhook receiver
components/                 Header (mega menu + mobile drawer), Footer, ProductCard, filters, gallery…
lib/
  products.ts               Catalog — edit your sarees here
  config.ts                 Shipping fee, free-shipping threshold, support contacts
  pricing.ts                Totals + ₹ formatting (shared by bag and server)
  razorpay.ts               Server-only Razorpay helpers
  orders.ts                 Order saving (TODO: connect a database)
public/images/              Your photos (see list below)
```

## Add your sarees and photos

- **Products:** edit `lib/products.ts`. Each saree has a `slug`, name, category, price (₹), optional MRP, images, details and stock flag.
- **Photos:** put files in `public/images/`. Missing images show a dark placeholder with the expected path.
  - Home: `hero.jpg`, `arch-silk.jpg`, `arch-handloom.jpg`, `arch-designer.jpg`, `explore-bridal.jpg`, `explore-kalamkari.jpg`, `bs-embroidered.jpg`, `bs-kanjivaram.jpg`, `bs-printed.jpg`, `bs-banarasi.jpg`, `handloom-lead.jpg`, `hl-ikat.jpg`, `hl-chanderi.jpg`, `hl-cotton.jpg`, `story.jpg`, `menu-promo.jpg`
  - Shop banners: `banner-all.jpg`, `banner-silk.jpg`, `banner-handloom.jpg`, `banner-designer.jpg`
  - Products: `public/images/products/…`, matching the paths in `lib/products.ts`
- **Shipping rules:** `lib/config.ts`.

## Test payments

With `rzp_test_` keys, use Razorpay's test cards or test UPI ID from their docs (razorpay.com/docs → Test Card Details). No real money moves.

## Deploy on Netlify

1. Push this folder to a GitHub repo.
2. Netlify → Add new site → Import from Git. It detects Next.js automatically.
3. Site settings → Environment variables: add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and `NEXT_PUBLIC_SITE_URL`.
4. Razorpay Dashboard → Webhooks → add `https://YOUR-DOMAIN/api/razorpay/webhook` with the same secret and the events `payment.captured`, `payment.failed`, `order.paid`.

## Before going live

- [ ] Connect a database in `lib/orders.ts` (Supabase/Postgres works well) so orders are stored and stock can be reduced.
- [ ] Send order-confirmation emails (e.g. Resend or Brevo) from the verify route or webhook.
- [ ] Add real Privacy, Terms, Shipping and Refund policy pages. Razorpay asks for these during account activation.
- [ ] Complete Razorpay KYC and switch to `rzp_live_` keys.
- [ ] Replace the sample products, prices and photos.
- [ ] Connect the newsletter form to your email tool (`components/Newsletter.tsx`).
