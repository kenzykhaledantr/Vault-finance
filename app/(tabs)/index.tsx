import { View, ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Bell } from 'lucide-react-native';

import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@store/authStore';
import {
  useTransactionSummary,
  useTransactions,
  transactionKeys,
} from '@features/transactions/hooks/useTransactions';
import { useBudgetSummary } from '../../src/features/budgets/hooks/useBudgets';
import { getCurrentMonthRange } from '@utils/date';

import { BalanceCard } from '@components/dashboard/BalanceCard';
import { MonthlySpending } from '@components/dashboard/MonthlySpending';
import { RecentActivity } from '@components/dashboard/RecentActivity';

export default function DashboardScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute date range once per render — memoized so it doesn't
  // create a new object reference every render (which would bust query cache)
  const { start, end } = useMemo(() => getCurrentMonthRange(), []);

  // Three independent queries — React Query fires these in parallel
  const { data: summary, isLoading: summaryLoading } = useTransactionSummary(start, end);
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useTransactions({
    limit: 5,
  });
  const { data: budgetTotal } = useBudgetSummary();

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Invalidate everything — pulls fresh data from SQLite
    await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    setIsRefreshing(false);
  }, [queryClient]);

  const balance = summary ? summary.totalIncome - summary.totalExpenses : 0;
  const spent = summary?.totalExpenses ?? 0;
  const budget = budgetTotal ?? 320000; // $3,200 fallback matches design

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.accentSubtle },
              ]}
            >
              <ShieldCheck size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted, fontSize: typography.xs }]}>
                Welcome back
              </Text>
              <Text style={[styles.appName, { color: colors.text, fontSize: typography.md }]}>
                {user?.name ?? 'Vault'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Bell size={18} color={colors.text} strokeWidth={1.8} />
          </View>
        </View>

        {/* Balance card */}
        <View style={{ marginBottom: spacing.lg }}>
          <BalanceCard balance={balance} changePercent={summaryLoading ? undefined : 2.4} />
        </View>

        {/* Monthly spending */}
        <View style={{ marginBottom: spacing.lg }}>
          <MonthlySpending spent={spent} budget={budget} />
        </View>

        {/* Recent activity */}
        <RecentActivity transactions={recentTransactions} isLoading={transactionsLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontWeight: '400', marginBottom: 1 },
  appName: { fontWeight: '600' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});