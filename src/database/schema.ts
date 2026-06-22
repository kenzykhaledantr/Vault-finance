import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('vault.db');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = OFF;
  `);

  // ── Migration check ───────────────────────────────────────────────────────
  // Check every table for user_id column.
  // If any table is missing it, drop and recreate everything cleanly.
  const transactionCols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(transactions)`
  );
  const budgetCols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(budgets)`
  );
  const goalCols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(savings_goals)`
  );

  const transactionHasUserId = transactionCols.some((c) => c.name === 'user_id');
  const budgetHasUserId = budgetCols.some((c) => c.name === 'user_id');
  const goalHasUserId = goalCols.some((c) => c.name === 'user_id');

  const needsMigration =
    !transactionHasUserId || !budgetHasUserId || !goalHasUserId;

  if (needsMigration) {
    // Drop in reverse dependency order
    await database.execAsync(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS budgets;
      DROP TABLE IF EXISTS savings_goals;
      DROP TABLE IF EXISTS categories;
    `);
  }

  // ── Create tables ─────────────────────────────────────────────────────────
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL,
      icon        TEXT NOT NULL,
      color       TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      is_default  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY NOT NULL,
      user_id     TEXT NOT NULL,
      amount      INTEGER NOT NULL CHECK(amount > 0),
      type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category_id TEXT NOT NULL,
      note        TEXT NOT NULL DEFAULT '',
      date        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at   TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id           TEXT PRIMARY KEY NOT NULL,
      user_id      TEXT NOT NULL,
      category_id  TEXT NOT NULL,
      limit_amount INTEGER NOT NULL CHECK(limit_amount > 0),
      month        TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, category_id, month),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id            TEXT PRIMARY KEY NOT NULL,
      user_id       TEXT NOT NULL,
      name          TEXT NOT NULL,
      target_amount INTEGER NOT NULL CHECK(target_amount > 0),
      saved_amount  INTEGER NOT NULL DEFAULT 0,
      target_date   TEXT,
      color         TEXT NOT NULL DEFAULT '#22c55e',
      image_url     TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_date
      ON transactions(user_id, date DESC);

    CREATE INDEX IF NOT EXISTS idx_transactions_user_category
      ON transactions(user_id, category_id);

    CREATE INDEX IF NOT EXISTS idx_budgets_user_month
      ON budgets(user_id, month);

    CREATE INDEX IF NOT EXISTS idx_goals_user
      ON savings_goals(user_id);
  `);

  await database.execAsync(`PRAGMA foreign_keys = ON;`);

  // Reseed categories if wiped by migration
  await seedDefaultCategories(database);
}

async function seedDefaultCategories(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_default = 1'
  );
  if (existing && existing.count > 0) return;

  const defaults = [
    { id: 'cat_dining',       name: 'Dining',         icon: 'UtensilsCrossed', color: '#f97316', type: 'expense' },
    { id: 'cat_shopping',     name: 'Shopping',       icon: 'ShoppingBag',     color: '#8b5cf6', type: 'expense' },
    { id: 'cat_transport',    name: 'Transport',      icon: 'Car',             color: '#3b82f6', type: 'expense' },
    { id: 'cat_bills',        name: 'Bills',          icon: 'Receipt',         color: '#ef4444', type: 'expense' },
    { id: 'cat_health',       name: 'Health',         icon: 'Heart',           color: '#ec4899', type: 'expense' },
    { id: 'cat_groceries',    name: 'Groceries',      icon: 'ShoppingCart',    color: '#22c55e', type: 'expense' },
    { id: 'cat_entertainment',name: 'Entertainment',  icon: 'Tv',              color: '#a855f7', type: 'expense' },
    { id: 'cat_travel',       name: 'Travel',         icon: 'Plane',           color: '#06b6d4', type: 'expense' },
    { id: 'cat_salary',       name: 'Salary',         icon: 'Banknote',        color: '#22c55e', type: 'income'  },
    { id: 'cat_freelance',    name: 'Freelance',      icon: 'Laptop',          color: '#10b981', type: 'income'  },
    { id: 'cat_investment',   name: 'Investment',     icon: 'TrendingUp',      color: '#06b6d4', type: 'income'  },
    { id: 'cat_other',        name: 'Other',          icon: 'MoreHorizontal',  color: '#71717a', type: 'expense' },
  ];

  await database.withTransactionAsync(async () => {
    for (const cat of defaults) {
      await database.runAsync(
        `INSERT OR IGNORE INTO categories
          (id, name, icon, color, type, is_default)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [cat.id, cat.name, cat.icon, cat.color, cat.type]
      );
    }
  });
}