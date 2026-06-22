import { getDatabase } from '../schema';
import type { Budget } from '../../types/index';
import { generateId, toMonthString } from '@utils/id';

function rowToBudget(row: {
  id: string;
  category_id: string;
  limit_amount: number;
  month: string;
  created_at: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  spent_amount: number;
}): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    limitAmount: row.limit_amount,
    month: row.month,
    createdAt: row.created_at,
    spentAmount: row.spent_amount,
    category: {
      id: row.category_id,
      name: row.category_name,
      icon: row.category_icon,
      color: row.category_color,
      type: 'expense',
      isDefault: true,
      createdAt: '',
    },
  };
}

export const budgetRepository = {
  async getByMonth(
    userId: string,           // ← added
    month: string = toMonthString()
  ): Promise<Budget[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<Parameters<typeof rowToBudget>[0]>(
      `SELECT
        b.*,
        c.name  AS category_name,
        c.icon  AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(t.amount), 0) AS spent_amount
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t
         ON t.category_id = b.category_id
         AND t.user_id = b.user_id
         AND t.type = 'expense'
         AND strftime('%Y-%m', t.date) = b.month
       WHERE b.month = ?
       GROUP BY b.id
       ORDER BY spent_amount DESC`,
      [userId, month]
    );
    return rows.map(rowToBudget);
  },

  async upsert(
    userId: string,           // ← added
    categoryId: string,
    limitAmount: number,
    month: string = toMonthString()
  ): Promise<void> {
    const db = getDatabase();
    const id = generateId();
    await db.runAsync(
      `INSERT INTO budgets (id, user_id, category_id, limit_amount, month)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, category_id, month)
       DO UPDATE SET limit_amount = excluded.limit_amount`,
      [id, userId, categoryId, limitAmount, month]
    );
  },


  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM budgets WHERE id = ?`, [id]);
  },
};