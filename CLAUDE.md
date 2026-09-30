# GymHub

Personal gym + nutrition tracker. Mobile, local-first, single user.

## Stack
- Expo / React Native, TypeScript
- Local storage: expo-sqlite (no ORM), migrations via `PRAGMA user_version` in `src/db/schema.ts`
- Routing: expo-router (`src/app/`)

## Tabs
All three MVP tabs are built (`src/app/(tabs)/`):
- Home (`index.tsx`) — today's workout, water, calories, latest weight
- Gym Hub (`gym.tsx`) — heat map + Start/Resume workout; `src/app/workout.tsx` and the exercise picker are pushed on top
- Nutrition (`nutrition.tsx`) — today's meals + kcal, water. `src/app/food-picker.tsx` (modal: search, custom food, grams) and `src/app/scan.tsx` (expo-camera barcode scan; typed barcode on web) sit on top. Barcode lookup: local `food_items` → Open Food Facts → custom-food form prefilled.

## Commands
- Start: `npx expo start`
- Test: `npm test` (jest-expo; pure logic in `src/lib` only)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Conventions
- Folder layout: `src/app` routes · `src/db` schema + SQL queries · `src/lib` pure logic + `__tests__` · `src/components` UI
- Units: kg

## Data Model
Schema v2 (`src/db/schema.ts`):
- `exercises` (name unique NOCASE, muscles JSON array) — 30 seeded in the migration
- `sessions` (started_at, finished_at NULL = active) — created on the first logged set; finishing an empty session deletes it
- `sets` (session_id, exercise_id, kg, reps, rpe nullable, created_at) — cascade-deleted with the session
- `water_entries` (ml, created_at) · `weight_entries` (kg, created_at)
- `food_items` (name, barcode unique nullable, kcal_per_100g, protein/carbs/fat per 100g nullable, source `custom`|`off`)
- `meal_entries` (food_id, grams, created_at) — kcal is derived (`grams * kcal_per_100g / 100`), never stored

Queries: `src/db/queries.ts` (workout), `src/db/daily.ts` (water, weight, day totals), `src/db/nutrition.ts` (foods, meals). Day ranges come from `dayRangeMs` in `src/lib/day.ts`.

## Web dev quirks (Expo SDK 57)
expo-sqlite's web build loads SQLite in a Web Worker, which only resolves when Metro emits split chunks. Two settings keep that working:
- `app.json` sets `web.output: "single"` (SPA). Under `"static"` the dev server pre-renders each route through the chunk-splitting serializer, which asserts on the worker and 500s the document (`@expo/metro-config/build/serializer/serializeChunks.js`). Don't switch back without re-testing web.
- `metro.config.js` registers `.wasm` (the worker fetches `wa-sqlite.wasm`) and sets COOP/COEP headers.

Do **not** set `EXPO_NO_METRO_LAZY=1`. It hides the 500 but leaves the client bundle without split-chunk paths, so the worker import throws "Bundle splitting is required for Web Worker imports" at runtime. Lazy bundling is fine as-is.

## Rules
- Local-first, no auth in MVP
- Derive all stats from logged sets — never store duplicate stats
- Build only the current PRD milestone

## Pointers
- PRD: `.claude/prds/gymhub.prd.md`
- Essentials: `ESSENTIALS.md`
