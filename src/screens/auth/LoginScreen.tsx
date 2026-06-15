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
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors, fonts, fontSizes, spacing } from '../../theme';

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail ainda não está ativado no Firebase. Ative em Authentication → Sign-in method → E-mail/senha.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique sua internet e tente novamente.';
    case 'auth/invalid-api-key':
      return 'Configuração do Firebase inválida. Verifique o arquivo .env e reinicie o servidor.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

function getAuthErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return mapAuthError(err.code);
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return mapAuthError('');
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[LoginScreen] auth error:', err);
      }
      setError(getAuthErrorMessage(err));
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
          bounces={false}
        >
          <View style={styles.hero}>
            <Text style={styles.brand}>TeamUp</Text>
            <Text style={styles.tagline}>
              Construa projetos reais.{'\n'}Monte seu portfólio.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              textContentType={isSignUp ? 'newPassword' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'password'}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title={isSignUp ? 'Criar conta' : 'Entrar'}
              variant="primary"
              onPress={handleSubmit}
              loading={loading}
            />

            <Pressable
              onPress={() => {
                setError(null);
                setIsSignUp((prev) => !prev);
              }}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Já tem conta? Entrar'
                  : 'Não tem conta? Criar conta'}
              </Text>
            </Pressable>

            <Text style={styles.terms}>
              Autenticação restrita a alunos e professores.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
    paddingTop: spacing.xxl,
  },
  brand: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.brand,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xxl,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.accent,
  },
  terms: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
  error: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
    marginBottom: spacing.sm,
  },
});
