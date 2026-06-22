import { getDatabase } from '../schema';
import type { Transaction, TransactionRow, TransactionType } from '../../types/index';
import { generateId, toDateString } from '@utils/id';

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    categoryId: row.category_id,
    note: row.note,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at ?? undefined,
    category: {
      id: row.category_id,
      name: row.category_name,
      icon: row.category_icon,
      color: row.category_color,
      type: row.category_type,
      isDefault: true,
      createdAt: '',
    },
  };
}

// Base query that always joins category data
const BASE_QUERY = `
  SELECT
    t.*,
    c.name  AS category_name,
    c.icon  AS category_icon,
    c.color AS category_color,
    c.type  AS category_type
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
`;

export type GetTransactionsOptions = {
  userId: string; 
  limit?: number | undefined;
  offset?: number | undefined;
  type?: TransactionType | undefined;
  categoryId?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  searchQuery?: string | undefined;
};

export const transactionRepository = {
  async getAll(options: GetTransactionsOptions): Promise<Transaction[]> {
    const db = getDatabase();
    const {
      userId,
      limit = 50,
      offset = 0,
      type,
      categoryId,
      startDate,
      endDate,
      searchQuery,
    } = options;

     const conditions: string[] = ['t.user_id = ?'];
    const params: (string | number)[] = [userId];

    if (type) {
      conditions.push('t.type = ?');
      params.push(type);
    }
    if (categoryId) {
      conditions.push('t.category_id = ?');
      params.push(categoryId);
    }
    if (startDate) {
      conditions.push('t.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('t.date <= ?');
      params.push(endDate);
    }
    if (searchQuery) {
      conditions.push('(t.note LIKE ? OR c.name LIKE ?)');
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      ${BASE_QUERY}
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await db.getAllAsync<TransactionRow>(query, [
      ...params,
      limit,
      offset,
    ]);
    return rows.map(rowToTransaction);
  },

  async getById(id: string): Promise<Transaction | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      `${BASE_QUERY} WHERE t.id = ?`,
      [id]
    );
    return row ? rowToTransaction(row) : null;
  },

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'category'> & {
      userId: string;  
    }
    
  ): Promise<Transaction> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO transactions
        (id, user_id, amount, type, category_id, note, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.userId, data.amount, data.type, data.categoryId, data.note, data.date, now, now]
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create transaction');
    return created;
  },

  async update(
    id: string,
    data: Partial<Pick<Transaction, 'amount' | 'type' | 'categoryId' | 'note' | 'date'>>
  ): Promise<Transaction> {
    const db = getDatabase();
    const fields: string[] = [];
    const params: (string | number)[] = [];

    if (data.amount !== undefined) { fields.push('amount = ?'); params.push(data.amount); }
    if (data.type !== undefined) { fields.push('type = ?'); params.push(data.type); }
    if (data.categoryId !== undefined) { fields.push('category_id = ?'); params.push(data.categoryId); }
    if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }
    if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }

    if (fields.length === 0) throw new Error('Nothing to update');

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await db.runAsync(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    const updated = await this.getById(id);
    if (!updated) throw new Error('Transaction not found');
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
  },

  // Aggregates — used by dashboard and insights screens
  async getSummary(
    userId: string,    // ← added
    startDate: string,
    endDate: string
  ): Promise<{ totalIncome: number; totalExpenses: number; balance: number; transactionCount: number }> {
    const db = getDatabase();
    const row = await db.getFirstAsync<{
      total_income: number;
      total_expenses: number;
      transaction_count: number;
    }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    );

    const totalIncome = row?.total_income ?? 0;
    const totalExpenses = row?.total_expenses ?? 0;
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: row?.transaction_count ?? 0,
    };
  },

  async getSpendingByCategory(
    userId: string,    // ← added
    startDate: string,
    endDate: string
  ): Promise<Array<{ categoryId: string; name: string; color: string; icon: string; total: number }>> {
    const db = getDatabase();
    return db.getAllAsync(
      `SELECT
        c.id   AS categoryId,
        c.name AS name,
        c.color AS color,
        c.icon  AS icon,
        COALESCE(SUM(t.amount), 0) AS total
       FROM categories c
       LEFT JOIN transactions t
         ON t.category_id = c.id
         AND t.type = 'expense'
         AND t.user_id = ?
         AND t.date BETWEEN ? AND ?
       WHERE c.type = 'expense'
       GROUP BY c.id
       HAVING total > 0
       ORDER BY total DESC`,
      [userId, startDate, endDate]
    );
  },

  // Returns daily totals for the sparkline chart on dashboard
  async getDailyTotals(
    userId: string,    // ← added
    startDate: string,
    endDate: string,
    type: TransactionType
  ): Promise<Array<{ date: string; total: number }>> {
    const db = getDatabase();
    return db.getAllAsync(
      `SELECT date, SUM(amount) AS total
       FROM transactions
       WHERE user_id = ? AND type = ? AND date BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
      [userId, type, startDate, endDate]
    );
  },
};