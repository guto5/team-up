import { useEffect, useMemo, useState } from 'react';
import {
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Trash } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useClasses } from '../../hooks/useClasses';
import { createProject } from '../../services/projectService';
import { joinClassByCode } from '../../services/classService';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { SkillPicker } from '../../components/ui/SkillPicker';
import { TextField } from '../../components/ui/TextField';
import { FeedStackParamList } from '../../navigation/types';
import { Class } from '../../types/class';
import { CreateProjectRoleInput } from '../../types/project';
import { isValidProjectUrl } from '../../utils/url';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type CreateProjectNavigation = NativeStackNavigationProp<
  FeedStackParamList,
  'CreateProject'
>;

type PublishMode = 'class' | 'public';

interface RoleForm extends CreateProjectRoleInput {
  key: string;
  selectedRequirements: string[];
}

function createEmptyRole(): RoleForm {
  return {
    key: `role-${Date.now()}-${Math.random()}`,
    title: '',
    quantity: 1,
    requirements: [],
    selectedRequirements: [],
  };
}

function formatDeadline(date: Date) {
  return date.toISOString().split('T')[0];
}

export function CreateProjectScreen() {
  const navigation = useNavigation<CreateProjectNavigation>();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const classIds = profile?.classIds ?? [];
  const { classes, loading: classesLoading } = useClasses(user?.uid, {
    role: 'student',
    classIds,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [manualClassCode, setManualClassCode] = useState('');
  const [linkingClass, setLinkingClass] = useState(false);
  const [publishMode, setPublishMode] = useState<PublishMode>('public');
  const [roles, setRoles] = useState<RoleForm[]>([createEmptyRole()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLinkedClasses = classes.length > 0;
  const isClassPublish = publishMode === 'class';

  useEffect(() => {
    if (classesLoading || classes.length === 0) return;

    setPublishMode('class');
    setSelectedClass((current) => current ?? classes[0]);
  }, [classes, classesLoading]);

  const updateRole = (key: string, patch: Partial<RoleForm>) => {
    setRoles((current) =>
      current.map((role) => (role.key === key ? { ...role, ...patch } : role)),
    );
  };

  const handleLinkClass = async () => {
    if (!user || !manualClassCode.trim()) {
      setError('Informe o código da turma.');
      return;
    }

    setLinkingClass(true);
    setError(null);

    try {
      const classItem = await joinClassByCode(user.uid, manualClassCode);
      setSelectedClass(classItem);
      setPublishMode('class');
      setManualClassCode('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível vincular a turma.',
      );
    } finally {
      setLinkingClass(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!title.trim() || !description.trim() || !deadline) {
      setError('Preencha título, descrição e prazo.');
      return;
    }

    if (projectUrl.trim() && !isValidProjectUrl(projectUrl)) {
      setError('Informe um link válido (Drive, GitHub, etc.).');
      return;
    }

    let classToPublish = selectedClass;

    if (publishMode === 'class' && !classToPublish && manualClassCode.trim()) {
      try {
        classToPublish = await joinClassByCode(user.uid, manualClassCode);
        setSelectedClass(classToPublish);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível vincular a turma informada.',
        );
        return;
      }
    }

    if (publishMode === 'class' && !classToPublish) {
      setError('Selecione uma turma vinculada ou informe o código da turma.');
      return;
    }

    const parsedRoles = isClassPublish
      ? []
      : roles
          .filter((role) => role.title.trim())
          .map((role) => ({
            title: role.title.trim(),
            quantity: Math.max(1, role.quantity),
            requirements: role.requirements,
          }));

    if (!isClassPublish && parsedRoles.length === 0) {
      setError('Adicione pelo menos uma vaga com título.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const projectId = await createProject(user, {
        title,
        description,
        projectUrl: projectUrl.trim() || null,
        deadline: formatDeadline(deadline),
        classTag: isClassPublish ? classToPublish!.code : null,
        classId: isClassPublish ? classToPublish!.id : null,
        className: isClassPublish ? classToPublish!.name : null,
        scope: isClassPublish ? 'class' : 'public',
        roles: parsedRoles,
      });

      Alert.alert(
        'Projeto publicado!',
        isClassPublish
          ? `Projeto publicado na turma ${classToPublish!.name}.`
          : 'Projeto publicado no feed geral!',
      );
      navigation.replace('ProjectDetail', { projectId });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível criar o projeto.',
      );
    } finally {
      setLoading(false);
    }
  };

  const scopeHint = useMemo(() => {
    if (!isClassPublish) {
      return 'Este projeto será publicado no feed geral (projeto externo).';
    }

    const classLabel =
      selectedClass?.name ??
      (manualClassCode.trim() ? manualClassCode.trim().toUpperCase() : null);

    return classLabel
      ? `Este projeto será publicado na turma ${classLabel}.`
      : 'Selecione uma turma vinculada ou informe o código para publicar na disciplina.';
  }, [isClassPublish, selectedClass?.name, manualClassCode]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Novo Projeto</Text>
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
          <TextField
            label="Título"
            placeholder="Ex: App de Saúde Mental Univates"
            value={title}
            onChangeText={setTitle}
          />
          <TextField
            label="Descrição / Objetivo"
            placeholder="Descreva o projeto e o que a equipe vai entregar..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.multiline}
            textAlignVertical="top"
          />
          <TextField
            label="Link do projeto (opcional)"
            placeholder="Drive, GitHub, Copilot, Figma..."
            value={projectUrl}
            onChangeText={setProjectUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <DatePicker
            label="Prazo"
            value={deadline}
            onChange={setDeadline}
            minimumDate={new Date()}
          />

          <Text style={styles.sectionTitle}>Turma</Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => {
                setPublishMode('class');
                if (!selectedClass && classes[0]) {
                  setSelectedClass(classes[0]);
                }
              }}
              style={[
                styles.modeChip,
                publishMode === 'class' && styles.modeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  publishMode === 'class' && styles.modeChipTextActive,
                ]}
              >
                Na turma
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setPublishMode('public');
              }}
              style={[
                styles.modeChip,
                publishMode === 'public' && styles.modeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  publishMode === 'public' && styles.modeChipTextActive,
                ]}
              >
                Feed geral
              </Text>
            </Pressable>
          </View>

          {publishMode === 'class' ? (
            <View style={styles.classSection}>
              {hasLinkedClasses ? (
                <>
                  <Text style={styles.classHint}>
                    Selecione uma turma já vinculada:
                  </Text>
                  <View style={styles.classOptions}>
                    {classes.map((classItem) => (
                      <Pressable
                        key={classItem.id}
                        onPress={() => {
                          setSelectedClass(classItem);
                          setManualClassCode('');
                        }}
                        style={[
                          styles.classOption,
                          selectedClass?.id === classItem.id &&
                            styles.classOptionSelected,
                        ]}
                      >
                        <Text style={styles.classOptionTitle}>{classItem.name}</Text>
                        <Text style={styles.classOptionCode}>{classItem.code}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : !hasLinkedClasses && !selectedClass ? (
                <View style={styles.noClassBanner}>
                  <Text style={styles.noClassTitle}>
                    VOCÊ NÃO TEM NENHUMA TURMA VINCULADA
                  </Text>
                  <Text style={styles.noClassText}>
                    Informe o código da turma para vincular e publicar na disciplina.
                  </Text>
                </View>
              ) : null}

              {selectedClass && !hasLinkedClasses ? (
                <View style={styles.linkedClassCard}>
                  <Text style={styles.linkedClassLabel}>Turma selecionada</Text>
                  <Text style={styles.linkedClassName}>{selectedClass.name}</Text>
                </View>
              ) : null}

              <Text style={styles.classHint}>
                {hasLinkedClasses
                  ? 'Ou digite o código de outra turma (você entra na turma e pode publicar):'
                  : 'Digite o código da turma para entrar e publicar nesta disciplina:'}
              </Text>
              <TextField
                label="Código da turma"
                placeholder="Ex: ABC123"
                value={manualClassCode}
                onChangeText={(text) => {
                  setManualClassCode(text.toUpperCase());
                  if (text.trim()) setSelectedClass(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Button
                title="Vincular turma"
                variant="secondary"
                onPress={handleLinkClass}
                loading={linkingClass}
              />
            </View>
          ) : null}

          <Text style={styles.scopeHint}>{scopeHint}</Text>

          {!isClassPublish ? (
            <>
              <Text style={styles.sectionTitle}>Vagas do Projeto</Text>

              {roles.map((role, index) => (
                <View key={role.key} style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleLabel}>Vaga {index + 1}</Text>
                    {roles.length > 1 ? (
                      <Pressable
                        onPress={() =>
                          setRoles((current) =>
                            current.filter((item) => item.key !== role.key),
                          )
                        }
                      >
                        <Trash size={18} color={colors.textSecondary} />
                      </Pressable>
                    ) : null}
                  </View>

                  <TextField
                    label="Cargo"
                    placeholder="Ex: Back-end Node.js"
                    value={role.title}
                    onChangeText={(text) => updateRole(role.key, { title: text })}
                  />
                  <TextField
                    label="Quantidade"
                    placeholder="1"
                    value={String(role.quantity)}
                    onChangeText={(text) =>
                      updateRole(role.key, {
                        quantity: Math.max(1, Number(text.replace(/\D/g, '')) || 1),
                      })
                    }
                    keyboardType="number-pad"
                  />

                  <SkillPicker
                    label="Requisitos"
                    selected={role.selectedRequirements}
                    onChange={(skills) =>
                      updateRole(role.key, {
                        selectedRequirements: skills,
                        requirements: skills,
                      })
                    }
                  />
                </View>
              ))}

              <Pressable
                onPress={() => setRoles((current) => [...current, createEmptyRole()])}
                style={styles.addRole}
              >
                <Plus size={18} color={colors.accent} weight="bold" />
                <Text style={styles.addRoleText}>Adicionar vaga</Text>
              </Pressable>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Publicar Projeto" onPress={handleSubmit} loading={loading} />
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
  multiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modeChipActive: {
    borderColor: colors.accent,
    backgroundColor: '#DEFF9A14',
  },
  modeChipText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  modeChipTextActive: {
    color: colors.accent,
  },
  classSection: {
    marginBottom: spacing.lg,
  },
  classHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  classOptions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  classOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  classOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: '#DEFF9A14',
  },
  classOptionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  classOptionCode: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  linkedClassCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  linkedClassLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  linkedClassName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    color: colors.accent,
  },
  noClassBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  noClassTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  noClassText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  scopeHint: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginBottom: spacing.xxl,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roleLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  reqLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  addRoleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.accent,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
