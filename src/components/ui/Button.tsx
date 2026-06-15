import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, fonts, fontSizes } from '../../theme';

type ButtonVariant = 'primary' | 'google' | 'secondary' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'google' || variant === 'primary' ? colors.black : colors.textPrimary}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`${variant}Text` as const], textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  google: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
  },
  secondary: {
    backgroundColor: colors.surface2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
  },
  primaryText: {
    color: colors.black,
  },
  googleText: {
    color: colors.black,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineText: {
    color: colors.textPrimary,
  },
});
