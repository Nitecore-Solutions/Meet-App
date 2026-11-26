import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { colors, radii, spacing } from "../constants/theme";

export function ChoiceChip({
  label,
  selected = false,
  onPress,
  icon,
  tone = "primary",
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  tone?: "primary" | "secondary";
  style?: object;
}) {
  const accent = tone === "secondary" ? colors.secondary : colors.primary;
  const soft = tone === "secondary" ? colors.secondarySoft : colors.primarySoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? soft : colors.surface,
          borderColor: selected ? accent : colors.line,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.choiceText,
          { color: selected ? accent : colors.body },
          selected && styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function InterestChip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.interest,
        selected && styles.interestSelected,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={[styles.interestText, selected && styles.interestTextSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Checkbox({
  checked,
  onChange,
  size = 23,
  accent = colors.secondary,
}: {
  checked: boolean;
  onChange: () => void;
  size?: number;
  accent?: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onChange}
      hitSlop={8}
      style={({ pressed }) => [
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: 6,
          borderColor: checked ? accent : colors.ink,
          backgroundColor: checked ? accent : colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {checked ? (
        <Check size={size * 0.68} color={colors.white} strokeWidth={3.2} />
      ) : null}
    </Pressable>
  );
}

export function CheckRow({
  label,
  description,
  checked,
  onChange,
  trailing,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onChange}
      style={({ pressed }) => [
        styles.checkRow,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Checkbox checked={checked} onChange={onChange} />
      <View style={styles.checkText}>
        <Text style={styles.checkLabel}>{label}</Text>
        {description ? (
          <Text style={styles.checkDescription}>{description}</Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function CheckPill({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.checkPill,
        checked && styles.checkPillSelected,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.pillBox, checked && styles.pillBoxSelected]}>
        {checked ? (
          <Check size={12} color={colors.white} strokeWidth={3.4} />
        ) : null}
      </View>
      <Text style={[styles.pillText, checked && styles.pillTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    flexGrow: 1,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  choiceTextSelected: {
    fontWeight: "800",
  },
  interest: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  interestSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  interestText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.body,
  },
  interestTextSelected: {
    color: colors.primaryDark,
  },
  box: {
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  checkText: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "500",
  },
  checkDescription: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  checkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pillBox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBoxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.body,
  },
  pillTextSelected: {
    color: colors.primaryDark,
  },
});
