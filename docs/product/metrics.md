# Success metrics

How we measure whether Assetra's core loop works. **All targets below are hypotheses** — not validated benchmarks — until M6 user testing completes.

---

## North star (qualitative)

> "If this app disappeared tomorrow, would you miss it?"

Used in M6 interviews alongside quantitative metrics.

---

## Primary metrics

| Metric | Definition | How measured | MVP hypothesis |
|--------|------------|--------------|----------------|
| **D7 retention** | % of new signups with ≥1 session on day 7 | Auth + activity log | > 25% |
| **Lesson completion rate** | Quizzes passed ÷ lessons started | `LessonCompletion` | > 60% |
| **Weekly sessions** | Avg. sessions per WAU per week | Session / check-in events | ≥ 3 |
| **Mission conversion** | Missions completed ÷ missions shown | Mission state machine | > 40% |
| **Portfolio connect rate** | Users with ≥1 holding ÷ signups | `Asset` count per user | > 50% |

---

## Secondary metrics

| Metric | Definition | Notes |
|--------|------------|-------|
| **D1 / D14 retention** | Same as D7 at day 1 and 14 | Funnel context |
| **Streak length (median)** | Consecutive check-in days | M3+ |
| **Time to first lesson** | Signup → first quiz complete | Onboarding quality |
| **Time to first mission** | Signup → first mission complete | M4+ |
| **Building unlock rate** | Buildings unlocked per active user | Engagement depth |
| **Advisor opens** | AI chat sessions per WAU | Optional; not primary for M1–M3 |

---

## Three-axis health (product)

Track distribution across user cohorts — not a single score:

| Axis | Proxy metric |
|------|----------------|
| **Knowledge** | Lessons completed, quiz scores |
| **Habits** | Check-in rate, streak, review frequency |
| **Portfolio Health** | Atlas health score when available |

Example segment: high Knowledge + low Portfolio Health → prioritize mission + sim content.

---

## M6 validation plan

1. **Cohort:** 20–50 users, 2–4 week test window.
2. **Instrument:** Minimal event logging (signup, lesson_start, lesson_complete, check_in, mission_view, mission_complete, asset_create).
3. **Weekly:** Review retention + completion dashboards.
4. **Exit interview:** North star question + "what would you change?"
5. **Decision:** Proceed to M7 / paid features if D7 and lesson completion meet or approach hypotheses.

---

## What we publish externally

Root [README](../../README.md) states *what* we measure, not numeric targets. This doc holds hypotheses and definitions for internal use.

---

## Related

- [PRD](./PRD.md)
- [Roadmap — M6](./roadmap.md#m6--user-validation)
- [User journey](./user-journey.md)
