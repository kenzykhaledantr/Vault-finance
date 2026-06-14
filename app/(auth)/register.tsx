import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { registerSchema, RegisterFormData } from '@features/auth/schemas/authSchemas';
import { useAuthStore } from '@store/authStore';
import { FormInput } from '@components/ui/FormInput';
import { useTheme } from '@hooks/useTheme';

export default function RegisterScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // TODO (Milestone 5): Replace with Supabase signup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = { id: '1', email: data.email, name: data.name };
      await setUser(mockUser, 'mock_access_token', 'mock_refresh_token');
      router.replace('/(tabs)');
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.accentSubtle, borderRadius: radius.xl },
            ]}
          >
            <UserPlus size={32} color={colors.accent} strokeWidth={1.5} />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.xxl }]}>
            Create account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
            Start tracking your finances
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Full name"
                placeholder="Your name"
                autoCapitalize="words"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Password"
                placeholder="Min. 8 characters"
                isPassword
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Confirm password"
                placeholder="Repeat your password"
                isPassword
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            {
              backgroundColor: colors.accent,
              borderRadius: radius.md,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.registerButtonText, { fontSize: typography.md }]}>
              Create account
            </Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        <View style={styles.loginRow}>
          <Text style={[{ color: colors.textSecondary, fontSize: typography.sm }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[{ color: colors.accent, fontSize: typography.sm, fontWeight: '600' }]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { textAlign: 'center', fontWeight: '400' },
  form: { marginBottom: 8 },
  registerButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerButtonText: { color: '#fff', fontWeight: '600' },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});