import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@theme/colors';

export default function AuthLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const colors = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Slide animation for auth screens
        animation: 'slide_from_right',
      }}
    />
  );
}