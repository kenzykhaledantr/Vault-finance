import { useQuery } from '@tanstack/react-query';
import { budgetRepository } from '../../../database/repositories/budgetRepository';
import { toMonthString } from '@utils/id';

export const budgetKeys = {
  all: ['budgets'] as const,
  byMonth: (month: string) => [...budgetKeys.all, month] as const,
};

export function useBudgets(month: string = toMonthString()) {
  return useQuery({
    queryKey: budgetKeys.byMonth(month),
    queryFn: () => budgetRepository.getByMonth(month),
  });
}

// Sums all category budgets into one number for the dashboard's "Budget" total
export function useBudgetSummary(month: string = toMonthString()) {
  return useQuery({
    queryKey: [...budgetKeys.byMonth(month), 'sum'],
    queryFn: async () => {
      const budgets = await budgetRepository.getByMonth(month);
      return budgets.reduce((sum, b) => sum + b.limitAmount, 0);
    },
  });
}