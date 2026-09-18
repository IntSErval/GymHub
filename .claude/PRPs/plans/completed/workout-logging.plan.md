# Plan: Workout Logging (Milestone 1)

## Summary
Set up the Expo app and build the Gym Hub tab. On that tab you start a workout, pick exercises from a library tagged by muscle, log sets (kg / reps / optional RPE), remove sets, finish the session, and see a GitHub-style heat map of the days you trained. Everything is stored locally in SQLite. The heat map is computed from logged sets and never stored.

## User Story
As a lifter tracking progressive overload, I want to log kg/reps/RPE per set in under 10 seconds and see which days I trained, so that I stay consistent and can see my training history at a glance.

## Problem → Solution
Empty repo (docs only) → runnable Expo app with one Gym Hub tab: heat map, start/resume workout, active workout screen, exercise picker.

## Metadata
- **Complexity**: Large (greenfield scaffold + DB + 3 screens)
- **Source PRD**: `.claude/prds/gymhub.prd.md`
- **PRD Phase**: Milestone 1 — Workout logging
- **Estimated Files**: ~16 created, 2 updated

---

## UX Design

### Before
N/A. No app exists yet.

### After
```
┌ Gym Hub ─────────────────────┐     ┌ Workout ── 42 min ── [Finish] ┐
│ ▢▣▢▢▣▣▢ … (17 weeks x 7)     │     │ Bench Press   chest·triceps   │
│ 12 days trained              │     │  1  60kg × 8  RPE 7        [✕]│
│                              │ ──▶ │  2  60kg × 8  RPE 8        [✕]│
│ [ Start workout ]            │     │  [kg 60][reps 8][rpe  ] [Add] │
│   (or "Resume workout")      │     │                               │
└──────────────────────────────┘     │ [+ Add exercise] ─▶ picker    │
                                     └───────────────────────────────┘
┌ Exercise picker (modal) ─────┐
│ [search……………]                │
│ Bench Press   chest·triceps  │
│ Squat         quads·glutes   │
│ [+ New exercise: name + tags]│
└──────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Gym Hub tab | — | Heat map + Start/Resume button | Refreshes on focus |
| Start workout | — | Creates session, opens Workout | Resumes if one is unfinished |
| Add set | — | kg/reps/rpe inputs, prefilled from last set of that exercise | Keeps a set under 10s |
| Remove set | — | ✕ deletes the row immediately | No confirm dialog |
| Finish | — | Sets `finished_at`; a session with 0 sets is deleted | Returns to Gym Hub |

---

## Mandatory Reading

The project has no code yet, so this plan sets the conventions. Read these first:

| Priority | File | Why |
|---|---|---|
| P0 | `CLAUDE.md` | Rules: local-first, kg, derive stats, current milestone only |
| P0 | `.claude/prds/gymhub.prd.md` | Scope + out-of-scope list |
| P1 | `ESSENTIALS.md` | Screens + glossary (RPE 1–10) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| expo-sqlite | https://docs.expo.dev/versions/latest/sdk/sqlite/ | `SQLiteProvider databaseName onInit`, `useSQLiteContext()`, `runAsync/getAllAsync/getFirstAsync/execAsync/withTransactionAsync`; migrate via `PRAGMA user_version` |
| expo-router tabs | https://docs.expo.dev/router/advanced/tabs/ | `app/(tabs)/_layout.tsx` with `<Tabs>`; `useFocusEffect` from `expo-router` |
| jest-expo | https://docs.expo.dev/develop/unit-testing/ | `preset: "jest-expo"`; test pure TS only |

KEY_INSIGHT: Current versions are Expo SDK 57 (`expo@57.0.x`, `expo-sqlite@57.0.x`, `expo-router@57.0.x`, `jest-expo@57.0.x`), on Node 22.
APPLIES_TO: Task 1
GOTCHA: always add Expo packages with `npx expo install` so the versions match the SDK. A plain `npm i` can pick incompatible versions.

KEY_INSIGHT: `execAsync` does not bind parameters.
APPLIES_TO: Task 3
GOTCHA: use `execAsync` only for fixed DDL. Pass every user value through `runAsync`/`getAllAsync` params.

KEY_INSIGHT: expo-sqlite uses native code and has only alpha web support.
APPLIES_TO: Tasks 3, 9, validation
GOTCHA: don't unit-test SQL in Jest. Unit-test only the pure `src/lib/*` functions, and check the DB through manual runs in Expo Go or an emulator. The build check bundles for android, not web.

---

## Patterns to Mirror

This is a greenfield project, so there's no existing code to copy. These conventions are **defined here**, and every later milestone follows them.

### NAMING_CONVENTION
```ts
// files: routes kebab/lowercase under app/ (expo-router), components PascalCase.tsx, lib camelCase.ts
// types PascalCase, functions camelCase, SQL tables snake_case plural
export type WorkoutSet = { id: number; sessionId: number; exerciseId: number; kg: number; reps: number; rpe: number | null; createdAt: number };
export async function addSet(db: SQLiteDatabase, input: NewSet): Promise<number> { … }
```

### ERROR_HANDLING
```ts
// Validate user input at the edge with a pure parser returning a result, never throw for bad input.
const parsed = parseSet(kgText, repsText, rpeText);
if (!parsed.ok) { setError(parsed.error); return; }
await addSet(db, { sessionId, exerciseId, ...parsed.value });
// DB/unexpected errors: let them throw; the screen catches with try/catch and shows Alert.alert('Could not save', String(e)).
```

### LOGGING_PATTERN
No logging library. `console.warn` only inside a catch that also shows the user an error. No `console.log` in committed code.

### REPOSITORY_PATTERN
```ts
// src/db/queries.ts — plain async functions, db passed in, SQL inline, params bound.
export function getActiveSession(db: SQLiteDatabase) {
  return db.getFirstAsync<{ id: number; startedAt: number }>(
    'SELECT id, started_at AS startedAt FROM sessions WHERE finished_at IS NULL ORDER BY id DESC LIMIT 1'
  );
}
```
No service layer and no classes. Screens call query functions directly with `useSQLiteContext()`.

### TEST_STRUCTURE
```ts
// src/lib/__tests__/heatmap.test.ts
import { buildHeatmap } from '../heatmap';
describe('buildHeatmap', () => {
  it('buckets sets into local days', () => { expect(…).toEqual(…); });
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json`, `app.json`, `tsconfig.json`, etc. | CREATE | Expo scaffold |
| `app/_layout.tsx` | CREATE | `SQLiteProvider` + root `Stack` |
| `app/(tabs)/_layout.tsx` | CREATE | Tabs (Gym Hub only for M1) |
| `app/(tabs)/index.tsx` | CREATE | Gym Hub: heat map + Start/Resume |
| `app/workout.tsx` | CREATE | Active workout screen |
| `src/db/schema.ts` | CREATE | `migrate(db)` via user_version |
| `src/db/seed.ts` | CREATE | Default exercise list |
| `src/db/queries.ts` | CREATE | All SQL |
| `src/lib/muscles.ts` | CREATE | `MUSCLES` const + `Muscle` type |
| `src/lib/sets.ts` | CREATE | `parseSet` validation |
| `src/lib/heatmap.ts` | CREATE | `buildHeatmap` pure grid builder |
| `src/components/Heatmap.tsx` | CREATE | Renders grid with Views |
| `src/components/ExercisePicker.tsx` | CREATE | RN `Modal`: search, pick, add custom |
| `src/lib/__tests__/sets.test.ts` | CREATE | parseSet tests |
| `src/lib/__tests__/heatmap.test.ts` | CREATE | buildHeatmap tests |
| `CLAUDE.md` | UPDATE | Fill in TBD commands, storage, folder layout |
| `.claude/prds/gymhub.prd.md` | UPDATE | M1 → in-progress + plan link (done at plan time) |

## NOT Building

- Home and Nutrition tabs. Those are Milestones 2 and 3, so no placeholder tabs.
- Workout history list, editing a past session, or editing a set in place. To change a set, remove it and add it again.
- Rest timer, supersets, templates, notes, warm-up flags.
- Volume, PRs, progression, or RPE stats (Milestones 4 and 5).
- A kg/lb toggle. The app uses kg only, per `CLAUDE.md`.
- Export or backup (still an open question in the PRD).
- Deleting or renaming exercises in the library.
- Chart or heat map libraries. The grid is plain Views.

---

## Step-by-Step Tasks

### Task 1: Scaffold Expo app in repo root
- **ACTION**: Create the Expo TypeScript app with expo-router in the existing folder, keeping `CLAUDE.md`, `ESSENTIALS.md` and `.claude/`.
- **IMPLEMENT**:
  - `npx create-expo-app@latest gymhub-tmp --template default` in the parent directory, then move its contents (including dotfiles, excluding `.git`) into the repo root. Alternatively, run it in the repo root if it accepts a non-empty directory.
  - Remove the example screens, components, hooks, constants and assets that the router template doesn't need. Use `npm run reset-project` if the script exists, then delete the `app-example/` folder it creates.
  - `npx expo install expo-sqlite`
  - `npx expo install jest-expo jest @types/jest -- --save-dev`
  - `package.json` scripts: `"typecheck": "tsc --noEmit"`, `"test": "jest"`, `"lint": "expo lint"`. Add `"jest": { "preset": "jest-expo" }`.
  - `app.json`: `name: "GymHub"`, `slug: "gymhub"`, `scheme: "gymhub"`.
- **MIRROR**: N/A (scaffold)
- **GOTCHA**: `create-expo-app` may refuse to run in a non-empty directory, so scaffold in a temp dir and move. Don't overwrite `CLAUDE.md`. `expo lint` creates the ESLint config on its first run.
- **VALIDATE**: `npm run typecheck` passes, `npx expo lint` passes, and `npx expo start` shows a blank screen in Expo Go.

### Task 2: Muscles + set parsing (pure)
- **ACTION**: Create `src/lib/muscles.ts` and `src/lib/sets.ts`.
- **IMPLEMENT**:
  ```ts
  // muscles.ts
  export const MUSCLES = ['chest','back','shoulders','biceps','triceps','forearms','core','quads','hamstrings','glutes','calves'] as const;
  export type Muscle = (typeof MUSCLES)[number];

  // sets.ts
  export type SetInput = { kg: number; reps: number; rpe: number | null };
  export type ParseResult = { ok: true; value: SetInput } | { ok: false; error: string };
  export function parseSet(kg: string, reps: string, rpe: string): ParseResult
  ```
  Rules:
  - Trim every input and accept `,` as a decimal separator.
  - kg: finite and ≥ 0 (0 is allowed for bodyweight exercises), max 1000.
  - reps: integer from 1 to 1000.
  - rpe: empty means `null`; otherwise 1 to 10 in steps of 0.5.
  - Errors: `'Enter kg'`, `'kg must be 0–1000'`, `'Reps must be a whole number 1–1000'`, `'RPE must be 1–10'`.
- **MIRROR**: ERROR_HANDLING (result type, no throw)
- **IMPORTS**: none
- **GOTCHA**: `Number('')` is `0`, so check for empty strings before converting. `Number('8e1')` parses to 80, which is acceptable.
- **VALIDATE**: Task 9 tests + `npm run typecheck`.

### Task 3: Schema + migration + seed
- **ACTION**: Create `src/db/schema.ts` and `src/db/seed.ts`.
- **IMPLEMENT**:
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;            -- run on EVERY open, before the version check
  -- version 0 → 1:
  CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    muscles TEXT NOT NULL              -- JSON array of Muscle
  );
  CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,       -- unix ms
    finished_at INTEGER                -- NULL = active
  );
  CREATE TABLE sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    kg REAL NOT NULL CHECK (kg >= 0),
    reps INTEGER NOT NULL CHECK (reps > 0),
    rpe REAL CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
    created_at INTEGER NOT NULL        -- unix ms
  );
  CREATE INDEX idx_sets_session ON sets(session_id);
  CREATE INDEX idx_sets_created ON sets(created_at);
  PRAGMA user_version = 1;
  ```
  `export async function migrate(db: SQLiteDatabase)`: set the pragmas, read `user_version`, and if it's `< 1`, run the DDL and seed inside `withTransactionAsync`, then set `user_version = 1`.
  `seed.ts` exports `SEED_EXERCISES: { name: string; muscles: Muscle[] }[]` with about 30 common lifts: Bench Press (chest, triceps, shoulders), Incline DB Press, Push-Up, Overhead Press, Lateral Raise, Pull-Up (back, biceps), Lat Pulldown, Barbell Row, Seated Cable Row, Deadlift (back, hamstrings, glutes), Romanian Deadlift, Squat (quads, glutes), Front Squat, Leg Press, Lunge, Leg Extension, Leg Curl, Hip Thrust, Calf Raise, Barbell Curl, Hammer Curl, Tricep Pushdown, Skull Crusher, Dip, Face Pull, Plank (core), Hanging Leg Raise, Cable Crunch, Wrist Curl (forearms), Shrug (back). Insert with `runAsync('INSERT INTO exercises (name, muscles) VALUES (?, ?)', name, JSON.stringify(muscles))`.
- **MIRROR**: REPOSITORY_PATTERN
- **IMPORTS**: `import type { SQLiteDatabase } from 'expo-sqlite'`
- **GOTCHA**: `foreign_keys` resets on every connection, so set it outside the version check or `ON DELETE CASCADE` silently won't run. The CHECK constraints are a second line of defense; `parseSet` is the first.
- **VALIDATE**: `npm run typecheck`. Manual check (Task 8): the picker lists the seeded exercises after a fresh install.

### Task 4: Queries
- **ACTION**: Create `src/db/queries.ts` with every SQL call.
- **IMPLEMENT**:
  - `type Exercise = { id: number; name: string; muscles: Muscle[] }` (the row's `muscles` is parsed with `JSON.parse`).
  - `listExercises(db): Promise<Exercise[]>`, ordered by name.
  - `addExercise(db, name, muscles): Promise<number>`: trims the name and throws if it's empty or has no muscles. The UNIQUE constraint rejects duplicates, and the screen shows "Exercise already exists".
  - `getActiveSession(db)`: shown in REPOSITORY_PATTERN.
  - `startSession(db): Promise<number>`: returns the active session's id if one exists, otherwise inserts with `Date.now()`. This prevents two open sessions.
  - `finishSession(db, id)`: inside a transaction, if `SELECT COUNT(*) FROM sets WHERE session_id=?` is 0, delete the session; otherwise set `finished_at = Date.now()`.
  - `listSessionSets(db, sessionId): Promise<(WorkoutSet & { exerciseName: string; muscles: Muscle[] })[]>`, joined with exercises and ordered by `sets.id`.
  - `addSet(db, { sessionId, exerciseId, kg, reps, rpe }): Promise<number>`, returning `lastInsertRowId`.
  - `deleteSet(db, id)`
  - `listSetTimestamps(db, sinceMs): Promise<number[]>`, from `SELECT created_at FROM sets WHERE created_at >= ?`.
- **MIRROR**: REPOSITORY_PATTERN, NAMING_CONVENTION (alias snake_case columns to camelCase in SQL with `AS`)
- **IMPORTS**: `SQLiteDatabase` from `expo-sqlite`, `Muscle` from `../lib/muscles`
- **GOTCHA**: `runAsync` returns `{ lastInsertRowId, changes }`. Don't compute stats here: no volume columns and no set counters (`CLAUDE.md` rule).
- **VALIDATE**: `npm run typecheck`.

### Task 5: Heat map (pure)
- **ACTION**: Create `src/lib/heatmap.ts`.
- **IMPLEMENT**:
  ```ts
  export type HeatCell = { date: string /* YYYY-MM-DD local */; count: number; level: 0|1|2|3|4; future: boolean };
  export function localDayKey(ms: number): string
  export function heatLevel(count: number): 0|1|2|3|4   // 0 → 0, 1–5 → 1, 6–12 → 2, 13–20 → 3, 21+ → 4
  export function buildHeatmap(timestamps: number[], today: Date, weeks = 17): HeatCell[][] // columns (weeks) of 7 days, Sun..Sat, last column contains today
  export function heatmapStartMs(today: Date, weeks = 17): number // local midnight of first cell
  ```
  How it works: count sets per `localDayKey`. The first column starts on the Sunday `weeks-1` weeks before the week containing today. Cells after today get `future: true` and level 0.
  Also export `daysTrained(cells)`, which counts cells with `count > 0`.
- **MIRROR**: NAMING_CONVENTION
- **GOTCHA**: build dates with `new Date(y, m, d)` and step with `setDate(d + 1)`. Adding 86_400_000 ms breaks on DST days. Format the key from local getters, not `toISOString()`, which is UTC.
- **VALIDATE**: Task 9 tests.

### Task 6: Heatmap component
- **ACTION**: Create `src/components/Heatmap.tsx`.
- **IMPLEMENT**: `export function Heatmap({ cells }: { cells: HeatCell[][] })`. It renders a row of columns, each with 7 cells of 12×12 and 3px gap. Colors come from a 5-step array in one `const LEVEL_COLORS` (for example `#ebedf0`, `#9be9a8`, `#40c463`, `#30a14e`, `#216e39`). Future cells are transparent. Wrap the grid in a horizontal `ScrollView` whose `contentOffset` starts at the end, so today is visible on narrow phones. Each cell gets `accessibilityLabel={`${date}: ${count} sets`}`.
- **MIRROR**: NAMING_CONVENTION
- **IMPORTS**: `View, ScrollView, StyleSheet` from `react-native`; `HeatCell` type
- **GOTCHA**: 17 weeks × 15px ≈ 255px fits most phones, so the ScrollView is only a fallback. Don't use `onLayout` measuring hacks.
- **VALIDATE**: `npm run typecheck`; visual check in Task 8.

