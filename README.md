# 🤖 RobotixFunnel : AI-Powered Robotised E-Commerce Platform


**RobotixFunnel** is a full-stack, AI-powered e-commerce platform with a real-time **Digital Twin Warehouse** featuring autonomous AGV robots, an **AI chatbot** shopping assistant, and a complete **admin panel** — built for the Romanian & European electronics market.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                              │
│                                                                     │
│   🛒 Storefront (8000)    🔧 Admin Panel (3001)    🏭 Dashboard    │
│   Next.js 15 + React 19   Next.js 16 + React 19    Three.js 3D    │
│   Tailwind CSS             Tailwind CSS 4            WebGL + WS    │
└──────────┬───────────────────────┬───────────────────────┬──────────┘
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  Platform Backend   │  │  AI Chat Service   │  │ Warehouse Orch.    │
│  Fastify 5 (:9000)  │  │  FastAPI (:5050)   │  │ Express (:4000)    │
│  Drizzle ORM        │  │  Gemini 3 Flash    │  │ Socket.IO + Gemini │
│  Stripe Payments    │  │  Product Search    │  │ A* Pathfinding     │
│  JWT + Google OAuth  │  │  Knowledge Base    │  │ 4 AGV Robots       │
└─────────┬───────────┘  └────────┬───────────┘  └─────────┬──────────┘
          │                       │                         │
          ▼                       ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
│                                                                     │
│   🐘 PostgreSQL (27 tables)       🔴 Redis (cache)                 │
│   Products, Orders, Invoices       Session, API cache              │
│   Customers, Carts, Blog                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Project Structure

```
RobotixFunnel/
├── frontend/                 # 🛒 Customer Storefront (Next.js 15, port 8000)
├── backend-v2/               # ⚙️ Platform Backend API (Fastify 5, port 9000)
├── Admin01/                  # 🔧 Admin Panel (Next.js 16, port 3001)
├── warehouse-orchestrator/   # 🏭 Digital Twin Warehouse (Express, port 4000)
├── ai-chat-service/          # 🤖 AI Chatbot (FastAPI, port 5050)
├── architecture.md           # Architecture documentation
└── README.md                 # This file
```

---

## 🛒 Frontend: Customer Storefront

**Tech**: Next.js 15.3 · React 19 · Tailwind CSS · Turbopack · TypeScript  
**Port**: `8000`  
**Package**: `robotixfunnel-storefront`

The storefront is a high-performance SSR/SSG e-commerce frontend with full shopping experience.

### Key Features
- **Server-Side Rendering** with Next.js App Router and Turbopack
- **Stripe Payment Integration** — Credit card, iDEAL, and more
- **Google OAuth** — One-click customer login
- **AI Chatbot Widget** — Embedded Gemini-powered shopping assistant
- **Multi-region Support** — Country-code based routing (`/ro/`, `/us/`)
- **Bilingual URLs** — English + Romanian routes (`/shipping` + `/livrare`)
- **Image Optimization** — AVIF/WebP with CDN (`cdn.mypni.com`)
- **Product Search & Filtering** — By category, brand, price, with sorting
- **Responsive Design** — Mobile-first Tailwind CSS

### Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with featured products & categories |
| `/store` | Product catalog with search, filters & sorting |
| `/products/[handle]` | Product detail page |
| `/categories/[...handle]` | Category browsing |
| `/collections/[handle]` | Product collections |
| `/brands` | Brand listing |
| `/cart` | Shopping cart |
| `/checkout` | Multi-step checkout flow |
| `/payment` | Payment processing (Stripe) |
| `/account` | Customer dashboard, orders, profile |
| `/order/[id]` | Order tracking & details |
| `/blog` | Blog articles |
| `/about` `/despre-noi` | About us (EN/RO) |
| `/shipping` `/livrare` | Shipping policy (EN/RO) |
| `/returns` `/retur` | Return policy (EN/RO) |
| `/warranty` `/garantie` | Warranty info (EN/RO) |
| `/terms` `/termeni` | Terms & conditions (EN/RO) |
| `/privacy` `/confidentialitate` | Privacy policy (EN/RO) |
| `/contact` | Contact form |

### Frontend API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/auth/google` | Google OAuth callback |
| `/api/cart` | Cart operations |
| `/api/products` | Product data (with specs) |
| `/api/blog` | Blog content |
| `/api/tracking` | Order tracking |
| `/api/warehouse` | Warehouse status proxy |
| `/api/revalidate` | ISR cache revalidation |

