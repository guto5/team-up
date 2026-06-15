import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignOut } from 'phosphor-react-native';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { auth } from '../../config/firebase';
import { ProfilePhotoPicker } from '../../components/profile/ProfilePhotoPicker';
import { persistProfilePhotoLocally } from '../../services/localPhotoService';
import { updateUserProfile } from '../../services/userService';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

export function TeacherProfileScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoSelected = useCallback(
    async (localUri: string) => {
      if (!user) return;

      setUploadingPhoto(true);
      try {
        const photoURL = await persistProfilePhotoLocally(user.uid, localUri);
        await updateUserProfile(user.uid, { photoURL });
      } catch {
        Alert.alert('Erro', 'Não foi possível atualizar a foto do perfil.');
      } finally {
        setUploadingPhoto(false);
      }
    },
    [user],
  );

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair do TeamUp?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          signOut(auth).catch(() => {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <SignOut size={20} color={colors.black} weight="bold" />
          </Pressable>
        </View>

        <View style={styles.avatarWrap}>
          <ProfilePhotoPicker
            photoURL={profile?.photoURL}
            size={90}
            loading={uploadingPhoto}
            onPhotoSelected={handlePhotoSelected}
          />
        </View>

        <Text style={styles.name}>{profile?.displayName ?? 'Professor(a)'}</Text>
        <Text style={styles.email}>{profile?.email ?? user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Professor Univates</Text>
        </View>

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {profile?.skills?.length ? (
          <>
            <Text style={styles.sectionTitle}>Disciplinas / Áreas</Text>
            <View style={styles.skills}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Pressable onPress={handleLogout} style={styles.logoutAction}>
          <SignOut size={18} color="#FF6B6B" weight="bold" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  cover: {
    height: 120,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    marginTop: -70,
    marginBottom: spacing.lg,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  roleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.accent,
  },
  bio: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  skillChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skillText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  logoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#FF6B6B44',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  logoutText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: '#FF6B6B',
  },
});
