import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatsCircle, UsersThree } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useClassDirectory } from '../../hooks/useClassDirectory';
import { useMyTeamProjects } from '../../hooks/useMyTeamProjects';
import { ensureChatMembership } from '../../services/chatService';
import { TeamProjectEntry } from '../../services/myProjectsService';
import { ClassDirectory, getProjectClassLabel } from '../../utils/class';
import { TeamStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type MyTeamNavigation = NativeStackNavigationProp<TeamStackParamList, 'MyTeamList'>;

function TeamProjectCard({
  entry,
  classDirectory,
  onOpenChat,
  onOpenProject,
}: {
  entry: TeamProjectEntry;
  classDirectory: ClassDirectory;
  onOpenChat: () => void;
  onOpenProject: () => void;
}) {
  const classLabel = getProjectClassLabel(entry.project, classDirectory);

  return (
    <Pressable onPress={onOpenChat} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <UsersThree size={20} color={colors.accent} weight="bold" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{entry.project.title}</Text>
          <Text style={styles.cardRole}>{entry.roleLabel}</Text>
          {classLabel ? (
            <Text style={styles.cardClass}>{classLabel}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable onPress={onOpenChat} style={styles.chatButton}>
          <ChatsCircle size={16} color={colors.black} weight="bold" />
          <Text style={styles.chatButtonText}>Abrir chat</Text>
        </Pressable>
        <Pressable onPress={onOpenProject} style={styles.detailLink}>
          <Text style={styles.detailLinkText}>Ver projeto</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export function MyTeamScreen() {
  const navigation = useNavigation<MyTeamNavigation>();
  const { user } = useAuth();
  const { directory: classDirectory } = useClassDirectory();
  const { entries, skippedClassProjects, loading, error } =
    useMyTeamProjects(user?.uid);

  useEffect(() => {
    if (!user || entries.length === 0) return;

    for (const entry of entries) {
      if (!entry.isCreator) continue;

      ensureChatMembership(entry.project, user).catch(() => undefined);
    }
  }, [entries, user]);

  const skippedCreatorClassProjects = skippedClassProjects.filter(
    (item) => item.isCreator,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Sua equipe</Text>
        <Text style={styles.title}>Minha Equipe</Text>
        <Text style={styles.subtitle}>
          Projetos do feed geral em que você participa — com acesso ao chat da
          equipe.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.project.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            skippedCreatorClassProjects.length > 0 ? (
              <View style={styles.skippedBanner}>
                <Text style={styles.skippedTitle}>
                  {skippedCreatorClassProjects.length} projeto(s) de turma oculto(s)
                </Text>
                <Text style={styles.skippedText}>
                  Projetos vinculados à turma não aparecem nesta aba. A equipe e o
                  chat ficam nos projetos do feed geral, como "
                  {entries[0]?.project.title ?? 'Mais um projeto'}".
                </Text>
                {skippedCreatorClassProjects.map((item) => (
                  <Text key={item.projectId} style={styles.skippedItem}>
                    • {item.title}
                  </Text>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ChatsCircle size={40} color={colors.textTertiary} weight="duotone" />
              <Text style={styles.emptyTitle}>Nenhum projeto em equipe</Text>
              <Text style={styles.emptyText}>
                Projetos de turma não aparecem aqui. Quando você criar um
                projeto no feed geral ou for aceito em uma vaga, o chat da
                equipe ficará disponível nesta aba.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TeamProjectCard
              entry={item}
              classDirectory={classDirectory}
              onOpenChat={() =>
                navigation.navigate('TeamChat', { projectId: item.project.id })
              }
              onOpenProject={() =>
                navigation.navigate('ProjectDetail', { projectId: item.project.id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  list: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  skippedBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  skippedTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  skippedText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  skippedItem: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DEFF9A14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardRole: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  cardClass: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  chatButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.black,
  },
  detailLink: {
    paddingVertical: spacing.sm,
  },
  detailLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
