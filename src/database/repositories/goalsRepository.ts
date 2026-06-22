import { getDatabase } from '../schema';
import type { SavingsGoal } from '../../types/index';
import { generateId } from '@utils/id';

function rowToGoal(row: {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  color: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    savedAmount: row.saved_amount,
    targetDate: row.target_date ?? undefined,
    color: row.color,
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const goalsRepository = {
  async getAll(userId: string): Promise<SavingsGoal[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<Parameters<typeof rowToGoal>[0]>(
      `SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(rowToGoal);
  },

  async create(
    userId: string,
    data: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color'> & {
      targetDate?: string | undefined;
    }
  ): Promise<SavingsGoal> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO savings_goals
        (id, user_id, name, target_amount, saved_amount, target_date, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [id, userId, data.name, data.targetAmount, data.targetDate ?? null, data.color, now, now]
    );

    const created = await db.getFirstAsync<Parameters<typeof rowToGoal>[0]>(
      `SELECT * FROM savings_goals WHERE id = ?`, [id]
    );
    if (!created) throw new Error('Failed to create goal');
    return rowToGoal(created);
  },

  async addFunds(userId: string, id: string, amount: number): Promise<void> {
    const db = getDatabase();
    // Verify ownership before updating
    await db.runAsync(
      `UPDATE savings_goals
       SET saved_amount = saved_amount + ?,
           updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [amount, new Date().toISOString(), id, userId]
    );
  },

 async delete(userId: string, id: string): Promise<void> {
    const db = getDatabase();
    // user_id check prevents deleting another user's goal
    await db.runAsync(
      `DELETE FROM savings_goals WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  },
};