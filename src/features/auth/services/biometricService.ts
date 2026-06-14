import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async getSupportedTypes(): Promise<BiometricType[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map((t) => {
      switch (t) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'facial';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'none';
      }
    });
  },

  async authenticate(reason: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      // Cancel option — always give users an escape
      cancelLabel: 'Cancel',
      // Allow PIN fallback if biometric fails
      disableDeviceFallback: false,
    });
    return result.success;
  },
};