### Task 7: Root + tabs layout + Gym Hub screen
- **ACTION**: Create `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`.
- **IMPLEMENT**:
  - `_layout.tsx`: `<SQLiteProvider databaseName="gymhub.db" onInit={migrate}><Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="workout" options={{ title: 'Workout' }} /></Stack></SQLiteProvider>`
  - `(tabs)/_layout.tsx`: `<Tabs><Tabs.Screen name="index" options={{ title: 'Gym Hub' }} /></Tabs>`
  - `(tabs)/index.tsx`: in `useFocusEffect(useCallback(…))`, load `listSetTimestamps(db, heatmapStartMs(new Date()))` and `getActiveSession(db)`, then render `<Heatmap>`, "N days trained", and a button labeled "Resume workout" or "Start workout". The button's handler calls `await startSession(db)`, then `router.push('/workout')`.
- **MIRROR**: ERROR_HANDLING (try/catch → `Alert.alert`)
- **IMPORTS**: `SQLiteProvider, useSQLiteContext` from `expo-sqlite`; `Stack, Tabs, router, useFocusEffect` from `expo-router`
- **GOTCHA**: `useFocusEffect` needs a `useCallback`-wrapped function, and the heat map must refresh when you come back from Workout. Remove any leftover template routes (for example `explore.tsx`) or they appear as tabs.
- **VALIDATE**: `npm run typecheck`, `npx expo lint`; the app opens to Gym Hub with an empty heat map.

