import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ArrowSquareOut,
  ChatsTeardrop,
  Lightning,
  PencilSimple,
  ShareNetwork,
  User,
} from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useChatAccess } from '../../hooks/useChatAccess';
import { useClassDirectory } from '../../hooks/useClassDirectory';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useProject } from '../../hooks/useProject';
import {
  useAllProjectApplications,
  useUserProjectApplications,
} from '../../hooks/useProjectApplications';
import {
  acceptApplication,
  applyToProjectRole,
  rejectApplication,
} from '../../services/applicationService';
import { completeProject } from '../../services/projectService';
import { RoleCard } from '../../components/project/RoleCard';
import { CreatorPanel } from '../../components/project/CreatorPanel';
import { FeedStackParamList } from '../../navigation/types';
import { ProjectApplication } from '../../types/application';
import { ProjectRole } from '../../types/project';
import { Button } from '../../components/ui/Button';
import { getProjectClassLabel, isClassScopedProject } from '../../utils/class';
import { resolveDisplayName } from '../../utils/user';
import { normalizeProjectUrl } from '../../utils/url';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type ProjectDetailParams = { projectId: string };
type ProjectDetailRoute = RouteProp<
  { ProjectDetail: ProjectDetailParams },
  'ProjectDetail'
>;
type ProjectDetailNavigation = NativeStackNavigationProp<
  FeedStackParamList & { EditProject: { projectId: string } },
  'ProjectDetail'
>;

