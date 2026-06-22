import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/authStore';
import {
  transactionRepository,
  type GetTransactionsOptions,
} from '../../../database/repositories/transactionRepository';
import type { Transaction } from '../../../types/index';

// ─── Query key factory ────────────────────────────────────────────────────────
export const transactionKeys = {
  all:        ['transactions'] as const,
  lists:      () => [...transactionKeys.all, 'list'] as const,
  list:       (opts: GetTransactionsOptions) => [...transactionKeys.lists(), opts] as const,
  detail:     (id: string) => [...transactionKeys.all, 'detail', id] as const,
  summary:    (start: string, end: string) => [...transactionKeys.all, 'summary', start, end] as const,
  byCategory: (start: string, end: string) => [...transactionKeys.all, 'byCategory', start, end] as const,
  daily:      (start: string, end: string, type: string) => [...transactionKeys.all, 'daily', start, end, type] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useTransactions(options: Omit<GetTransactionsOptions, 'userId'> = {}) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: transactionKeys.list({ ...options, userId }),
    queryFn: () => transactionRepository.getAll({ ...options, userId }),
    enabled: Boolean(userId),
  });
}

export function useTransactionSummary(startDate: string, endDate: string) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: transactionKeys.summary(startDate, endDate),
    queryFn: () => transactionRepository.getSummary(userId, startDate, endDate),
    enabled: Boolean(userId),
  });
}

export function useSpendingByCategory(startDate: string, endDate: string) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: transactionKeys.byCategory(startDate, endDate),
    queryFn: () => transactionRepository.getSpendingByCategory(userId, startDate, endDate),
    enabled: Boolean(userId),
  });
}

export function useDailyTotals(
  startDate: string,
  endDate: string,
  type: 'income' | 'expense'
) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: transactionKeys.daily(startDate, endDate, type),
    queryFn: () => transactionRepository.getDailyTotals(userId, startDate, endDate, type),
    enabled: Boolean(userId),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    // Transaction type comes from @types/index — no IDBTransaction confusion
    mutationFn: (
      data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'category'>
    ) => transactionRepository.create({ ...data, userId: user?.id ?? '' }),

    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });

      if (created.type === 'expense') {
        try {
          const { notificationService } = await import(
            '../../../services/notifications/notificationService'
          );
          const { budgetRepository } = await import(
            '../../../database/repositories/budgetRepository'
          );
          const { toMonthString } = await import('@utils/id');

          const budgets = await budgetRepository.getByMonth(
            user?.id ?? '',
            toMonthString()
          );
          const budget = budgets.find((b) => b.categoryId === created.categoryId);

          if (budget && budget.limitAmount > 0) {
            const percent = (budget.spentAmount / budget.limitAmount) * 100;
            const remaining = budget.limitAmount - budget.spentAmount;
            if (percent >= 80) {
              await notificationService.sendBudgetWarning(
                budget.category?.name ?? 'Category',
                percent,
                remaining
              );
            }
          }
        } catch {
          // Never block transaction save on notification failure
        }
      }
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<Transaction, 'amount' | 'type' | 'categoryId' | 'note' | 'date'>>;
    }) => transactionRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}