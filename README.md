# TransCredit — Payment Gateway Simulation

A closed-loop payment system (mini-Momo/Stripe) with server-side authoritative ledger logic.

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────┐
│   Merchant Web (POS)    │        │   Mobile App (User)  │
│   Next.js 14 App Router │        │   React Native/Expo  │
│   - Enter Amount        │        │   - Scan QR          │
│   - Generate QR         │◀──────▶│   - Review Checkout  │
│   - Real-time Status    │  QR    │   - PIN Confirm      │
└──────────┬──────────────┘        └──────────┬───────────┘
           │                                  │
           │      ┌──────────────────┐        │
           └─────▶│  API Routes      │◀───────┘
                  │  (Central Bank)  │
                  │  - create-order  │
                  │  - get order     │
                  │  - execute-tx    │  ◀── Atomic Transaction
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │   Firestore      │
                  │   - wallets      │
                  │   - orders       │
                  │   - ledger_logs  │
                  └──────────────────┘
```

## Quick Start

### 1. Web (Merchant POS + API)

```bash
cd web
cp .env.local.example .env.local  # Fill in Firebase credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. Seed Test Data

```bash
curl -X POST http://localhost:3000/api/seed
```

Creates:
- `merchant-001`: TransCredit Coffee (balance: 0)
- `user-001`: Nguyen Van A (balance: 5,000,000 VND)
- `user-002`: Tran Thi B (balance: 2,000,000 VND)

### 3. Mobile (User Bank App)

```bash
cd mobile
npm install
npx expo start
```

Scan QR with Expo Go on your device.

> **Note:** Update `API_BASE_URL` in `mobile/lib/api.ts` to your machine's LAN IP.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Next.js API Routes (serverless) |
| Database | Firebase Firestore (atomic transactions) |
| Merchant App | Next.js 14, App Router |
| User App | React Native, Expo, TypeScript |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/create-order` | POST | Create a pending order |
| `/api/orders/[id]` | GET | Fetch order details |
| `/api/execute-transaction` | POST | **Atomic payment** — validates, transfers, logs |
| `/api/seed` | POST | Create demo wallets |

## License

Internal simulation — not for production use without real banking API integration.
# transcredit
