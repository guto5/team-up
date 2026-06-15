import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarBlank } from 'phosphor-react-native';
import { colors, fonts, fontSizes, radius, spacing } from '../../theme';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  error?: string;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function DatePicker({
  label,
  value,
  onChange,
  minimumDate = new Date(),
  error,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ?? minimumDate);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
      return;
    }

    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const openPicker = () => {
    setTempDate(value ?? minimumDate);
    setShowPicker(true);
  };

  const confirmIOS = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={openPicker}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <CalendarBlank size={20} color={colors.accent} weight="bold" />
        <Text style={[styles.valueText, !value && styles.placeholder]}>
          {value ? formatDate(value) : 'Selecionar data'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={value ?? minimumDate}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalAction}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={confirmIOS}>
                  <Text style={[styles.modalAction, styles.modalConfirm]}>
                    Confirmar
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                onChange={handleChange}
                themeVariant="dark"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  valueText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalAction: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  modalConfirm: {
    color: colors.accent,
  },
  iosPicker: {
    height: 220,
  },
});
