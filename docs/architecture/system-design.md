# System design

Product architecture and naming for Assetra.

---

## Naming model

```text
Assetra                    ← product (brand)
├── Lumitopia              ← experience layer
│   ├── City
│   ├── Learning
│   ├── Missions
│   └── Progress
│
└── Atlas                  ← intelligence layer
    ├── Portfolio
    ├── Risk
    ├── Market Data
    └── AI
```

| Name | Layer | User-facing? | Repo (today) |
|------|-------|--------------|--------------|
| **Assetra** | Product | Yes (brand) | Root, marketing |
| **Lumitopia** | Experience | Yes | `frontend/app/lumitopia/` *(planned)* |
| **Atlas** | Intelligence | Mostly internal | `frontend/` APIs, `mle/` |

### Copy guidelines

- ✅ "Welcome to Assetra" / "Build your city in Lumitopia"
- ✅ "Your portfolio health" (Atlas output surfaced in Lumitopia)
- ❌ "Assetra analyzes your city" (ambiguous)
- ❌ "Atlas dashboard" in consumer UI (use "Portfolio" or "Insights")

Glossary: [docs/product/glossary.md](../product/glossary.md)

---

## Two-layer architecture

```text
┌──────────────────────────────────────────────────┐
│              Lumitopia (in development)          │
│   City · Learning · Missions · Progress          │
└────────────────────────┬─────────────────────────┘
                         │ REST / server actions
                         │ missions, health, context
┌────────────────────────▼─────────────────────────┐
│                     Atlas                        │
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

1. User updates holdings → Atlas stores `Asset`, refreshes quotes.
2. MLE cron fills `DailyMarketPrice` → `MarketFeature`.
3. Atlas computes risk / health → exposes via API.
4. Lumitopia reads insights → creates **Mission**.
5. User completes lesson / sim → Lumitopia updates XP & buildings.
6. AI Advisor receives portfolio + mission context for explanations.

---

## Repository mapping

```text
Assetra/
├── frontend/
│   ├── app/
│   │   ├── dashboard/         # Atlas UI (today)
│   │   ├── lumitopia/         # Lumitopia city (planned)
│   │   ├── learn/             # Learning (planned)
│   │   └── api/               # Atlas APIs
│   ├── features/              # (planned) domain modules
│   ├── ai-agent/              # Atlas — AI module
│   └── lib/
│       ├── market/            # Atlas — risk
│       ├── prices/            # Atlas — quotes
│       └── broker/            # Atlas — Plaid
├── mle/                       # Atlas — market ETL
└── docs/
    ├── product/
    ├── atlas/                 # this layer's setup docs
    └── architecture/          # this file
```

### Extraction boundaries (future)

| Module | Can become |
|--------|------------|
| `frontend/ai-agent/` | npm package or microservice |
| `mle/` | Scheduled worker / separate repo |
| `features/portfolio/` | Shared package if multi-app |

Lumitopia should depend on Atlas via **API contracts**, not direct DB access from UI components.

---

## Atlas subsystems (current)

| Subsystem | Key paths | External deps |
|-----------|-----------|---------------|
| **Portfolio** | `lib/assets-store`, `app/api/assets` | Prisma |
| **Quotes** | `lib/prices/finnhub`, `coingecko` | Finnhub, CoinGecko |
| **Risk** | `lib/market/portfolio-risk` | `MarketFeature` |
| **Broker** | `lib/broker/*`, Plaid routes | Plaid |
| **MLE** | `mle/scripts/*` | Yahoo Finance |
| **AI** | `ai-agent/`, `api/ai-agent/chat` | OpenAI |

Setup & deploy: [Atlas README](../atlas/README.md)

---

## Lumitopia subsystems (planned)

| Subsystem | Responsibility |
|-----------|----------------|
| **City** | Map, buildings, districts, level display |
| **Progress** | XP, coins, streaks, levels |
| **Learning** | Lessons, quizzes, completions |
| **Missions** | Rules engine: insight → mission |
| **Simulator** | What-if allocation (calls Atlas risk) |

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
- [Atlas README](../atlas/README.md)
