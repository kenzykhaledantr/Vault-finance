import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '@hooks/useTheme';
import { useTransactions } from '@features/transactions/hooks/useTransactions';
import { TransactionRow } from '@components/dashboard/TransactionRow';
import { groupByDate } from '@utils/date';
import type { Transaction, TransactionType } from '../../src/types/index';

type FilterType = 'all' | TransactionType;

type SectionHeader = { type: 'header'; title: string; total: number };
type SectionRow = { type: 'row'; transaction: Transaction };
type ListItem = SectionHeader | SectionRow;

// Build the flat list data structure FlashList needs —
// FlashList doesn't support SectionList natively so we flatten manually
function buildListData(
  transactions: Transaction[],
  filter: FilterType
): ListItem[] {
  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const grouped = groupByDate(filtered);
  const items: ListItem[] = [];

  for (const group of grouped) {
    const total = group.data.reduce((sum, t) => {
      return t.type === 'expense' ? sum - t.amount : sum + t.amount;
    }, 0);
    items.push({ type: 'header', title: group.title, total });
    for (const t of group.data) {
      items.push({ type: 'row', transaction: t });
    }
  }
  return items;
}

const FILTERS: Array<{ label: string; value: FilterType }> = [
  { label: 'All', value: 'all' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export default function LedgerScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const { data: transactions = [], isLoading, isFetching } = useTransactions({
    searchQuery: search.length >= 2 ? search : undefined,
    limit: PAGE_SIZE * (page + 1),
  });

  const listData = useMemo(
    () => buildListData(transactions, filter),
    [transactions, filter]
  );

  const onLoadMore = useCallback(() => {
    if (!isFetching && transactions.length === PAGE_SIZE * (page + 1)) {
      setPage((p) => p + 1);
    }
  }, [isFetching, transactions.length, page]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <SectionHeader
          title={item.title}
          total={item.total}
          colors={colors}
          typography={typography}
          spacing={spacing}
        />
      );
    }
    return <TransactionRow transaction={item.transaction} />;
  }, [colors, typography, spacing]);

  const getItemType = useCallback(
    (item: ListItem) => item.type,
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text, fontSize: typography.xl }]}>
          Ledger
        </Text>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              marginTop: spacing.md,
            },
          ]}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, fontSize: typography.base },
            ]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <View style={[styles.filterRow, { marginTop: spacing.md }]}>
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.text : colors.surface,
                    borderColor: isActive ? colors.text : colors.border,
                    borderRadius: radius.full,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    {
                      color: isActive ? colors.background : colors.textSecondary,
                      fontSize: typography.sm,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: typography.md }]}>
            {search.length > 0 ? 'No results found' : 'No transactions yet'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={listData}
          renderItem={renderItem}
          getItemType={getItemType}
          overrideItemLayout={(layout, item) => {
    // Give headers less height than transaction rows
    layout.span = item.type === 'header' ? 36 : 64;
  }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
          }}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetching ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            bottom: insets.bottom + spacing.lg,
          },
        ]}
        onPress={() => router.push('/(tabs)/add')}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#000" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// Extracted to avoid inline anonymous component — FlashList requires stable references
function SectionHeader({
  title,
  total,
  colors,
  typography,
  spacing,
}: {
  title: string;
  total: number;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  const isPositive = total >= 0;
  return (
    <View
      style={[
        styles.sectionHeader,
        { paddingVertical: spacing.sm, marginTop: spacing.md },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: typography.xs }]}>
        {title.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.sectionTotal,
          {
            color: isPositive ? colors.income : colors.expense,
            fontSize: typography.xs,
          },
        ]}
      >
        {isPositive ? '+' : ''}
        {(total / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 8 },
  title: { fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontWeight: '400' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterLabel: { fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontWeight: '600', letterSpacing: 0.5 },
  sectionTotal: { fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontWeight: '400' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});