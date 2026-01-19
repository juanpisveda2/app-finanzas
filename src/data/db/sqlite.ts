import * as SQLite from 'expo-sqlite';

import { createId } from '../../lib/ids';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('finanzas.db');
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      nature TEXT NOT NULL DEFAULT 'variable',
      isBasic INTEGER NOT NULL,
      isEnjoyment INTEGER NOT NULL,
      color TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      activeFrom TEXT,
      activeTo TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      description TEXT,
      paymentMethod TEXT,
      shared INTEGER NOT NULL,
      sharedWith TEXT,
      expenseKind TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      targetAmount REAL,
      targetDate TEXT,
      currentAmount REAL NOT NULL,
      priority TEXT NOT NULL
    );
  `);

  await migrateCategories(db);
  await seedDefaultCategories(db);
}

export async function resetDatabase() {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM movements;
    DELETE FROM goals;
    DELETE FROM categories;
  `);
  await seedDefaultCategories(db);
}

async function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (row?.count && row.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const defaults = [
    { name: 'Comida', kind: 'expense', nature: 'variable', isBasic: 1, isEnjoyment: 0 },
    { name: 'Transporte', kind: 'expense', nature: 'variable', isBasic: 1, isEnjoyment: 0 },
    { name: 'Salidas', kind: 'expense', nature: 'variable', isBasic: 0, isEnjoyment: 1 },
  ];

  for (const item of defaults) {
    await db.runAsync(
      `INSERT INTO categories
        (id, name, kind, nature, isBasic, isEnjoyment, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createId('cat'),
        item.name,
        item.kind,
        item.nature,
        item.isBasic,
        item.isEnjoyment,
        1,
        now,
        now,
      ]
    );
  }
}

async function migrateCategories(db: SQLite.SQLiteDatabase) {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(categories)');
  const existing = new Set(columns.map((col) => col.name));
  const now = new Date().toISOString();

  if (!existing.has('isActive')) {
    await db.execAsync('ALTER TABLE categories ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1');
  }
  if (!existing.has('nature')) {
    await db.execAsync(
      "ALTER TABLE categories ADD COLUMN nature TEXT NOT NULL DEFAULT 'variable'"
    );
  }
  if (!existing.has('activeFrom')) {
    await db.execAsync('ALTER TABLE categories ADD COLUMN activeFrom TEXT');
  }
  if (!existing.has('activeTo')) {
    await db.execAsync('ALTER TABLE categories ADD COLUMN activeTo TEXT');
  }
  if (!existing.has('createdAt')) {
    await db.execAsync('ALTER TABLE categories ADD COLUMN createdAt TEXT');
  }
  if (!existing.has('updatedAt')) {
    await db.execAsync('ALTER TABLE categories ADD COLUMN updatedAt TEXT');
  }

  await db.runAsync(
    `UPDATE categories
     SET nature = COALESCE(NULLIF(nature, ''), 'variable'),
         isActive = COALESCE(isActive, 1),
         createdAt = COALESCE(createdAt, ?),
         updatedAt = COALESCE(updatedAt, ?)`,
    [now, now]
  );
}
