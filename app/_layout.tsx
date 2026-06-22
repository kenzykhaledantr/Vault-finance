import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@store/authStore';
import { Colors } from '@theme/colors';
import { initializeDatabase } from '../src/database/index';
import { useNotificationHandler } from '@hooks/useNotificationHandler';
import * as Linking from 'expo-linking';
import { supabase } from '../src/services/supbase/supabaseClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: { retry: 0 },
  },
});

function RootNavigator() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];
  const { isLoading, isAuthenticated, restoreSession } = useAuthStore();
  useNotificationHandler();

  // DB init + session restore run sequentially on mount
  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        await restoreSession();
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    }
    init();
  }, [restoreSession]);

  // Redirect once loading completes
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
  // Handle deep link when app opens from reset email
  const handleDeepLink = async (url: string) => {
    if (url.includes('reset-password') || url.includes('type=recovery')) {
      // Supabase automatically picks up the session from the URL
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/(auth)/reset-password');
      }
    }
  };

  // App already open — listen for incoming links
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  // App was closed — check initial URL
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}