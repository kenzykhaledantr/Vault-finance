import { Platform } from 'react-native';

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm:  6,
  md:  10,
  lg:  16,
  xl:  24,
  full: 9999,
} as const;

export const typography = {
  // Font sizes
  xs:   11,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,

  // Line heights
  tight:  1.2,
  normal: 1.5,
  relaxed: 1.7,

  // Font weights as string literals (RN requires strings)
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

// Platform-aware shadows
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }),
} as const;