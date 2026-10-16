# prisma

Database schema and migrations (PostgreSQL). Schema: [`schema.prisma`](schema.prisma).

```bash
npx prisma migrate deploy        # apply migrations
npx prisma migrate dev --name x  # create a new migration (local DB)
npx prisma studio                # browse data
```

`DATABASE_URL` comes from `frontend/.env` (see [`prisma.config.ts`](../prisma.config.ts)).

---

## Models

### Per-user

| Model | Purpose | Key fields |
|-------|---------|------------|
| `User` | Account + balance-sheet items | `email`, `passwordHash`, `cashAmount`, `debtAmount`, `realEstateAmount` |
| `Session` | Login sessions | `token`, `expiresAt` |
| `PasswordResetToken` | Reset flow | `tokenHash`, `expiresAt`, `usedAt` |
| `Asset` | One holding | `symbol`, `type` (Stock / ETF / Crypto / Cash), `quantity`, `avgCost`, `currentPrice`, `source` (MANUAL / SYNCED), `groupId?`, `connectionId?` |
| `AssetGroup` | User-defined group | `name` |
| `BrokerConnection` | Plaid item | `itemId`, `accessTokenEnc`, `status`, `lastSyncedAt` |
| `UserActivity` | Event log | `type` (REGISTER, LOGIN, DASHBOARD_VIEW, ASSET_*) |

Deleting a `User` cascades to everything above. Deleting a `BrokerConnection` deletes its synced `Asset`s; deleting a group only un-groups its assets.

### Shared market data

| Model | Key | Written by |
|-------|-----|-----------|
| `DailyMarketPrice` | `(symbol, date)` | `mle/scripts/sync_prices.py` (Yahoo OHLCV) and `lib/market/symbol-lifecycle.ts` (close-only backfill) |
| `MarketFeature` | `(symbol, date)` | `mle/scripts/compute_market_features.py` and `lib/market/symbol-lifecycle.ts` |

`MarketFeature` columns: `ma20`, `return7d`, `return30d`, `returnYtd`, `return1y`, `volatility7d`, `volatility30d`, `volatilityYtd`, `volatility1y`. Definitions in [`mle/README.md`](../../mle/README.md#compute-market-features).

`symbol` matches `Asset.symbol` (e.g. `BTC`, not `BTC-USD`).

---

## Migrations

| Migration | Change |
|-----------|--------|
| `20260602180000_init` | Users (with cash / debt), sessions, reset tokens, assets, activity |
| `20260714120000_portfolio_redesign` | `ETF` asset type, `realEstateAmount`, `Basket` tables |
| `20260714130000_asset_groups` | Replaces baskets with `AssetGroup` + `Asset.groupId` |
| `20260715120000_daily_market_price` | `DailyMarketPrice` |
| `20260728220000_broker_plaid_sync` | `Cash` asset type, `BrokerConnection`, `Asset.source` / `externalId` / `connectionId` |
| `20260728230000_market_feature` | `MarketFeature` (MA20, 7d / 30d) |
| `20260728240000_market_feature_extended` | YTD / 1Y returns and 7d / YTD / 1Y volatility |

The Python ETL writes these tables with raw SQL, so renaming a column here requires updating `mle/scripts/` too.
