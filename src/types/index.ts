export type TransactionType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
  createdAt: string;
};

export type Transaction = {
  id: string;
  amount: number;       // Always in cents
  type: TransactionType;
  categoryId: string;
  category?: Category;
  note: string;
  date: string;         // ISO 8601
  createdAt: string;
  updatedAt: string;
  syncedAt?: string | undefined;
};

export type Budget = {
  id: string;
  categoryId: string;
  category?: Category;
  limitAmount: number;  // In cents
  month: string;        // 'YYYY-MM'
  spentAmount: number;  // Computed
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string | undefined;
  color: string;
  imageUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

// What the repository layer returns from raw SQLite rows
export type TransactionRow = {
  id: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  note: string;
  date: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  // Joined from categories
  category_name: string;
  category_icon: string;
  category_color: string;
  category_type: TransactionType;
};