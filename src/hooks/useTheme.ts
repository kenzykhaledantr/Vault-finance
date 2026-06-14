import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from '@theme/colors';
import { spacing, radius, typography, shadows } from '@theme/index';

// This hook is used in EVERY component to access the current theme.
// Centralizing it means we change theme logic in ONE place.
export function useTheme() {
  const scheme = (useColorScheme() ?? 'dark') as keyof typeof Colors;
  const colors = Colors[scheme];

  return {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    isDark: scheme === 'dark',
  };
}