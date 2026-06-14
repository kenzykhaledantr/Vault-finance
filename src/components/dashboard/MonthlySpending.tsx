import { View, Text, StyleSheet } from 'react-native';
import { memo } from 'react';
import { useTheme } from '@hooks/useTheme';
import { formatCurrency } from '@utils/id';

type MonthlySpendingProps = {
  spent: number;     // in cents
  budget: number;    // in cents
};

export const MonthlySpending = memo(function MonthlySpending({
  spent,
  budget,
}: MonthlySpendingProps) {
  const { colors, typography, spacing, radius } = useTheme();

  const remaining = Math.max(budget - spent, 0);
  // Clamp to 100% — never show a progress bar wider than the container
  const percentUsed = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const dailyAverage = Math.round(spent / new Date().getDate());

  // Color shifts based on how much budget is used —
  // gives users an immediate visual warning before they overspend
  const progressColor =
    percentUsed >= 90 ? colors.expense : percentUsed >= 70 ? '#f59e0b' : colors.accent;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.md }]}>
          Monthly spending
        </Text>
      </View>

      <View style={styles.amountRow}>
        <View>
          <Text style={[styles.amountLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
            Current spend
          </Text>
          <Text style={[styles.amount, { color: colors.text, fontSize: typography.xl }]}>
            {formatCurrency(spent)}
          </Text>
        </View>
        <View style={styles.amountRight}>
          <Text style={[styles.amountLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
            Budget
          </Text>
          <Text style={[styles.budgetAmount, { color: colors.textSecondary, fontSize: typography.md }]}>
            {formatCurrency(budget)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.borderSubtle, borderRadius: radius.full },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentUsed}%`,
              backgroundColor: progressColor,
              borderRadius: radius.full,
            },
          ]}
        />
      </View>

      <View style={[styles.footer, { marginTop: spacing.md }]}>
        <View>
          <Text style={[styles.footerLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
            Remaining
          </Text>
          <Text style={[styles.footerValue, { color: colors.text, fontSize: typography.sm }]}>
            {formatCurrency(remaining)}
          </Text>
        </View>
        <View style={styles.amountRight}>
          <Text style={[styles.footerLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
            Daily avg
          </Text>
          <Text style={[styles.footerValue, { color: colors.text, fontSize: typography.sm }]}>
            {formatCurrency(dailyAverage)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1 },
  header: { marginBottom: 12 },
  title: { fontWeight: '600' },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  amountRight: { alignItems: 'flex-end' },
  amountLabel: { fontWeight: '400', marginBottom: 2 },
  amount: { fontWeight: '700' },
  budgetAmount: { fontWeight: '500' },
  progressTrack: { height: 6, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontWeight: '400', marginBottom: 2 },
  footerValue: { fontWeight: '600' },
});