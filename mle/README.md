# Portfolio Risk Engine (MLE) — Architecture V1

Data pipeline for Assetra’s portfolio risk features (volatility, correlation, VaR, etc.).

## Goal

Persist **daily market prices** so the risk engine can run offline analysis without hitting live quote APIs on every request.

## V1 data flow

```text
Asset table (your holdings)
        ↓
Yahoo Finance (historical)  →  sync_prices.py / GitHub Action  →  DailyMarketPrice
                                                                    ↓
                                                          (later) Risk API → Dashboard

Finnhub (live quotes)  →  frontend  →  “Refresh Quotes”
```

| Stage | Role |
|--------|------|
| **Yahoo Finance** | Daily OHLCV for risk-engine history |
| **Finnhub** | Live quotes in the app only |
| **Scheduler** | `sync_prices.py` locally, or GitHub Action on weekdays |
| **Database** | `DailyMarketPrice` |

## Repo layout

```text
mle/
├── README.md
├── requirements.txt
└── scripts/
    ├── price_db.py        # shared fetch / upsert / load symbols
    ├── fetch_price.py     # one symbol (debug / print)
    └── sync_prices.py     # all portfolio symbols → DB
```

## Milestone checklist

1. [x] Architecture V1
2. [x] `fetch_price.py` — Yahoo + print / `--write`
3. [x] `DailyMarketPrice` schema
4. [x] Upsert into DB
5. [x] Auto sync from `Asset` + GitHub Action cron
6. [ ] Risk metrics API + UI

## Local: sync everything in your portfolio

```bash
cd mle
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Reads distinct Stock/ETF/Crypto symbols from Asset → Yahoo → DailyMarketPrice
python scripts/sync_prices.py --period 1mo

# Daily incremental (recent bars only)
python scripts/sync_prices.py --period 5d

# Or force an explicit list
python scripts/sync_prices.py --symbols TSLA,AAPL,NVDA --period 1y
```

Needs `DATABASE_URL` in `frontend/.env`.

Single-symbol debug:

```bash
python scripts/fetch_price.py --symbol TSLA --period 1mo --write
```

## Automatic schedule (GitHub Actions)

Workflow: [`.github/workflows/sync-daily-prices.yml`](../.github/workflows/sync-daily-prices.yml)

- Runs **weekdays 22:00 UTC** (after US market close)
- Can also run manually: GitHub → **Actions** → **Sync daily market prices** → **Run workflow**

**One-time setup**

1. Push this repo (so the workflow file is on GitHub)
2. GitHub → repo → **Settings** → **Secrets and variables** → **Actions**
3. New secret: name `DATABASE_URL`, value = your Neon **pooled** connection string (same as Vercel / `frontend/.env`)

Until the secret is set, the Action will fail with a missing URL.

## Inspect data

```bash
cd frontend && npx prisma studio
```

Open **DailyMarketPrice**, or in Neon SQL Editor:

```sql
SELECT symbol, COUNT(*), MIN(date), MAX(date)
FROM "DailyMarketPrice"
GROUP BY symbol
ORDER BY symbol;
```

## Design notes

- Stored `symbol` matches your `Asset.symbol` (e.g. `BTC`); Yahoo may use `BTC-USD` only for the request.
- Re-runs upsert on `(symbol, date)` — safe to run every day.
- Crypto Yahoo map lives in `scripts/price_db.py` (`CRYPTO_YAHOO_TICKERS`).

## Out of scope (later)

- Risk metrics (vol, correlation, VaR)
- Auth-gated risk APIs / UI
