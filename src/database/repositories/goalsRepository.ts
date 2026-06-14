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
  async getAll(): Promise<SavingsGoal[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<Parameters<typeof rowToGoal>[0]>(
      `SELECT * FROM savings_goals ORDER BY created_at DESC`
    );
    return rows.map(rowToGoal);
  },

  async create(
    data: Pick<SavingsGoal, 'name' | 'targetAmount' | 'color'> & {
      targetDate?: string | undefined;
    }
  ): Promise<SavingsGoal> {
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO savings_goals
        (id, name, target_amount, saved_amount, target_date, color, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [id, data.name, data.targetAmount, data.targetDate ?? null, data.color, now, now]
    );

    const created = await db.getFirstAsync<Parameters<typeof rowToGoal>[0]>(
      `SELECT * FROM savings_goals WHERE id = ?`,
      [id]
    );
    if (!created) throw new Error('Failed to create goal');
    return rowToGoal(created);
  },

  async addFunds(id: string, amount: number): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE savings_goals
       SET saved_amount = saved_amount + ?,
           updated_at = ?
       WHERE id = ?`,
      [amount, new Date().toISOString(), id]
    );
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM savings_goals WHERE id = ?`, [id]);
  },
};