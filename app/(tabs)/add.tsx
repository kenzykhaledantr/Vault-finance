import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, X, Calendar } from 'lucide-react-native';
import * as Icons from 'lucide-react-native';

import { useTheme } from '@hooks/useTheme';
import { useCreateTransaction } from '@features/transactions/hooks/useTransactions';
import { categoryRepository } from '../../src/database/repositories/categoryRepository';
import { useQuery } from '@tanstack/react-query';
import { parseToCents, toDateString } from '@utils/id';
import type { TransactionType, Category } from '../../src/types/index';

function getIconComponent(iconName: string) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName];
  return IconComponent ?? Icons.Circle;
}

export default function AddTransactionScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountDisplay, setAmountDisplay] = useState('0.00');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [note, setNote] = useState('');
  const [date] = useState(toDateString());

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoryRepository.getByType(type),
  });

  const handleDigit = useCallback((digit: string) => {
    setAmountDisplay((prev) => {
      // Remove existing decimal point and leading zeros, then rebuild
      const raw = prev.replace('.', '').replace(/^0+/, '') + digit;
      const padded = raw.padStart(3, '0');
      const intPart = padded.slice(0, -2) || '0';
      const decPart = padded.slice(-2);
      return `${intPart}.${decPart}`;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setAmountDisplay((prev) => {
      const raw = prev.replace('.', '').slice(0, -1) || '0';
      const padded = raw.padStart(3, '0');
      const intPart = padded.slice(0, -2) || '0';
      const decPart = padded.slice(-2);
      return `${intPart}.${decPart}`;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const cents = parseToCents(amountDisplay);
    if (cents === 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than $0.00');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Select category', 'Please select a category for this transaction.');
      return;
    }
    try {
      await createTransaction.mutateAsync({
        amount: cents,
        type,
        categoryId: selectedCategory.id,
        note: note.trim(),
        date,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  }, [amountDisplay, selectedCategory, type, note, date, createTransaction]);

  const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.md }]}>
          Add transaction
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View
          style={[
            styles.typeToggle,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.full,
              margin: spacing.lg,
            },
          ]}
        >
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                {
                  backgroundColor: type === t ? colors.text : 'transparent',
                  borderRadius: radius.full,
                },
              ]}
              onPress={() => {
                setType(t);
                setSelectedCategory(null);
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: type === t ? colors.background : colors.textSecondary,
                    fontSize: typography.sm,
                  },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount display */}
        <View style={[styles.amountSection, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted, fontSize: typography.sm }]}>
            Transaction amount
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            <Text style={[styles.amountCurrency, { color: colors.textMuted }]}>$ </Text>
            {amountDisplay}
          </Text>
        </View>

        {/* Date + Note row */}
        <View style={[styles.metaRow, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
          <View
            style={[
              styles.metaChip,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
            ]}
          >
            <Calendar size={14} color={colors.textMuted} />
            <Text style={[{ color: colors.textSecondary, fontSize: typography.xs }]}>
              Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                fontSize: typography.xs,
              },
            ]}
            placeholder="Add a note..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            maxLength={80}
          />
        </View>

        {/* Category grid */}
        <Text
          style={[
            styles.categoryLabel,
            { color: colors.textMuted, fontSize: typography.xs, paddingHorizontal: spacing.lg },
          ]}
        >
          SELECT CATEGORY
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: spacing.lg }]}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            const Icon = getIconComponent(cat.icon);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? cat.color : colors.surface,
                    borderColor: isSelected ? cat.color : colors.border,
                    borderRadius: radius.md,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Icon size={20} color={isSelected ? '#fff' : cat.color} strokeWidth={2} />
                <Text
                  style={[
                    styles.categoryChipLabel,
                    {
                      color: isSelected ? '#fff' : colors.textSecondary,
                      fontSize: typography.xs,
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Numpad */}
        <View style={[styles.numpad, { paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          {NUMPAD.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.numpadKey,
                { backgroundColor: colors.surface, borderRadius: radius.md },
              ]}
              onPress={() => key === '⌫' ? handleBackspace() : key !== '.' ? handleDigit(key) : null}
              activeOpacity={0.6}
            >
              <Text style={[styles.numpadLabel, { color: colors.text, fontSize: typography.xl }]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.md,
              marginHorizontal: spacing.lg,
              marginTop: spacing.lg,
              opacity: createTransaction.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={createTransaction.isPending}
          activeOpacity={0.85}
        >
          {createTransaction.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Check size={20} color="#000" strokeWidth={2.5} />
              <Text style={[styles.saveButtonText, { fontSize: typography.md }]}>
                Save Transaction
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontWeight: '600' },
  scrollContent: {},
  typeToggle: {
    flexDirection: 'row',
    padding: 4,
  },
  typeButton: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  typeButtonText: { fontWeight: '600' },
  amountSection: { alignItems: 'center', paddingVertical: 8 },
  amountLabel: { fontWeight: '400', marginBottom: 4 },
  amountValue: { fontSize: 48, fontWeight: '700' },
  amountCurrency: { fontSize: 32, fontWeight: '300' },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  noteInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    fontWeight: '400',
  },
  categoryLabel: { fontWeight: '600', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  categoryScroll: { gap: 8, paddingBottom: 4 },
  categoryChip: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
    borderWidth: 1,
    minWidth: 72,
  },
  categoryChipLabel: { fontWeight: '500', textAlign: 'center' },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numpadKey: {
    width: '30%',
    aspectRatio: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  numpadLabel: { fontWeight: '400' },
  saveButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: { color: '#000', fontWeight: '700' },
});