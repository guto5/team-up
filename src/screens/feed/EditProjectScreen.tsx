import { useEffect, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Plus, Trash } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';
import { updateProject } from '../../services/projectService';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { SkillPicker } from '../../components/ui/SkillPicker';
import { TextField } from '../../components/ui/TextField';
import { FeedStackParamList } from '../../navigation/types';
import { CreateProjectRoleInput } from '../../types/project';
import { isClassScopedProject } from '../../utils/class';
import { isValidProjectUrl } from '../../utils/url';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

type EditProjectRoute = RouteProp<FeedStackParamList, 'EditProject'>;
type EditProjectNavigation = NativeStackNavigationProp<
  FeedStackParamList,
  'EditProject'
>;

interface RoleForm extends CreateProjectRoleInput {
  key: string;
  selectedRequirements: string[];
  filled: number;
}

function createEmptyRole(): RoleForm {
  return {
    key: `role-${Date.now()}-${Math.random()}`,
    title: '',
    quantity: 1,
    requirements: [],
    selectedRequirements: [],
    filled: 0,
  };
}

function parseDeadline(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDeadline(date: Date) {
  return date.toISOString().split('T')[0];
}

export function EditProjectScreen() {
  const navigation = useNavigation<EditProjectNavigation>();
  const { params } = useRoute<EditProjectRoute>();
  const { user } = useAuth();
  const { project, loading, error } = useProject(params.projectId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [roles, setRoles] = useState<RoleForm[]>([createEmptyRole()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const isCreator = user?.uid === project?.creatorId;
  const isClassProject = project ? isClassScopedProject(project) : false;

  useEffect(() => {
    if (!project || initialized) return;

    setTitle(project.title);
    setDescription(project.description);
    setProjectUrl(project.projectUrl ?? '');
    setDeadline(parseDeadline(project.deadline));
    setRoles(
      project.roles.map((role) => ({
        key: role.id,
        title: role.title,
        quantity: role.quantity,
        requirements: role.requirements,
        selectedRequirements: role.requirements,
        filled: role.filled,
      })),
    );
    setInitialized(true);
  }, [initialized, project]);

  const updateRole = (key: string, patch: Partial<RoleForm>) => {
    setRoles((current) =>
      current.map((role) => (role.key === key ? { ...role, ...patch } : role)),
    );
  };

  const handleSubmit = async () => {
    if (!user || !project) return;

    if (!title.trim() || !description.trim() || !deadline) {
      setFormError('Preencha título, descrição e prazo.');
      return;
    }

    if (projectUrl.trim() && !isValidProjectUrl(projectUrl)) {
      setFormError('Informe um link válido (Drive, GitHub, etc.).');
      return;
    }

    const parsedRoles = isClassProject
      ? undefined
      : roles
          .filter((role) => role.title.trim())
          .map((role) => ({
            title: role.title.trim(),
            quantity: Math.max(role.filled, role.quantity),
            requirements: role.requirements,
          }));

    if (!isClassProject && (!parsedRoles || parsedRoles.length === 0)) {
      setFormError('Adicione pelo menos uma vaga com título.');
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      await updateProject(project, user.uid, {
        title,
        description,
        projectUrl: projectUrl.trim() || null,
        deadline: formatDeadline(deadline),
        roles: parsedRoles,
      });

      Alert.alert('Projeto atualizado!', 'As alterações foram salvas.');
      navigation.goBack();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Não foi possível salvar o projeto.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !project || !isCreator) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backOnly}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Edição indisponível</Text>
          <Text style={styles.errorText}>
            {error ??
              (project?.status === 'completed'
                ? 'Projetos concluídos não podem ser editados.'
                : 'Somente o criador pode editar este projeto.')}
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
        <Text style={styles.headerTitle}>Editar Projeto</Text>
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

          {isClassProject ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Projeto de turma</Text>
              <Text style={styles.infoText}>
                A turma vinculada não pode ser alterada após a publicação.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Vagas do Projeto</Text>

              {roles.map((role, index) => (
                <View key={role.key} style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleLabel}>
                      Vaga {index + 1}
                      {role.filled > 0 ? ` · ${role.filled} preenchida(s)` : ''}
                    </Text>
                    {roles.length > 1 && role.filled === 0 ? (
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
                        quantity: Math.max(
                          role.filled,
                          Number(text.replace(/\D/g, '')) || 1,
                        ),
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
          )}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Button title="Salvar alterações" onPress={handleSubmit} loading={saving} />
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
  infoBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  infoTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
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
