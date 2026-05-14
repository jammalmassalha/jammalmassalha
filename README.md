# DropShopping

Cross-platform drop-shopping starter platform:
- Flutter mobile app for iOS/Android storefront.
- Node.js backend API for products, orders, and payment callbacks.
- React admin dashboard for order monitoring and operations.

## Project Layout

```
.
├── admin/                 # React + Vite admin dashboard
├── backend/               # Node.js API
└── mobile_app/            # Flutter app
```

## Features Implemented

- Trending products endpoint (`/api/products/trending`) with replaceable data source.
- Flutter product feed with cart state handled by Riverpod.
- Order creation endpoint (`/api/orders`) for crypto checkout flows.
- Admin order endpoint (`/api/admin/orders`) protected by API key.
- Webhook signature verification using timing-safe HMAC comparison.
- CORS + headers configuration to reduce admin access issues from browsers.

## Quick Start

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:4000`.

### 2) Admin Dashboard

```bash
cd admin
npm install
npm run dev
```

Optional environment variables (`admin/.env`):

```bash
VITE_API_BASE=http://localhost:4000
VITE_ADMIN_API_KEY=change-me
```

### 3) Flutter App

```bash
cd mobile_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4000
```

If running on Android emulator, use:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

## API Overview

- `GET /health`
- `GET /api/products/trending`
- `POST /api/orders`
- `GET /api/admin/orders` (requires header `x-admin-api-key`)
- `POST /api/payments/callback` (requires header `x-payment-signature`)

## Notes On Your TODO/Fix List

### TODO Progress

- Initialize Flutter project and configure Firebase or Node.js backend:
	Done with a Node.js backend + Flutter app starter.
- Develop Admin Dashboard for order management and inventory tracking:
	Order management scaffold is complete; inventory tracking is next.
- Integrate cryptocurrency payment SDKs for seamless checkout:
	Ready for SDK integration; webhook verification path is implemented.
- Implement a web scraper or API to fetch trending USA product data:
	Mock source implemented with a clear replacement point in backend service.

### Fix Progress

- Debug state management issues between product list and cart:
	Riverpod `Notifier`-based cart state now centrally managed.
- Resolve permissions error when accessing Admin site from mobile browsers:
	CORS policy and allowed headers configured for practical browser access.
- Fix cryptographic signature verification for payment callbacks:
	Added timing-safe HMAC SHA-256 verification.

## Next Build Steps

1. Replace mock trending data with a marketplace API or compliant scraper pipeline.
2. Integrate real crypto rails (for example Coinbase Commerce, Stripe crypto-enabled flow, or NowPayments).
3. Add authentication/authorization for admin users (JWT/OAuth + roles).
4. Persist products/orders in a database (PostgreSQL or Firestore).
5. Add CI and tests for backend webhook verification and Flutter cart behavior.
