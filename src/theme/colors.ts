// The entire color system as constants.
// Every color in the app comes from here — never hardcode hex values in components.

export const palette = {
  // Brand greens (matches your design's green accent)
  green: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    900: '#14532d',
  },
  // Dark surfaces
  dark: {
    50:  '#18181b',
    100: '#1c1c1f',
    200: '#27272a',
    300: '#3f3f46',
    400: '#52525b',
    500: '#71717a',
  },
  // Semantic reds for expenses
  red: {
    400: '#f87171',
    500: '#ef4444',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

export const Colors = {
  light: {
    background:        '#f8f9fa',
    surface:           '#ffffff',
    surfaceElevated:   '#ffffff',
    border:            '#e4e4e7',
    borderSubtle:      '#f4f4f5',
    text:              '#09090b',
    textSecondary:     '#71717a',
    textMuted:         '#a1a1aa',
    accent:            palette.green[500],
    accentSubtle:      palette.green[50],
    expense:           palette.red[500],
    expenseSubtle:     '#fef2f2',
    income:            palette.green[500],
    incomeSubtle:      palette.green[50],
    tabBar:            '#ffffff',
    tabBarBorder:      '#e4e4e7',
    card:              '#ffffff',
  },
  dark: {
    background:        '#0a0a0a',
    surface:           '#111111',
    surfaceElevated:   '#1a1a1a',
    border:            '#2a2a2a',
    borderSubtle:      '#1f1f1f',
    text:              '#fafafa',
    textSecondary:     '#a1a1aa',
    textMuted:         '#52525b',
    accent:            palette.green[500],
    accentSubtle:      '#0d2818',
    expense:           palette.red[400],
    expenseSubtle:     '#1c0e0e',
    income:            palette.green[400],
    incomeSubtle:      '#0a1f0f',
    tabBar:            '#111111',
    tabBarBorder:      '#1f1f1f',
    card:              '#1a1a1a',
  },
} as const;

export type ColorScheme = typeof Colors.light;