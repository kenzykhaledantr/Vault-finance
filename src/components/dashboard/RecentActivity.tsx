import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { memo } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { TransactionRow } from './TransactionRow';
import type { Transaction } from '../../types/index';

type RecentActivityProps = {
  transactions: Transaction[];
  isLoading: boolean;
};

export const RecentActivity = memo(function RecentActivity({
  transactions,
  isLoading,
}: RecentActivityProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.md }]}>
          Recent activity
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/ledger')}>
          <Text style={[styles.viewAll, { color: colors.accent, fontSize: typography.sm }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.sm }]}>
            No transactions yet
          </Text>
        </View>
      ) : (
        transactions.map((transaction, index) => (
          <View key={transaction.id}>
            <TransactionRow transaction={transaction} />
            {index < transactions.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            )}
          </View>
        ))
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontWeight: '600' },
  viewAll: { fontWeight: '500' },
  divider: { height: 1, marginLeft: 52 },
  loadingContainer: { paddingVertical: 24, alignItems: 'center' },
  emptyContainer: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontWeight: '400' },
});