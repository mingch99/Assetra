# Assetra — Product Requirements (PRD)

> Internal product document. Summary lives in the [root README](../../README.md).

---

## Vision

Help people become better investors over time — not by reading generic articles, but by **learning through their own money**.

> In six months on Assetra, a user should understand their portfolio, build better habits, and make more informed financial decisions than when they started.

---

## Naming

| Term | Definition |
|------|------------|
| **Assetra** | The product (umbrella brand) |
| **Lumitopia** | Experience layer — city, learning, missions, progress |
| **Atlas** | Intelligence layer — portfolio, risk, market data, AI |

Do not use "Assetra" interchangeably for city vs. intelligence layer in docs or UI copy. See [system design](../architecture/system-design.md).

---

## Problem

Many people want to invest but:

- Financial knowledge is fragmented (YouTube, articles, ChatGPT).
- Learning feels boring and disconnected from their actual holdings.
- Portfolio trackers show data but not **why it matters**.
- There is little motivation to review finances consistently.

---

## Target user

**Primary (v1):** Young adults starting to invest — curious, holding a small portfolio (stocks / ETFs / crypto), lacking structured financial literacy.

**Not targeting (v1):** Professional traders, day traders, users seeking stock-picking signals.

---

## Value proposition

| For users | What Assetra offers |
|-----------|---------------------|
| **Engagement** | A city in Lumitopia that grows as they learn and act |
| **Personalization** | Lessons and missions tied to *their* portfolio |
| **Clarity** | Engine-backed insights explained in plain language |
| **Habit** | Daily check-ins, streaks, progress across three axes |

### Product strategy (internal)

> Education is acquisition. Personalization is retention.

Free layer: lessons, basic tracking, basic portfolio health.  
Paid layer (future): advanced analytics, AI coach, simulation, goal-based allocation, reviews.

---

## Core loop

```text
Track  →  Insight  →  Learn  →  Apply  →  Grow
  │          │          │         │         │
  │          │          │         │         └─ City expands (buildings, districts)
  │          │          │         └─ Simulator / rebalance preview
  │          │          └─ Micro-lesson + quiz (+XP)
  │          └─ Mission from portfolio (e.g. concentration risk)
  └─ Log activity / update portfolio
```

**Example:** 58% tech exposure → Risk District mission → Diversification lesson → what-if rebalance → unlock 🏘️ Diversification Apartments.

---

## Lumitopia (experience layer)

### Three progress axes

City growth reflects **maturity**, not portfolio size.

| Axis | Meaning | Driven by |
|------|---------|-----------|
| **Knowledge** | What you understand | Lessons, quizzes, simulations |
| **Habits** | Consistency | Check-ins, reviews, streaks |
| **Portfolio Health** | How holdings look | Atlas metrics |

### Resource model

| Resource | Source | Purpose |
|----------|--------|---------|
| **Coins** | Activity (check-in, logging) | Engagement currency |
| **XP** | Lessons, quizzes | Knowledge progression |
| **Buildings** | Unlocked concepts | Visual skill tree |

Principle: **Track → Learn → Apply → Build** — not "trade → reward".

---

## Atlas (intelligence layer)

Powers holdings, quotes, risk, market ETL, and portfolio-aware AI. Users rarely see "Atlas" as a brand; insights surface as Lumitopia missions and copy.

Current capabilities: [Atlas README](../atlas/README.md)

---

## MVP features

### Must have (M1–M3)

- [ ] User onboarding
- [ ] Lumitopia city home (level, XP, buildings)
- [ ] Daily financial check-in
- [ ] 5 micro-lessons: Saving, Compound, Stocks, ETF, Diversification
- [ ] Quiz + XP + building unlock
- [ ] Progress persistence (DB)

### Should have (M4–M5)

- [ ] Portfolio Health Score
- [ ] Insight → Mission pipeline
- [ ] Atlas integration (risk API → missions)
- [ ] What-if rebalance simulator
- [ ] AI mission explanations (portfolio context)

### Atlas — already built

- [x] Portfolio dashboard, groups, auth, EN/ZH
- [x] Live quotes, Plaid import, risk snapshot
- [x] Market ETL + MLE CI
- [x] AI Portfolio Advisor

---

## Non-goals (v1)

- Native iOS / Android
- 50+ lesson library
- Social / leaderboards
- Stock recommendations or "AI pick"
- Licensed financial advisory
- Full SimCity-scale city builder
- Bank budgeting (beyond investing)
- Subscription / payments

---

## Design principles

1. **Learn your money** — lessons link to the user's portfolio when possible.
2. **Track → Learn → Apply → Build** — reward learning and review, not over-trading.
3. **Insights become missions** — raw metrics stay in Atlas; users see Lumitopia tasks.
4. **Explain, don't prescribe** — no buy/sell calls in v1.
5. **City reflects maturity** — progress = knowledge + habits + health, not balance.

---

## Glossary

See dedicated [glossary](./glossary.md) or quick reference:

| Term | Meaning |
|------|---------|
| **District** | Themed city area (Risk, Portfolio, Market…) |
| **Building** | Unlocked concept (e.g. Diversification Apartments) |
| **Mission** | Task triggered by a portfolio insight |
| **Health Score** | Composite portfolio quality (planned) |

---

## Related docs

- [Roadmap](./roadmap.md)
- [User journey](./user-journey.md)
- [Metrics](./metrics.md)
- [System design](../architecture/system-design.md)
- [Atlas](../atlas/README.md)
