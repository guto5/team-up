import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { colors, fonts, fontSizes } from '../theme';
import { UserProfile } from '../types/user';
import { AuthStack } from './AuthStack';
import { SetupStack } from './SetupStack';
import { AppTabs } from './AppTabs';
import { TeacherTabs } from './TeacherTabs';

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.bgApp,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};

function resolveAppScreen(
  user: ReturnType<typeof useAuth>['user'],
  isProfileComplete: boolean,
  profile: UserProfile | null,
) {
  if (!user) return <AuthStack />;
  if (!isProfileComplete) return <SetupStack />;
  if (profile?.role === 'teacher') return <TeacherTabs />;
  return <AppTabs />;
}

export function RootNavigator() {
  const { user, initializing: authInitializing } = useAuth();
  const {
    profile,
    isProfileComplete,
    loading: profileLoading,
    error,
  } = useUserProfile(user?.uid);

  if (authInitializing || (user && profileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user && error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>
          Não foi possível carregar seu perfil. Verifique sua conexão e o Firestore.
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {resolveAppScreen(user, isProfileComplete, profile)}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
