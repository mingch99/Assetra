# Assetra

**Build your Financial City. Learn investing through your own portfolio.**

Assetra is a gamified personal finance product where users grow a **Financial City** through daily activity, micro-lessons, and portfolio-aware missions — powered by **Assetra Engine** for holdings, risk, and market analytics.

**Live demo:** [assetra-eight.vercel.app](https://assetra-eight.vercel.app)  
**Status:** Engine dashboard live · Financial City experience in development (M0–M1)

---

## Why Assetra

**Problem** — People want to invest but financial knowledge is fragmented, learning feels disconnected from their holdings, and portfolio trackers show numbers without explaining *why they matter*.

**Solution** — Turn portfolio insights into city missions, pair micro-lessons with the user's real assets, and make progress visible through a city that grows with knowledge, habits, and portfolio health.

---

## How it works

```text
Track  →  Insight  →  Learn  →  Apply  →  Grow
```

Log activity and holdings → Engine surfaces insights → complete lessons and missions → try simulations → unlock buildings and expand your city.

Details: [`docs/product/PRD.md`](docs/product/PRD.md)

---

## Product

**Assetra** is the product. It has two parts:

| Part | Role |
|------|------|
| [**Financial City**](docs/product/PRD.md#financial-city-experience-layer) | Experience layer — learning, missions, gamification, city UI |
| [**Assetra Engine**](docs/engine/README.md) | Analytics backend — portfolio, risk, market data, AI |

```text
Assetra
├── Financial City          (WIP)
│   ├── Learning
│   ├── Missions
│   └── Gamification
│
└── Assetra Engine          (live)
    ├── Portfolio
    ├── Risk
    ├── Market Data
    └── AI
```

Naming & architecture: [`docs/architecture/system-design.md`](docs/architecture/system-design.md)

---

## MVP (summary)

**Financial City (building):** onboarding, city home, daily check-in, 5 micro-lessons, quiz + XP + building unlock.

**Engine (shipped):** portfolio dashboard, live quotes, Plaid import, risk snapshot, market ETL, AI advisor, auth, EN/ZH.

Full scope, non-goals, and acceptance criteria: [`docs/product/PRD.md`](docs/product/PRD.md)

---

## Architecture

```text
Financial City (experience)  →  missions, lessons, XP
         │
Assetra Engine (analytics)   →  portfolio · quotes · risk · MLE · AI
         │
PostgreSQL + external APIs   →  Neon · Finnhub · Plaid · Yahoo · OpenAI
```

---

## Roadmap

| Milestone | Focus | Status |
|-----------|-------|--------|
| **M0** | PRD, docs, user flow | In progress |
| **M1** | Playable city prototype | Planned |
| **M2** | Learning system (5 modules) | Planned |
| **M3** | Gamification engine | Planned |
| **M4** | Engine → mission integration | Planned |
| **M5** | What-if simulator | Planned |
| **M6** | User validation (20–50 users) | Planned |
| **M7** | Mobile (post-validation) | Planned |

Details: [`docs/product/roadmap.md`](docs/product/roadmap.md)

We will validate engagement through D7 retention, lesson completion, weekly sessions, mission completion, and portfolio connection. Hypotheses and definitions: [`docs/product/metrics.md`](docs/product/metrics.md)

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **App** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **Data** | Prisma · PostgreSQL (Neon) |
| **Engine APIs** | Finnhub · Plaid · CoinGecko · OpenAI |
| **MLE** | Python 3.12 · yfinance · pandas · GitHub Actions |

---

## Repository

```text
Assetra/
├── README.md
├── docs/
│   ├── product/           # PRD, roadmap, metrics, user journey
│   ├── engine/            # Engine setup & deploy
│   └── architecture/      # System design
├── frontend/              # Next.js (Engine + future City UI)
├── mle/                   # Market data ETL
└── .github/workflows/
```

---

## Getting started

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env
npm install && npx prisma migrate deploy && npm run dev
```

Engine setup, env vars, MLE, and deploy: [`docs/engine/README.md`](docs/engine/README.md)

---

## Disclaimer

Assetra provides **financial education and portfolio analytics**, not investment advice, brokerage, or tax services. Users are responsible for their own financial decisions.

---

## License

[MIT](LICENSE) © 2026 Mingcheng Fan

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Product PRD](docs/product/PRD.md) | Vision, users, MVP, principles, glossary |
| [Roadmap](docs/product/roadmap.md) | Milestones, engineering deliverables, status |
| [User journey](docs/product/user-journey.md) | Day 1 → Day 7 experience |
| [Metrics](docs/product/metrics.md) | Success metrics and validation hypotheses |
| [Engine](docs/engine/README.md) | Portfolio engine — setup, architecture, deploy |
| [System design](docs/architecture/system-design.md) | Product architecture and naming |
| [MLE](mle/README.md) | Market data pipeline |
