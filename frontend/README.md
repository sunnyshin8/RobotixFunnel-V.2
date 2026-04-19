# RobotixFunnel — Storefront

> Part of the **RobotixFunnel** monorepo. Public-facing e-commerce storefront for the platform.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## Overview

The storefront is a **Next.js 15** application (App Router) serving as the customer-facing side of the RobotixFunnel platform. It connects to the Platform Backend at port 9000 and is served at port 8000. Static assets (product images, brand logos) are delivered via `cdn.mypni.com`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (Turbopack in dev) |
| UI Library | React 19 |
| Styling | Tailwind CSS + Radix UI |
| Language | TypeScript 5 |
| Payments | Stripe |
| Auth | JWT + bcryptjs |
| Database client | `pg` (PostgreSQL direct) |
| Image CDN | `cdn.mypni.com` |

## Features

- **Product Catalog** — browsing, filtering, search
- **Product Detail Pages** — images, variants, pricing, tiered pricing
- **Cart & Checkout** — full cart flow with Stripe payment integration
- **Customer Accounts** — registration, login, order history
- **Multi-region / i18n** — country-code based routing (`/[countryCode]/...`)
- **Server Components & Server Actions** — Next.js 15 App Router patterns
- **Static Pre-Rendering + ISR** — fast page loads with on-demand revalidation
- **SEO** — sitemap, metadata, OpenGraph

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── [countryCode]/     # Country-based routing
│   ├── components/ui/         # Shared UI components (Radix-based)
│   ├── lib/
│   │   ├── config.ts          # Site configuration
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── i18n/              # Internationalisation helpers
│   │   └── util/              # Utility functions
│   ├── modules/               # Feature modules (cart, account, checkout…)
│   └── styles/                # Global CSS
├── public/
│   ├── brands/                # Brand logo assets
│   └── products/              # Product image assets
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- Platform Backend running on port 9000

### Install

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_WAREHOUSE_URL=http://localhost:4000
NEXT_PUBLIC_DEFAULT_REGION=ro

# Stripe
NEXT_PUBLIC_STRIPE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Revalidation
REVALIDATE_SECRET=your_revalidate_secret
```

### Run

```bash
# Development (Turbopack, port 8000)
npm run dev

# Production build
npm run build
npm start
```

The storefront runs at **http://localhost:8000**.

## Image CDN

Product images and brand logos are served through `cdn.mypni.com`. This domain is whitelisted in `next.config.js` for Next.js `<Image>` optimization. The CDN serves `avif`/`webp` formats with 24-hour cache TTL.

## Payment Integration

Stripe is configured for checkout. Set `NEXT_PUBLIC_STRIPE_KEY` and `STRIPE_SECRET_KEY` in `.env.local`. The checkout flow uses Stripe Elements for card capture.

## Related Modules

| Module | Path | Port |
|---|---|---|
| Admin Panel | `/Admin01` | 3001 |
| Platform Backend | `/backend-v2` | 9000 |
| Warehouse Orchestrator | `/warehouse-orchestrator` | 4000 |

See the root [README](../README.md) for full platform architecture.
