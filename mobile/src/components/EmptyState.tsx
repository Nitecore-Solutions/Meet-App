import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, spacing } from "../constants/theme";

export function MascotIllustration({
  size = 210,
  mood = "sad",
  tint = colors.lavenderDeep,
}: {
  size?: number;
  mood?: "sad" | "happy";
  tint?: string;
}) {
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 230 198">
      <Circle cx="131" cy="94" r="76" fill={tint} opacity={0.8} />
      <Path
        d="M59 137 C49 151 48 164 51 175"
        stroke="#555066"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M151 145 C157 157 154 168 149 176"
        stroke="#555066"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Circle
        cx="111"
        cy="88"
        r="68"
        fill="#F8F6FC"
        stroke="#555066"
        strokeWidth={6}
      />
      <Path
        d="M168 131 C180 139 185 148 183 156 C176 154 166 145 158 137 Z"
        fill="#F8F6FC"
        stroke="#555066"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <Circle cx="88" cy="82" r="4.5" fill="#555066" />
      <Circle cx="128" cy="82" r="4.5" fill="#555066" />
      {mood === "sad" ? (
        <Path
          d="M96 113 Q108 102 122 113"
          stroke="#555066"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <Path
          d="M96 108 Q108 122 122 108"
          stroke="#555066"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </Svg>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
  mood = "sad",
  compact = false,
}: {
  title?: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  mood?: "sad" | "happy";
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.artWrap}>
        <MascotIllustration size={compact ? 160 : 214} mood={mood} />
        {icon ? <View style={styles.artBadge}>{icon}</View> : null}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  artWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  artBadge: {
    position: "absolute",
    right: 17,
    bottom: 17,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#281B3C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginTop: spacing.md,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotActive: {
    width: 17,
    backgroundColor: colors.ink,
  },
});

export function DecorativeDots({
  count,
  active = 0,
}: {
  count: number;
  active?: number;
}) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === active && styles.dotActive]}
        />
      ))}
    </View>
  );
}


