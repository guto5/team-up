import { useMemo, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, SealCheck } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';
import { useAllProjectApplications } from '../../hooks/useProjectApplications';
import { useEndorsementsGiven } from '../../hooks/useEndorsements';
import { endorseTeammateSkill } from '../../services/endorsementService';
import { Chip } from '../../components/ui/Chip';
import { FeedStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type EndorsementRoute = RouteProp<FeedStackParamList, 'Endorsement'>;

interface Teammate {
  uid: string;
  name: string;
  roleTitle: string;
  skills: string[];
}

export function EndorsementScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<EndorsementRoute>();
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProject(params.projectId);
  const { applications, loading: appsLoading } = useAllProjectApplications(
    params.projectId,
    true,
  );
  const { endorsements, loading: endorsementsLoading } = useEndorsementsGiven(user?.uid);
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const teammates = useMemo<Teammate[]>(() => {
    if (!project || !user) return [];

    const accepted = applications.filter((app) => app.status === 'accepted');
    const list: Teammate[] = [];

    if (project.creatorId !== user.uid) {
      const creatorRole = project.roles[0];
      list.push({
        uid: project.creatorId,
        name: project.creatorName,
        roleTitle: 'Criador(a)',
        skills: creatorRole?.requirements ?? [],
      });
    }

    for (const app of accepted) {
      if (app.userId === user.uid) continue;

      const role = project.roles.find((item) => item.id === app.roleId);
      list.push({
        uid: app.userId,
        name: app.userName,
        roleTitle: app.roleTitle,
        skills: role?.requirements ?? [],
      });
    }

    return list;
  }, [applications, project, user]);

  const hasEndorsed = (endorseeId: string, skillName: string) =>
    endorsements.some(
      (item) =>
        item.endorserId === user?.uid &&
        item.endorseeId === endorseeId &&
        item.skillName === skillName &&
        item.projectId === params.projectId,
    );

  const handleEndorse = async (teammate: Teammate, skillName: string) => {
    if (!user || !project) return;

    const key = `${teammate.uid}_${skillName}`;
    setProcessingKey(key);

    try {
      await endorseTeammateSkill(
        user,
        teammate.uid,
        project.id,
        project.title,
        skillName,
      );
      Alert.alert('Skill validada!', `Você validou ${skillName} para ${teammate.name}.`);
    } catch (err) {
      Alert.alert(
        'Não foi possível validar',
        err instanceof Error ? err.message : 'Tente novamente.',
      );
    } finally {
      setProcessingKey(null);
    }
  };

  const loading = projectLoading || appsLoading || endorsementsLoading;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project || project.status !== 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.error}>
            A validação de skills só está disponível após a conclusão do projeto.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Validar Skills</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <Text style={styles.description}>
          Valide as skills dos seus colegas com base no trabalho entregue neste projeto.
        </Text>

        {teammates.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum colega disponível para validação neste projeto.
          </Text>
        ) : (
          teammates.map((teammate) => (
            <View key={teammate.uid} style={styles.card}>
              <View style={styles.cardHeader}>
                <SealCheck size={18} color={colors.accent} weight="fill" />
                <View>
                  <Text style={styles.name}>{teammate.name}</Text>
                  <Text style={styles.role}>{teammate.roleTitle}</Text>
                </View>
              </View>

              <View style={styles.chips}>
                {(teammate.skills.length > 0 ? teammate.skills : ['Colaboração']).map(
                  (skill) => {
                    const endorsed = hasEndorsed(teammate.uid, skill);
                    const key = `${teammate.uid}_${skill}`;
                    return (
                      <Chip
                        key={key}
                        label={endorsed ? `${skill} ✓` : skill}
                        selected={endorsed}
                        onPress={() =>
                          !endorsed && !processingKey && handleEndorse(teammate, skill)
                        }
                      />
                    );
                  },
                )}
              </View>
            </View>
          ))
        )}
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
  back: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  projectTitle: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  role: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
    color: colors.accent,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
