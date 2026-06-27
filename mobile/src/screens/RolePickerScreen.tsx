import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/buttons/Button';
import { setRole, getStoredToken } from '../services/authService';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RolePicker'>;
};

export function RolePickerScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleSelect(role: 'influencer' | 'brand') {
    setLoading(true);
    setError(null);
    try {
      const token = await getStoredToken();
      if (!token) throw new Error('No auth token — please sign in again.');
      await setRole(role, token);
      if (role === 'influencer') {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('BrandOnboarding');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
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
          I am a…
        </Text>
        <Text style={{ ...theme.typography.textStyles.bodyLg, color: theme.colors.textSecondary }}>
          Choose your role. This cannot be changed later.
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
        <View style={{ gap: theme.spacing[4] }}>
          <Button
            testID="btn-role-influencer"
            variant="primary"
            size="lg"
            block
            onPress={() => handleRoleSelect('influencer')}
          >
            Creator / Influencer
          </Button>

          <Button
            testID="btn-role-brand"
            variant="secondary"
            size="lg"
            block
            onPress={() => handleRoleSelect('brand')}
          >
            Brand
          </Button>
        </View>
      )}
    </View>
  );
}
