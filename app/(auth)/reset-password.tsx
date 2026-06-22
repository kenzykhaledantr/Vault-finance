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
import { KeyRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@features/auth/schemas/authSchemas';
import { authService } from '@features/auth/services/authService';
import { FormInput } from '@components/ui/FormInput';
import { useTheme } from '@hooks/useTheme';

export default function ResetPasswordScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.updatePassword(data.password);
      Alert.alert(
        'Password updated',
        'Your password has been changed successfully.',
        [
          {
            text: 'Sign in',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update password.';
      if (message.toLowerCase().includes('session')) {
        setError('password', {
          message: 'Reset link expired. Please request a new one.',
        });
      } else {
        setError('password', { message });
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
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.lg,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.accentSubtle,
              borderRadius: radius.xl,
            },
          ]}
        >
          <KeyRound size={32} color={colors.accent} strokeWidth={1.5} />
        </View>

        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: typography.xxl },
          ]}
        >
          Set new password
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary, fontSize: typography.md },
          ]}
        >
          Your new password must be at least 8 characters and include an
          uppercase letter, a number, and a special character.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="New password"
                placeholder="Enter new password"
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
                label="Confirm new password"
                placeholder="Repeat new password"
                isPassword
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
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
              style={[styles.submitButtonText, { fontSize: typography.md }]}
            >
              Update password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontWeight: '700', marginBottom: 10 },
  subtitle: { fontWeight: '400', lineHeight: 22, marginBottom: 32 },
  form: { marginBottom: 8 },
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { color: '#000', fontWeight: '700' },
});