### Task 8: Workout screen + exercise picker
- **ACTION**: Create `app/workout.tsx` and `src/components/ExercisePicker.tsx`.
- **IMPLEMENT**:
  - **Workout**:
    - On mount, load the active session. If none exists, `router.back()`.
    - Show elapsed time in the header, computed from `startedAt` and updated every 30s.
    - State: `sets` from `listSessionSets`, and `extraExerciseIds`, which holds exercises picked in the picker that have no sets yet.
    - Group the display by exercise, ordered by first appearance: exercises with sets first, then the `extraExerciseIds` ones.
    - Each group shows its set rows (index, `kg × reps`, `RPE x` if present, and a ✕ button that runs `deleteSet` and reloads). Below the rows is an input row with a `kg` field (`keyboardType="decimal-pad"`), a `reps` field (`number-pad`) and an `rpe` field (`decimal-pad`, optional), plus an **Add** button.
    - Prefill the inputs from the group's last set (kg and reps, not rpe). Add runs `parseSet`; on error it shows the message inline under the row, and on success it runs `addSet` and reloads.
    - A "+ Add exercise" button opens the picker. Picking adds the id to `extraExerciseIds` unless the exercise already has sets.
    - The **Finish** header button runs `finishSession`, then `router.back()`.
  - **ExercisePicker** `({ visible, onClose, onPick })`:
    - RN `Modal` with a search `TextInput` that filters by name or muscle, case-insensitive.
    - `FlatList` of exercises, each showing its muscles joined with `·`.
    - A "New exercise" section with a name input and toggle chips for each `MUSCLES` entry. Save runs `addExercise`, reloads the list and picks the new exercise. On a UNIQUE error it shows "Exercise already exists".
