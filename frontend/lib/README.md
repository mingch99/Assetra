# lib

Domain logic for the app. Server-side modules are imported by route handlers in `app/api/`; `api/` and `i18n/` are the only parts used by client components.

---

## Map

| Path | Side | Role |
|------|------|------|
| `prisma.ts` | Server | Shared Prisma client |
| `auth-session.ts` | Server | Create / read / clear session cookies (`getCurrentUser`) |
| `password-reset.ts`, `email.ts` | Server | Reset tokens (hashed, 1h TTL) and Resend email |
| `activity.ts` | Server | Writes `UserActivity` events |
| `assets-store.ts` | Server | Holding CRUD + payload validation; triggers market-data backfill / purge |
| `groups-store.ts` | Server | Group CRUD |
| `portfolio-store.ts` | Server | Cash / debt / real-estate on `User` |
| `asset-categories.ts` | Shared | Market value, crypto buckets (BTC / ETH / stablecoins / altcoins), allocation slices, liquid vs non-liquid |
| `portfolio-history.ts` | Server | Rebuilds portfolio value over a range from current holdings × historical closes |
| `prices/` | Server | Quotes and history from external APIs |
| `market/` | Server | Stored market data: features, backfill, risk |
| `broker/` | Server | Plaid integration |
| `integrations/ai-agent/` | Server | Loads portfolio context for the AI agent |
| `api/` | Client | Typed `fetch` wrappers for every API route |
| `i18n/` | Client | `LanguageProvider`, `en` / `zh` message tables |

---

## prices/

| File | Role |
|------|------|
| `index.ts` | `getQuotesForAssets` — splits symbols by market, calls each source, merges; a failing source returns `{}` |
| `finnhub.ts` | US equity quotes |
| `coingecko.ts` | Crypto quotes; `SUPPORTED_CRYPTO` symbol → CoinGecko id map (only these coins are supported) |
| `history.ts` | Daily closes for a range (Finnhub candles, CoinGecko market chart), forward-fill alignment |
| `types.ts` | `Quote`, `QuoteMap`, `resolveMarket` |

## market/

| File | Role |
|------|------|
| `features.ts` | `computeMarketFeatures` — MA20, returns, annualized volatility. **Must match** `mle/scripts/compute_market_features.py` |
| `symbol-lifecycle.ts` | `scheduleEnsureSymbolHistory`: backfill ~1y closes when a symbol has < 200 bars or < 300 days span, then recompute features. `maybePurgeSymbolMarketData`: delete market rows once no `Asset` references the symbol |
| `portfolio-risk.ts` | `computePortfolioRisk` — value-weighted average of each holding's latest `MarketFeature`; reports `coveredWeight` and `missingSymbols` |

## broker/

| File | Role |
|------|------|
| `plaid-client.ts` | Plaid API client, link token, token exchange, holdings fetch |
| `sync-holdings.ts` | `syncBrokerConnection` — upserts `SYNCED` assets by `externalId`, removes sold positions, triggers backfill / purge |
| `token-crypto.ts` | Encrypt / decrypt Plaid access tokens with `BROKER_TOKEN_ENCRYPTION_KEY` |
| `cash.ts` | Combine manual cash with broker-synced cash positions |
