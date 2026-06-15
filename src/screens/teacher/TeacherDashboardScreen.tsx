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
import { Plus, UsersThree } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useClasses } from '../../hooks/useClasses';
import { Class } from '../../types/class';
import { TeacherStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type DashboardNavigation = NativeStackNavigationProp<
  TeacherStackParamList,
  'TeacherDashboard'
>;

function ClassCard({
  item,
  onPress,
}: {
  item: Class;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{item.code}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <UsersThree size={16} color={colors.textSecondary} weight="bold" />
        <Text style={styles.cardMetaText}>
          {item.studentIds.length} aluno(s) vinculado(s)
        </Text>
      </View>
    </Pressable>
  );
}

export function TeacherDashboardScreen() {
  const navigation = useNavigation<DashboardNavigation>();
  const { user } = useAuth();
  const { classes, loading, error } = useClasses(user?.uid, { role: 'teacher' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Área do Professor</Text>
          <Text style={styles.title}>Minhas Turmas</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('CreateClass')}
          style={styles.fab}
        >
          <Plus size={22} color={colors.black} weight="bold" />
        </Pressable>
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
          data={classes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma turma criada</Text>
              <Text style={styles.emptyText}>
                Crie uma turma e compartilhe o código com seus alunos para que
                eles vinculem projetos à disciplina.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ClassCard
              item={item}
              onPress={() =>
                navigation.navigate('ClassDetail', { classId: item.id })
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  codeBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  codeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.accent,
    letterSpacing: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardMetaText: {
    fontFamily: fonts.medium,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
