# TransCredit — Proprietary Payment Gateway Simulation

A closed-loop fintech payment gateway simulation built for educational purposes. Features a **merchant POS web app** and a **consumer mobile app** connected through a secure server-side backend powered by Firebase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### Merchant Web App (Next.js 14)
- **POS Product Grid** — Tap-to-add product catalog (Coffee, Food, Drinks, Snacks)
- **Cart & Billing** — Quantity controls, line totals, charge button
- **QR Code Generation** — Dynamic QR codes for each order
- **Real-time Payment Status** — Firestore listeners with animated UI feedback
- **Audio Notification** — "Ding" sound on successful payment
- **Customer Management** — Admin table showing all registered users and balances
- **Dark Fintech UI** — Glassmorphism, gradients, micro-animations

### Consumer Mobile App (React Native / Expo)
- **Authentication** — Email/Password login & registration via Firebase Auth
- **Onboarding** — Profile setup with name, phone, virtual bank selection
- **Virtual Wallet** — Auto-generated account number with ₫5,000,000 starting balance
- **QR Scan & Pay** — Camera-based QR scanning with PIN confirmation
- **P2P Transfer** — Send money to other users by account number
- **Premium Banking UI** — Card display, quick actions, dark theme

### Backend API (Next.js API Routes)
- `POST /api/auth/register` — Create user profile + wallet
- `POST /api/create-order` — Create payment order
- `GET /api/orders/[id]` — Fetch order details
- `POST /api/execute-transaction` — Atomic payment execution
- `POST /api/p2p-transfer` — Peer-to-peer money transfer
- `GET /api/wallet/[id]` — Fetch wallet data
- `GET /api/customers` — Admin user listing
- `POST /api/seed` — Seed demo data

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Firebase                          │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Firestore  │  │   Auth   │  │  Ledger Logs │   │
│  │  wallets/    │  │          │  │              │   │
│  │  orders/     │  │          │  │              │   │
│  │  users/      │  │          │  │              │   │
│  └──────┬───────┘  └────┬─────┘  └──────────────┘   │
└─────────┼──────────────┼────────────────────────────┘
          │              │
    ┌─────┴──────────────┴─────┐
    │    Next.js API Routes    │
    │   (Server-side authority) │
    │   Atomic Transactions    │
    └──────┬──────────┬────────┘
           │          │
    ┌──────┴───┐  ┌───┴──────────┐
    │  Web POS │  │ Mobile App   │
    │ (Merchant)│  │ (Consumer)   │
    └──────────┘  └──────────────┘
```

## 🛡️ Security Design
- **Server-side authority** — All financial logic runs on the API, never the client
- **Atomic Firestore Transactions** — Prevents race conditions on payments and transfers
- **Immutable Ledger** — Every transaction logged to `ledger_logs` collection
- **Balance validation** — Server checks funds before any deduction

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore enabled
- Expo Go app on your phone (for mobile testing)

### Backend + Web App
```bash
cd web
npm install
cp .env.local.example .env.local  # Add your Firebase credentials
npm run dev                       # http://localhost:3000
```

### Mobile App
```bash
cd mobile
npm install
npx expo start                    # Scan QR with Expo Go
```

### Seed Demo Data
```bash
curl -X POST http://localhost:3000/api/seed
```

## 📂 Project Structure
```
TransCredit/
├── web/                          # Next.js 14 (Backend + Merchant POS)
│   ├── src/app/
│   │   ├── api/                  # API Routes (create-order, execute-transaction, etc.)
│   │   ├── customers/            # Customer management page
│   │   └── page.tsx              # POS main page
│   ├── src/components/           # ProductGrid, Cart, QRDisplay, OrderStatus
│   └── src/lib/                  # Firebase config, types, products
├── mobile/                       # React Native (Expo) Consumer App
│   ├── screens/                  # AuthScreen, OnboardingScreen, TransferScreen
│   ├── components/               # PinPad, PaymentResult
│   ├── lib/                      # API client, Firebase config, types
│   └── App.tsx                   # Main app with auth routing
├── README.md
└── LICENSE
```

## 🏦 Supported Banks (Simulated)
Techcombank, MBBank, Vietcombank, VPBank, ACB, Sacombank, TPBank, BIDV

## 📄 License
[MIT](./LICENSE)
