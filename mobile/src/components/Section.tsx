import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ChevronRight } from "lucide-react-native";

import { colors, radii, spacing } from "../constants/theme";

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function CardGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children);
  return (
    <View style={[styles.group, style]}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 ? <View style={styles.separator} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
}

export function MenuRow({
  title,
  value,
  onPress,
  arrow = true,
  icon,
  detail,
  danger = false,
  right,
  style,
}: {
  title: string;
  value?: string;
  onPress?: () => void;
  arrow?: boolean;
  icon?: React.ReactNode;
  detail?: string;
  danger?: boolean;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.danger]}>{title}</Text>
        {value ? (
          <Text style={styles.rowValue} numberOfLines={2}>
            {value}
          </Text>
        ) : null}
        {detail ? (
          <Text style={styles.rowDetail} numberOfLines={3}>
            {detail}
          </Text>
        ) : null}
      </View>
      {right}
      {arrow ? (
        <ChevronRight
          size={19}
          color={danger ? colors.danger : colors.ink}
          strokeWidth={2}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, style, { opacity: pressed ? 0.65 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function DividerLabel({
  label,
  style,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.dividerRow, style]}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "primary" | "blue" | "pink";
}) {
  const palette = {
    neutral: { bg: colors.lineSoft, fg: colors.muted },
    success: { bg: colors.successSoft, fg: colors.successDark },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    primary: { bg: colors.primarySoft, fg: colors.primaryDark },
    blue: { bg: colors.secondarySoft, fg: colors.secondaryDark },
    pink: { bg: colors.accentSoft, fg: colors.accentDark },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function InfoLine({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailBlock}>
      <Text style={styles.detailTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginLeft: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 58,
  },
  icon: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: "500",
    color: colors.ink,
  },
  danger: {
    color: colors.danger,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  rowDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  pill: {
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  infoLine: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  infoLabel: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
    marginTop: 3,
  },
  detailBlock: {
    paddingVertical: spacing.md,
  },
  detailTitle: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
    marginBottom: 4,
  },
});
