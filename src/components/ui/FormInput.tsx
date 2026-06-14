import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@hooks/useTheme';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string | undefined;
  isPassword?: boolean | undefined;
};

export function FormInput({
  label,
  error,
  isPassword = false,
  ...props
}: FormInputProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.sm }]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: error
              ? colors.expense          // Red border on error
              : isFocused
              ? colors.accent           // Green border on focus
              : colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.md,
              paddingRight: isPassword ? 48 : spacing.lg,
            },
          ]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.textMuted} />
            ) : (
              <Eye size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: colors.expense, fontSize: typography.xs }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: '500' },
  inputWrapper: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: '400',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  error: { marginTop: 4, fontWeight: '400' },
});