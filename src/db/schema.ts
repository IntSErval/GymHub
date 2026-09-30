import type { SQLiteDatabase } from 'expo-sqlite';

import { SEED_EXERCISES } from './seed';

export async function migrate(db: SQLiteDatabase) {
  // foreign_keys resets per connection, so set it on every open.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          muscles TEXT NOT NULL
        );
        CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at INTEGER NOT NULL,
          finished_at INTEGER
        );
        CREATE TABLE sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
          exercise_id INTEGER NOT NULL REFERENCES exercises(id),
          kg REAL NOT NULL CHECK (kg >= 0),
          reps INTEGER NOT NULL CHECK (reps > 0),
          rpe REAL CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
          created_at INTEGER NOT NULL
        );
        CREATE INDEX idx_sets_session ON sets(session_id);
        CREATE INDEX idx_sets_created ON sets(created_at);
      `);
      for (const { name, muscles } of SEED_EXERCISES) {
        await db.runAsync('INSERT INTO exercises (name, muscles) VALUES (?, ?)', name, JSON.stringify(muscles));
      }
      // Inside the transaction so a crash can't leave tables created but version 0.
      await db.execAsync('PRAGMA user_version = 1');
    });
  }

  if (version < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE water_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ml INTEGER NOT NULL CHECK (ml > 0),
          created_at INTEGER NOT NULL
        );
        CREATE TABLE weight_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kg REAL NOT NULL CHECK (kg > 0),
          created_at INTEGER NOT NULL
        );
        -- Macros are per 100 g. source: 'off' = Open Food Facts.
        CREATE TABLE food_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          barcode TEXT UNIQUE,
          kcal_per_100g REAL NOT NULL CHECK (kcal_per_100g >= 0),
          protein_g REAL,
          carbs_g REAL,
          fat_g REAL,
          source TEXT NOT NULL CHECK (source IN ('custom','off'))
        );
        CREATE TABLE meal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL REFERENCES food_items(id),
          grams REAL NOT NULL CHECK (grams > 0),
          created_at INTEGER NOT NULL
        );
        CREATE INDEX idx_water_created ON water_entries(created_at);
        CREATE INDEX idx_weight_created ON weight_entries(created_at);
        CREATE INDEX idx_meals_created ON meal_entries(created_at);
      `);
      await db.execAsync('PRAGMA user_version = 2');
    });
  }
}
