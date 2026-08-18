# User journey — Day 1 → Day 7

Target experience for MVP validation. Assumes Lumitopia + Atlas integration (M3–M4).

---

## Day 1 — First city

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Sign up / log in | Welcome to Assetra; empty city (Level 1) |
| 2 | Land on Lumitopia | Brief tutorial: "Build your city by learning and managing money" |
| 3 | Start first lesson (*Saving* or *Diversification*) | 2–3 min concept + 3-question quiz |
| 4 | Complete quiz | +30 XP; unlock first building (e.g. 🏠 Residential) |
| 5 | Optional: add first holding | Atlas records portfolio; gentle prompt, not required |

**Goal:** User understands the loop and sees one visible reward.

---

## Day 2 — Habit seed

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Daily check-in | "What did you do today?" (Saved / Invested / Learned / Reviewed) |
| 2 | Select an action | +Coins, streak = 1 → 2 |
| 3 | Short lesson or review | +XP; city level progress bar moves |

**Goal:** Second session; streak begins.

---

## Day 3 — Portfolio connects

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Add holdings or link broker | Atlas syncs quotes & allocation |
| 2 | Return to city | First **mission** appears (e.g. tech concentration) |
| 3 | Tap mission | Plain-language insight + link to relevant lesson |

**Goal:** Personalization — insight is about *their* portfolio.

---

## Day 4 — Mission completion

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Complete mission lesson | Quiz passed |
| 2 | — | Building levels up (e.g. Apartments Lv.1 → Lv.2) |
| 3 | — | Portfolio Health axis updates in city summary |

**Goal:** Learn → Apply connection feels tangible.

---

## Day 5 — Review

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Open city health panel | Three axes: Knowledge / Habits / Portfolio Health |
| 2 | Tap weak axis | Suggested next lesson or mission |
| 3 | Optional: refresh quotes | Atlas updates holdings value |

**Goal:** User knows where to improve without raw metric overload.

---

## Day 6 — Simulation

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Mission offers "Try it" | What-if simulator opens |
| 2 | Adjust allocation (e.g. tech 80% → 50%) | Risk / allocation preview updates |
| 3 | Save or dismiss | Mission progress; optional AI summary |

**Goal:** Act step of core loop; not just reading.

---

## Day 7 — Weekly recap

| Step | User action | System response |
|------|-------------|-----------------|
| 1 | Open app | Weekly recap card |
| 2 | — | XP gained, streak, buildings unlocked, health delta |
| 3 | — | Tease next district (locked → "Unlock at Level X") |

**Goal:** Reason to return next week; sense of progression.

---

## Edge cases (MVP)

| Case | Behavior |
|------|----------|
| No portfolio yet | City + lessons work; missions deferred until ≥1 holding |
| Skipped days | Streak resets; city unchanged; no punishment copy |
| Atlas insight unavailable | Generic habit missions only |

---

## Related

- [PRD](./PRD.md)
- [Roadmap](./roadmap.md)
- [Metrics](./metrics.md)
