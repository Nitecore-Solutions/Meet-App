import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../constants/theme";
import { BackButton } from "./Buttons";

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  border = true,
  large = false,
  background = colors.surface,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  border?: boolean;
  large?: boolean;
  background?: string;
}) {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: background },
        border && styles.border,
      ]}
    >
      <View style={styles.left}>
        {onBack ? <BackButton onPress={onBack} /> : null}
        <View style={styles.titles}>
          <Text
            style={[styles.title, large && styles.largeTitle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  titles: {
    flexShrink: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
  largeTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 2,
    fontWeight: "500",
  },
  right: {
    flexShrink: 0,
  },
});
