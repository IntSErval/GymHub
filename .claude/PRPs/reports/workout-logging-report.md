# Implementation Report: Workout Logging (Milestone 1)

## Summary
Set up the Expo SDK 57 app and built the Gym Hub tab:
- A 17-week heat map, computed from `sets.created_at`.
- A Start/Resume workout button.
- A workout screen for adding and removing sets (kg, reps, optional RPE). kg and reps are prefilled from the last set of that exercise. Finishing a session with no sets deletes it.
- An exercise picker with search, 30 seeded exercises, and custom exercises with muscle tags.

Data is stored locally in SQLite with a `user_version` migration.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large |
| Confidence | 7/10 | Automated checks all green; on-device checks not yet run |
| Files Changed | ~16 created, 2 updated | 14 source/test + scaffold config (package.json, app.json, tsconfig, eslint.config.js, .gitignore, assets) created; CLAUDE.md + PRD updated |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Scaffold Expo app | done | Deviated: routes in `src/app/` (SDK 57 template) |
| 2 | Muscles + parseSet | done | |
| 3 | Schema + migration + seed | done | `user_version` set inside the transaction |
| 4 | Queries | done | |
| 5 | Heat map (pure) | done | |
| 6 | Heatmap component | done | `scrollToEnd` on content size change instead of `contentOffset` |
| 7 | Layouts + Gym Hub | done | `Tabs` from `expo-router/js-tabs` (the root export is deprecated) |
| 8 | Workout + ExercisePicker | done | |
| 9 | Unit tests | done | 14 tests |
| 10 | CLAUDE.md | done | |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | Pass | `tsc --noEmit` 0 errors, `expo lint` 0 problems |
| Unit Tests | Pass | 14/14 |
| Build | Pass | `expo export --platform android` bundled (2.8 MB hbc); `expo-doctor` 21/21 |
| Integration | N/A | No server; DB code is exercised only on a device |
| Edge Cases | Partial | Input validation and heat map edge cases covered by tests; plan's manual on-device checklist **not yet run** |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/app/_layout.tsx` | CREATED | +15 |
| `src/app/(tabs)/_layout.tsx` | CREATED | +9 |
| `src/app/(tabs)/index.tsx` | CREATED | +60 |
| `src/app/workout.tsx` | CREATED | +239 |
| `src/components/Heatmap.tsx` | CREATED | +40 |
| `src/components/ExercisePicker.tsx` | CREATED | +118 |
| `src/db/schema.ts` | CREATED | +44 |
| `src/db/seed.ts` | CREATED | +34 |
| `src/db/queries.ts` | CREATED | +89 |
| `src/lib/muscles.ts` | CREATED | +15 |
| `src/lib/sets.ts` | CREATED | +23 |
| `src/lib/heatmap.ts` | CREATED | +58 |
| `src/lib/__tests__/sets.test.ts` | CREATED | +40 |
| `src/lib/__tests__/heatmap.test.ts` | CREATED | +54 |
| `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`, `assets/` | CREATED | scaffold |
| `CLAUDE.md` | UPDATED | TBDs filled |
| `.claude/prds/gymhub.prd.md` | UPDATED | M1 status |

## Deviations from Plan
- **Routes are in `src/app/`, not `app/`.** The SDK 57 `default` template uses `src/app` and the `@/*` alias maps to `./src/*`.
- **Tabs are imported from `expo-router/js-tabs`.** `Tabs` from `expo-router` is marked deprecated in SDK 57.
- **Test globals come from `@jest/globals`, and `@types/jest` was removed.** TypeScript 6 in this template doesn't pick up ambient `@types/jest`.
- **Unused template dependencies were dropped:** `@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`. `expo-doctor` still passes.
- **The scaffold was created in the session scratchpad**, not the parent directory. Only the config and assets the app needs were copied.
- **`PRAGMA user_version = 1` runs inside the migration transaction.** This way a crash can't leave the tables created while the version is still 0.

## Issues Encountered
- `npx expo install … -- --save-dev` put the Jest packages under `dependencies`. They were moved to `devDependencies` by hand.
- React Compiler lint rule `react-hooks/purity` rejected `useState(Date.now())`, so it's now a lazy initializer.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `src/lib/__tests__/sets.test.ts` | 7 | valid set, null RPE, comma decimals, 0 kg, whitespace, bad kg/reps/RPE |
| `src/lib/__tests__/heatmap.test.ts` | 7 | level buckets, local-date keys, 17×7 shape, Sunday start, future days, same-day counting, out-of-window timestamps |

## Next Steps
- [ ] Run the plan's manual checklist on a device (`npx expo start` → Expo Go)
- [ ] Code review via `/code-review`
- [ ] Commit (`/prp-commit`). Nothing is committed yet, and the repo has no commits.