- **MIRROR**: ERROR_HANDLING, REPOSITORY_PATTERN
- **IMPORTS**: `useSQLiteContext`; `Stack, router` from `expo-router` (use `<Stack.Screen options={{ headerRight }} />` inside the screen); query fns; `parseSet`; `MUSCLES`
- **GOTCHA**:
  - Picked exercises with no sets live only in React state, and that's intentional (`// ponytail: unlogged exercises aren't persisted; add a session_exercises table if resume-with-empty-exercise matters`).
  - Keep input state per exercise id, in a `Record<number, {kg, reps, rpe}>`.
  - Wrap the screen in `KeyboardAvoidingView` so the keyboard doesn't cover the inputs.
  - Tapping Add twice fast can double-insert, so disable the button while saving.
- **VALIDATE**: `npm run typecheck`, `npx expo lint`, then run the manual checklist below.

### Task 9: Unit tests
- **ACTION**: Create `src/lib/__tests__/sets.test.ts` and `heatmap.test.ts` (cases in Testing Strategy).
- **MIRROR**: TEST_STRUCTURE
- **GOTCHA**: create fixed dates with `new Date(2026, 0, 15, 12)` (local noon) so tests don't depend on the timezone.
- **VALIDATE**: `npm test` all green.

### Task 10: Update CLAUDE.md
- **ACTION**: Replace the TBDs:
  - Storage: `expo-sqlite`
  - Start: `npx expo start`
  - Test: `npm test`
  - Lint: `npx expo lint`
  - Typecheck: `npm run typecheck`
  - Folder layout: `app/` routes, `src/db` SQL + schema, `src/lib` pure logic (tested), `src/components` UI
- **VALIDATE**: file reads correctly; no other sections changed.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| parseSet valid | `'60','8','7.5'` | ok `{60,8,7.5}` | |
| parseSet no rpe | `'60','8',''` | ok rpe `null` | |
| parseSet comma decimal | `'62,5','5',''` | kg `62.5` | ✓ |
| parseSet bodyweight | `'0','12',''` | ok kg `0` | ✓ |
| parseSet empty kg | `'','8',''` | error `Enter kg` | ✓ |
| parseSet negative/huge kg | `'-5'` / `'1001'` | error | ✓ |
| parseSet fractional reps | `'60','8.5',''` | error | ✓ |
| parseSet zero reps | `'60','0',''` | error | ✓ |
| parseSet rpe out of range / non-half step | `'11'`, `'0'`, `'7.3'` | error | ✓ |
| parseSet whitespace | `' 60 ',' 8 ',' '` | ok, rpe null | ✓ |
| heatLevel buckets | 0,1,5,6,12,13,20,21 | 0,1,1,2,2,3,3,4 | ✓ |
| buildHeatmap shape | `[]`, today | 17 columns × 7, all count 0 | ✓ |
| buildHeatmap last column holds today; later days `future` | today = Wed | Thu–Sat future | ✓ |
| buildHeatmap buckets same day | 3 timestamps same local day | that cell count 3 | |
| buildHeatmap ignores out-of-window timestamps | timestamp before start | not counted, no crash | ✓ |
| localDayKey local not UTC | `new Date(2026,0,15,23,30).getTime()` | `'2026-01-15'` | ✓ |
| daysTrained | cells with 2 non-zero days | 2 | |

### Edge Cases Checklist
- [x] Empty input: an empty kg field is rejected and an empty rpe becomes null
- [x] Maximum size input: kg ≤ 1000 and reps ≤ 1000
- [x] Invalid types: non-numeric text is rejected by `parseSet`
- [x] Concurrent access: Add is disabled while saving, and `startSession` reuses an active session
- [ ] Network failure: N/A (no network in this milestone)
- [ ] Permission denied: N/A

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck && npx expo lint
```
EXPECT: Zero errors

