import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionRepository, type GetTransactionsOptions } from '../../../database/repositories/transactionRepository';
import type { Transaction } from '../../../types/index';

// Query key factory — centralized key management prevents cache bugs
export const transactionKeys = {
  all:     ['transactions'] as const,
  lists:   () => [...transactionKeys.all, 'list'] as const,
  list:    (opts: GetTransactionsOptions) => [...transactionKeys.lists(), opts] as const,
  detail:  (id: string) => [...transactionKeys.all, 'detail', id] as const,
  summary: (start: string, end: string) =>
    [...transactionKeys.all, 'summary', start, end] as const,
  byCategory: (start: string, end: string) =>
    [...transactionKeys.all, 'byCategory', start, end] as const,
  daily: (start: string, end: string, type: string) =>
    [...transactionKeys.all, 'daily', start, end, type] as const,
};

export function useTransactions(options: GetTransactionsOptions = {}) {
  return useQuery({
    queryKey: transactionKeys.list(options),
    queryFn: () => transactionRepository.getAll(options),
  });
}

export function useTransactionSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: transactionKeys.summary(startDate, endDate),
    queryFn: () => transactionRepository.getSummary(startDate, endDate),
  });
}

export function useSpendingByCategory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: transactionKeys.byCategory(startDate, endDate),
    queryFn: () => transactionRepository.getSpendingByCategory(startDate, endDate),
  });
}

export function useDailyTotals(
  startDate: string,
  endDate: string,
  type: 'income' | 'expense'
) {
  return useQuery({
    queryKey: transactionKeys.daily(startDate, endDate, type),
    queryFn: () => transactionRepository.getDailyTotals(startDate, endDate, type),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'category'>
    ) => transactionRepository.create(data),

    onSuccess: () => {
      // Invalidate ALL transaction queries so every screen refreshes
      // This is the beauty of React Query — one line updates the entire app
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