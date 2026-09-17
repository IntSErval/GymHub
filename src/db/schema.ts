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
}
