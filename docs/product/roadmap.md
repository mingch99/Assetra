# Roadmap

**Legend:** `Done` · `Next` · `Later`

---

## Done — MVP core

| Area | Delivered |
|------|-----------|
| **Accounts** | Email/password auth, sessions, password reset (Resend), profile, account deletion |
| **Holdings** | Manual CRUD with symbol search, groups, cash / debt / real estate |
| **Broker import** | Plaid Investments link, sync, webhook, encrypted access tokens |
| **Quotes** | Finnhub (US equities), CoinGecko (crypto) |
| **Charts** | Allocation chart, return / volatility card |
| **Market data ETL** | Yahoo daily OHLCV → `DailyMarketPrice` → `MarketFeature`, weekday cron |
| **In-app backfill** | ~1y history fetched when a symbol is first added; data purged when no longer held |
| **AI advisor** | OpenAI streaming chat with portfolio context, EN / ZH |
| **Quality** | MLE unit tests + CI |

---

## Next

| Item | Why | Notes |
|------|-----|-------|
| **AI advisor reads market history** | This is what the daily data was collected for. Today the advisor only sees holdings and live quotes, so it can't answer "how volatile has my portfolio been this month?" | Add latest `MarketFeature` per holding and the portfolio risk snapshot to the context in `lib/integrations/ai-agent/portfolio-context-loader.ts` |
| **Value-history chart on dashboard** | `components/PortfolioValueChart.tsx` and `GET /api/portfolio/history` exist but nothing renders the chart | Add it to `app/dashboard/page.tsx` |
| **Frontend CI** | No automated checks on the Next.js app | `npm run lint` + `tsc --noEmit` on push / PR |
| **Single source for features** | Feature math exists in both Python (`mle/`) and TypeScript (`lib/market/features.ts`) | Keep them in sync or make one the only writer |

---

## Later

| Item | Notes |
|------|-------|
| AI advisor tool calls | Let the agent query price history for any range instead of a fixed snapshot |
| Deeper risk metrics | Correlation between holdings, max drawdown, VaR |
| Portfolio snapshots | Store daily portfolio value so history reflects past trades, not just current holdings |
| Frontend unit tests | Portfolio math, risk weighting |

---

## Out of scope

See [PRD — Non-goals](PRD.md#non-goals-mvp). The earlier gamified-learning plan is archived in [`docs/archive/lumitopia/`](../archive/lumitopia/README.md).
