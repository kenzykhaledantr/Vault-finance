import * as SecureStore from 'expo-secure-store';

// Key constants — never use magic strings scattered around the codebase
const ACCESS_TOKEN_KEY = 'vault_access_token';
const REFRESH_TOKEN_KEY = 'vault_refresh_token';
const USER_KEY = 'vault_user';

// SecureStore options — these ensure maximum security
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // On iOS: store in Keychain, only accessible when device is unlocked
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export const tokenService = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Run both saves in parallel — faster than sequential
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, SECURE_OPTIONS),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, SECURE_OPTIONS),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY, SECURE_OPTIONS);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY, SECURE_OPTIONS);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(USER_KEY, SECURE_OPTIONS),
    ]);
  },

  async saveUser(user: object): Promise<void> {
    // Serialize user object to string for SecureStore
    await SecureStore.setItemAsync(
      USER_KEY,
      JSON.stringify(user),
      SECURE_OPTIONS
    );
  },

  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY, SECURE_OPTIONS);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupted data — clear it
      await SecureStore.deleteItemAsync(USER_KEY, SECURE_OPTIONS);
      return null;
    }
  },

  // Decode JWT payload without verifying signature (verification happens server-side)
  // Used to check expiry before making an API call
  decodeTokenPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Base64 decode the payload (middle part)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload || typeof payload['exp'] !== 'number') return true;
    // exp is in seconds, Date.now() is in milliseconds
    // Add 30s buffer to refresh before actual expiry
    return payload['exp'] * 1000 < Date.now() + 30_000;
  },
};