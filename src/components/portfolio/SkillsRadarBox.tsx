import { StyleSheet, Text, View } from 'react-native';
import { SealCheck } from 'phosphor-react-native';
import { EndorsedSkill } from '../../types/user';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface SkillsRadarBoxProps {
  endorsedSkills: EndorsedSkill[];
  selfDeclaredSkills: string[];
}

function EndorsedSkillRow({ name, endorserCount }: EndorsedSkill) {
  const label =
    endorserCount === 1
      ? 'Validado por 1 colega'
      : `Validado por ${endorserCount} colegas`;

  return (
    <View style={styles.skillRow}>
      <View style={styles.skillNameWrap}>
        <SealCheck size={16} color={colors.accent} weight="fill" />
        <Text style={styles.endorsedName}>{name}</Text>
      </View>
      <View style={styles.endorseBadge}>
        <Text style={styles.endorseBadgeText}>{label}</Text>
      </View>
    </View>
  );
}

function SelfDeclaredSkillRow({ name }: { name: string }) {
  return (
    <View style={styles.skillRow}>
      <Text style={styles.selfDeclaredName}>{name}</Text>
      <Text style={styles.autoBadge}>Autodeclarado</Text>
    </View>
  );
}

export function SkillsRadarBox({
  endorsedSkills,
  selfDeclaredSkills,
}: SkillsRadarBoxProps) {
  const hasSkills = endorsedSkills.length > 0 || selfDeclaredSkills.length > 0;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Radar de Skills</Text>

      {!hasSkills ? (
        <Text style={styles.empty}>Nenhuma skill cadastrada ainda.</Text>
      ) : (
        <View style={styles.list}>
          {endorsedSkills.map((skill) => (
            <EndorsedSkillRow key={skill.name} {...skill} />
          ))}
          {selfDeclaredSkills.map((skill) => (
            <SelfDeclaredSkillRow key={skill} name={skill} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  skillNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  endorsedName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.accent,
  },
  endorseBadge: {
    backgroundColor: 'rgba(222, 255, 154, 0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
  },
  endorseBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
  selfDeclaredName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: '#DDDDDD',
    flex: 1,
  },
  autoBadge: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