### Unit Tests
```bash
npm test
```
EXPECT: All pass

### Build Check
```bash
npx expo export --platform android --output-dir .expo-export-check && rm -rf .expo-export-check
```
EXPECT: Bundle succeeds (JS only, no native build needed)

### Health
```bash
npx expo-doctor
```
EXPECT: No dependency version mismatches

### Manual Validation (Expo Go or Android emulator via `npx expo start`)
- [ ] Fresh install → Gym Hub shows an empty 17-week grid and "0 days trained"
- [ ] Start workout → Workout screen; + Add exercise → picker lists ~30 seeded exercises; search "quads" filters
- [ ] Pick Bench Press → enter 60 / 8 / 7 → Add → row appears; inputs stay prefilled 60 / 8
- [ ] Enter reps `0` → inline error, nothing saved
- [ ] ✕ on a set → row removed
- [ ] Close app mid-workout → reopen → Gym Hub says "Resume workout" → sets still there
- [ ] Finish → back to Gym Hub, today's cell colored, "1 days trained"
- [ ] Start then Finish with zero sets → no session is kept and the heat map is unchanged
- [ ] New exercise "Cable Fly" + chest → saved and picked; adding "cable fly" again → "Exercise already exists"
- [ ] Log a set in < 10s with prefill (stopwatch, PRD metric)

