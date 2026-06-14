import { create } from 'zustand';
import { tokenService } from '@features/auth/services/tokenService';

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearUser: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: async (user, accessToken, refreshToken) => {
    // Save to secure storage AND update in-memory state atomically
    await Promise.all([
      tokenService.saveTokens(accessToken, refreshToken),
      tokenService.saveUser(user),
    ]);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearUser: async () => {
    await tokenService.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Called on every app launch — checks if a valid session exists
  restoreSession: async () => {
    try {
      const accessToken = await tokenService.getAccessToken();
      if (!accessToken) {
        set({ isLoading: false });
        return false;
      }
      if (tokenService.isTokenExpired(accessToken)) {
        // Token expired — try refresh (we'll implement API later)
        // For now, clear session
        await tokenService.clearTokens();
        set({ isLoading: false });
        return false;
      }
      // Token valid — restore user from secure storage
      const user = await tokenService.getUser<User>();
      if (!user) {
        set({ isLoading: false });
        return false;
      }
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },
}));