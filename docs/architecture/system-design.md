# System design

How Assetra's MVP is put together.

---

## Components

```text
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│  /            login / register                               │
│  /dashboard   summary · charts · holdings table · AI chat    │
└───────────────────────────────┬──────────────────────────────┘
                                │ fetch (lib/api/*)
┌───────────────────────────────▼──────────────────────────────┐
│ Next.js route handlers (frontend/app/api/*)                  │
│  auth · assets · groups · portfolio · quotes · symbols       │
│  broker (Plaid) · ai-agent/chat                              │
│                 │                                            │
│                 ▼                                            │
│ Domain logic (frontend/lib/*)                                │
│  stores · prices · market · broker · portfolio-history       │
└──────┬─────────────────────┬─────────────────────┬───────────┘
       │ Prisma              │ HTTP                │ HTTP (stream)
       ▼                     ▼                     ▼
┌──────────────┐   ┌───────────────────────┐   ┌──────────┐
│ PostgreSQL   │   │ Finnhub · CoinGecko   │   │ OpenAI   │
│ (Neon)       │   │ Plaid · Resend        │   └──────────┘
└──────▲───────┘   └───────────────────────┘
       │ psycopg
┌──────┴────────────────────────────┐
│ mle/ (Python, GitHub Actions)     │◀── Yahoo Finance
│ sync_prices → compute_features    │
└───────────────────────────────────┘
```

There is no separate backend service: the Next.js route handlers are the API.

---

## Data flows

### 1. Recording a financial position

1. User adds a holding (`POST /api/assets`) or imports from Plaid (`/api/broker/*`).
2. `lib/assets-store` writes the `Asset` row.
3. For market types (Stock / ETF / Crypto), `scheduleEnsureSymbolHistory` runs in the background: if the symbol has less than ~1 year of bars, it backfills daily closes from Finnhub / CoinGecko and recomputes `MarketFeature`.
4. Cash, debt and real estate are fields on `User`, edited through `PUT /api/portfolio`.

### 2. Rendering the dashboard

| Widget | Source |
|--------|--------|
| Summary card | `GET /api/assets` + `GET /api/portfolio` + `GET /api/quotes` (live) |
| Allocation chart | Same data, grouped client-side (`lib/asset-categories`) |
| Value history *(component built, not rendered yet)* | `GET /api/portfolio/history?range=…` — rebuilt from **current** holdings × historical closes (Finnhub / CoinGecko) |
| Return / volatility card | `GET /api/portfolio/risk` — value-weighted latest `MarketFeature` per holding |

### 3. Daily market data (ETL)

1. GitHub Actions runs weekdays at 22:00 UTC.
2. `sync_prices.py --period 5d` reads distinct Stock / ETF / Crypto symbols from `Asset`, fetches Yahoo OHLCV (crypto as `BTC-USD` etc.), upserts `DailyMarketPrice` on `(symbol, date)`.
3. `compute_market_features.py` recomputes `MarketFeature` from all stored bars.
4. When a symbol is no longer held by anyone, the app deletes its rows (`maybePurgeSymbolMarketData`).

Market tables are **shared across users** — one row per symbol per day.

### 4. AI advisor

1. `POST /api/ai-agent/chat` authenticates the user.
2. `lib/integrations/ai-agent/portfolio-context-loader.ts` loads holdings, groups, cash/debt and live quotes, and `ai-agent/` turns them into a JSON summary (allocation, P&L, leverage, per-holding metrics).
3. The summary is placed in the system prompt; the reply streams back from OpenAI.

**Gap:** step 2 does not read `DailyMarketPrice` / `MarketFeature` yet. See [roadmap](../product/roadmap.md#next).

---

## Data model

Full schema: [`frontend/prisma/schema.prisma`](../../frontend/prisma/schema.prisma) · overview: [`frontend/prisma/README.md`](../../frontend/prisma/README.md)

```text
User ─┬─< Asset >─┬─ AssetGroup
      │           └─ BrokerConnection
      ├─< AssetGroup
      ├─< BrokerConnection
      ├─< Session
      ├─< PasswordResetToken
      └─< UserActivity

DailyMarketPrice   (symbol, date)  shared
MarketFeature      (symbol, date)  shared
```

---

## Two writers for market data

| Writer | When | Source | Columns filled |
|--------|------|--------|----------------|
| `mle/` (Python) | Weekday cron | Yahoo Finance | Full OHLCV + volume |
| `lib/market/symbol-lifecycle.ts` (TS) | A symbol is added | Finnhub / CoinGecko | Close only (open = high = low = close, volume 0) |

Both upsert on `(symbol, date)`, so the nightly Yahoo run overwrites backfilled rows with full bars once they fall inside its window. The feature math is implemented twice (`mle/scripts/compute_market_features.py` and `lib/market/features.ts`) and must stay consistent.

---

## CI / ops

| Workflow | Trigger | Does |
|----------|---------|------|
| [`mle-ci.yml`](../../.github/workflows/mle-ci.yml) | Push / PR touching `mle/**` | `pytest` |
| [`sync-daily-prices.yml`](../../.github/workflows/sync-daily-prices.yml) | Weekdays 22:00 UTC, manual | Price sync + feature compute |

Hosting: Vercel (root directory `frontend`). Setup: [setup.md](../setup.md).
