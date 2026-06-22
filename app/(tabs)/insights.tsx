import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, X, Check } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';

import { useTheme } from '@hooks/useTheme';
import { useBudgets } from '@features/budgets/hooks/useBudgets';
import { useSpendingByCategory } from '@features/transactions/hooks/useTransactions';
import { budgetRepository } from '../../src/database/repositories/budgetRepository';
import { useQueryClient } from '@tanstack/react-query';
import { budgetKeys } from '@features/budgets/hooks/useBudgets';
import { formatCurrency, parseToCents, toMonthString } from '@utils/id';
import { getCurrentMonthRange } from '@utils/date';
import type { Budget } from '../../src/types/index';
import { useAuthStore } from '@/store/authStore';

function getIconComponent(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName];
  return IconComponent ?? Icons.Circle;
}

export default function InsightsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { start, end } = getCurrentMonthRange();

  const { data: budgets = [], isLoading } = useBudgets();
  const { data: categorySpending = [] } = useSpendingByCategory(start, end);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);

  const openEdit = useCallback((budget: Budget) => {
    setEditingBudget(budget);
    setLimitInput((budget.limitAmount / 100).toFixed(2));
  }, []);

  const { user } = useAuthStore();

const saveLimit = useCallback(async () => {
  if (!editingBudget) return;
  const cents = parseToCents(limitInput);
  if (cents <= 0) {
    Alert.alert('Invalid amount', 'Please enter a valid budget amount.');
    return;
  }
  setIsSaving(true);
  try {
    await budgetRepository.upsert(
      user?.id ?? '',      // ← pass userId
      editingBudget.categoryId,
      cents,
      toMonthString()
    );
    await queryClient.invalidateQueries({ queryKey: budgetKeys.all() });
    setEditingBudget(null);
  } catch {
    Alert.alert('Error', 'Failed to save budget. Please try again.');
  } finally {
    setIsSaving(false);
  }
}, [editingBudget, limitInput, queryClient, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxxl,
            paddingHorizontal: spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
          Budget & Insights
        </Text>

        {/* Monthly overview card */}
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: '#141414',
              borderRadius: radius.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={[styles.overviewTitle, { color: '#a0a0a0', fontSize: typography.sm }]}>
            Monthly overview
          </Text>
          <Text style={[styles.overviewDate, { color: '#a0a0a0', fontSize: typography.xs }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          <View style={[styles.totalSpentBadge, { marginTop: spacing.md }]}>
            <Text style={[{ color: '#ffffff', fontSize: typography.sm, fontWeight: '500' }]}>
              Total spent: {formatCurrency(totalSpent)}
            </Text>
          </View>

          {/* Donut placeholder — Victory Native chart */}
          <View style={[styles.donutContainer]}>
            <View
              style={[
                styles.donutOuter,
                { borderColor: colors.accent, borderWidth: 12 },
              ]}
            >
              <View style={styles.donutInner}>
                <Text style={[{ color: '#a0a0a0', fontSize: typography.xs }]}>
                  Remaining
                </Text>
                <Text style={[{ color: '#ffffff', fontSize: typography.lg, fontWeight: '700' }]}>
                  {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
                </Text>
              </View>
            </View>
          </View>

          {/* Legend */}
          {categorySpending.slice(0, 4).map((cat) => (
            <View key={cat.categoryId} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={[{ color: '#a0a0a0', fontSize: typography.sm, flex: 1 }]}>
                {cat.name}
              </Text>
              <Text style={[{ color: '#ffffff', fontSize: typography.sm, fontWeight: '500' }]}>
                {formatCurrency(cat.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Smart insight */}
        <View
          style={[
            styles.insightCard,
            { backgroundColor: '#0a2010', borderRadius: radius.lg, marginTop: spacing.lg },
          ]}
        >
          <Text style={[{ color: colors.accent, fontSize: typography.sm, fontWeight: '600' }]}>
            ⚡ Smart insights
          </Text>
          <Text style={[{ color: '#d4d4d4', fontSize: typography.sm, marginTop: 6, lineHeight: 20 }]}>
            You&apos;re on track to save {formatCurrency(Math.max(totalBudget - totalSpent, 0))} more this month.
          </Text>
        </View>

        {/* Budget categories */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.md }]}>
            Budget categories
          </Text>
          <TouchableOpacity style={styles.adjustRow}>
            <Settings size={14} color={colors.textMuted} />
            <Text style={[{ color: colors.textMuted, fontSize: typography.xs, marginLeft: 4 }]}>
              Adjust limits
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : budgets.length === 0 ? (
          <View
            style={[
              styles.emptyBudget,
              { backgroundColor: colors.surface, borderRadius: radius.lg },
            ]}
          >
            <Text style={[{ color: colors.textMuted, fontSize: typography.sm, textAlign: 'center' }]}>
              No budgets set yet.{'\n'}Tap a category to set a limit.
            </Text>
          </View>
        ) : (
          budgets.map((budget) => (
            <BudgetCategoryRow
              key={budget.id}
              budget={budget}
              onEdit={openEdit}
              colors={colors}
              typography={typography}
              spacing={spacing}
              radius={radius}
            />
          ))
        )}
      </ScrollView>

      {/* Edit budget modal */}
      <Modal
        visible={editingBudget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingBudget(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderRadius: radius.xl },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.lg }]}>
                Set budget limit
              </Text>
              <TouchableOpacity onPress={() => setEditingBudget(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {editingBudget && (
              <Text style={[{ color: colors.textSecondary, fontSize: typography.sm, marginBottom: spacing.lg }]}>
                {editingBudget.category?.name} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            )}

            <View
              style={[
                styles.amountInputWrapper,
                { backgroundColor: colors.background, borderRadius: radius.md },
              ]}
            >
              <Text style={[{ color: colors.textMuted, fontSize: typography.xl, fontWeight: '300' }]}>
                $
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { color: colors.text, fontSize: typography.xl },
                ]}
                value={limitInput}
                onChangeText={setLimitInput}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.accent, borderRadius: radius.md, opacity: isSaving ? 0.7 : 1 },
              ]}
              onPress={saveLimit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Check size={18} color="#000" strokeWidth={2.5} />
                  <Text style={[{ color: '#000', fontSize: typography.md, fontWeight: '600' }]}>
                    Save limit
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BudgetCategoryRow({
  budget,
  onEdit,
  colors,
  typography,
  spacing,
  radius,
}: {
  budget: Budget;
  onEdit: (b: Budget) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
}) {
  const percent = budget.limitAmount > 0
    ? Math.min((budget.spentAmount / budget.limitAmount) * 100, 100)
    : 0;
  const remaining = Math.max(budget.limitAmount - budget.spentAmount, 0);
  const progressColor =
    percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : colors.accent;

  const Icon = getIconComponent(budget.category?.icon ?? 'Circle');
  const iconColor = budget.category?.color ?? colors.accent;

  return (
    <View
      style={[
        styles.budgetRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.budgetRowTop}>
        <View style={styles.budgetRowLeft}>
          <View
            style={[
              styles.budgetIcon,
              { backgroundColor: `${iconColor}1A`, borderRadius: radius.sm },
            ]}
          >
            <Icon size={16} color={iconColor} />
          </View>
          <View>
            <Text style={[{ color: colors.text, fontSize: typography.sm, fontWeight: '500' }]}>
              {budget.category?.name ?? 'Category'}
            </Text>
            <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>
              {budget.spentAmount > 0
                ? `${Math.round(budget.spentAmount / budget.limitAmount * 100)}% used`
                : 'No spending yet'}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[{ color: colors.text, fontSize: typography.sm, fontWeight: '600' }]}>
            {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.limitAmount)}
          </Text>
          <TouchableOpacity onPress={() => onEdit(budget)}>
            <Text style={[{ color: colors.accent, fontSize: typography.xs, fontWeight: '500', marginTop: 2 }]}>
              Edit limit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.borderSubtle, borderRadius: radius.full, marginTop: spacing.sm },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%`, backgroundColor: progressColor, borderRadius: radius.full },
          ]}
        />
      </View>

      <Text style={[{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }]}>
        {formatCurrency(remaining)} left
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  title: { fontWeight: '700' },
  overviewCard: { padding: 20 },
  overviewTitle: { fontWeight: '600' },
  overviewDate: { fontWeight: '400', marginTop: 2 },
  totalSpentBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  donutContainer: { alignItems: 'center', paddingVertical: 24 },
  donutOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: { alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  insightCard: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: '600' },
  adjustRow: { flexDirection: 'row', alignItems: 'center' },
  emptyBudget: { padding: 32, alignItems: 'center' },
  budgetRow: { padding: 14, borderWidth: 1 },
  budgetRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  budgetRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 5, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: { margin: 12, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '700' },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 4,
    marginBottom: 16,
  },
  amountInput: { flex: 1, fontWeight: '600' },
  saveButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});