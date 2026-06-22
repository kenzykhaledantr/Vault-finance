import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { memo } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';
import type { SyncStatus } from '@hooks/useSync';

type SyncBadgeProps = {
  status: SyncStatus;
  lastSynced: Date | null;
  onPress: () => void;
};

export const SyncBadge = memo(function SyncBadge({
  status,
  lastSynced,
  onPress,
}: SyncBadgeProps) {
  const { colors, typography, radius } = useTheme();

  const config = {
    idle: {
      icon: <Cloud size={14} color={colors.textMuted} />,
      label: 'Sync',
      color: colors.textMuted,
    },
    syncing: {
      icon: <RefreshCw size={14} color={colors.accent} />,
      label: 'Syncing...',
      color: colors.accent,
    },
    success: {
      icon: <CheckCircle size={14} color={colors.accent} />,
      label: lastSynced
        ? `Synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Synced',
      color: colors.accent,
    },
    error: {
      icon: <CloudOff size={14} color={colors.expense} />,
      label: 'Sync failed',
      color: colors.expense,
    },
  } as const;

  const current = config[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.badge,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.full,
        },
      ]}
      activeOpacity={0.7}
    >
      {current.icon}
      <Text style={[styles.label, { color: current.color, fontSize: typography.xs }]}>
        {current.label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  label: { fontWeight: '500' },
});