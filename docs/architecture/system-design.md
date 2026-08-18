# System design

Product architecture and naming for Assetra.

---

## Naming model

```text
Assetra                    ← product (brand)
├── Financial City         ← experience layer
│   ├── Learning
│   ├── Missions
│   └── Gamification
│
└── Assetra Engine         ← analytics backend
    ├── Portfolio
    ├── Risk
    ├── Market Data
    └── AI
```

| Name | Layer | User-facing? | Repo (today) |
|------|-------|--------------|--------------|
| **Assetra** | Product | Yes (brand) | Root, marketing |
| **Financial City** | Experience | Yes | `frontend/app/city/` *(planned)* |
| **Assetra Engine** | Analytics | Mostly internal | `frontend/` APIs, `mle/` |

### Copy guidelines

- ✅ "Welcome to Assetra" / "Build your Financial City"
- ✅ "Your portfolio health" (Engine output surfaced in city)
- ❌ "Assetra analyzes your city" (ambiguous)
- ❌ "Assetra Engine dashboard" in consumer UI (use "Portfolio" or "Insights")

Glossary: [docs/product/glossary.md](../product/glossary.md)

---

## Two-layer architecture

```text
┌──────────────────────────────────────────────────┐
│              Financial City (WIP)                │
│   City UI · Lessons · Quizzes · Missions · XP    │
└────────────────────────┬─────────────────────────┘
                         │ REST / server actions
                         │ missions, health, context
┌────────────────────────▼─────────────────────────┐
│                 Assetra Engine                   │
│  ┌────────────┐ ┌────────┐ ┌──────────┐ ┌─────┐ │
│  │ Portfolio  │ │  Risk  │ │  Market  │ │ AI  │ │
│  │ CRUD·Plaid │ │ metrics│ │ ETL·quotes│ │chat│ │
│  └────────────┘ └────────┘ └──────────┘ └─────┘ │
└────────────────────────┬─────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     PostgreSQL      │
              │  User · Asset ·     │
              │  DailyMarketPrice · │
              │  MarketFeature ·    │
              │  (City tables TBD)  │
              └─────────────────────┘
```

### Data flow (target)

1. User updates holdings → Engine stores `Asset`, refreshes quotes.
2. MLE cron fills `DailyMarketPrice` → `MarketFeature`.
3. Engine computes risk / health → exposes via API.
4. Financial City reads insights → creates **Mission**.
5. User completes lesson / sim → City updates XP & buildings.
6. AI Advisor receives portfolio + mission context for explanations.

---

## Repository mapping

```text
Assetra/
├── frontend/
│   ├── app/
│   │   ├── dashboard/      # Engine UI (today)
│   │   ├── city/           # Financial City (planned)
│   │   ├── learn/          # Lessons (planned)
│   │   └── api/            # Engine APIs
│   ├── features/           # (planned) domain modules
│   ├── ai-agent/           # Engine — AI module
│   └── lib/
│       ├── market/         # Engine — risk
│       ├── prices/         # Engine — quotes
│       └── broker/         # Engine — Plaid
├── mle/                    # Engine — market ETL
└── docs/
    ├── product/
    ├── engine/
    └── architecture/       # this file
```

### Extraction boundaries (future)

| Module | Can become |
|--------|------------|
| `frontend/ai-agent/` | npm package or microservice |
| `mle/` | Scheduled worker / separate repo |
| `features/portfolio/` | Shared package if multi-app |

Financial City should depend on Engine via **API contracts**, not direct DB access from UI components.

---

## Engine subsystems (current)

| Subsystem | Key paths | External deps |
|-----------|-----------|---------------|
| **Portfolio** | `lib/assets-store`, `app/api/assets` | Prisma |
| **Quotes** | `lib/prices/finnhub`, `coingecko` | Finnhub, CoinGecko |
| **Risk** | `lib/market/portfolio-risk` | `MarketFeature` |
| **Broker** | `lib/broker/*`, Plaid routes | Plaid |
| **MLE** | `mle/scripts/*` | Yahoo Finance |
| **AI** | `ai-agent/`, `api/ai-agent/chat` | OpenAI |

Setup & deploy: [Engine README](../engine/README.md)

---

## Financial City subsystems (planned)

| Subsystem | Responsibility |
|-----------|----------------|
| **City renderer** | Map, buildings, districts, level display |
| **Progress service** | XP, coins, streaks, levels |
| **Learning service** | Lessons, quizzes, completions |
| **Mission service** | Rules engine: insight → mission |
| **Simulator** | What-if allocation (calls Engine risk) |

### Planned schema (sketch)

```text
UserProgress · UserBuilding · DailyCheckIn
Lesson · LessonCompletion · Mission · MissionCompletion
PortfolioHealthSnapshot
```

Full PRD: [docs/product/PRD.md](../product/PRD.md)

---

## CI / ops

| Workflow | Scope |
|----------|-------|
| `mle-ci.yml` | Python unit tests |
| `sync-daily-prices.yml` | Market ETL cron |
| *(planned)* `frontend-ci.yml` | Lint, typecheck, tests |

---

## Related

- [Product PRD](../product/PRD.md)
- [Roadmap](../product/roadmap.md)
- [Engine README](../engine/README.md)
