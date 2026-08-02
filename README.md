# Assetra

AI-powered portfolio management for stocks, ETFs, and crypto.

Track holdings, refresh live quotes, analyze allocation and risk, and ask an AI advisor about your portfolio — all in one dashboard.

**Live demo:** [Assetra](https://assetra-eight.vercel.app)

---

## Features

| Area | What you get |
|------|----------------|
| **Portfolio dashboard** | Holdings table, total value, cash / debt / real estate, allocation charts |
| **Asset types** | Stocks, ETFs, Crypto, plus cash-like balances on the user profile |
| **Live quotes** | Finnhub-backed refresh for US equities (and mapped crypto where supported) |
| **Groups** | Organize holdings into custom groups; filter and chart by group |
| **Broker import** | One-click Investments import via [Plaid](https://plaid.com/) (sandbox / production) |
| **Risk snapshot** | Portfolio return & volatility over 7d / 30d / YTD / 1Y from stored market features |
| **AI Portfolio Advisor** | Streaming chat over your holdings context (OpenAI) |
| **Auth & account** | Email/password, sessions, password reset (Resend), profile & account deletion |
| **i18n** | English / 中文 UI |

---

## Monorepo layout

```text
Assetra/
├── frontend/          # Next.js app (UI, API routes, Prisma, AI agent module)
├── mle/               # Python ETL: Yahoo daily prices → MarketFeature
└── .github/workflows/ # Weekday cron: sync prices + compute features
```

| Path | Role |
|------|------|
| [`frontend/`](frontend/) | Dashboard, auth, APIs, Prisma schema, Plaid, AI advisor UI |
| [`frontend/ai-agent/`](frontend/ai-agent/) | Extractable AI agent core (no DB coupling) — see [its README](frontend/ai-agent/README.md) |
| [`mle/`](mle/) | Market data pipeline & feature engineering — see [MLE README](mle/README.md) |

---

## Tech stack

**Frontend / API**

- [Next.js](https://nextjs.org/) 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- [Prisma](https://www.prisma.io/) · PostgreSQL ([Neon](https://neon.tech/))
- [Finnhub](https://finnhub.io/) (live quotes) · [Plaid](https://plaid.com/) (broker link) · [Resend](https://resend.com/) (email) · OpenAI (advisor)

**MLE**

- Python 3.12 · `yfinance` · `pandas` · `psycopg`
- GitHub Actions cron (weekdays 22:00 UTC)

---

## Architecture (high level)

```text
                    ┌─────────────────────────────┐
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

- **Finnhub** powers on-demand quote refresh in the app.
- **Yahoo Finance** (via `mle/`) persists daily OHLCV for offline risk features — not called on every dashboard load.
- Risk UI reads aggregated metrics from `MarketFeature` (see `GET /api/portfolio/risk`).

---

## Quick start (frontend)

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Neon pooled connection string recommended for Vercel)

### Setup

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env   # fill in values — see below
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy from [`frontend/.env.example`](frontend/.env.example). Minimum for local auth + holdings:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon **pooled** Postgres URL |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |
| `FINNHUB_API_KEY` | Live US quotes |
| `OPENAI_API_KEY` | AI Portfolio Advisor |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Password-reset email (optional; links log to console without key) |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | Broker import |
| `BROKER_TOKEN_ENCRYPTION_KEY` | Encrypt Plaid access tokens at rest |

---

## Market data pipeline (MLE)

Persist daily bars and derived features so the risk card can run without hitting live quote APIs.

```bash
cd mle
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Needs DATABASE_URL (same as frontend/.env)
python scripts/sync_prices.py --period 1mo
python scripts/compute_market_features.py
```

**Automated sync:** [`.github/workflows/sync-daily-prices.yml`](.github/workflows/sync-daily-prices.yml) runs on weekdays after the US close. Set repository secret `DATABASE_URL` once.

**CI:** [`.github/workflows/mle-ci.yml`](.github/workflows/mle-ci.yml) runs `pytest` on `mle/**` changes (no live Yahoo / DB).

Feature columns include MA20, multi-horizon returns, and annualized volatility windows. Full details: [`mle/README.md`](mle/README.md).

Inspect tables with:

```bash
cd frontend && npx prisma studio
```

---

## AI Portfolio Advisor

- Core logic lives in [`frontend/ai-agent/`](frontend/ai-agent/) (types, prompts, streaming client, chat widget).
- Assetra wires it via `lib/integrations/ai-agent/` (loads portfolio context from the DB) and a thin `POST /api/ai-agent/chat` route.
- Designed so the agent package can later move to a standalone service.

---

## Deploy

The frontend is set up for **Vercel**:

1. Import the repo; set **Root Directory** to `frontend`.
2. Add the same env vars as `.env.example` (use Neon’s **pooled** `DATABASE_URL`).
3. Build uses `prisma generate` + `migrate deploy` + `next build`.

For daily price sync in production, configure the GitHub Action `DATABASE_URL` secret as described in the MLE README.

---

## Roadmap (near term)

- [x] Auth, holdings CRUD, live quotes, groups, EN/ZH
- [x] Daily price ETL + MarketFeature + portfolio risk card
- [x] Deeper risk metrics (correlation, VaR) and richer risk UI
- [ ] Plaid broker import
- [ ] AI advisor chat


---

## License

[MIT](LICENSE) © 2026 Mingcheng Fan
