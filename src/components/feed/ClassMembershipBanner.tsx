import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GraduationCap, Plus } from 'phosphor-react-native';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface ClassMembershipBannerProps {
  classCount: number;
  onPress: () => void;
}

export function ClassMembershipBanner({
  classCount,
  onPress,
}: ClassMembershipBannerProps) {
  const hasClasses = classCount > 0;

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <GraduationCap size={22} color={colors.accent} weight="duotone" />
      <View style={styles.content}>
        <Text style={styles.title}>
          {hasClasses
            ? `${classCount} turma${classCount > 1 ? 's' : ''} vinculada${classCount > 1 ? 's' : ''}`
            : 'Entrar em uma turma'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {hasClasses
            ? 'Toque para ver suas turmas ou entrar em outra com o código'
            : 'Use o código do professor para vincular sua conta à turma'}
        </Text>
      </View>
      <View style={styles.action}>
        <Plus size={16} color={colors.black} weight="bold" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  action: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
