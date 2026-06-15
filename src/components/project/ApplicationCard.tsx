import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProjectApplication } from '../../types/application';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface ApplicationCardProps {
  application: ProjectApplication;
  onAccept: () => void;
  onReject: () => void;
  processing?: boolean;
}

export function ApplicationCard({
  application,
  onAccept,
  onReject,
  processing = false,
}: ApplicationCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{application.userName}</Text>
      <Text style={styles.role}>Vaga: {application.roleTitle}</Text>

      <View style={styles.actions}>
        <Pressable
          onPress={onReject}
          disabled={processing}
          style={[styles.button, styles.rejectButton]}
        >
          <Text style={styles.rejectText}>Recusar</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={processing}
          style={[styles.button, styles.acceptButton]}
        >
          <Text style={styles.acceptText}>Aceitar</Text>
        </Pressable>
      </View>
    </View>
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
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  role: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  acceptButton: {
    backgroundColor: colors.accent,
  },
  rejectText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  acceptText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.black,
  },
});
