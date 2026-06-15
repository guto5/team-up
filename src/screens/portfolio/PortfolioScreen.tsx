import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { Link, SignOut } from 'phosphor-react-native';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../config/firebase';
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker';
import { persistProfilePhotoLocally } from '../../services/localPhotoService';
import { updateUserProfile, syncCompletedProjectsForUser } from '../../services/userService';
import { useCompletedProjects } from '../../hooks/useCompletedProjects';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useEndorsementsReceived } from '../../hooks/useEndorsements';
import { SkillsRadarBox } from '../../components/portfolio/SkillsRadarBox';
import { ProjectHistoryCard } from '../../components/portfolio/ProjectHistoryCard';
import {
  createPortfolioSlug,
  getPortfolioUrl,
  getSelfDeclaredSkills,
} from '../../utils/portfolio';
import { AppTabParamList, FeedStackParamList } from '../../navigation/types';
import { Button } from '../../components/ui/Button';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type PortfolioNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Portfolio'>,
  NativeStackNavigationProp<FeedStackParamList>
>;

export function PortfolioScreen() {
  const navigation = useNavigation<PortfolioNavigation>();
  const { user } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { projects: projectsToEndorse } = useCompletedProjects(user?.uid);
  const { profile, loading, error } = useUserProfile(user?.uid);
  const { endorsedSkills, loading: endorsementsLoading } = useEndorsementsReceived(
    user?.uid,
  );

  useEffect(() => {
    if (!user?.uid) return;

    syncCompletedProjectsForUser(user.uid).catch(() => {
      // Falha silenciosa — o portfólio ainda exibe dados já salvos no perfil.
    });
  }, [user?.uid]);

  const portfolioSlug =
    profile?.portfolioSlug ??
    (user ? createPortfolioSlug(user.displayName ?? 'user', user.uid) : '');

  const handleLogout = useCallback(() => {
    Alert.alert('Sair da conta', 'Deseja realmente sair do TeamUp?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          signOut(auth).catch(() => {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
          });
        },
      },
    ]);
  }, []);

  const handlePhotoSelected = useCallback(
    async (localUri: string) => {
      if (!user) return;

      setUploadingPhoto(true);
      try {
        const photoURL = await persistProfilePhotoLocally(user.uid, localUri);
        await updateUserProfile(user.uid, { photoURL });
      } catch {
        Alert.alert('Erro', 'Não foi possível atualizar a foto do perfil.');
      } finally {
        setUploadingPhoto(false);
      }
    },
    [user],
  );

  const handleSharePortfolio = useCallback(async () => {
    if (!portfolioSlug) return;

    const url = getPortfolioUrl(portfolioSlug);

    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Link copiado!', `${url}\n\nPronto para compartilhar seu portfólio.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível copiar o link do portfólio.');
    }
  }, [portfolioSlug]);

  if (loading || endorsementsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Perfil indisponível</Text>
          <Text style={styles.errorText}>
            {error ?? 'Complete seu perfil para visualizar o portfólio.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selfDeclaredSkills = getSelfDeclaredSkills(profile.skills, endorsedSkills);
  const completedProjects = profile.completedProjects ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <SignOut size={20} color={colors.textPrimary} weight="bold" />
          </Pressable>
          <Pressable onPress={handleSharePortfolio} style={styles.shareButton}>
            <Link size={20} color={colors.black} weight="bold" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.avatarWrap}>
            <ProfilePhotoPicker
              photoURL={profile.photoURL}
              size={90}
              loading={uploadingPhoto}
              onPhotoSelected={handlePhotoSelected}
            />
          </View>

          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>

          <SkillsRadarBox
            endorsedSkills={endorsedSkills}
            selfDeclaredSkills={selfDeclaredSkills}
          />

          {projectsToEndorse.length > 0 ? (
            <View style={styles.endorseSection}>
              <Text style={styles.sectionTitle}>Validar equipe</Text>
              {projectsToEndorse.slice(0, 3).map((project) => (
                <Button
                  key={project.id}
                  title={`Validar skills — ${project.title}`}
                  onPress={() =>
                    navigation.navigate('Feed', {
                      screen: 'Endorsement',
                      params: { projectId: project.id },
                    })
                  }
                  variant="secondary"
                  style={styles.endorseAction}
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            Projetos Concluídos ({completedProjects.length})
          </Text>

          {completedProjects.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>
                Seus projetos concluídos aparecerão aqui após a entrega e
                validação da equipe.
              </Text>
            </View>
          ) : (
            completedProjects.map((project) => (
              <ProjectHistoryCard key={project.id} project={project} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  cover: {
    height: 140,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  avatarWrap: {
    marginTop: -45,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  endorseSection: {
    marginBottom: spacing.xxl,
  },
  endorseAction: {
    marginBottom: spacing.sm,
  },
  emptyHistory: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  emptyHistoryText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