### Scripts
```bash
yarn dev          # Start dev server (port 8000, Turbopack)
yarn build        # Production build
yarn start        # Production server
yarn lint         # ESLint
yarn analyze      # Bundle analyzer
```

---

## ⚙️ Backend : Platform API

**Tech**: Fastify 5 · Drizzle ORM · PostgreSQL · Redis · Stripe · TypeScript  
**Port**: `9000`  
**Architecture**: Clean Architecture (Domain → Application → Infrastructure → Presentation)

The backend follows **Clean Architecture** with dependency injection, providing RESTful APIs for the storefront, admin panel, and warehouse.

### Key Features
- **Clean Architecture** — Domain entities, use cases, repository interfaces
- **Stripe Payments** — Full payment lifecycle with webhooks
- **B2B Supplier Integration** — PNI/MyPNI product sync & scraping
- **Tiered Pricing** — B2B volume-based pricing system
- **JWT Authentication** — Stateless auth with refresh tokens
- **Redis Caching** — High-performance API response cache
- **Swagger UI** — Auto-generated API documentation
- **Rate Limiting** — Per-route rate limiting
- **Structured Logging** — Pino logger with pretty-print

### API Endpoints

#### Store APIs (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/store/products` | List products (with search, filters, pagination) |
| GET | `/store/products/:id` | Product detail |
| GET | `/store/product-categories` | Category tree |
| GET | `/store/collections` | Product collections |
| GET | `/store/regions` | Available regions & countries |
| POST | `/store/carts` | Create cart |
| POST | `/store/carts/:id/line-items` | Add to cart |
| GET | `/store/customers/me` | Current customer profile |
| POST | `/store/orders` | Place order |
| GET | `/store/orders` | Customer order history |

#### Admin APIs (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/admin/products` | Product management |
| CRUD | `/admin/product-categories` | Category management |
| CRUD | `/admin/orders` | Order management |
| CRUD | `/admin/customers` | Customer management |
| CRUD | `/admin/invoices` | Invoice management |
| CRUD | `/admin/promotions` | Promo code management |
| POST | `/admin/pni/sync` | Sync B2B supplier products |

#### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/register` | Customer registration |
| POST | `/webhooks/stripe` | Stripe webhook handler |
| GET | `/health` | Health check |

### Database Schema (27 Tables)

| Table | Purpose |
|-------|---------|
| `products` | Product catalog (title, description, price tiers, B2B data) |
| `product_variants` | SKU, inventory, pricing (RON bani) |
| `categories` | Hierarchical categories (parent_id) |
| `brands` | Product brands |
| `orders` | Full order lifecycle (9 statuses) |
| `order_items` | Order line items |
| `carts` / `cart_items` | Shopping carts |
| `customers` | Accounts (B2B: CUI, reg number) |
| `customer_addresses` | Shipping & billing addresses |
| `invoices` / `invoice_items` | Romanian-format invoices (RON) |
| `promotions` | Promo codes (%, fixed, date ranges, usage limits) |
| `payment_collections` / `payment_sessions` | Stripe payment records |
| `regions` / `region_countries` | Geographic regions with tax rates |
| `collections` / `collection_products` | Product collections |
| `blog_posts` / `blog_categories` | Blog CMS |
| `admin_users` | Admin accounts |
| `system_config` | Key-value system configuration |
| `platform_log` | Structured logging |

### Scripts
```bash
npm run dev           # Start dev server (tsx watch, port 9000)
npm run build         # TypeScript compile
npm run start         # Production server
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to DB
npm run db:seed       # Seed initial data
npm run db:studio     # Drizzle Studio (DB GUI)
npm run test          # Run tests (Vitest)
```

---

## 🔧 Admin Panel

**Tech**: Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript  
**Port**: `3001`  
**Base Path**: `/app`

Full-featured admin dashboard for managing the entire e-commerce operation.

### Key Features
- **Product Management** — CRUD, bulk import, B2B supplier sync
- **Order Management** — View, process, fulfill orders with status tracking
- **Customer Management** — Customer profiles, B2B company data
- **Invoicing (Facturare)** — Romanian-format e-invoices (e-Factura)
- **Marketing Tools** — Email campaigns, promotions, SEO management
- **Blog CMS** — Content management with AI blog generation
- **Media Library** — Upload & manage product images
- **Supplier Integration** — PNI/MyPNI import & API connectivity
- **Google Ads** — Google advertising integration
- **Security Settings** — User roles, access control

### Admin Pages

