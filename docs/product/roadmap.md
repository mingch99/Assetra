# Roadmap

Engineering milestones for Assetra. Status as of project restructure.

**Legend:** `Done` · `In progress` · `Planned` · `Blocked`

---

## Overview

| Milestone | Focus | Status | Target outcome |
|-----------|-------|--------|----------------|
| **M0** | Product & docs | In progress | PRD, architecture, user flow frozen |
| **M1** | Playable prototype | Planned | 5-min city + 1 lesson loop (fake data OK) |
| **M2** | Learning system | Planned | 5 modules + quiz + completion state |
| **M3** | Gamification | Planned | XP, streaks, buildings, 7-day engagement loop |
| **M4** | Engine integration | Planned | Health score → missions from real portfolio |
| **M5** | Simulator | Planned | What-if rebalance with risk preview |
| **M6** | Validation | Planned | 20–50 users, measure retention & completion |
| **M7** | Mobile | Planned | React Native / PWA after validation |

---

## M0 — Product & documentation

**Status:** In progress

| Deliverable | Status |
|-------------|--------|
| Product PRD | Done |
| Naming & system design doc | Done |
| Root README (entry only) | Done |
| User journey doc | Done |
| Metrics hypotheses | Done |
| Figma / clickable Day 1 flow | Planned |
| Prisma schema sketch (City domain) | Planned |

**Exit criteria:** Team agrees on MVP scope and naming; no coding on M4+ before M1 slice works.

---

## M1 — Playable prototype

**Status:** Planned · **Duration:** ~1–2 weeks

| Epic | Deliverables | Status |
|------|--------------|--------|
| **City shell** | `/city` route, level + XP bar, 3–5 static buildings | Planned |
| **Learn** | 1 lesson (Diversification): concept + 3-question quiz | Planned |
| **Reward** | +XP, unlock animation, building lights up | Planned |
| **Progress** | Persist XP (localStorage or minimal DB) | Planned |

**Exit criteria:** Someone unfamiliar can complete the loop in ~5 minutes without explanation.

---

## M2 — Learning system

**Status:** Planned · **Duration:** ~1 week

| Epic | Deliverables | Status |
|------|--------------|--------|
| **Content** | 5 modules: Saving, Compound, Stocks, ETF, Diversification | Planned |
| **Schema** | `Lesson`, `LessonCompletion`, quiz scores | Planned |
| **UI** | Lesson list, player, quiz component | Planned |
| **Mapping** | Building ↔ lesson unlock rules | Planned |

**Exit criteria:** Zero-knowledge user completes all 5 modules and passes quizzes.

---

## M3 — Gamification engine

**Status:** Planned · **Duration:** ~1 week

| Epic | Deliverables | Status |
|------|--------------|--------|
| **Progress** | `UserProgress`, `UserBuilding`, `DailyCheckIn` | Planned |
| **Rules** | XP thresholds, level calc, streak logic | Planned |
| **UI** | Check-in flow, streak display, building levels | Planned |
| **Tests** | Unit tests for XP / unlock rules | Planned |

**Exit criteria:** 7 consecutive days produce visible city changes.

---

## M4 — Engine integration

**Status:** Planned · **Duration:** ~2–3 weeks

| Epic | Deliverables | Status |
|------|--------------|--------|
| **Health score** | Composite score (diversification, concentration, vol…) | Planned |
| **Missions** | Insight → mission rules (e.g. tech concentration) | Planned |
| **Bridge** | Wire `portfolio-risk`, `MarketFeature`, existing dashboard | Planned |
| **AI copy** | Mission explanation via advisor context | Planned |

**Depends on:** M1–M3, existing Engine APIs.

**Exit criteria:** Real portfolio triggers a mission + linked lesson in Financial City.

---

## M5 — What-if simulator

**Status:** Planned · **Duration:** ~2 weeks

| Epic | Deliverables | Status |
|------|--------------|--------|
| **Sim UI** | Adjust weights / sell scenario | Planned |
| **Calc** | Reuse Engine risk + allocation math | Planned |
| **Mission tie-in** | Complete sim → mission done → building upgrade | Planned |

**Exit criteria:** User answers "If I reduce tech from 80% → 50%, how does risk change?"

---

## M6 — User validation

**Status:** Planned · **Duration:** ~2–4 weeks

| Activity | Status |
|----------|--------|
| Recruit 20–50 testers | Planned |
| Instrument analytics (retention, completion) | Planned |
| Interviews (qualitative north star) | Planned |
| Frontend CI (lint + typecheck + tests) | Planned |

**Exit criteria:** Data + interviews inform go/no-go on M7 and paid features. See [metrics](./metrics.md).

---

## M7 — Mobile

**Status:** Planned · **Gate:** M6 validation passed

| Option | Notes |
|--------|-------|
| React Native / Expo | Shared TS with web |
| PWA enhancement | Lower cost first step |
| Native Swift | Only if animation / UX demands it |

---

## Engine track (parallel)

Capabilities already shipped outside city milestones:

| Capability | Status |
|------------|--------|
| Auth, holdings, groups, i18n | Done |
| Live quotes, Plaid, risk card | Done |
| MLE sync + MarketFeature + CI | Done |
| AI Portfolio Advisor | Done |
| Health Score API | Planned (M4) |
| Correlation / VaR | Planned (post-M6) |

Details: [Engine README](../engine/README.md)
