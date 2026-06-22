import { supabase } from '../../../services/supbase/supabaseClient';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export const authService = {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // stored in auth.users.raw_user_meta_data
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed — no user returned');

    return {
      id: data.user.id,
      email: data.user.email ?? email,
      name: data.user.user_metadata?.['name'] ?? name,
    };
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed — no user returned');

    return {
      id: data.user.id,
      email: data.user.email ?? email,
      name: data.user.user_metadata?.['name'] ?? email.split('@')[0],
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Restore session from SecureStore on app launch
  async restoreSession(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;

    const user = data.session.user;
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.['name'] ?? user.email?.split('@')[0] ?? '',
    };
  },

  async refreshSession(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.user) return null;

    const user = data.session.user;
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.['name'] ?? '',
    };
    },
  async forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Deep link back into the app after user clicks email link
    redirectTo: 'vault://reset-password',
  });
  if (error) throw new Error(error.message);
},

async updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw new Error(error.message);
},
};