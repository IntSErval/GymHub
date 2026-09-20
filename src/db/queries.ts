import type { SQLiteDatabase } from 'expo-sqlite';

import type { Muscle } from '@/lib/muscles';
import type { SetInput } from '@/lib/sets';

export type Exercise = { id: number; name: string; muscles: Muscle[] };
export type WorkoutSet = SetInput & { id: number; sessionId: number; exerciseId: number; createdAt: number };
export type SessionSet = WorkoutSet & { exerciseName: string; muscles: Muscle[] };
export type NewSet = SetInput & { sessionId: number; exerciseId: number };

export async function listExercises(db: SQLiteDatabase): Promise<Exercise[]> {
  const rows = await db.getAllAsync<{ id: number; name: string; muscles: string }>(
    'SELECT id, name, muscles FROM exercises ORDER BY name COLLATE NOCASE'
  );
  return rows.map((r) => ({ ...r, muscles: JSON.parse(r.muscles) }));
}

export async function addExercise(db: SQLiteDatabase, name: string, muscles: Muscle[]): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Enter a name');
  if (muscles.length === 0) throw new Error('Pick at least one muscle');
  // Pre-check instead of catching the UNIQUE violation: the driver's constraint
  // message differs per platform ("UNIQUE constraint failed" on native,
  // "Error finalizing statement" on web), so sniffing it is unreliable.
  // The UNIQUE index is still the real guard.
  const clash = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM exercises WHERE name = ? COLLATE NOCASE',
    trimmed
  );
  if (clash) throw new Error('Exercise already exists');
  const result = await db.runAsync(
    'INSERT INTO exercises (name, muscles) VALUES (?, ?)',
    trimmed,
    JSON.stringify(muscles)
  );
  return result.lastInsertRowId;
}

export function getActiveSession(db: SQLiteDatabase) {
  return db.getFirstAsync<{ id: number; startedAt: number }>(
    'SELECT id, started_at AS startedAt FROM sessions WHERE finished_at IS NULL ORDER BY id DESC LIMIT 1'
  );
}

export async function startSession(db: SQLiteDatabase): Promise<number> {
  const active = await getActiveSession(db);
  if (active) return active.id;
  const result = await db.runAsync('INSERT INTO sessions (started_at) VALUES (?)', Date.now());
  return result.lastInsertRowId;
}

export async function finishSession(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sets WHERE session_id = ?', id);
    if (!row?.n) {
      await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
    } else {
      await db.runAsync('UPDATE sessions SET finished_at = ? WHERE id = ?', Date.now(), id);
    }
  });
}

export async function listSessionSets(db: SQLiteDatabase, sessionId: number): Promise<SessionSet[]> {
  const rows = await db.getAllAsync<Omit<SessionSet, 'muscles'> & { muscles: string }>(
    `SELECT s.id, s.session_id AS sessionId, s.exercise_id AS exerciseId, s.kg, s.reps, s.rpe,
            s.created_at AS createdAt, e.name AS exerciseName, e.muscles
       FROM sets s JOIN exercises e ON e.id = s.exercise_id
      WHERE s.session_id = ?
      ORDER BY s.id`,
    sessionId
  );
  return rows.map((r) => ({ ...r, muscles: JSON.parse(r.muscles) }));
}

export async function addSet(db: SQLiteDatabase, input: NewSet): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO sets (session_id, exercise_id, kg, reps, rpe, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    input.sessionId,
    input.exerciseId,
    input.kg,
    input.reps,
    input.rpe,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function deleteSet(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM sets WHERE id = ?', id);
}

export async function listSetTimestamps(db: SQLiteDatabase, sinceMs: number): Promise<number[]> {
  const rows = await db.getAllAsync<{ createdAt: number }>(
    'SELECT created_at AS createdAt FROM sets WHERE created_at >= ?',
    sinceMs
  );
  return rows.map((r) => r.createdAt);
}
