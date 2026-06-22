import { useEffect, useCallback, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@store/authStore';
import { syncService } from '../services/supbase/syncService';
import { useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from '@features/transactions/hooks/useTransactions';

// Install: npm install --legacy-peer-deps @react-native-community/netinfo

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function useSync() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const sync = useCallback(async () => {
    if (!user) return;
    setStatus('syncing');
    try {
      const result = await syncService.syncAll(user.id);
      setStatus('success');
      setLastSynced(new Date());
      // Refresh queries after pull — new remote data is now in SQLite
      if (result.pulled > 0) {
        await queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      }
    } catch {
      setStatus('error');
    }
  }, [user, queryClient]);

  // Auto-sync when network comes back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && status !== 'syncing') {
        sync();
      }
    });
    return () => unsubscribe();
  }, [sync, status]);

  // Sync on mount if online
  useEffect(() => {
    NetInfo.fetch().then((state) => {
      if (state.isConnected) sync();
    });
  }, [sync]);

  return { sync, status, lastSynced };
}