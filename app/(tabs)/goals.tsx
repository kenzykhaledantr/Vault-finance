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
import { Plus, X, Check, Target } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '@hooks/useTheme';
import { goalsRepository } from '../../src/database/repositories/goalsRepository';
import { formatCurrency, parseToCents, generateId } from '@utils/id';
import type { SavingsGoal } from '../../src/types/index';

const GOAL_COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#ef4444', '#06b6d4',
];

const goalKeys = {
  all: ['goals'] as const,
};

function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: () => goalsRepository.getAll(),
  });
}

function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof goalsRepository.create>[0]) =>
      goalsRepository.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

function useAddFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      goalsRepository.addFunds(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsRepository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export default function GoalsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const addFunds = useAddFunds();
  const deleteGoal = useDeleteGoal();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<SavingsGoal | null>(null);
  const [fundsInput, setFundsInput] = useState('');

  // Create goal form state
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0] as string);

  const handleCreateGoal = useCallback(async () => {
    if (!newGoalName.trim()) {
      Alert.alert('Required', 'Please enter a goal name.');
      return;
    }
    const cents = parseToCents(newGoalTarget);
    if (cents <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid target amount.');
      return;
    }
    await createGoal.mutateAsync({
      name: newGoalName.trim(),
      targetAmount: cents,
      color: newGoalColor,
    });
    setShowCreateModal(false);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalColor(GOAL_COLORS[0] as string);
  }, [newGoalName, newGoalTarget, newGoalColor, createGoal]);

  const handleAddFunds = useCallback(async () => {
    if (!addFundsGoal) return;
    const cents = parseToCents(fundsInput);
    if (cents <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    await addFunds.mutateAsync({ id: addFundsGoal.id, amount: cents });
    setAddFundsGoal(null);
    setFundsInput('');
  }, [addFundsGoal, fundsInput, addFunds]);

  const handleDeleteGoal = useCallback((goal: SavingsGoal) => {
    Alert.alert(
      'Delete goal',
      `Are you sure you want to delete "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal.mutate(goal.id),
        },
      ]
    );
  }, [deleteGoal]);

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
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
              Savings Goals
            </Text>
            <Text style={[{ color: colors.textMuted, fontSize: typography.sm }]}>
              Track your progress toward financial freedom.
            </Text>
          </View>
        </View>

        {/* Goals list */}
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxxl }} />
        ) : (
          <>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddFunds={() => {
                  setAddFundsGoal(goal);
                  setFundsInput('');
                }}
                onDelete={() => handleDeleteGoal(goal)}
                colors={colors}
                typography={typography}
                spacing={spacing}
                radius={radius}
              />
            ))}

            {/* New goal card */}
            <TouchableOpacity
              style={[
                styles.newGoalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  marginTop: spacing.sm,
                },
              ]}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.newGoalIcon,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Plus size={20} color={colors.accent} />
              </View>
              <Text style={[{ color: colors.text, fontSize: typography.md, fontWeight: '600' }]}>
                New Goal
              </Text>
              <Text style={[{ color: colors.textMuted, fontSize: typography.sm }]}>
                Set a new financial target
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Add funds modal */}
      <Modal
        visible={addFundsGoal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFundsGoal(null)}
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
                Add funds
              </Text>
              <TouchableOpacity onPress={() => setAddFundsGoal(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {addFundsGoal && (
              <Text style={[{ color: colors.textSecondary, fontSize: typography.sm, marginBottom: spacing.lg }]}>
                {addFundsGoal.name} · {formatCurrency(addFundsGoal.savedAmount)} saved so far
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
                style={[styles.amountInput, { color: colors.text, fontSize: typography.xl }]}
                value={fundsInput}
                onChangeText={setFundsInput}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  opacity: addFunds.isPending ? 0.7 : 1,
                },
              ]}
              onPress={handleAddFunds}
              disabled={addFunds.isPending}
            >
              {addFunds.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Check size={18} color="#000" strokeWidth={2.5} />
                  <Text style={[{ color: '#000', fontSize: typography.md, fontWeight: '600' }]}>
                    Add funds
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create goal modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
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
                New goal
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted, fontSize: typography.sm }]}>
              Goal name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: radius.md,
                  fontSize: typography.md,
                  marginBottom: spacing.md,
                },
              ]}
              value={newGoalName}
              onChangeText={setNewGoalName}
              placeholder="e.g. Emergency Fund"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, fontSize: typography.sm }]}>
              Target amount
            </Text>
            <View
              style={[
                styles.amountInputWrapper,
                { backgroundColor: colors.background, borderRadius: radius.md, marginBottom: spacing.md },
              ]}
            >
              <Text style={[{ color: colors.textMuted, fontSize: typography.xl, fontWeight: '300' }]}>
                $
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text, fontSize: typography.xl }]}
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted, fontSize: typography.sm }]}>
              Color
            </Text>
            <View style={[styles.colorRow, { marginBottom: spacing.lg }]}>
              {GOAL_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    newGoalColor === color && styles.colorSwatchSelected,
                  ]}
                  onPress={() => setNewGoalColor(color)}
                >
                  {newGoalColor === color && (
                    <Check size={14} color="#fff" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  opacity: createGoal.isPending ? 0.7 : 1,
                },
              ]}
              onPress={handleCreateGoal}
              disabled={createGoal.isPending}
            >
              {createGoal.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Target size={18} color="#000" />
                  <Text style={[{ color: '#000', fontSize: typography.md, fontWeight: '600' }]}>
                    Create goal
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

function GoalCard({
  goal,
  onAddFunds,
  onDelete,
  colors,
  typography,
  spacing,
  radius,
}: {
  goal: SavingsGoal;
  onAddFunds: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
}) {
  const percent = goal.targetAmount > 0
    ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <TouchableOpacity
      onLongPress={onDelete}
      delayLongPress={600}
      activeOpacity={0.9}
      style={[
        styles.goalCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          marginBottom: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: goal.color,
        },
      ]}
    >
      <View style={styles.goalCardTop}>
        <View>
          <Text style={[{ color: colors.textMuted, fontSize: typography.xs, fontWeight: '500' }]}>
            {percent >= 100 ? 'COMPLETED' : `${Math.round(percent)}% reached`}
          </Text>
          <Text style={[{ color: colors.text, fontSize: typography.md, fontWeight: '700', marginTop: 2 }]}>
            {goal.name}
          </Text>
        </View>

        {/* Circular progress ring */}
        <View
          style={[
            styles.ringContainer,
            {
              borderColor: goal.color,
              borderWidth: 3,
              borderRadius: radius.full,
              backgroundColor: `${goal.color}15`,
            },
          ]}
        >
          <Text style={[{ color: goal.color, fontSize: typography.xs, fontWeight: '700' }]}>
            {Math.round(percent)}%
          </Text>
        </View>
      </View>

      <View style={[styles.goalAmounts, { marginTop: spacing.sm }]}>
        <View>
          <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>Saved so far</Text>
          <Text style={[{ color: colors.text, fontSize: typography.md, fontWeight: '600' }]}>
            {formatCurrency(goal.savedAmount)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[{ color: colors.textMuted, fontSize: typography.xs }]}>Target</Text>
          <Text style={[{ color: colors.text, fontSize: typography.md, fontWeight: '600' }]}>
            {formatCurrency(goal.targetAmount)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: colors.borderSubtle, borderRadius: radius.full, marginTop: spacing.sm },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%`, backgroundColor: goal.color, borderRadius: radius.full },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.addFundsButton,
          {
            backgroundColor: goal.color,
            borderRadius: radius.md,
            marginTop: spacing.md,
          },
        ]}
        onPress={onAddFunds}
        activeOpacity={0.85}
      >
        <Plus size={16} color="#fff" strokeWidth={2.5} />
        <Text style={[{ color: '#fff', fontSize: typography.sm, fontWeight: '600' }]}>
          Add Funds
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontWeight: '700', marginBottom: 4 },
  goalCard: { padding: 16, borderWidth: 1 },
  goalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ringContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 5, overflow: 'hidden' },
  progressFill: { height: '100%' },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  newGoalCard: {
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  newGoalIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { margin: 12, padding: 24 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontWeight: '700' },
  amountInputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 4, marginBottom: 16 },
  amountInput: { flex: 1, fontWeight: '600' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  inputLabel: { fontWeight: '500', marginBottom: 6 },
  textInput: { padding: 14, fontWeight: '400' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { transform: [{ scale: 1.2 }] },
});