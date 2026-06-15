import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { User } from 'phosphor-react-native';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface FeedHeaderProps {
  photoURL?: string | null;
  onAvatarPress: () => void;
}

export function FeedHeader({ photoURL, onAvatarPress }: FeedHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        Team<Text style={styles.logoAccent}>Up.</Text>
      </Text>

      <Pressable onPress={onAvatarPress} style={styles.avatarButton}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <User color={colors.textSecondary} size={18} weight="bold" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  logo: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.heading,
    color: colors.textPrimary,
  },
  logoAccent: {
    color: colors.accent,
  },
  avatarButton: {
    borderRadius: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
