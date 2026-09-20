# GymHub

Personal gym + nutrition tracker. Mobile, local-first, single user.

## Stack
- Expo / React Native, TypeScript
- Local storage: expo-sqlite (no ORM), migrations via `PRAGMA user_version` in `src/db/schema.ts`
- Routing: expo-router (`src/app/`)

## Tabs
Target design (MVP):
- Home — today's workout, water, calories, weight
- Gym Hub — workout logger, exercise library, heat map
- Nutrition — meal log, food library, barcode lookup, water

**Built so far:** only one tab, "Gym Hub" (`src/app/(tabs)/index.tsx`): heat map + Start/Resume workout. The workout screen (`src/app/workout.tsx`) and exercise picker modal are pushed on top of it. Home and Nutrition don't exist yet.

## Commands
- Start: `npx expo start`
- Test: `npm test` (jest-expo; pure logic in `src/lib` only)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Conventions
- Folder layout: `src/app` routes · `src/db` schema + SQL queries · `src/lib` pure logic + `__tests__` · `src/components` UI
- Units: kg

## Data Model
Built (schema v1, `src/db/schema.ts`):
- `exercises` (name unique NOCASE, muscles JSON array) — 30 seeded in the migration
- `sessions` (started_at, finished_at NULL = active) — created on the first logged set; finishing an empty session deletes it
- `sets` (session_id, exercise_id, kg, reps, rpe nullable, created_at) — cascade-deleted with the session

Planned, not built: FoodItem · MealEntry · WaterEntry · WeightEntry

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
