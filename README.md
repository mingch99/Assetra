# Assetra

**Your whole financial picture in one place, with an AI advisor that knows your portfolio.**

Assetra is a personal finance dashboard. You record what you own (stocks, ETFs, crypto, cash, real estate) and what you owe. Assetra values everything with live quotes and shows it as charts. Every trading day, a backend job stores market data (close, volume, returns, volatility) for every symbol you hold. That data and your holdings feed an AI agent that answers questions about your portfolio.

**Live demo:** [assetra-eight.vercel.app](https://assetra-eight.vercel.app)
**Status:** MVP — core tracking, charts, daily market data pipeline and AI advisor are live.

---

## What it does

| Feature | Description |
|---------|-------------|
| **Holdings** | Add stocks, ETFs and crypto manually (with symbol search), or import them from a broker via Plaid |
| **Balance sheet** | Record cash, debt and real estate; see total assets, net equity and debt ratio |
| **Live valuation** | Quotes from Finnhub (US equities) and CoinGecko (crypto), USD-denominated |
| **Charts** | Allocation breakdown by type, group and crypto bucket |
| **Groups** | Bundle holdings into custom groups; filter and chart by group |
| **Risk snapshot** | Value-weighted portfolio return and volatility over 7d / 30d / YTD / 1Y |
| **Daily market data** | Weekday job stores OHLCV for each held symbol and derives features (MA20, returns, volatility) |
| **AI advisor** | Streaming chat that answers questions using your actual portfolio data |
| **Accounts** | Email/password auth, password reset by email, English / 中文 UI |

---

## How it works

```text
            ┌───────────────────────────────┐
  User ───▶ │  Next.js app (frontend/)      │
            │  Dashboard · API routes · AI  │
            └──────┬───────────────┬────────┘
                   │               │
          live quotes, import   prompt + portfolio context
                   │               │
     Finnhub · CoinGecko · Plaid   OpenAI
                   │
            ┌──────▼────────────────────────┐
            │  PostgreSQL (Neon)            │
            │  User · Asset · AssetGroup    │
            │  DailyMarketPrice             │
            │  MarketFeature                │
            └──────▲────────────────────────┘
                   │  weekdays 22:00 UTC
            ┌──────┴────────────────────────┐
            │  Market data ETL (mle/)       │
            │  Yahoo Finance → prices →     │
            │  features                     │
            └───────────────────────────────┘
```

Details: [`docs/architecture/system-design.md`](docs/architecture/system-design.md)

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **App & API** | Next.js 16 (App Router, route handlers) · React 19 · TypeScript · Tailwind CSS 4 |
| **Database** | PostgreSQL (Neon) · Prisma 6 |
| **Market data ETL** | Python 3.12 · pandas · yfinance · psycopg |
| **External services** | Finnhub · CoinGecko · Plaid · OpenAI · Resend |
| **CI / scheduling** | GitHub Actions (pytest CI, daily price sync cron) |
| **Hosting** | Vercel |

---

## Repository

```text
Assetra/
├── frontend/              # Next.js app: dashboard, API routes, Prisma schema, AI agent
│   ├── app/               #   pages and API routes
│   ├── components/        #   dashboard UI components
│   ├── lib/               #   server-side domain logic
│   ├── ai-agent/          #   self-contained AI advisor module
│   └── prisma/            #   schema and migrations
├── mle/                   # Python market data ETL (Yahoo → DailyMarketPrice → MarketFeature)
├── docs/                  # Product, architecture and setup docs
└── .github/workflows/     # MLE CI and daily price sync
```

Each major folder has its own README:
[`frontend/`](frontend/README.md) ·
[`frontend/lib/`](frontend/lib/README.md) ·
[`frontend/ai-agent/`](frontend/ai-agent/README.md) ·
[`frontend/prisma/`](frontend/prisma/README.md) ·
[`mle/`](mle/README.md) ·
[`docs/`](docs/README.md)

---

## Getting started

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env          # fill in DATABASE_URL and API keys
npm install
npx prisma migrate deploy
npm run dev                   # http://localhost:3000
```

Environment variables, the market data pipeline, and Vercel deployment: [`docs/setup.md`](docs/setup.md)

---

## Roadmap

| Status | Item |
|--------|------|
| Done | Auth, holdings, balance sheet, groups, EN/ZH |
| Done | Live quotes, Plaid import, allocation and value charts |
| Done | Daily market data ETL + features + CI |
| Done | Risk snapshot, AI advisor |
| Next | Give the AI advisor the stored market history (returns, volatility, trends) |
| Next | Put the portfolio value-history chart on the dashboard (component and API exist) |
| Next | Frontend CI (lint + typecheck) |
| Later | Deeper risk metrics (correlation, drawdown, VaR) |

Details: [`docs/product/roadmap.md`](docs/product/roadmap.md)

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Product requirements](docs/product/PRD.md) | MVP goal, users, scope, non-goals |
| [Roadmap](docs/product/roadmap.md) | What's done and what's next |
| [System design](docs/architecture/system-design.md) | Components, data flow, data model |
| [Setup & deployment](docs/setup.md) | Env vars, local dev, ETL, Vercel |
| [Market data ETL](mle/README.md) | Price sync and feature computation |
| [AI agent](frontend/ai-agent/README.md) | Advisor module and its boundaries |

---

## Disclaimer

Assetra provides **portfolio tracking and analytics**, not investment advice, brokerage, or tax services. AI advisor output is for reference only. Users are responsible for their own financial decisions.

---

## License

[MIT](LICENSE) © 2026 Mingcheng Fan
