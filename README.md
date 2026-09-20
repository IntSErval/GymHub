# GymHub

A personal, local-first workout tracker. One user, no accounts, no server: everything lives in an on-device SQLite database.

> **Status:** Milestone 1 (workout logging) is built. Nutrition, water, calories and weight are planned but **not built yet** — see [Roadmap](#roadmap).

## What you can do today

| Feature | How it works |
|---|---|
| **Log a workout** | Tap **Start workout**, pick an exercise, type `kg`, `reps` and an optional `RPE`, tap **Add**. |
| **Add / remove sets** | Each set is a row under its exercise; tap **✕** to delete one. |
| **Fast repeat sets** | After the first set, kg and reps are prefilled from your last set of that exercise. |
| **Exercise library** | 30 seeded exercises, searchable by name *or* muscle (try typing `glutes`). Create your own with muscle tags. |
| **Heat map** | GitHub-style grid of the last 17 weeks. Each square is a day; darker = more sets logged. |
| **Resume a workout** | Close the app mid-session and the button changes to **Resume workout**. |
| **Finish** | Tap **Finish** in the header. A session with no sets is discarded, not saved. |

### Input rules (enforced by `src/lib/sets.ts`)

| Field | Accepts | Example |
|---|---|---|
| kg | 0–1000, decimals allowed, `,` works as decimal separator | `62.5` or `62,5` |
| reps | whole number 1–1000 | `8` |
| RPE | optional, 1–10 in steps of 0.5 | `8.5` |

Grouped numbers like `1,000` are rejected rather than silently read as `1`.

### Heat map levels

| Sets that day | Shade |
|---|---|
| 0 | empty |
| 1–5 | lightest green |
| 6–12 | light |
| 13–20 | medium |
| 21+ | darkest |

## Quick start

Requires Node 20+ and either the **Expo Go** app (SDK 57) on your phone or a web browser.

```bash
npm install
npx expo start          # then press w (web), a (Android) or scan the QR in Expo Go
```

| Command | What it does |
|---|---|
| `npm start` | Start the dev server |
| `npm run web` | Start straight into the browser |
| `npm test` | Jest unit tests (15 tests over the pure logic in `src/lib`) |
| `npm run lint` | `expo lint` |
| `npm run typecheck` | `tsc --noEmit` |

### Troubleshooting

- **Expo Go says "problem running the requested project"** — your Expo Go app is probably older than SDK 57; update it from the app store. If the phone can't reach your PC, use `npx expo start --tunnel`.
- **Web shows `Worker chunk not found for: .../worker.ts`** — this is an upstream Expo SDK 57 bug (expo/expo#50153). The repo works around it with `EXPO_NO_METRO_LAZY=1` in `.env`. Remove that line after upgrading to SDK 58.
- **Web can't resolve a `.wasm` import** — `metro.config.js` registers `.wasm` as an asset and sets the COOP/COEP headers `expo-sqlite`'s web worker needs. Don't delete it.

## How it's built

- Expo SDK 57 / React Native 0.86 / TypeScript, routing with `expo-router`
- `expo-sqlite` with plain SQL (no ORM); schema migrations via `PRAGMA user_version`
- Pure logic (parsing, heat map maths) is kept in `src/lib` so it can be unit-tested without a device

```
src/
  app/          routes: (tabs)/index.tsx = Gym Hub, workout.tsx = active workout
  components/   Heatmap, ExercisePicker
  db/           schema.ts (migration), queries.ts (SQL), seed.ts (30 exercises)
  lib/          sets.ts, heatmap.ts, muscles.ts  (+ __tests__/)
```

### Data model

```
exercises  id, name (unique, case-insensitive), muscles (JSON array)
sessions   id, started_at, finished_at (NULL while a workout is active)
sets       id, session_id → sessions, exercise_id → exercises, kg, reps, rpe (nullable), created_at
```

Rules of thumb: units are **kg**; stats (like the heat map) are always **derived from `sets`**, never stored separately; a session row is created on the *first logged set*, so tapping Start and backing out leaves nothing behind.

## Roadmap

| # | Milestone | Status |
|---|---|---|
| 1 | Workout logging (sets, exercises, heat map) | built — on-device manual check still pending |
| 2 | Home daily log (today's workout, water, calories, weight) | not started |
| 3 | Nutrition basics (meal log, food library, barcode lookup) | not started |
| 4+ | Muscle volume engine, progression stats, AI meal log, generated plans | later |

Full detail: [`.claude/prds/gymhub.prd.md`](.claude/prds/gymhub.prd.md) · checklist: [`ESSENTIALS.md`](ESSENTIALS.md) · M1 write-up: [`.claude/PRPs/reports/workout-logging-report.md`](.claude/PRPs/reports/workout-logging-report.md)
