import { create } from 'zustand';
import { tokenService } from '@features/auth/services/tokenService';
import { authService } from '@features/auth/services/authService';

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | undefined;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearUser: async () => {
    try {
      await authService.logout();       // Sign out from Supabase
    } catch {
      // Continue clearing local state even if Supabase call fails
    }
    await tokenService.clearTokens();   // Wipe SecureStore
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  restoreSession: async () => {
    try {
      // Supabase client handles token refresh automatically
      // because we gave it the SecureStore adapter
      const user = await authService.restoreSession();
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