---

## Acceptance Criteria
- [ ] All tasks completed
- [ ] Typecheck, lint, tests, export all pass
- [ ] Manual checklist passes
- [ ] No stored stats (heat map derived from `sets.created_at`)
- [ ] Only Gym Hub tab exists

## Completion Checklist
- [ ] Code follows the conventions defined above
- [ ] User input validated via `parseSet`; DB errors surfaced with `Alert`
- [ ] No `console.log`
- [ ] Pure logic in `src/lib` with tests
- [ ] CLAUDE.md TBDs filled
- [ ] Nothing from NOT Building added

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| create-expo-app template differs in SDK 57 (reset script missing, extra files) | Medium | Low | Delete example files by hand; check `app/` only contains planned routes |
| Timezone/DST bugs in heat map | Medium | Medium | Local-date keys and `setDate` stepping, covered by tests |
| Foreign keys off → orphan sets | Low | Medium | `PRAGMA foreign_keys = ON` on every open |
| Schema changes in later milestones | High | Low | `user_version` migrations; add `if (v < 2)` blocks, never edit v1 |
| Local data loss | Low | High | Out of scope; open question in PRD (export/backup) |

## Notes
- Decisions made without asking, all conventional and easy to change:
  - `expo-sqlite` with no ORM.
  - `expo-router`.
  - `jest-expo`, testing pure functions only.
  - Muscles stored as a JSON text column rather than a join table. Milestone 4's muscle engine can add a table in a v2 migration if it needs to query by muscle in SQL.
- Heat map intensity counts **sets per day**. Sessions per day is almost always 1, so it would give no gradient.
- A session's date is the set timestamps, so a workout that runs past midnight spreads across two cells. That's accepted.
