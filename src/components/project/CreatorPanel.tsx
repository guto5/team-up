import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Project } from '../../types/project';
import { ProjectApplication } from '../../types/application';
import { ApplicationCard } from './ApplicationCard';
import { Button } from '../ui/Button';
import { colors, fonts, fontSizes, spacing } from '../../theme';

interface CreatorPanelProps {
  project: Project;
  pendingApplications: ProjectApplication[];
  acceptedApplications: ProjectApplication[];
  loading?: boolean;
  processingId: string | null;
  completing: boolean;
  onAccept: (application: ProjectApplication) => void;
  onReject: (application: ProjectApplication) => void;
  onComplete: () => void;
  onEndorse: () => void;
}

export function CreatorPanel({
  project,
  pendingApplications,
  acceptedApplications,
  loading = false,
  processingId,
  completing,
  onAccept,
  onReject,
  onComplete,
  onEndorse,
}: CreatorPanelProps) {
  const isCompleted = project.status === 'completed';
  const canComplete = !isCompleted && acceptedApplications.length > 0;

  const handleComplete = () => {
    Alert.alert(
      'Concluir projeto',
      'Isso encerra as vagas e libera a validação de skills entre os membros. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Concluir', onPress: onComplete },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestão de Candidaturas</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}

      {!loading && pendingApplications.length > 0 ? (
        <>
          <Text style={styles.subtitle}>
            Pendentes ({pendingApplications.length})
          </Text>
          {pendingApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              processing={processingId === application.id}
              onAccept={() => onAccept(application)}
              onReject={() => onReject(application)}
            />
          ))}
        </>
      ) : null}

      {!loading && acceptedApplications.length > 0 ? (
        <>
          <Text style={styles.subtitle}>
            Aceitos ({acceptedApplications.length})
          </Text>
          {acceptedApplications.map((application) => (
            <View key={application.id} style={styles.acceptedCard}>
              <Text style={styles.acceptedName}>{application.userName}</Text>
              <Text style={styles.acceptedRole}>{application.roleTitle}</Text>
            </View>
          ))}
        </>
      ) : null}

      {!loading &&
      pendingApplications.length === 0 &&
      acceptedApplications.length === 0 ? (
        <Text style={styles.hint}>
          Nenhuma candidatura ainda. Quando alguém se candidatar às suas vagas,
          aparecerá aqui para você aceitar ou recusar.
        </Text>
      ) : null}

      {canComplete ? (
        <Button
          title="Marcar projeto como concluído"
          onPress={handleComplete}
          loading={completing}
          variant="primary"
          style={styles.actionButton}
        />
      ) : null}

      {isCompleted ? (
        <>
          <Text style={styles.completedBadge}>Projeto concluído</Text>
          <Button
            title="Validar skills da equipe"
            onPress={onEndorse}
            variant="secondary"
            style={styles.actionButton}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  acceptedCard: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  acceptedName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  acceptedRole: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: colors.accent,
  },
  completedBadge: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.lg,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  loader: {
    marginBottom: spacing.lg,
  },
});