export function ProjectDetailScreen() {
  const navigation = useNavigation<ProjectDetailNavigation>();
  const { params } = useRoute<ProjectDetailRoute>();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { project, loading, error } = useProject(params.projectId);
  const { profile: creatorProfile } = useUserProfile(
    project?.creatorId && user?.uid !== project.creatorId ? project.creatorId : undefined,
  );
  const { directory: classDirectory } = useClassDirectory();
  const { canAccess: canChat } = useChatAccess(project, user?.uid);
  const { appliedRoleIds } = useUserProjectApplications(params.projectId, user?.uid);
  const isCreator = user?.uid === project?.creatorId;
  const isTeacherViewer = profile?.role === 'teacher' && !isCreator;
  const {
    pendingApplications,
    acceptedApplications,
    loading: applicationsLoading,
  } = useAllProjectApplications(params.projectId, Boolean(isCreator));

  const [applyingRoleId, setApplyingRoleId] = useState<string | null>(null);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const handleShare = useCallback(async () => {
    if (!project) return;

    try {
      await Share.share({
        message: `Confira o projeto "${project.title}" no TeamUp!`,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o projeto.');
    }
  }, [project]);

  const handleOpenProjectUrl = useCallback(async () => {
    if (!project?.projectUrl) return;

    const url = normalizeProjectUrl(project.projectUrl);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Link inválido', 'Não foi possível abrir este endereço.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o link do projeto.');
    }
  }, [project?.projectUrl]);

  const handleChatPress = useCallback(() => {
    if (!canChat) {
      Alert.alert(
        'Chat indisponível',
        'Somente o criador e membros aceitos na equipe podem acessar o chat.',
      );
      return;
    }
    navigation.navigate('TeamChat', { projectId: params.projectId });
  }, [canChat, navigation, params.projectId]);

  const handleEndorsePress = useCallback(() => {
    navigation.navigate('Endorsement', { projectId: params.projectId });
  }, [navigation, params.projectId]);

  const handleEditPress = useCallback(() => {
    navigation.navigate('EditProject', { projectId: params.projectId });
  }, [navigation, params.projectId]);

  const handleAcceptApplication = useCallback(
    async (application: Parameters<typeof acceptApplication>[1]) => {
      if (!project) return;
      setProcessingAppId(application.id);
      try {
        await acceptApplication(project, application);
        Alert.alert('Candidato aceito!', `${application.userName} entrou na equipe.`);
      } catch (err) {
        Alert.alert(
          'Erro',
          err instanceof Error ? err.message : 'Não foi possível aceitar.',
        );
      } finally {
        setProcessingAppId(null);
      }
    },
    [project],
  );

  const handleRejectApplication = useCallback(
    async (application: ProjectApplication) => {
      setProcessingAppId(application.id);
      try {
        await rejectApplication(params.projectId, application.id);
      } catch (err) {
        Alert.alert(
          'Erro',
          err instanceof Error ? err.message : 'Não foi possível recusar.',
        );
      } finally {
        setProcessingAppId(null);
      }
    },
    [params.projectId],
  );

  const handleCompleteProject = useCallback(async () => {
    if (!project) return;
    setCompleting(true);
    try {
      await completeProject(project);
      Alert.alert(
        'Projeto concluído!',
        'A equipe já pode validar as skills uns dos outros.',
      );
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof Error ? err.message : 'Não foi possível concluir o projeto.',
      );
    } finally {
      setCompleting(false);
    }
  }, [project]);

  const handleApply = useCallback(
    (role: ProjectRole) => {
      if (!user || !project) return;

      Alert.alert(
        'Confirmar candidatura',
        `Deseja se candidatar à vaga de ${role.title}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Candidatar-se',
            onPress: async () => {
              setApplyingRoleId(role.id);
              try {
                await applyToProjectRole(project, role, user);
                Alert.alert(
                  'Candidatura enviada!',
                  'O criador do projeto receberá sua inscrição.',
                );
              } catch (err) {
                Alert.alert(
                  'Não foi possível candidatar',
                  err instanceof Error
                    ? err.message
                    : 'Tente novamente em instantes.',
                );
              } finally {
                setApplyingRoleId(null);
              }
            },
          },
        ],
      );
    },
    [project, user],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backOnly}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Projeto não encontrado</Text>
          <Text style={styles.errorText}>
            {error ?? 'Este projeto pode ter sido removido ou está indisponível.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isClassProject = isClassScopedProject(project);
  const hasRecruitment = !isClassProject;
  const classLabel = getProjectClassLabel(project, classDirectory);
  const openRoles = project.roles.filter((role) => role.filled < role.quantity);
  const canApply =
    hasRecruitment && project.status === 'open' && !isCreator && !isTeacherViewer;

  const creatorDisplayName = isCreator
    ? 'Você'
    : resolveDisplayName(creatorProfile, null, project.creatorName);

  const creatorSubtitle = isCreator
    ? 'Criado por você'
    : (project.creatorSubtitle ?? 'Criador(a) do projeto');

  const creatorPhotoURL = isCreator
    ? profile?.photoURL ?? project.creatorPhotoURL
    : creatorProfile?.photoURL ?? project.creatorPhotoURL;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.topActions}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
          </Pressable>

          {!isTeacherViewer ? (
            <View style={styles.topActionsRight}>
              {isCreator && project.status === 'open' ? (
                <Pressable onPress={handleEditPress} hitSlop={8}>
                  <PencilSimple size={24} color={colors.textSecondary} weight="bold" />
                </Pressable>
              ) : null}
              {canChat ? (
                <Pressable onPress={handleChatPress} hitSlop={8}>
                  <ChatsTeardrop size={24} color={colors.accent} weight="bold" />
                </Pressable>
              ) : null}
              <Pressable onPress={handleShare} hitSlop={8}>
                <ShareNetwork size={24} color={colors.textSecondary} weight="bold" />
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{project.title}</Text>

        {classLabel ? (
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{classLabel}</Text>
          </View>
        ) : null}

        {project.isBoosted ? (
          <View style={styles.boostTag}>
            <Lightning size={12} color={colors.boost} weight="fill" />
            <Text style={styles.boostTagText}>Destaque Patrocinado</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.creatorBox}>
          {creatorPhotoURL ? (
            <Image source={{ uri: creatorPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User color={colors.textSecondary} size={18} weight="bold" />
            </View>
          )}
          <View>
            <Text style={styles.creatorName}>{creatorDisplayName}</Text>
            <Text style={styles.creatorSubtitle}>{creatorSubtitle}</Text>
          </View>
        </View>

        {isCreator && hasRecruitment ? (
          <CreatorPanel
            project={project}
            pendingApplications={pendingApplications}
            acceptedApplications={acceptedApplications}
            loading={applicationsLoading}
            processingId={processingAppId}
            completing={completing}
            onAccept={handleAcceptApplication}
            onReject={handleRejectApplication}
            onComplete={handleCompleteProject}
            onEndorse={handleEndorsePress}
          />
        ) : null}

        {project.status === 'completed' && !isCreator && !isTeacherViewer ? (
          <Button
            title="Validar skills da equipe"
            onPress={handleEndorsePress}
            variant="secondary"
            style={styles.endorseButton}
          />
        ) : null}

        <Text style={styles.sectionTitle}>Objetivo do Projeto</Text>
        <Text style={styles.description}>{project.description}</Text>

        {project.projectUrl ? (
          <Pressable onPress={handleOpenProjectUrl} style={styles.linkCard}>
            <View style={styles.linkCardContent}>
              <Text style={styles.linkLabel}>Link do projeto</Text>
              <Text style={styles.linkUrl} numberOfLines={2}>
                {project.projectUrl}
              </Text>
            </View>
            <ArrowSquareOut size={22} color={colors.accent} weight="bold" />
          </Pressable>
        ) : null}

        {isClassProject ? (
          <View style={styles.classInfoBox}>
            <Text style={styles.classInfoText}>
              Projeto publicado na turma. Este tipo de projeto não aceita candidaturas.
            </Text>
          </View>
        ) : null}

        {hasRecruitment ? (
          <>
            <Text style={styles.sectionTitle}>
              Vagas Estruturadas ({openRoles.length || project.roles.length})
            </Text>

            {project.roles.map((role) => {
              const displayRole =
                project.status !== 'open' ? { ...role, filled: role.quantity } : role;

              return (
                <RoleCard
                  key={role.id}
                  role={displayRole}
                  applied={appliedRoleIds.has(role.id)}
                  applying={applyingRoleId === role.id}
                  canApply={canApply}
                  onApply={() => handleApply(role)}
                />
              );
            })}
          </>
        ) : null}
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
  backOnly: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  topActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  classBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  classBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  boostTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.boost,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  boostTagText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.boost,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  creatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  creatorSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: '#DDDDDD',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  linkCardContent: {
    flex: 1,
  },
  linkLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  linkUrl: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.accent,
  },
  classInfoBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  classInfoText: {
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
  endorseButton: {
    marginBottom: spacing.xxl,
  },
});
