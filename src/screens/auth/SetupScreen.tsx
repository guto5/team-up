import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker';
import { saveUserProfile } from '../../services/userService';
import { persistProfilePhotoLocally } from '../../services/localPhotoService';
import { getRoleFromEmail } from '../../utils/role';
import { Button } from '../../components/ui/Button';
import { SkillPicker } from '../../components/ui/SkillPicker';
import { TextField } from '../../components/ui/TextField';
import { colors, fonts, fontSizes, spacing } from '../../theme';

function getFirstName(displayName: string | null | undefined, email?: string | null) {
  if (displayName) return displayName.split(' ')[0];
  if (email) return email.split('@')[0];
  return 'estudante';
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function SetupScreen() {
  const { user } = useAuth();
  const role = useMemo(() => getRoleFromEmail(user?.email), [user?.email]);
  const isTeacher = role === 'teacher';

  const firstName = useMemo(
    () => getFirstName(user?.displayName, user?.email),
    [user?.displayName, user?.email],
  );

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoURL ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    if (isTeacher && displayName.trim().length < 2) {
      return 'Informe seu nome completo.';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return 'Informe um telefone válido com DDD.';
    }

    if (!isTeacher) {
      const semesterNumber = Number(semester);
      if (!semester || semesterNumber < 1 || semesterNumber > 12) {
        return 'Informe o semestre atual (1 a 12).';
      }
    }

    if (selectedSkills.length === 0) {
      return isTeacher
        ? 'Selecione pelo menos uma disciplina ou área.'
        : 'Selecione pelo menos uma skill.';
    }

    if (bio.trim().length < 10) {
      return 'Escreva uma bio com pelo menos 10 caracteres.';
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!user) return;

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      let photoURL: string | null = user.photoURL;

      if (photoUri) {
        setUploadingPhoto(true);
        photoURL = await persistProfilePhotoLocally(user.uid, photoUri);
        setUploadingPhoto(false);
      }

      await saveUserProfile(user, {
        displayName: isTeacher ? displayName.trim() : undefined,
        phone,
        semester: isTeacher ? undefined : Number(semester),
        bio: bio.trim(),
        skills: selectedSkills,
        role,
        photoURL,
      });
    } catch (err) {
      setUploadingPhoto(false);
      setFormError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar seu perfil. Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.welcome}>
            Bem-vindo, <Text style={styles.welcomeAccent}>{firstName}</Text>
          </Text>

          <Text style={styles.description}>
            {isTeacher
              ? 'Configure seu perfil de professor para gerenciar turmas e acompanhar os projetos dos alunos.'
              : 'No TeamUp, seu perfil é a soma dos projetos que você entrega. Selecione suas skills iniciais. Elas serão '}
            {!isTeacher ? (
              <Text style={styles.descriptionStrong}>
                validadas por seus colegas após os projetos.
              </Text>
            ) : null}
          </Text>

          <ProfilePhotoPicker
            photoURL={photoUri}
            loading={uploadingPhoto}
            onPhotoSelected={setPhotoUri}
          />

          {isTeacher ? (
            <TextField
              label="Nome completo"
              placeholder="Ex: Prof. João Silva"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          ) : null}

          <TextField
            label="Telefone"
            placeholder="(51) 99999-9999"
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            keyboardType="phone-pad"
          />

          {!isTeacher ? (
            <TextField
              label="Semestre atual"
              placeholder="Ex: 4"
              value={semester}
              onChangeText={(text) => setSemester(text.replace(/\D/g, '').slice(0, 2))}
              keyboardType="number-pad"
            />
          ) : null}

          <TextField
            label="Bio"
            placeholder={
              isTeacher
                ? 'Conte sobre suas disciplinas e o que espera dos projetos...'
                : 'Conte um pouco sobre você e o que busca nos projetos...'
            }
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.bioInput}
            textAlignVertical="top"
          />

          <SkillPicker
            label={isTeacher ? 'Disciplinas / Áreas' : 'Skills Autodeclaradas'}
            selected={selectedSkills}
            onChange={setSelectedSkills}
          />

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Button
            title={isTeacher ? 'Ir para Turmas' : 'Ir para Projetos'}
            onPress={handleSubmit}
            loading={loading}
            icon={<ArrowRight size={18} color={colors.black} weight="bold" />}
          />
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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  welcome: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  welcomeAccent: {
    color: colors.accent,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  descriptionStrong: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  formError: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
