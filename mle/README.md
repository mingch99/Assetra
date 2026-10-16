# Market data ETL (mle/)

Batch pipeline that stores **daily market data** for every symbol held in Assetra and derives features from it. The stored history is the data source for the portfolio risk card and, next, the AI advisor.

## Data flow

```text
Asset table (distinct Stock / ETF / Crypto symbols)
        │
        ▼
sync_prices.py  ── Yahoo Finance (yfinance) ──▶  DailyMarketPrice   (OHLCV per symbol per day)
        │
        ▼
compute_market_features.py  ─────────────────▶  MarketFeature      (MA20, returns, volatility)
        │
        ▼
GET /api/portfolio/risk  →  dashboard return / volatility card
(next) AI advisor context
```

| Source | Used for |
|--------|----------|
| **Yahoo Finance** (this pipeline) | Full daily OHLCV history |
| **Finnhub / CoinGecko** (app) | Live quotes; close-only backfill when a new symbol is added (see [system design](../docs/architecture/system-design.md#two-writers-for-market-data)) |

Both tables are shared across users and keyed by `(symbol, date)`. Re-runs upsert, so running every day is safe.

## Layout

```text
mle/
├── requirements.txt          # runtime: yfinance, pandas, psycopg
├── requirements-dev.txt      # + pytest
├── pytest.ini
├── scripts/
│   ├── price_db.py           # .env loading, Yahoo fetch, upsert, load portfolio symbols
│   ├── sync_prices.py        # CLI: symbols → Yahoo → DailyMarketPrice
│   └── compute_market_features.py  # CLI: DailyMarketPrice → MarketFeature
└── tests/                    # unit tests, no network or DB
```

## Setup

```bash
cd mle
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`DATABASE_URL` is read from the environment, or from `frontend/.env`.

## Sync prices

```bash
# All symbols in Asset; first run, fill a year of history
python scripts/sync_prices.py --period 1y

# Daily incremental (what the cron runs)
python scripts/sync_prices.py --period 5d

# Explicit list
python scripts/sync_prices.py --symbols TSLA,AAPL,NVDA --period 1y
```

`--period` accepts any yfinance period (`5d`, `1mo`, `1y`, …). Crypto symbols are stored as in `Asset` (`BTC`) but requested from Yahoo as `BTC-USD`.

## Compute market features

```bash
python scripts/compute_market_features.py
python scripts/compute_market_features.py --symbols TSLA,AAPL
```

Price `P` = `adjClose` when present, else `close`. Windows are in **trading days** (rows), not calendar days.

| Column | Definition |
|--------|------------|
| `ma20` | 20-day simple moving average of `P` |
| `return7d` | `P_t / P_{t-7} − 1` |
| `return30d` | `P_t / P_{t-30} − 1` |
| `return1y` | `P_t / P_{t-250} − 1` |
| `returnYtd` | `P_t / P_(first bar of the year) − 1` |
| `volatility7d` / `30d` / `1y` | Sample std of daily returns over 7 / 30 / 250 days × √252 |
| `volatilityYtd` | Same, over all daily returns since the first bar of the year |

Values stay `NULL` until the window is full. The same math is implemented in TypeScript in `frontend/lib/market/features.ts`; change both together.

## Tests & CI

```bash
pip install -r requirements-dev.txt
pytest
```

Tests cover ticker mapping, Yahoo row parsing (mocked), feature math and sync target resolution. They do not call Yahoo or Postgres.

CI: [`.github/workflows/mle-ci.yml`](../.github/workflows/mle-ci.yml) runs `pytest` on pushes / PRs touching `mle/**`.

## Schedule

[`.github/workflows/sync-daily-prices.yml`](../.github/workflows/sync-daily-prices.yml) runs **weekdays 22:00 UTC** (after US close): `sync_prices.py --period 5d`, then `compute_market_features.py`. It can also be triggered manually from the Actions tab.

Requires repository secret `DATABASE_URL` (Neon pooled URL, same as the app). Without it the job fails.

## Inspect data

```sql
SELECT symbol, COUNT(*), MIN(date), MAX(date)
FROM "DailyMarketPrice"
GROUP BY symbol
ORDER BY symbol;

SELECT symbol, date, ma20, "return30d", "volatility30d"
FROM "MarketFeature"
ORDER BY symbol, date DESC
LIMIT 50;
```

## Status

- [x] Yahoo fetch + upsert into `DailyMarketPrice`
- [x] Auto-discover symbols from `Asset` + weekday cron
- [x] `MarketFeature`: MA20, 7d / 30d / YTD / 1Y returns and volatility
- [x] Unit tests + CI
- [x] Portfolio risk API + dashboard card (`/api/portfolio/risk`)
- [ ] Feed features to the AI advisor
- [ ] Correlation, drawdown, VaR
