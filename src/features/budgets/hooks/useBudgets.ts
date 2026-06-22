import { toMonthString } from '@/utils/id';
import { useAuthStore } from '@store/authStore';
import { useQuery } from '@tanstack/react-query';
import { budgetRepository } from '../../../database/repositories/budgetRepository';

// ─── Query key factory ──────────────────────────────────────────────────────── 
export const budgetKeys = {
  all: () => ['budgets'] as const,
  byMonth: (month: string) => [...budgetKeys.all(), 'byMonth', month] as const,
};


export function useBudgets(month: string = toMonthString()) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: budgetKeys.byMonth(month),
    queryFn: () => budgetRepository.getByMonth(userId, month),
    enabled: Boolean(userId),
  });
}

export function useBudgetSummary(month: string = toMonthString()) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [...budgetKeys.byMonth(month), 'sum'],
    queryFn: async () => {
      const budgets = await budgetRepository.getByMonth(userId, month);
      return budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    },
    enabled: Boolean(userId),
  });
}