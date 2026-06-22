import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@features/auth/schemas/authSchemas';
import { authService } from '@features/auth/services/authService';
import { FormInput } from '@components/ui/FormInput';
import { useTheme } from '@hooks/useTheme';

export default function ForgotPasswordScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSentToEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong.';
      // Don't reveal if email exists or not — security best practice
      // Always show success to prevent user enumeration attacks
      if (message.toLowerCase().includes('rate limit')) {
        setError('email', {
          message: 'Too many requests. Please wait a few minutes and try again.',
        });
      } else {
        // Show success even on error — prevents email enumeration
        setSentToEmail(data.email);
        setEmailSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        {/* Back button */}
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.full,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>

        {!emailSent ? (
          // ── Request form ──────────────────────────────────────────────────
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.accentSubtle,
                  borderRadius: radius.xl,
                },
              ]}
            >
              <Mail size={32} color={colors.accent} strokeWidth={1.5} />
            </View>

            <Text
              style={[
                styles.title,
                { color: colors.text, fontSize: typography.xxl },
              ]}
            >
              Forgot password?
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontSize: typography.md,
                },
              ]}
            >
              Enter your email address and we&apos;ll send you a link to reset your
              password.
            </Text>

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
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
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
                <ActivityIndicator color="#000" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { fontSize: typography.md },
                  ]}
                >
                  Send reset link
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.back()}
            >
              <Text
                style={[
                  styles.backToLoginText,
                  {
                    color: colors.textSecondary,
                    fontSize: typography.sm,
                  },
                ]}
              >
                Back to{' '}
                <Text style={{ color: colors.accent, fontWeight: '600' }}>
                  Sign in
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Success state ─────────────────────────────────────────────────
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.incomeSubtle,
                  borderRadius: radius.xl,
                },
              ]}
            >
              <CheckCircle
                size={32}
                color={colors.income}
                strokeWidth={1.5}
              />
            </View>

            <Text
              style={[
                styles.title,
                { color: colors.text, fontSize: typography.xxl },
              ]}
            >
              Check your email
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontSize: typography.md,
                },
              ]}
            >
              We sent a password reset link to
            </Text>
            <Text
              style={[
                styles.emailHighlight,
                {
                  color: colors.text,
                  fontSize: typography.md,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              {sentToEmail}
            </Text>

            <Text
              style={[
                styles.hint,
                { color: colors.textMuted, fontSize: typography.sm },
              ]}
            >
              Didn&apos;t receive it? Check your spam folder or try again in a few
              minutes.
            </Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  { fontSize: typography.md },
                ]}
              >
                Back to sign in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => setEmailSent(false)}
            >
              <Text
                style={[
                  styles.backToLoginText,
                  {
                    color: colors.textSecondary,
                    fontSize: typography.sm,
                  },
                ]}
              >
                Try a{' '}
                <Text style={{ color: colors.accent, fontWeight: '600' }}>
                  different email
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 32,
  },
  content: { flex: 1 },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 28,
  },
  form: { marginBottom: 8 },
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  backToLogin: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontWeight: '400',
  },
  emailHighlight: {
    padding: 14,
    borderWidth: 1,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  hint: {
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 32,
    textAlign: 'center',
  },
});