| Route | Description |
|-------|-------------|
| `/app/dashboard` | Overview stats & analytics |
| `/app/products` | Product catalog management |
| `/app/products/new` | Create new product |
| `/app/orders` | Order processing & fulfillment |
| `/app/customers` | Customer database |
| `/app/inventory` | Stock management |
| `/app/promotions` | Discount codes & promotions |
| `/app/facturare` | Romanian invoice management |
| `/app/blog` | Blog post editor |
| `/app/cms` | Static page management |
| `/app/seo` | SEO settings & sitemap |
| `/app/email` | Email template manager |
| `/app/marketing` | Marketing campaigns |
| `/app/media` | Media library |
| `/app/settings` | Store configuration |
| `/app/magazin/furnizori` | Supplier management |
| `/app/magazin/api-furnizori` | B2B API integration |
| `/app/google/ads` | Google Ads dashboard |
| `/app/utilizatori` | User management |
| `/app/securitate` | Security settings |

### Scripts
```bash
npm run dev       # Start admin panel (port 3001)
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

---

## 🏭 Warehouse Orchestrator — Digital Twin

**Tech**: Express.js · Socket.IO · Three.js · Google Gemini AI · TypeScript  
**Port**: `4000`

A real-time **Digital Twin Warehouse** with autonomous AGV robot simulation, AI-powered route optimization, and 3D WebGL visualization.

### Key Features
- **3D Warehouse Visualization** — Three.js WebGL rendering of warehouse floor
- **4 Autonomous AGV Robots** — Octobot, Marcobot, Cyberbot, Vegbot
- **A* Pathfinding** — Optimal route calculation for robots on 60×40 grid
- **Real-time WebSocket Streaming** — Live robot positions via Socket.IO
- **AI Route Optimization** — Gemini AI optimizes picking routes
- **AI Copilot** — Natural language Q&A about warehouse state
- **AI Anomaly Detection** — Detects stuck robots, low battery, queue buildup
- **Voice Commands** — Speech-to-text via Gemini for robot control
- **Real Stock Integration** — Loads actual product inventory from PostgreSQL
- **Multi-stage Fulfillment** — Pick → Transport → Pack → Ship → Complete
- **Demo Mode** — Auto-generates orders for demonstration
- **Backend Callback** — Notifies platform when orders are fulfilled

### Warehouse Layout

```
┌──────────────────────────────────────────────────────────────┐
│ 📦 RECEIVING    │ Radio    │ Surveillance │ Electrical │ DIY │
│                 │ Stations │  & Video     │ Electronics│     │
├─────────────────┼──────────┼──────────────┼────────────┤     │
│                 │ Security │ Smart Home   │ Car        │     │
│   Aisles        │ Systems  │              │ Electronics│     │
│   (Robot Paths) ├──────────┼──────────────┼────────────┤     │
│                 │ Photo    │ Home &       │ Health &   │     │
│ 🤖 Octobot     │ Video    │ Garden       │ Wellness   │     │
│ 🤖 Marcobot    │ Audio    │              │            │     │
│ 🤖 Cyberbot    ├──────────┼──────────────┼────────────┤     │
│ 🤖 Vegbot      │ Phones & │ Miscellaneous│            │     │
│                 │ Tablets  │              │            │     │
├─────────────────┼──────────┴──────────────┴────────────┘     │
│ 📦 PACKING      │                          🔋 CHARGING      │
│                  │                                           │
│ 🚚 SHIPPING     │                                           │
└──────────────────────────────────────────────────────────────┘
```

**Grid**: 60 × 40 cells · **16 Zones** (12 category + 4 functional)  
**Robot States**: IDLE → MOVING → PICKING → CARRYING → PACKING → CHARGING

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (uptime, Gemini status, stock) |
| GET | `/api/warehouse/state` | Full warehouse state snapshot |
| GET | `/api/warehouse/metrics` | Performance metrics |
| POST | `/api/warehouse/order` | Submit order for robot fulfillment |
| GET | `/api/warehouse/order/:id` | Track order fulfillment status |
| GET | `/api/warehouse/stock` | Stock by zone |
| POST | `/api/warehouse/stock/reload` | Reload stock from database |
| POST | `/api/ai/copilot` | Ask AI about warehouse (natural language) |
| GET | `/api/ai/report` | AI-generated performance report |
| GET | `/api/ai/anomalies` | AI anomaly detection |
| POST | `/api/ai/transcribe` | Voice command transcription |

### WebSocket Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `warehouseState` | Server→Client | Real-time state broadcast (every 500ms) |
| `newOrder` | Server→Client | New order received |
| `fulfillmentCreated` | Server→Client | Order fulfilled by robots |
| `anomalies` | Server→Client | AI anomaly alerts |
| `copilotQuestion` | Client→Server | Ask AI copilot |
| `copilotAnswer` | Server→Client | AI copilot response |
| `addDemoOrder` | Client→Server | Trigger demo order |
| `moveRobot` | Client→Server | Joystick robot control |
| `sendRobotTo` | Client→Server | Send robot to coordinates |
| `sendRobotToZone` | Client→Server | Send robot to named zone |
| `aiRobotCommand` | Client→Server | Natural language robot command |
| `optimizeRoute` | Client→Server | AI route optimization |

### Scripts
```bash
npm run dev       # Start with hot reload (tsx watch, port 4000)
npm run build     # Compile TypeScript
npm run start     # Production server
```

---

## 🤖 AI Chat Service : Shopping Assistant

**Tech**: FastAPI · Google Gemini (gemini-3-flash-preview) · Python  
**Port**: `5050`

An AI-powered chatbot that helps customers find products, answers store questions, and provides personalized recommendations.

### Key Features
- **Gemini 3 Flash Preview** — Latest Google AI model for fast responses
- **Product Search** — Searches backend catalog and recommends products
- **Knowledge Base** — Store policies, categories, shipping, returns
- **Product Cards** — Returns structured product data for UI rendering
- **Conversational AI** — Natural greetings, store Q&A, product queries
- **Template Fallback** — Graceful degradation when AI is unavailable
- **CORS Enabled** — Cross-origin support for frontend widget

### How It Works

```
User Message → is_conversational?
                ├── YES → Gemini AI response (store knowledge)
                └── NO  → Extract keywords
                          → Search backend (/store/products?q=...)
                          → Gemini AI crafts response with product context
                          → Return response + ProductCard[] for UI
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (AI enabled, model name) |
| POST | `/chat` | Chat endpoint |

