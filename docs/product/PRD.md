# Assetra — Product Requirements (PRD)

Internal product document. Summary lives in the [root README](../../README.md).

---

## Vision

**Help people build the financial knowledge and habits that give their future selves more choices.**

---

## Product Goal

Assetra helps people become better investors over time — not by reading generic financial content, but by learning through **their own money**.

In six months on Assetra, a user should better understand their portfolio, build stronger financial habits, and make more informed investment decisions than when they started.

---

## Naming

| Term | Definition |
|------|------------|
| **Assetra** | The product |
| **Lumitopia** | Experience layer — city, learning, missions, progress |
| **Atlas** | Intelligence layer — portfolio analytics, risk, market data, and AI |

**Naming rule:** Use **Assetra** only for the overall product. Use **Lumitopia** for the experience layer and **Atlas** for the intelligence layer.

See [`docs/architecture/system-design.md`](../architecture/system-design.md) for system boundaries and architecture.

---

## Problem

Investing is easy to start, but hard to understand.

Many new investors struggle because:

- Financial knowledge is fragmented across videos, articles, social media, and AI tools.
- Learning often feels generic and disconnected from their actual holdings.
- Portfolio trackers show *what* is happening without explaining **why it matters**.
- There is little motivation to review finances and build investing habits consistently.

---

## Target user

**Primary (v1):** Young adults who are starting to invest — curious, already holding or beginning to build a portfolio across stocks, ETFs, or crypto, but lacking structured financial literacy.

**Not targeting (v1):** Professional traders, day traders, or users seeking stock-picking signals.

---

## Value proposition

| For users | What Assetra offers |
|-----------|---------------------|
| **Engagement** | Lumitopia grows as users learn and build better financial habits |
| **Personalization** | Lessons and missions connected to their own portfolio |
| **Clarity** | Atlas-powered insights explained in plain language |
| **Habit** | Daily check-ins, streaks, and visible progress across knowledge, habits, and portfolio health |

### Product hypothesis

> **Education drives discovery and engagement. Personalization drives long-term retention.**

This hypothesis will be validated through the MVP and early user testing.

### Monetization hypothesis (post-MVP)

Potential premium features may include advanced portfolio analytics, AI coaching, simulations, goal-based allocation, and personalized reviews.

Pricing and feature gating are out of scope for v1 and will be evaluated after product validation.

---

## Core loop

```text
Track  →  Insight  →  Learn  →  Apply  →  Grow
  │          │          │         │         │
  │          │          │         │         └─ City grows (buildings, districts)
  │          │          │         └─ Simulation / portfolio experiment
  │          │          └─ Micro-lesson + quiz (+XP)
  │          └─ Atlas insight → Lumitopia mission
  └─ Check in / update portfolio
```

**Example:** Atlas detects 58% technology exposure → Lumitopia creates a concentration-risk mission → user completes the Diversification lesson → explores a what-if allocation → unlocks 🏘️ Diversification Apartments.

---

## Lumitopia (experience layer)

Lumitopia is the visual representation of a user's financial journey. The city grows through learning and consistent financial habits, while its buildings reflect the user's real portfolio.

City growth reflects **financial maturity and progress, not portfolio size**. A larger portfolio should not automatically create a larger or more advanced city.

### Progress model

Lumitopia is shaped by three dimensions:

| Dimension | Represents | Effect on Lumitopia |
|-----------|------------|----------------------|
| **Knowledge** | What the user has learned | Earns **XP** and **expands the available city area** |
| **Habits** | Consistent financial engagement | Earns **Coins** used to **build and customize the city** |
| **Portfolio** | What the user owns | Influences building types, districts, and **the visual identity of the city** |

### Resource model

| Resource | Earned / determined by | Used for |
|----------|-------------------------|----------|
| **Coins** | Check-ins, reviews, missions, and other healthy financial activities | Build, upgrade, and customize buildings |
| **XP** | Lessons, quizzes, simulations, and learning challenges | Increase City Level and unlock additional city space |
| **City Level** | Accumulated XP | Determines city size and unlocks new areas and progression |
| **Buildings** | Portfolio holdings classified by Atlas | Visually represent the user's portfolio composition |
| **Districts** | Groups of related asset categories | Organize buildings and make portfolio allocation visible through the city |

### Portfolio → City mapping

