# Assetra

**Build today. Unlock more choices tomorrow.**

Assetra is a gamified investing and financial education platform where users build **Lumitopia** — a city that grows as they learn, build better financial habits, and understand their own portfolio. Behind it, **Atlas** serves as the intelligence engine, turning portfolio holdings, risk, and market data into personalized insights, missions, and learning experiences.

**Live demo:** [Assetra](https://assetra-eight.vercel.app)  
**Status:** Atlas engine live · Lumitopia in development

---

## Why Assetra

**Problem** — Investing is easy to start, but hard to understand. Financial knowledge is fragmented, education feels disconnected from real portfolios, and traditional portfolio trackers show users what is happening without explaining *why it matters*.

**Solution** — Assetra turns investing into a personalized learning experience. Portfolio insights become missions, financial concepts connect to the user’s real holdings, and progress comes to life through **Lumitopia** — a city that grows with their knowledge, habits, and portfolio health.

---

## How it works

```text
Track  →  Insight  →  Learn  →  Apply  →  Grow
```

Log activity and holdings → **Atlas** surfaces personalized insights → complete lessons and missions → try simulations → unlock buildings and grow **Lumitopia**.

Details: [`docs/product/PRD.md`](docs/product/PRD.md)

---

## Product

**Assetra** is the product. It is built around two core systems:

| Part | Role |
|------|------|
| [**Lumitopia**](docs/product/PRD.md#lumitopia-experience-layer) | Experience layer — city, learning, missions, and gamification |
| [**Atlas**](docs/engine/README.md) | Intelligence layer — portfolio analytics, risk, market data, and AI |

```text
Assetra
├── Lumitopia               (in development)
│   ├── City
│   ├── Learning
│   ├── Missions
│   └── Progress
│
└── Atlas                   (live)
    ├── Portfolio
    ├── Risk
    ├── Market Data
    └── AI
```

Naming & architecture: [`docs/architecture/system-design.md`](docs/architecture/system-design.md)

---

## MVP (summary)

**Lumitopia (in development):** onboarding, city home, daily check-ins, 5 micro-lessons, quizzes, XP, and building unlocks.

**Atlas (live):** portfolio dashboard, live quotes, Plaid import, risk analytics, market ETL, AI advisor, authentication, and EN/ZH support.

Full scope, non-goals, and acceptance criteria: [`docs/product/PRD.md`](docs/product/PRD.md)

---

## Architecture

```text
┌───────────────────────────────────────────────┐
│                   Lumitopia                   │
│                Experience Layer               │
│      City · Learning · Missions · Progress    │
└───────────────────────┬───────────────────────┘
                        │
                 insights · actions
                        │
┌───────────────────────▼───────────────────────┐
│                     Atlas                     │
│               Intelligence Layer              │
│    Portfolio · Risk · Market Data · MLE · AI  │
└───────────────────────┬───────────────────────┘
                        │
                  data · services
                        │
┌───────────────────────▼───────────────────────┐
│            Data & External Services           │
│ PostgreSQL · Finnhub · Plaid · Yahoo · OpenAI │
└───────────────────────────────────────────────┘
```

Detailed system architecture: [`docs/architecture/system-design.md`](docs/architecture/system-design.md).

---

## Roadmap

| Milestone | Focus | Status |
|-----------|-------|--------|
| **M0** | PRD, docs, and user flow | In progress |
| **M1** | Playable Lumitopia prototype | Planned |
| **M2** | Learning system (5 modules) | Planned |
| **M3** | Progress & gamification system | Planned |
| **M4** | Atlas → Lumitopia integration | Planned |
| **M5** | What-if portfolio simulator | Planned |
| **M6** | User validation (20–50 users) | Planned |
| **M7** | Mobile experience (post-validation) | Planned |

Details: [`docs/product/roadmap.md`](docs/product/roadmap.md)

We will validate engagement through D7 retention, lesson completion, weekly sessions, mission completion, and portfolio connection. Hypotheses and definitions: [`docs/product/metrics.md`](docs/product/metrics.md)

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 |
| **Backend** | FastAPI · Prisma |
| **Database** | PostgreSQL (Neon) |
| **Atlas / MLE** | Python 3.12 · pandas · yfinance |
| **External services** | Finnhub · Plaid · CoinGecko · OpenAI |
| **CI/CD** | GitHub Actions |

---

## Repository

```text
Assetra/
├── README.md
├── docs/
│   ├── product/           # PRD, roadmap, metrics, user journey
│   ├── atlas/             # Atlas setup & deployment
│   └── architecture/      # System design
├── frontend/              # Next.js app (Atlas + Lumitopia)
├── mle/                   # Market data ETL
└── .github/workflows/     # CI/CD and scheduled jobs
```

---

## Getting started

```bash
git clone https://github.com/mingch99/Assetra.git
cd Assetra/frontend
cp .env.example .env
npm install && npx prisma migrate deploy && npm run dev
```

Atlas setup, environment variables, MLE, and deployment: [`docs/atlas/README.md`](docs/atlas/README.md)

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
| [Product PRD](docs/product/PRD.md) | Vision, target users, MVP, principles, and glossary |
| [Roadmap](docs/product/roadmap.md) | Milestones, engineering deliverables, and status |
| [User journey](docs/product/user-journey.md) | Day 1 → Day 7 Lumitopia experience |
| [Metrics](docs/product/metrics.md) | Success metrics and validation hypotheses |
| [Atlas](docs/atlas/README.md) | Intelligence engine — setup, architecture, and deployment |
| [System design](docs/architecture/system-design.md) | Assetra architecture, system boundaries, and naming |
| [MLE](mle/README.md) | Market data and ETL pipeline |
