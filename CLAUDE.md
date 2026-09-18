# GymHub

Personal gym + nutrition tracker. Mobile, local-first, single user.

## Stack
- Expo / React Native, TypeScript
- Local storage: expo-sqlite (no ORM), migrations via `PRAGMA user_version` in `src/db/schema.ts`
- Routing: expo-router (`src/app/`)

## Tabs
- Home — today's workout, water, calories, weight
- Gym Hub — workout logger, exercise library, heat map
- Nutrition — meal log, food library, barcode lookup, water

## Commands
- Start: `npx expo start`
- Test: `npm test` (jest-expo; pure logic in `src/lib` only)
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Conventions
- Folder layout: `src/app` routes · `src/db` schema + SQL queries · `src/lib` pure logic + `__tests__` · `src/components` UI
- Units: kg

## Data Model (outline)
- Exercise (name, muscle tags)
- WorkoutSession (date, exercises)
- Set (kg, reps, rpe)
- FoodItem · MealEntry · WaterEntry · WeightEntry

## Rules
- Local-first, no auth in MVP
- Derive all stats from logged sets — never store duplicate stats
- Build only the current PRD milestone

## Pointers
- PRD: `.claude/prds/gymhub.prd.md`
- Essentials: `ESSENTIALS.md`
