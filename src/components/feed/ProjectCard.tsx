import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, Lightning } from 'phosphor-react-native';
import { Project } from '../../types/project';
import {
  ClassDirectory,
  emptyClassDirectory,
  getProjectClassLabel,
  isClassScopedProject,
} from '../../utils/class';
import { formatProjectDeadline } from '../../utils/formatDate';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  classDirectory?: ClassDirectory;
}

function RoleRow({
  title,
  filled,
  quantity,
  isLast,
}: Project['roles'][number] & { isLast: boolean }) {
  const isFilled = filled >= quantity;

  return (
    <View style={[styles.roleItem, isLast && styles.roleItemLast]}>
      <Text style={[styles.roleText, isFilled && styles.roleFilled]}>
        {quantity}x {title}
      </Text>
      {isFilled ? (
        <CheckCircle size={16} color={colors.accent} weight="fill" />
      ) : null}
    </View>
  );
}

export function ProjectCard({
  project,
  onPress,
  classDirectory = emptyClassDirectory,
}: ProjectCardProps) {
  const openRoles = project.roles.filter((role) => role.filled < role.quantity);
  const classLabel = getProjectClassLabel(project, classDirectory);
  const showRoles = !isClassScopedProject(project);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        project.isBoosted && styles.cardBoosted,
        pressed && styles.cardPressed,
      ]}
    >
      {project.isBoosted ? (
        <View style={styles.boostBadge}>
          <Lightning size={10} color={colors.black} weight="fill" />
          <Text style={styles.boostBadgeText}>Em Destaque</Text>
        </View>
      ) : null}

      <Text style={styles.title}>{project.title}</Text>

      <View style={styles.meta}>
        {classLabel ? (
          <View style={styles.classTag}>
            <Text style={styles.classTagText}>{classLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.deadline}>
          Prazo: {formatProjectDeadline(project.deadline)}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {project.description}
      </Text>

      {showRoles ? (
        <View style={styles.rolesSection}>
          <Text style={styles.rolesTitle}>Vagas Abertas</Text>
          {(openRoles.length > 0 ? openRoles : project.roles).map((role, index, list) => (
            <RoleRow
              key={role.id}
              {...role}
              isLast={index === list.length - 1}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  cardBoosted: {
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: '#141208',
  },
  cardPressed: {
    opacity: 0.92,
  },
  boostBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.lg,
    backgroundColor: colors.boost,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boostBadgeText: {
    fontFamily: fonts.extraBold,
    fontSize: fontSizes.xs,
    color: colors.black,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
    paddingRight: spacing.xxxl,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  classTag: {
    backgroundColor: colors.surface2,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  classTagText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  deadline: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: '#BBBBBB',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  rolesSection: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rolesTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2,
  },
  roleItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  roleText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  roleFilled: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
});
