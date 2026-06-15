import { useState } from 'react';
import {
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
import { ArrowLeft } from 'phosphor-react-native';
import { useAuth } from '../../hooks/useAuth';
import { createClass } from '../../services/classService';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { TeacherStackParamList } from '../../navigation/types';
import { colors, fonts, fontSizes, spacing } from '../../theme';

type CreateClassNavigation = NativeStackNavigationProp<
  TeacherStackParamList,
  'CreateClass'
>;

export function CreateClassScreen() {
  const navigation = useNavigation<CreateClassNavigation>();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const classId = await createClass(user, name);
      navigation.replace('ClassDetail', { classId });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível criar a turma.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={24} color={colors.textSecondary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Nova Turma</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Um código único será gerado automaticamente para seus alunos
            vincularem a turma ao criar projetos.
          </Text>

          <TextField
            label="Nome da turma"
            placeholder="Ex: Engenharia de Software — 2026/1"
            value={name}
            onChangeText={setName}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Criar turma" onPress={handleSubmit} loading={loading} />
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
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
