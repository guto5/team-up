import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretLeft, Users } from 'phosphor-react-native';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  imageURL?: string | null;
  onBack: () => void;
}

export function ChatHeader({
  title,
  subtitle,
  imageURL,
  onBack,
}: ChatHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
        <CaretLeft size={24} color={colors.textSecondary} weight="bold" />
      </Pressable>

      {imageURL ? (
        <Image source={{ uri: imageURL }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Users size={20} color={colors.textSecondary} weight="bold" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  backButton: {
    marginRight: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
