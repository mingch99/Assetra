# Assetra — Product Requirements (MVP)

Summary lives in the [root README](../../README.md).

---

## Goal

Give an individual investor **one place to see their full financial position** — what they own, what they owe, and how it is performing — and an **AI advisor that answers questions using that real data** instead of generic advice.

---

## Problem

- Holdings are spread across brokers, exchanges and bank accounts; there is no single view of net worth.
- Brokerage apps show positions but not debt, cash or real estate, so the user can't see leverage or liquidity.
- Generic AI chatbots don't know what the user owns, so their answers about "my portfolio" are guesses.
- Answering "how risky has my portfolio been lately?" needs price history, which most personal trackers don't keep.

---

## Target user

Individual investors holding a mix of US stocks, ETFs and crypto who want a consolidated view and plain-language analysis.

**Not targeting:** day traders, professional portfolio managers, users looking for buy/sell signals.

---

## MVP scope

### 1. Financial position

| Requirement | Status |
|-------------|--------|
| Account registration, login, password reset by email | Done |
| Add / edit / delete holdings (Stock, ETF, Crypto) with symbol search | Done |
| Record cash, debt and real-estate amounts | Done |
| Import holdings from a broker via Plaid Investments | Done |
| Group holdings into custom groups | Done |

### 2. Visualization

| Requirement | Status |
|-------------|--------|
| Summary: total assets, debt, net equity, unrealized P&L | Done |
| Allocation chart (by type, group, crypto bucket) | Done |
| Portfolio value over time (7d / 30d / 90d / YTD / 1Y) | Built (`PortfolioValueChart` + `/api/portfolio/history`), **not yet rendered on the dashboard** |
| Return and volatility card (7d / 30d / YTD / 1Y) | Done |
| English / 中文 UI | Done |

### 3. Daily market data

| Requirement | Status |
|-------------|--------|
| Store daily OHLCV for every symbol any user holds (`DailyMarketPrice`) | Done |
| Derive per-symbol features: MA20, returns, annualized volatility (`MarketFeature`) | Done |
| Run automatically every weekday after US close | Done |
| Backfill ~1 year of history when a new symbol is added | Done |
| Purge market data for symbols no user holds any more | Done |

### 4. AI advisor

| Requirement | Status |
|-------------|--------|
| Streaming chat panel on the dashboard | Done |
| Context: holdings, allocation, cash, debt, groups, live quotes | Done |
| Context: stored market history and features | **Not yet** — see [roadmap](roadmap.md) |
| Answers in the user's UI language | Done |

---

## Non-goals (MVP)

- Buy/sell recommendations or trade execution
- Licensed financial advice
- Transaction-level history (cost basis comes from user input or the broker)
- Budgeting and expense tracking
- Non-US equities or non-USD currencies
- Native mobile apps
- Payments / subscriptions

---

## Principles

1. **Your data, not generic data** — every number and AI answer is grounded in the user's own holdings.
2. **Explain, don't prescribe** — the advisor analyzes and explains; it does not tell users what to buy or sell.
3. **Don't invent numbers** — if data is missing, say so.
4. **Store once, reuse** — market data is shared across users and computed offline, not fetched per request.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Holding / Asset** | A position the user owns (Stock, ETF, Crypto, or Cash-type asset) |
| **Group** | User-defined bundle of holdings |
| **Net equity** | Total assets − debt |
| **DailyMarketPrice** | One stored daily bar (OHLCV) per symbol per date |
| **MarketFeature** | Features derived from daily bars (MA20, returns, volatility) per symbol per date |
| **Risk snapshot** | Value-weighted portfolio return / volatility from the latest `MarketFeature` rows |
| **AI advisor** | Chat assistant that receives the user's portfolio as context |
