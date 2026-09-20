# GymHub

## Problem
Tracking workouts (kg / reps / RPE) and nutrition (meals, water, weight) means juggling separate apps, so logging gets skipped and progress can't be seen in one place.

## Evidence
- Assumption — needs validation via 2 weeks of personal use (logging consistency)

## Users
- **Primary**: Me — a lifter tracking progressive overload and daily calories/water/weight
- **Not for**: Coaches, teams, public users (no accounts, no social)

## Hypothesis
We believe **one app that logs sets and daily food/water/weight** will **make consistent logging easy** for **me**.
We'll know we're right when **I log ≥5 days/week for 4 straight weeks**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Logging consistency | ≥5 days/week × 4 weeks | Heat map / log count |
| Time to log a set | < 10s | Manual stopwatch |
| Time to log a meal | < 30s | Manual stopwatch |

## Scope
**MVP**
- Home: today's workout, water, calories, weight log
- Gym Hub: workout logger (kg, reps, RPE; add/remove sets), exercise library with muscle tags, GitHub-style heat map
- Nutrition: manual meal log, food library, barcode lookup (Open Food Facts), water log

**Out of scope**
- AI meal logging, photo food scan — needs a working food DB first
- Pre-meal recipes — not core to logging
- Auto workout plan by "type" — "type" is undefined
- Strength/progression stats, RPE breakdown — need weeks of data
- Muscle activity / split map / recovery & volume — build later as one engine
- Featured exercise — nice-to-have
- Accounts / cloud sync — single user, local-first

## Delivery Milestones
| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Workout logging | Log sets with kg/reps/RPE, add/remove sets, see heat map | complete (device check pending) | `.claude/PRPs/plans/completed/workout-logging.plan.md` · `.claude/PRPs/reports/workout-logging-report.md` |
| 2 | Home daily log | Today's workout + water, calories, weight on Home | pending | — |
| 3 | Nutrition basics | Manual meal log, food library, barcode lookup | pending | — |
| 4 | Muscle volume engine | Muscle activity, split map, recovery views | pending | — |
| 5 | Progression & RPE stats | Strength trends, RPE breakdown | pending | — |
| 6 | AI meal log / photo scan | Log a meal from text or a photo | pending | — |
| 7 | Generated plans | Workout plan from goal/experience | pending | — |

## Open Questions
- [ ] What is "type" for workout plans — goal, experience, or body type?
- [ ] kg only, or kg/lb toggle?
- [ ] Does Open Food Facts cover my local foods well enough?
- [ ] AI provider and cost for M6?
- [ ] Data backup/export for a local-only app?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep | High | High | Hold to milestone order |
| Empty analytics early on | High | Medium | Defer analytics to M4+ |
| Open Food Facts data gaps | Medium | Medium | Allow custom food entries |
| AI cost / accuracy | Medium | Medium | Defer; always allow manual edit |
| Local data loss | Low | High | TBD — export/backup |

---
*Status: Milestone 1 built (2026-09-17), post-review bug fixes and web fix landed 2026-09-18; on-device check pending. Milestones 2–7 not started.*
