import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { signInWithGoogle, signInWithApple, signInWithOTP } from '../services/authProvider';
import { login } from '../services/authService';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
};

export function SignInScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(getToken: () => Promise<string>) {
    setLoading(true);
    setError(null);
    try {
      const firebaseToken = await getToken();
      const result = await login(firebaseToken);
      if (result.role_set) {
        navigation.replace('Main');
      } else {
        navigation.replace('RolePicker');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bgSurface,
        paddingTop: insets.top + theme.spacing[8],
        paddingHorizontal: theme.spacing[5],
        gap: theme.spacing[6],
      }}
    >
      <View style={{ gap: theme.spacing[3] }}>
        <Text style={{ ...theme.typography.textStyles.display, color: theme.colors.textPrimary }}>
          Welcome to{'\n'}Cravio
        </Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          India's commission-free influencer marketplace.
        </Text>
      </View>

      {error ? (
        <Text style={{ ...theme.typography.textStyles.caption, color: theme.colors.error ?? theme.colors.textSecondary }}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} />
      ) : (
        <View style={{ gap: theme.spacing[3] }}>
          <Button
            testID="btn-google"
            variant="primary"
            size="lg"
            block
            onPress={() => handleSignIn(signInWithGoogle)}
          >
            Continue with Google
          </Button>

          <Button
            testID="btn-apple"
            variant="secondary"
            size="lg"
            block
            onPress={() => handleSignIn(signInWithApple)}
          >
            Continue with Apple
          </Button>

          <Button
            testID="btn-otp"
            variant="secondary"
            size="lg"
            block
            onPress={() => handleSignIn(() => signInWithOTP(''))}
          >
            Continue with Phone
          </Button>
        </View>
      )}
    </View>
  );
}
