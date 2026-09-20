# GymHub Essentials

## MVP Checklist
### Home
- [ ] Today's workout — no separate Home screen exists yet; the single tab (`src/app/(tabs)/index.tsx`, titled "Gym Hub") shows the heat map and a Start/Resume workout button, which covers this need for now
- [ ] Water log — not implemented
- [ ] Calorie log — not implemented
- [ ] Weight log — not implemented

### Gym Hub
- [x] Workout logger (kg, reps, RPE) — `src/app/workout.tsx`, `src/lib/sets.ts` (`parseSet`)
- [x] Add / remove sets — `addSet`/`deleteSet` in `src/db/queries.ts`, wired to `onAdd`/`onDelete` in `workout.tsx`
- [x] Exercise library with muscle tags — `src/components/ExercisePicker.tsx`, `src/lib/muscles.ts`, `addExercise`/`listExercises`
- [x] Heat map — `src/components/Heatmap.tsx`, `src/lib/heatmap.ts`, wired into `index.tsx`

### Nutrition
- [ ] Manual meal log — not implemented (no nutrition screens or tables yet)
- [ ] Food library — not implemented
- [ ] Barcode lookup (Open Food Facts) — not implemented
- [ ] Water log — not implemented

## Core Flows
- Log a set — done
- Finish a session — done (`finishSession`; empty sessions are deleted instead of saved)
- Log a meal — not implemented
- Log water — not implemented
- Log weight — not implemented

## Screens (outline)
- Home
- Gym Hub → Active Workout → Exercise Picker
- Nutrition → Add Meal → Barcode Scan

## Deferred
- AI meal logging, photo scan, recipes
- Generated workout plans
- Progression stats, RPE breakdown
- Muscle activity, split map, recovery & volume
- Featured exercise, accounts/sync

## Glossary
- **Set** — one round of reps at a weight
- **RPE** — how hard a set felt (1–10)
- **Volume** — sets × reps × kg
- **Split** — how you divide muscle groups across days
