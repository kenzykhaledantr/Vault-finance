import { supabase } from './supabaseClient';
import { getDatabase } from '../../database/schema';
import type { Transaction } from '../../types/index';

// Supabase SQL schema (run this in your Supabase SQL editor):
//
// CREATE TABLE transactions (
//   id          TEXT PRIMARY KEY,
//   user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   amount      INTEGER NOT NULL,
//   type        TEXT NOT NULL,
//   category_id TEXT NOT NULL,
//   note        TEXT NOT NULL DEFAULT '',
//   date        TEXT NOT NULL,
//   created_at  TIMESTAMPTZ NOT NULL,
//   updated_at  TIMESTAMPTZ NOT NULL
// );
// ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users can only access own transactions"
//   ON transactions FOR ALL USING (auth.uid() = user_id);

export const syncService = {
  // Push all unsynced local transactions to Supabase
  async pushUnsyncedTransactions(userId: string): Promise<number> {
    const db = getDatabase();

    // Fetch everything not yet synced
    const unsynced = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE synced_at IS NULL ORDER BY created_at ASC LIMIT 100`
    );

    if (unsynced.length === 0) return 0;

    const records = unsynced.map((t) => ({
      id: t.id,
      user_id: userId,
      amount: t.amount,
      type: t.type,
      category_id: t.categoryId,
      note: t.note,
      date: t.date,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }));

    // upsert = insert or update if already exists
    // onConflict: 'id' means "if this ID already exists, update it"
    const { error } = await supabase
      .from('transactions')
      .upsert(records, { onConflict: 'id' });

    if (error) throw new Error(`Sync failed: ${error.message}`);

    // Mark as synced in local DB
    const syncedAt = new Date().toISOString();
    const ids = unsynced.map((t) => `'${t.id}'`).join(',');
    await db.execAsync(
      `UPDATE transactions SET synced_at = '${syncedAt}' WHERE id IN (${ids})`
    );

    return unsynced.length;
  },

  // Pull transactions from Supabase that don't exist locally
  // Used when user logs in on a new device
  async pullRemoteTransactions(userId: string): Promise<number> {
    const db = getDatabase();

    const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)   // ← filter by user
    .order('created_at', { ascending: false })
    .limit(500);

    if (error) throw new Error(`Pull failed: ${error.message}`);
    if (!data || data.length === 0) return 0;

    // Insert into local DB — ignore conflicts (already have it)
    await db.withTransactionAsync(async () => {
      for (const t of data) {
        await db.runAsync(
          `INSERT OR IGNORE INTO transactions
            (id, amount, type, category_id, note, date, created_at, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t['id'], t['amount'], t['type'], t['category_id'],
            t['note'], t['date'], t['created_at'], t['updated_at'],
            new Date().toISOString(),
          ]
        );
      }
    });

    return data.length;
  },

  async syncAll(userId: string): Promise<{ pushed: number; pulled: number }> {
    const [pushed, pulled] = await Promise.all([
      this.pushUnsyncedTransactions(userId),
      this.pullRemoteTransactions(userId),
    ]);
    return { pushed, pulled };
  },
};