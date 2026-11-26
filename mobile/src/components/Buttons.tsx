import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { colors, radii, shadow, spacing } from "../constants/theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "outline"
  | "soft"
  | "danger"
  | "success"
  | "ghost";

const palettes: Record<
  ButtonVariant,
  { background: string; text: string; border: string }
> = {
  primary: {
    background: colors.primary,
    text: colors.white,
    border: colors.primary,
  },
  secondary: {
    background: colors.secondary,
    text: colors.white,
    border: colors.secondary,
  },
  dark: {
    background: colors.ink,
    text: colors.white,
    border: colors.ink,
  },
  outline: {
    background: colors.surface,
    text: colors.ink,
    border: colors.line,
  },
  soft: {
    background: colors.primarySoft,
    text: colors.primaryDark,
    border: colors.primarySoft,
  },
  danger: {
    background: colors.dangerSoft,
    text: colors.danger,
    border: colors.dangerSoft,
  },
  success: {
    background: colors.success,
    text: colors.white,
    border: colors.success,
  },
  ghost: {
    background: "transparent",
    text: colors.primary,
    border: "transparent",
  },
};

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  pill?: boolean;
  uppercase?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  iconRight,
  style,
  compact = false,
  pill = false,
  uppercase = true,
}: PrimaryButtonProps) {
  const palette = palettes[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        pill && styles.pill,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: inactive ? 0.45 : pressed ? 0.82 : 1,
        },
        variant !== "ghost" && shadow.soft,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              { color: palette.text },
              compact && styles.compactLabel,
              uppercase && styles.uppercase,
            ]}
          >
            {label}
          </Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

export function BackButton({
  onPress,
  light = false,
  plain = true,
}: {
  onPress?: () => void;
  light?: boolean;
  plain?: boolean;
}) {
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress ?? (() => navigation.goBack())}
      hitSlop={10}
      style={({ pressed }) => [
        styles.back,
        !plain && styles.backCircle,
        !plain && {
          backgroundColor: light ? "rgba(255,255,255,0.18)" : colors.surface,
          borderColor: light ? "transparent" : colors.line,
        },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <ArrowLeft
        size={23}
        color={light ? colors.white : colors.ink}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = "light",
  size = 40,
  style,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "light" | "soft" | "primary" | "danger";
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const background =
    tone === "danger"
      ? colors.dangerSoft
      : tone === "soft"
        ? colors.lineSoft
        : tone === "primary"
          ? colors.primarySoft
          : colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          opacity: pressed ? 0.7 : 1,
        },
        tone === "light" && shadow.soft,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  pill: {
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  compactLabel: {
    fontSize: 12.5,
  },
  uppercase: {
    letterSpacing: 0.7,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backCircle: {
    marginLeft: 0,
    borderRadius: 19,
    borderWidth: 1,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