**POST `/chat` Request:**
```json
{
  "message": "show me LED strips",
  "history": []
}
```

**Response:**
```json
{
  "response": "Check out these awesome LED strips! ...",
  "products": [
    {
      "id": "prod_123",
      "title": "SK9822 LED Strip 1m 60px",
      "handle": "sk9822-led-strip",
      "thumbnail": "https://cdn.mypni.com/...",
      "price": "45.99",
      "currency": "RON"
    }
  ]
}
```

### Knowledge Base Categories

| # | Category | Handle |
|---|----------|--------|
| 1 | Radio Stations | `statii-radio` |
| 2 | Video Surveillance | `sisteme-supraveghere-video` |
| 3 | Electrical & Electronics | `electrice-si-electronice` |
| 4 | Security Systems | `sisteme-securitate` |
| 5 | Smart Home | `smart-home` |
| 6 | Car Electronics | `electronice-auto` |
| 7 | Photo Video Audio | `foto-video-audio` |
| 8 | Home & Garden | `casa-si-gradina` |
| 9 | Health & Wellness | `sanatate-si-wellness` |
| 10 | Phones & Tablets | `telefoane-si-tablete` |
| 11 | DIY & Tools | `bricolaj-si-scule` |
| 12 | Miscellaneous | `diverse` |

### Setup
```bash
pip install -r requirements.txt
python main.py    # Start on port 5050
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **Python** ≥ 3.10
- **PostgreSQL** 16
- **Redis** 7
- **Yarn** 4.x (for frontend)

### 1. Clone the Repository
```bash
git clone https://github.com/sunnyshin8/RobotixFunnel.git
cd RobotixFunnel
```

### 2. Set Up Environment Variables

Create `.env` files in each service directory:

**`backend-v2/.env`**
```env
PORT=9000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgresql://robotix:password@localhost:5432/robotixfunnel
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAIL=admin@robotixfunnel.com
ADMIN_PASSWORD=your-admin-password
WAREHOUSE_ORCHESTRATOR_URL=http://localhost:4000
```

**`frontend/.env`**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_WAREHOUSE_URL=http://localhost:4000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=ro
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_AI_CHAT_URL=http://localhost:5050
JWT_SECRET=your-jwt-secret
DATABASE_PASSWORD=your-db-password
```

**`warehouse-orchestrator/.env`**
```env
PORT=4000
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://robotix:password@localhost:5432/robotixfunnel
BACKEND_API_URL=http://localhost:9000
DEMO_MODE=true
TICK_INTERVAL=500
ROBOT_COUNT=4
```

