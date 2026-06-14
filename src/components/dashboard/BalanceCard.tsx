import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { memo } from 'react';
import { ArrowUpRight, Plus, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@hooks/useTheme';
import { formatCurrency } from '@utils/id';

type BalanceCardProps = {
  balance: number;          // in cents
  changePercent?: number | undefined;  // e.g. +2.4
};

// memo() prevents re-render if props haven't changed —
// important since this card sits at the top of a scrolling list
export const BalanceCard = memo(function BalanceCard({
  balance,
  changePercent,
}: BalanceCardProps) {
  const { typography, spacing, radius } = useTheme();

  // This card always uses dark surface regardless of theme —
  // matches the design's intentional dark "vault" branding
  const cardColors = {
    bg: '#141414',
    surface: '#1f1f1f',
    text: '#ffffff',
    textMuted: '#9a9a9a',
    accent: '#22c55e',
    accentBg: 'rgba(34, 197, 94, 0.15)',
  };

  return (
    <View style={[styles.card, { backgroundColor: cardColors.bg, borderRadius: radius.lg }]}>
      <Text style={[styles.label, { color: cardColors.textMuted, fontSize: typography.sm }]}>
        Total available balance
      </Text>

      <View style={styles.balanceRow}>
        <Text style={[styles.balance, { color: cardColors.text, fontSize: typography.xxxl }]}>
          {formatCurrency(balance)}
        </Text>
      </View>

      {changePercent !== undefined && (
        <View
          style={[
            styles.changeBadge,
            { backgroundColor: cardColors.accentBg, borderRadius: radius.sm },
          ]}
        >
          <TrendingUp size={12} color={cardColors.accent} strokeWidth={2.5} />
          <Text style={[styles.changeText, { color: cardColors.accent, fontSize: typography.xs }]}>
            {changePercent > 0 ? '+' : ''}
            {changePercent.toFixed(1)}% this month
          </Text>
        </View>
      )}

      {/* Quick actions row */}
      <View style={[styles.actionsRow, { marginTop: spacing.xl }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: cardColors.surface, borderRadius: radius.md },
          ]}
          activeOpacity={0.7}
          onPress={() => {/* TODO: transfer flow */}}
        >
          <ArrowUpRight size={18} color={cardColors.text} strokeWidth={2} />
          <Text style={[styles.actionText, { color: cardColors.text, fontSize: typography.sm }]}>
            Transfer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.depositButton,
            { backgroundColor: cardColors.accent, borderRadius: radius.md },
          ]}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={[styles.actionText, { color: '#000', fontSize: typography.sm, fontWeight: '600' }]}>
            Deposit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { padding: 20 },
  label: { fontWeight: '400', marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  balance: { fontWeight: '700' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  changeText: { fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  depositButton: {},
  actionText: { fontWeight: '500' },
});