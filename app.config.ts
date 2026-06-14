import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vault',
  slug: 'vault-finance',
  version: '1.0.0',
  scheme: 'vault',           // Deep link scheme: vault://
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',  // Respects system dark mode
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0a',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yourcompany.vault',
    infoPlist: {
      NSFaceIDUsageDescription: 'Use Face ID to securely access your vault.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#0a0a0a',
    },
    package: 'com.yourcompany.vault',
    permissions: ['USE_FINGERPRINT', 'USE_BIOMETRIC'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    [
      'expo-local-authentication',
      { faceIDPermission: 'Allow Vault to use Face ID.' },
    ],
    [
      'expo-notifications',
      { color: '#22c55e' },
    ],
  ],
  extra: {
    // Never hardcode secrets here — use .env.local
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
});