import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SealCheck } from 'phosphor-react-native';
import { Project } from '../../types/project';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface EndorsementBannerProps {
  project: Project;
  onPress: () => void;
}

export function EndorsementBanner({ project, onPress }: EndorsementBannerProps) {
  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <SealCheck size={20} color={colors.accent} weight="fill" />
      <View style={styles.content}>
        <Text style={styles.title}>Valide as skills da equipe</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {project.title}
        </Text>
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
    borderColor: colors.accent,
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
  },
});
