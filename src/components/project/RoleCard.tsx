import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProjectRole } from '../../types/project';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface RoleCardProps {
  role: ProjectRole;
  applied: boolean;
  applying: boolean;
  canApply?: boolean;
  onApply: () => void;
}

export function RoleCard({
  role,
  applied,
  applying,
  canApply = true,
  onApply,
}: RoleCardProps) {
  const isFull = role.filled >= role.quantity;
  const spotsLeft = Math.max(role.quantity - role.filled, 0);

  const buttonLabel = applied
    ? 'Candidatura enviada'
    : isFull
      ? 'Vaga preenchida'
      : applying
        ? 'Enviando...'
        : 'Candidatar-se à Vaga';

  const isDisabled = !canApply || applied || isFull || applying;

  return (
    <Pressable
      onPress={onApply}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.card,
        pressed && canApply && !isDisabled && styles.cardPressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.title}>{role.title}</Text>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>
            {spotsLeft > 0 ? `${spotsLeft} Vaga${spotsLeft > 1 ? 's' : ''}` : 'Lotada'}
          </Text>
        </View>
      </View>

      <View style={styles.reqs}>
        {role.requirements.map((req) => (
          <View key={req} style={styles.reqTag}>
            <Text style={styles.reqText}>{req}</Text>
          </View>
        ))}
      </View>

      {canApply ? (
        <View style={[styles.applyButton, isDisabled && styles.applyButtonDisabled]}>
          <Text style={[styles.applyText, isDisabled && styles.applyTextDisabled]}>
            {buttonLabel}
          </Text>
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
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.92,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  qtyBadge: {
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  qtyText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  reqs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.lg,
  },
  reqTag: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
  },
  reqText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: '#AAAAAA',
  },
  applyButton: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: colors.surface2,
  },
  applyText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.black,
  },
  applyTextDisabled: {
    color: colors.textSecondary,
  },
});
