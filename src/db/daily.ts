import type { SQLiteDatabase } from 'expo-sqlite';

// All ranges are [fromMs, toMs).

export async function addWater(db: SQLiteDatabase, ml: number): Promise<number> {
  const r = await db.runAsync('INSERT INTO water_entries (ml, created_at) VALUES (?, ?)', ml, Date.now());
  return r.lastInsertRowId;
}

export async function sumWater(db: SQLiteDatabase, fromMs: number, toMs: number): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(ml), 0) AS total FROM water_entries WHERE created_at >= ? AND created_at < ?',
    fromMs,
    toMs,
  );
  return row?.total ?? 0;
}

export async function addWeight(db: SQLiteDatabase, kg: number): Promise<number> {
  const r = await db.runAsync('INSERT INTO weight_entries (kg, created_at) VALUES (?, ?)', kg, Date.now());
  return r.lastInsertRowId;
}

export async function latestWeight(db: SQLiteDatabase): Promise<{ kg: number; createdAt: number } | null> {
  return db.getFirstAsync<{ kg: number; createdAt: number }>(
    'SELECT kg, created_at AS createdAt FROM weight_entries ORDER BY created_at DESC, id DESC LIMIT 1',
  );
}

export async function sumCalories(db: SQLiteDatabase, fromMs: number, toMs: number): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(m.grams * f.kcal_per_100g / 100), 0) AS total
     FROM meal_entries m JOIN food_items f ON f.id = m.food_id
     WHERE m.created_at >= ? AND m.created_at < ?`,
    fromMs,
    toMs,
  );
  return row?.total ?? 0;
}

export async function workoutSummary(
  db: SQLiteDatabase,
  fromMs: number,
  toMs: number,
): Promise<{ sets: number; exercises: number }> {
  const row = await db.getFirstAsync<{ sets: number; exercises: number }>(
    `SELECT COUNT(*) AS sets, COUNT(DISTINCT exercise_id) AS exercises
     FROM sets WHERE created_at >= ? AND created_at < ?`,
    fromMs,
    toMs,
  );
  return row ?? { sets: 0, exercises: 0 };
}
