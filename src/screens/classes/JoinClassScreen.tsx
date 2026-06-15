import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, GraduationCap, UsersThree } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useClasses } from '../../hooks/useClasses';
import { useUserProfile } from '../../hooks/useUserProfile';
import { joinClassByCode } from '../../services/classService';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

export function JoinClassScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const classIds = profile?.classIds ?? [];
  const { classes, loading } = useClasses(user?.uid, {
    role: 'student',
    classIds,
  });

  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinClass = async () => {
    if (!user) return;

    if (!classCode.trim()) {
      setError('Informe o código da turma.');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const classItem = await joinClassByCode(user.uid, classCode);
      setClassCode('');
      Alert.alert(
        'Turma vinculada!',
        `Você entrou na turma ${classItem.name}. Agora pode publicar projetos nela.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível entrar na turma.',
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Minhas turmas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <GraduationCap size={28} color={colors.accent} weight="duotone" />
            <Text style={styles.introTitle}>Entrar em uma turma</Text>
            <Text style={styles.introText}>
              Cole o código que o professor compartilhou para vincular sua conta à
              turma. Depois disso, você poderá publicar projetos na disciplina sem
              precisar digitar o código novamente.
            </Text>
          </View>

          <TextField
            label="Código da turma"
            placeholder="Ex: ABC123"
            value={classCode}
            onChangeText={(text) => setClassCode(text.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Entrar na turma"
            onPress={handleJoinClass}
            loading={joining}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Turmas vinculadas</Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : classes.length === 0 ? (
            <View style={styles.emptyCard}>
              <UsersThree size={32} color={colors.textTertiary} weight="duotone" />
              <Text style={styles.emptyTitle}>Nenhuma turma ainda</Text>
              <Text style={styles.emptyText}>
                Use o código acima para entrar na sua primeira turma.
              </Text>
            </View>
          ) : (
            <View style={styles.classList}>
              {classes.map((classItem) => (
                <View key={classItem.id} style={styles.classCard}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classTeacher}>
                    Prof. {classItem.teacherName}
                  </Text>
                  <Text style={styles.classCode}>Código: {classItem.code}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  flex: {
    flex: 1,
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
  intro: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  introTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  introText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  centered: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  classList: {
    gap: spacing.md,
  },
  classCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  className: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  classTeacher: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  classCode: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.accent,
    letterSpacing: 1,
  },
});
