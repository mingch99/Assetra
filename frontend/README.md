# Assetra — frontend

The Next.js app: dashboard UI, API route handlers, database access and the AI advisor. There is no separate backend; everything server-side runs in route handlers.

Setup, env vars and deployment: [`docs/setup.md`](../docs/setup.md).

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

> This project uses Next.js 16, which has breaking changes from earlier versions. See [`AGENTS.md`](AGENTS.md).

---

## Layout

```text
frontend/
├── app/
│   ├── page.tsx              # Login / register
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── forgot-password/      # Request reset email
│   ├── reset-password/       # Set new password from emailed token
│   └── api/                  # Route handlers (see below)
├── components/               # Dashboard UI components
├── lib/                      # Server-side domain logic + client API wrappers → lib/README.md
├── ai-agent/                 # Self-contained AI advisor module → ai-agent/README.md
├── prisma/                   # Schema and migrations → prisma/README.md
└── types/asset.ts            # Shared Asset / Group / HistoryRange types
```

---

## Pages

| Route | Contents |
|-------|----------|
| `/` | Login / register |
| `/dashboard` | `PortfolioCard` (totals, cash / debt / real estate), `ReturnVolatilityCard`, `AllocationChart`, `AssetTable` (holdings, groups, broker import), `AgentChatWidget` |
| `/forgot-password`, `/reset-password` | Password reset flow |

---

## Components

| Component | Role |
|-----------|------|
| `PortfolioCard` | Total assets, debt, net equity, P&L; edit cash / debt / real estate |
| `AllocationChart` | Allocation by type, group or crypto bucket |
| `ReturnVolatilityCard` | Portfolio return / volatility from stored market features |
| `AssetTable` | Holdings list with live prices and P&L; hosts `AddAssetMenu` and `GroupManager` |
| `AddAssetMenu` | Entry point for `AssetForm` (manual add with symbol search) and `BrokerImportControls` (Plaid) |
| `GroupManager` | Create, rename, delete groups |
| `PortfolioValueChart` | Value over time for 7d / 30d / 90d / YTD / 1Y — **not rendered anywhere yet** |
| `UserMenu` | Profile, password change, account deletion, logout |
| `LanguageSwitcher` | EN / 中文 |

---

## API routes

All routes except auth entry points and the Plaid webhook require a session cookie and return `{ data }` or `{ error }`.

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/register` · `login` · `logout` · `me` | POST / GET | Session auth |
| `/api/auth/profile` · `password` · `account` | PUT / DELETE | Profile, password, account deletion |
| `/api/auth/forgot-password` · `reset-password` | POST | Password reset |
| `/api/assets` | GET, POST | List / create holdings |
| `/api/assets/[id]` | GET, PUT, DELETE | Single holding |
| `/api/groups`, `/api/groups/[id]` | CRUD | Asset groups |
| `/api/portfolio` | GET, PUT | Cash, debt, real-estate amounts |
| `/api/portfolio/history?range=` | GET | Value history (`7d`, `30d`, `90d`, `ytd`, `1y`) |
| `/api/portfolio/risk` | GET | Weighted return / volatility from `MarketFeature` |
| `/api/quotes` | GET | Live quotes for the user's holdings |
| `/api/symbols/search?q=` | GET | US stock / ETF (Finnhub) and supported crypto search |
| `/api/broker/link/token` · `link/exchange` | POST | Plaid Link flow |
| `/api/broker/connections`, `connections/[id]` | GET, DELETE | List / disconnect brokers |
| `/api/broker/sync` | POST | Re-sync broker holdings |
| `/api/broker/webhook` | POST | Plaid webhook (no session) |
| `/api/ai-agent/chat` | POST | Streaming AI advisor reply |

---

## Conventions

- Route handlers stay thin: auth → parse → call `lib/*` → respond.
- Database access only through `lib/*` (via `lib/prisma.ts`), never from components.
- Client components call the API through `lib/api/*`, not `fetch` directly.
- All UI strings go through `lib/i18n` (`en.ts` and `zh.ts` must have the same keys).
- All amounts are USD.