**`ai-chat-service/.env`**
```env
GEMINI_API_KEY=your-gemini-api-key
BACKEND_URL=http://localhost:9000
```

### 3. Install Dependencies & Start Services

```bash
# Backend
cd backend-v2
npm install
npm run db:push       # Create database tables
npm run db:seed       # Seed initial data
npm run dev           # Start on port 9000

# Frontend
cd ../frontend
yarn install
yarn dev              # Start on port 8000

# Warehouse Orchestrator
cd ../warehouse-orchestrator
npm install
npm run dev           # Start on port 4000

# AI Chat Service
cd ../ai-chat-service
pip install -r requirements.txt
python main.py        # Start on port 5050

# Admin Panel
cd ../Admin01
npm install
npm run dev           # Start on port 3001
```

### 4. Access the Services

| Service | URL |
|---------|-----|
| 🛒 Storefront | [http://localhost:8000](http://localhost:8000) |
| ⚙️ Backend API | [http://localhost:9000](http://localhost:9000) |
| 📊 Swagger Docs | [http://localhost:9000/docs](http://localhost:9000/docs) |
| 🔧 Admin Panel | [http://localhost:3001/app](http://localhost:3001/app) |
| 🏭 Warehouse 3D | [http://localhost:4000](http://localhost:4000) |
| 🤖 Chat Health | [http://localhost:5050/health](http://localhost:5050/health) |

---

## 🌐 CDN Layer

A CDN (Content Delivery Network) layer is integrated into the platform to accelerate static asset delivery:

- **Domain**: `cdn.mypni.com` — whitelisted in the storefront's `next.config.js` for optimized image delivery.
- **Purpose**: Serves product images, brand logos, and other static media from edge locations closer to end users.
- **Next.js Image Optimization**: Works in tandem with Next.js `<Image>` component to serve `avif`/`webp` formats, apply device-aware resizing, and cache responses for 24 hours (`minimumCacheTTL: 86400`).

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS | Customer storefront |
| **Admin** | Next.js 16, React 19, Tailwind CSS 4 | Admin dashboard |
| **Backend** | Fastify 5, TypeScript | REST API server |
| **Database** | PostgreSQL 16, Drizzle ORM | Data persistence (27 tables) |
| **Cache** | Redis 7, ioredis | API response caching |
| **Payments** | Stripe | Credit card & payment processing |
| **Auth** | JWT, Google OAuth, bcrypt | Authentication & authorization |
| **Warehouse** | Express, Socket.IO, Three.js | Digital twin simulation |
| **AI Chat** | FastAPI, Google Gemini 3 | Shopping assistant chatbot |
| **AI Warehouse** | Google Gemini 2.0/2.5 | Route optimization, copilot, anomaly detection |
| **CDN** | Cloudflare (cdn.mypni.com) | Image optimization & delivery |
| **Styling** | Tailwind CSS, Radix UI, Headless UI | Component library |
| **Icons** | Lucide React | Icon system |
| **Logging** | Pino | Structured logging |

---

## 🌟 Unique Features

### 🏭 Digital Twin Warehouse
Real-time 3D warehouse simulation with 4 autonomous AGV robots (Octobot, Marcobot, Cyberbot, Vegbot) navigating a 60×40 grid using A* pathfinding. Robots autonomously pick, transport, pack, and ship orders with live WebSocket streaming to a Three.js dashboard.

### 🤖 Triple AI Integration
Three separate Google Gemini AI integrations:
1. **Warehouse Copilot** — Natural language Q&A about warehouse operations
2. **Shopping Assistant** — Customer-facing chatbot with product recommendations
3. **Route Optimizer** — AI-optimized picking routes for warehouse robots

### 🗣️ Voice-Controlled Warehouse
Speak commands to control warehouse robots — audio is transcribed by Gemini AI and parsed into robot instructions.

### 🇷🇴 Romanian E-Commerce
Full Romanian localization: bilingual URLs (`/shipping` + `/livrare`), RON currency, 19% VAT, e-Factura electronic invoicing, Romanian-format invoices.

### 📦 Real Stock Sync
Warehouse simulation loads actual product inventory from the PostgreSQL database and distributes items across category-mapped shelf zones.

### 🔗 B2B Supplier Integration
Automated product syncing from PNI/MyPNI B2B suppliers with web scraping, authentication, and catalog import.

---

## 📄 License

Private — Query Curious © 2025

---

## 👥 Team

**Owner**: Query Curious  
**Repository**: [github.com/sunnyshin8/RobotixFunnel](https://github.com/sunnyshin8/RobotixFunnel)
