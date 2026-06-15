import { StyleSheet, Text, View } from 'react-native';
import { CompletedProject } from '../../types/user';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface ProjectHistoryCardProps {
  project: CompletedProject;
}

export function ProjectHistoryCard({ project }: ProjectHistoryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.period}>{project.period}</Text>
      </View>
      <Text style={styles.role}>{project.role}</Text>
      <Text style={styles.description}>{project.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  period: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: '#666666',
  },
  role: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
