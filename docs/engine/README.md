# Assetra Engine

Analytics backend for the [Assetra](../../README.md) product.

The Engine powers portfolio tracking, market data, risk analytics, and AI-assisted explanations. Users interact with **Financial City** in the experience layer; **Assetra Engine** runs underneath and turns holdings into insights, missions, and personalized guidance.

**Live demo (Engine dashboard):** [assetra-eight.vercel.app](https://assetra-eight.vercel.app)

Naming: [Product glossary](../product/glossary.md) · [System design](../architecture/system-design.md)

---

## Capabilities

| Area | Status | Description |
|------|--------|-------------|
| **Portfolio dashboard** | Ready | Holdings table, total value, cash / debt / real estate, allocation charts |
| **Asset types** | Ready | Stocks, ETFs, Crypto; cash-like balances on user profile |
| **Live quotes** | Ready | Finnhub (US equities); CoinGecko for crypto search |
| **Groups** | Ready | Custom groups; filter and chart by group |
| **Broker import** | Ready | Plaid Investments link (sandbox / production) |
| **Risk snapshot** | Ready | Portfolio return & volatility (7d / 30d / YTD / 1Y) from `MarketFeature` |
| **Market ETL** | Ready | Yahoo daily OHLCV → `DailyMarketPrice` → features via `mle/` |
| **AI Portfolio Advisor** | Ready | Streaming chat with portfolio context (OpenAI) |
| **Auth & account** | Ready | Email/password, sessions, password reset (Resend) |
| **i18n** | Ready | English / 中文 UI |
| **Portfolio Health Score** | Planned | Composite score → city missions |
| **What-if simulator** | Planned | Rebalance preview tied to risk metrics |

---

## Monorepo layout

```text
Assetra/
├── frontend/          # Next.js app — APIs, dashboard, Prisma, AI agent
├── mle/               # Python ETL — Yahoo prices → MarketFeature
└── .github/workflows/ # Price sync cron + MLE CI
```

| Path | Role |
|------|------|
| [`frontend/`](../../frontend/) | Dashboard, auth, APIs, Prisma schema, Plaid, AI advisor UI |
| [`frontend/ai-agent/`](../../frontend/ai-agent/) | Extractable AI agent core — see [AI agent README](../../frontend/ai-agent/README.md) |
| [`mle/`](../../mle/) | Market data pipeline — see [MLE README](../../mle/README.md) |

---

## Tech stack

**Frontend / API**

- [Next.js](https://nextjs.org/) 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- [Prisma](https://www.prisma.io/) · PostgreSQL ([Neon](https://neon.tech/))
- [Finnhub](https://finnhub.io/) · [Plaid](https://plaid.com/) · [Resend](https://resend.com/) · OpenAI

**MLE**

- Python 3.12 · `yfinance` · `pandas` · `psycopg`
- GitHub Actions cron (weekdays 22:00 UTC) + `pytest` CI

---

## Architecture

```text
                    ┌─────────────────────────────┐
                    │      Financial City (WIP)   │
                    │  Lessons · Missions · XP    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         Browser UI          │
                    │  Dashboard · Advisor · Auth │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Next.js API routes      │
                    │  assets · quotes · risk ·   │
                    │  broker · ai-agent · auth   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
        PostgreSQL            Finnhub / Plaid      OpenAI stream
     (holdings, sessions,      (live / import)      (advisor)
      DailyMarketPrice,
       MarketFeature)
              ▲
              │  sync_prices + compute_market_features
              │  (local CLI or GitHub Action)
        Yahoo Finance
```

- **Finnhub** — on-demand quote refresh in the app.
- **Yahoo Finance** (`mle/`) — daily OHLCV for offline risk features.
- **Risk API** — `GET /api/portfolio/risk` reads aggregated metrics from `MarketFeature`.

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (Neon **pooled** connection string recommended for Vercel)

### Frontend

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy from [`frontend/.env.example`](../../frontend/.env.example).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon **pooled** Postgres URL |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |
| `FINNHUB_API_KEY` | Live US quotes |
| `OPENAI_API_KEY` | AI Portfolio Advisor |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Password-reset email |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | Broker import |
| `BROKER_TOKEN_ENCRYPTION_KEY` | Encrypt Plaid tokens at rest |

### Market data pipeline (MLE)

```bash
cd mle
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python scripts/sync_prices.py --period 1mo
python scripts/compute_market_features.py
```

**Automated sync:** [`.github/workflows/sync-daily-prices.yml`](../../.github/workflows/sync-daily-prices.yml) — weekdays after US close; set repo secret `DATABASE_URL`.

**CI:** [`.github/workflows/mle-ci.yml`](../../.github/workflows/mle-ci.yml) — `pytest` on `mle/**` changes.

Full MLE details: [`mle/README.md`](../../mle/README.md).

Inspect tables:

```bash
cd frontend && npx prisma studio
```

---

## AI Portfolio Advisor

- Core: [`frontend/ai-agent/`](../../frontend/ai-agent/)
- Integration: `lib/integrations/ai-agent/portfolio-context-loader.ts`
- Route: `POST /api/ai-agent/chat`
- Designed to extract into a standalone service later.

---

## Deploy (Vercel)

1. Import repo; set **Root Directory** to `frontend`.
2. Add env vars from `.env.example` (pooled `DATABASE_URL`).
3. Build: `prisma generate` + `migrate deploy` + `next build`.
4. Configure GitHub Action `DATABASE_URL` for daily price sync.

---

## Engine roadmap

- [x] Auth, holdings CRUD, live quotes, groups, EN/ZH
- [x] Daily price ETL + MarketFeature + portfolio risk card
- [x] Plaid broker import + AI advisor
- [x] MLE unit tests + CI
- [ ] Portfolio Health Score API (feeds city missions)
- [ ] What-if rebalance simulator
- [ ] Deeper risk metrics (correlation, VaR)