Atlas classifies portfolio holdings into asset types and sectors. Lumitopia translates those classifications into buildings and districts.

Examples:

| Portfolio category | Lumitopia representation |
|--------------------|---------------------------|
| Real estate / REITs | Housing and real estate |
| Broad-market ETFs | Commercial / office buildings |
| Technology | Technology buildings |
| Financials | Banks and financial buildings |
| Healthcare | Hospitals and research facilities |
| Industrials | Factories and industrial buildings |
| Energy / Utilities | Energy infrastructure |
| Crypto | Futuristic / space-themed structures |
| Cash | Parks, reserves, or open space |

Exact mappings are subject to iteration during prototype testing.

### Core rules

1. **Knowledge expands the city** — learning earns XP, and XP unlocks more space.
2. **Habits build the city** — consistent financial activity earns Coins that users can spend on construction and customization.
3. **Your portfolio shapes the city** — holdings influence the types of buildings and districts that appear.
4. **Portfolio size does not determine city size** — progress should reflect learning and engagement rather than wealth.
5. **Reward learning, not trading** — buying or selling assets does not directly generate Coins or XP.

> **Learn → Earn → Build → Expand**

The goal is for Lumitopia to make financial progress visible: as users learn more, build better habits, and understand their portfolio, their city becomes larger, richer, and more personalized.

---

## Atlas (intelligence layer)

Atlas powers portfolio data, market intelligence, risk analytics, and portfolio-aware AI. Users primarily interact with Lumitopia; Atlas operates underneath, providing the insights and signals that Lumitopia translates into missions and learning experiences.

Current capabilities: [Atlas README](../atlas/README.md)

---

## MVP features

### M1 — Playable Lumitopia prototype

- [ ] Lumitopia city home
- [ ] 1 micro-lesson
- [ ] 1 quiz
- [ ] XP reward
- [ ] 1 building unlock
- [ ] Visible city change after completion
- [ ] Local / mock state is acceptable

### M2 — Learning system

- [ ] 5 micro-lessons: Saving, Compound Interest, Stocks, ETFs, Diversification
- [ ] Quiz system
- [ ] Learning progress
- [ ] XP progression
- [ ] User onboarding
- [ ] Progress persistence

### M3 — Progress & gamification

- [ ] Daily financial check-in
- [ ] Coins and XP
- [ ] Building unlocks
- [ ] Streaks
- [ ] City progression

### M4 — Atlas integration

- [ ] Portfolio Health signals
- [ ] Atlas insight → Lumitopia mission pipeline
- [ ] Portfolio-aware missions
- [ ] AI-assisted mission explanations

### M5 — What-if simulator

- [ ] Allocation simulation
- [ ] Risk-impact preview
- [ ] Connect simulation results to learning content

### Atlas — already built

- [x] Portfolio dashboard, groups, authentication, EN/ZH
- [x] Live quotes, Plaid import, risk analytics
- [x] Market ETL and MLE CI
- [x] AI Portfolio Advisor

---

## Non-goals (v1)

- Native iOS / Android
- 50+ lesson library
- Social / leaderboards
- Stock recommendations or "AI pick"
- Licensed financial advisory
- Full SimCity-scale city builder
- Full budgeting and expense tracking
- Subscription / payments

---

## Design principles

1. **Learn your money** — lessons link to the user's portfolio when possible.
2. **Track → Learn → Apply → Build** — reward learning and review, not over-trading.
3. **Insights become experiences** — Atlas produces portfolio intelligence; Lumitopia translates it into missions and learning experiences.
4. **Explain, don't prescribe** — no buy/sell calls in v1.
5. **City reflects maturity** — progress = knowledge + habits + health, not balance.

---

## Glossary

See dedicated [glossary](./glossary.md) or quick reference:

| Term | Meaning |
|------|---------|
| **District** | Themed area of Lumitopia tied to a financial domain |
| **Building** | Visual representation of an unlocked financial concept |
| **Mission** | Learning or review task triggered by user progress or portfolio insights |
| **Portfolio Health** | Portfolio characteristics derived from Atlas risk and diversification signals |

---

## Related docs

- [Roadmap](./roadmap.md)
- [User journey](./user-journey.md)
- [Metrics](./metrics.md)
- [System design](../architecture/system-design.md)
- [Atlas](../atlas/README.md)
