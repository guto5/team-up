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
import { ArrowLeft, Copy } from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { subscribeToProjectsByClassCode } from '../../services/projectService';
import { useClassDirectory } from '../../hooks/useClassDirectory';
import { getProjectClassLabel } from '../../utils/class';
import { getStudentsForClass } from '../../services/classService';
import { Class } from '../../types/class';
import { Project } from '../../types/project';
import { UserProfile } from '../../types/user';
import { TeacherStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type ClassDetailNavigation = NativeStackNavigationProp<
  TeacherStackParamList,
  'ClassDetail'
>;
type ClassDetailRoute = RouteProp<TeacherStackParamList, 'ClassDetail'>;

export function ClassDetailScreen() {
  const navigation = useNavigation<ClassDetailNavigation>();
  const route = useRoute<ClassDetailRoute>();
  const { classId } = route.params;

  const [classItem, setClassItem] = useState<Class | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { directory: classDirectory } = useClassDirectory();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'classes', classId), (snapshot) => {
      if (!snapshot.exists()) {
        setClassItem(null);
        setLoading(false);
        return;
      }

      setClassItem({
        id: snapshot.id,
        ...(snapshot.data() as Omit<Class, 'id'>),
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [classId]);

  useEffect(() => {
    if (!classItem) return;

    getStudentsForClass(classItem).then((profiles) => {
      setStudents(profiles);
    });
  }, [classItem?.id, classItem?.studentIds.join(',')]);

  useEffect(() => {
    if (!classItem) return;

    const unsubscribe = subscribeToProjectsByClassCode(classItem.code, setProjects);
    return unsubscribe;
  }, [classItem?.code]);

  const handleCopyCode = useCallback(async () => {
    if (!classItem) return;

    try {
      await Clipboard.setStringAsync(classItem.code);
      Alert.alert(
        'Código copiado!',
        `Compartilhe o código ${classItem.code} com seus alunos.`,
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível copiar o código.');
    }
  }, [classItem]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!classItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Turma não encontrada.</Text>
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
        <Text style={styles.headerTitle}>{classItem.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código da turma</Text>
          <Text style={styles.codeValue}>{classItem.code}</Text>
          <Pressable onPress={handleCopyCode} style={styles.copyButton}>
            <Copy size={18} color={colors.black} weight="bold" />
            <Text style={styles.copyText}>Copiar código</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Alunos ({students.length})
        </Text>
        {students.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum aluno vinculado ainda. Compartilhe o código da turma.
          </Text>
        ) : (
          students.map((student) => (
            <View key={student.uid} style={styles.listItem}>
              <Text style={styles.listItemTitle}>{student.displayName}</Text>
              <Text style={styles.listItemSubtitle}>{student.email}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>
          Projetos da turma ({projects.length})
        </Text>
        {projects.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum projeto vinculado a esta turma ainda.
          </Text>
        ) : (
          projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() =>
                navigation.navigate('ProjectDetail', { projectId: project.id })
              }
              style={styles.listItem}
            >
              <Text style={styles.listItemTitle}>{project.title}</Text>
              <Text style={styles.listItemSubtitle}>
                {project.creatorName} • {getProjectClassLabel(project, classDirectory) ?? classItem.name}
              </Text>
              {project.projectUrl ? (
                <Text style={styles.listItemLink} numberOfLines={1}>
                  {project.projectUrl}
                </Text>
              ) : null}
            </Pressable>
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
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  codeLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  codeValue: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  copyText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.black,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  listItemTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  listItemSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  listItemLink: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
});
