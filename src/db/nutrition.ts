import type { SQLiteDatabase } from 'expo-sqlite';

import type { FoodInput } from '@/lib/nutrition';

export type Food = { id: number; name: string; kcalPer100g: number; barcode: string | null };
export type Meal = { id: number; foodName: string; grams: number; kcal: number; createdAt: number };

const FOOD_COLS = 'id, name, kcal_per_100g AS kcalPer100g, barcode';

export function searchFoods(db: SQLiteDatabase, q: string): Promise<Food[]> {
  // ponytail: % and _ in q act as wildcards; escape them if that ever confuses a search.
  return db.getAllAsync<Food>(
    `SELECT ${FOOD_COLS} FROM food_items WHERE name LIKE ? ORDER BY name COLLATE NOCASE LIMIT 50`,
    `%${q.trim()}%`
  );
}

export function findFoodByBarcode(db: SQLiteDatabase, code: string) {
  return db.getFirstAsync<Food>(`SELECT ${FOOD_COLS} FROM food_items WHERE barcode = ?`, code);
}

export async function addFood(db: SQLiteDatabase, food: FoodInput, source: 'custom' | 'off'): Promise<number> {
  // Pre-check rather than catching UNIQUE: the error text differs between web and native (see addExercise).
  if (food.barcode && (await findFoodByBarcode(db, food.barcode))) {
    throw new Error('Food with this barcode already exists');
  }
  const r = await db.runAsync(
    `INSERT INTO food_items (name, barcode, kcal_per_100g, protein_g, carbs_g, fat_g, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    food.name,
    food.barcode,
    food.kcalPer100g,
    food.proteinG,
    food.carbsG,
    food.fatG,
    source
  );
  return r.lastInsertRowId;
}

export async function addMeal(db: SQLiteDatabase, foodId: number, grams: number): Promise<number> {
  const r = await db.runAsync(
    'INSERT INTO meal_entries (food_id, grams, created_at) VALUES (?, ?, ?)',
    foodId,
    grams,
    Date.now()
  );
  return r.lastInsertRowId;
}

/** Meals in [fromMs, toMs), oldest first; kcal derived, never stored. */
export function listMealsBetween(db: SQLiteDatabase, fromMs: number, toMs: number): Promise<Meal[]> {
  return db.getAllAsync<Meal>(
    `SELECT m.id, f.name AS foodName, m.grams, m.grams * f.kcal_per_100g / 100 AS kcal, m.created_at AS createdAt
       FROM meal_entries m JOIN food_items f ON f.id = m.food_id
      WHERE m.created_at >= ? AND m.created_at < ?
      ORDER BY m.created_at, m.id`,
    fromMs,
    toMs
  );
}

export async function deleteMeal(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM meal_entries WHERE id = ?', id);
}
