import { getDatabase } from '../schema';
import type { Category } from '../../types/index';

// Maps raw snake_case DB row to camelCase TypeScript type
function rowToCategory(row: {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  is_default: number;
  created_at: string;
}): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as Category['type'],
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
  };
}

export const categoryRepository = {
  async getAll(): Promise<Category[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<Parameters<typeof rowToCategory>[0]>(
      `SELECT * FROM categories ORDER BY is_default DESC, name ASC`
    );
    return rows.map(rowToCategory);
  },

  async getByType(type: Category['type']): Promise<Category[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<Parameters<typeof rowToCategory>[0]>(
      `SELECT * FROM categories WHERE type = ? ORDER BY name ASC`,
      [type]
    );
    return rows.map(rowToCategory);
  },

  async getById(id: string): Promise<Category | null> {
    const db = getDatabase();
    const row = await db.getFirstAsync<Parameters<typeof rowToCategory>[0]>(
      `SELECT * FROM categories WHERE id = ?`,
      [id]
    );
    return row ? rowToCategory(row) : null;
  },

  async create(category: Omit<Category, 'isDefault' | 'createdAt'>): Promise<Category> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, type, is_default)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [category.id, category.name, category.icon, category.color, category.type]
    );
    const created = await this.getById(category.id);
    if (!created) throw new Error('Failed to create category');
    return created;
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    // Check it's not a default category
    const cat = await this.getById(id);
    if (cat?.isDefault) throw new Error('Cannot delete default categories');
    await db.runAsync(`DELETE FROM categories WHERE id = ?`, [id]);
  },
};