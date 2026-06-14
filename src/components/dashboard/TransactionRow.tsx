import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { memo } from 'react';
import { router } from 'expo-router';
import * as Icons from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';
import { formatCurrency } from '@utils/id';
import { formatTime } from '@utils/date';
import type { Transaction } from '../../types/index';

type TransactionRowProps = {
  transaction: Transaction;
};

// Maps category icon name (stored as string in DB) → actual Lucide component
// Falls back to a generic icon if the name doesn't exist
function getIconComponent(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName];
  return IconComponent ?? Icons.Circle;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
}: TransactionRowProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const isExpense = transaction.type === 'expense';
  const category = transaction.category;

  const Icon = category ? getIconComponent(category.icon) : Icons.Circle;
  const iconColor = category?.color ?? colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.6}
      onPress={() => router.push(`/transaction/${transaction.id}`)}
    >
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: `${iconColor}1A`, borderRadius: radius.md }, // 1A = ~10% opacity hex
        ]}
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>

      <View style={[styles.details, { marginLeft: spacing.md }]}>
        <Text
          style={[styles.title, { color: colors.text, fontSize: typography.base }]}
          numberOfLines={1}
        >
          {category?.name ?? 'Uncategorized'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.xs }]}>
          {formatTime(transaction.date)}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color: isExpense ? colors.expense : colors.income,
            fontSize: typography.base,
          },
        ]}
      >
        {isExpense ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, justifyContent: 'center' },
  title: { fontWeight: '500', marginBottom: 2 },
  subtitle: { fontWeight: '400' },
  amount: { fontWeight: '600' },
});