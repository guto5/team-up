import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Plus, X } from 'phosphor-react-native';
import { AVAILABLE_SKILLS } from '../../constants/skills';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface SkillPickerProps {
  label?: string;
  selected: string[];
  onChange: (skills: string[]) => void;
}

export function SkillPicker({ label, selected, onChange }: SkillPickerProps) {
  const [inputValue, setInputValue] = useState('');

  const toggle = (skill: string) => {
    onChange(
      selected.includes(skill)
        ? selected.filter((s) => s !== skill)
        : [...selected, skill],
    );
  };

  const addCustom = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setInputValue('');
  };

  const customSkills = selected.filter(
    (s) => !(AVAILABLE_SKILLS as readonly string[]).includes(s),
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.chips}>
        {AVAILABLE_SKILLS.map((skill) => {
          const active = selected.includes(skill);
          return (
            <Pressable
              key={skill}
              onPress={() => toggle(skill)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {skill}
              </Text>
            </Pressable>
          );
        })}

        {customSkills.map((skill) => (
          <Pressable
            key={skill}
            onPress={() => toggle(skill)}
            style={[styles.chip, styles.chipActive, styles.chipCustom]}
          >
            <Text style={[styles.chipText, styles.chipTextActive]}>{skill}</Text>
            <X size={12} color={colors.accent} weight="bold" />
          </Pressable>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar skill personalizada..."
          placeholderTextColor={colors.textTertiary}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addCustom}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={addCustom}
          style={[styles.addButton, !inputValue.trim() && styles.addButtonDisabled]}
          disabled={!inputValue.trim()}
        >
          <Plus size={18} color={colors.black} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xxl,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent,
  },
  chipCustom: {
    paddingRight: spacing.sm,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.35,
  },
});
