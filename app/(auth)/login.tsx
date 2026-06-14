import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ShieldCheck, Fingerprint } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loginSchema, LoginFormData } from '@features/auth/schemas/authSchemas';
import { biometricService } from '@features/auth/services/biometricService';
import { tokenService } from '@features/auth/services/tokenService';
import { useAuthStore } from '@store/authStore';
import { FormInput } from '@components/ui/FormInput';
import { useTheme } from '@hooks/useTheme';

export default function LoginScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    // Check biometric availability on mount
    biometricService.isAvailable().then(setBiometricAvailable);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // TODO (Milestone 5): Replace with real Supabase/API call
      // Simulating API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response
      const mockUser = {
        id: '1',
        email: data.email,
        name: 'Kenzy',
      };
      const mockAccessToken = 'mock_access_token';
      const mockRefreshToken = 'mock_refresh_token';

      await setUser(mockUser, mockAccessToken, mockRefreshToken);
      router.replace('/(tabs)');
    } catch {
      // Never expose raw error messages to users — could leak server details
      setError('password', {
        message: 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    const success = await biometricService.authenticate(
      'Log in to your Vault'
    );
    if (!success) return;

    // Check if we have a stored session to restore after biometric
    const token = await tokenService.getAccessToken();
    if (!token) {
      Alert.alert(
        'No saved session',
        'Please log in with your email and password first.'
      );
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
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
            <ShieldCheck size={32} color={colors.accent} strokeWidth={1.5} />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.xxl }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
            Sign in to your Vault
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
                placeholder="Enter your password"
                isPassword
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => {/* TODO: forgot password screen */}}
          >
            <Text style={[styles.forgotText, { color: colors.accent, fontSize: typography.sm }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
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
            <Text style={[styles.loginButtonText, { fontSize: typography.md }]}>
              Sign in
            </Text>
          )}
        </TouchableOpacity>

        {/* Biometric Login */}
        {biometricAvailable && (
          <TouchableOpacity
            style={[
              styles.biometricButton,
              {
                borderColor: colors.border,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={handleBiometric}
            activeOpacity={0.8}
          >
            <Fingerprint size={20} color={colors.accent} />
            <Text
              style={[
                styles.biometricText,
                { color: colors.textSecondary, fontSize: typography.sm },
              ]}
            >
              Use biometrics
            </Text>
          </TouchableOpacity>
        )}

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={[styles.registerText, { color: colors.textSecondary, fontSize: typography.sm }]}>
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.registerLink, { color: colors.accent, fontSize: typography.sm }]}>
              Create one
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
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
  forgotPassword: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 },
  forgotText: { fontWeight: '500' },
  loginButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loginButtonText: { color: '#fff', fontWeight: '600' },
  biometricButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    marginBottom: 32,
  },
  biometricText: { fontWeight: '500' },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: { fontWeight: '400' },
  registerLink: { fontWeight: '600' },
});