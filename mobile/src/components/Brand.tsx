import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { APP_NAME } from "../constants/config";
import { colors } from "../constants/theme";

export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="3" y="7" width="29" height="26" rx="12" fill={colors.primary} />
      <Path
        d="M11 30 L8.5 39 L20 32.5 Z"
        fill={colors.primary}
      />
      <Circle cx="13.2" cy="19" r="2.7" fill={colors.white} />
      <Circle cx="22.2" cy="19" r="2.7" fill={colors.white} />
      <Rect x="21" y="17" width="24" height="23" rx="10.5" fill={colors.accent} />
      <Path d="M37 38 L40 44.5 L31.5 40 Z" fill={colors.accent} />
      <Circle cx="29.2" cy="28" r="2.25" fill={colors.white} />
      <Circle cx="36.8" cy="28" r="2.25" fill={colors.white} />
    </Svg>
  );
}

export function BrandWordmark({
  size = 28,
  dark = false,
}: {
  size?: number;
  dark?: boolean;
}) {
  return (
    <View style={styles.wordmarkRow}>
      <BrandMark size={size + 5} />
      <Text
        style={[
          styles.wordmark,
          { fontSize: size },
          dark && { color: colors.white },
        ]}
      >
        <Text style={{ color: dark ? colors.white : colors.primary }}>Pagal</Text>
        <Text style={{ color: dark ? colors.primarySoft : colors.ink }}>Pagal</Text>
      </Text>
    </View>
  );
}

export function BrandLockup({
  size = 28,
  dark = false,
  tagline = APP_NAME,
}: {
  size?: number;
  dark?: boolean;
  tagline?: string;
}) {
  return (
    <View style={styles.lockup}>
      <BrandWordmark size={size} dark={dark} />
      <Text
        style={[
          styles.tagline,
          { color: dark ? "rgba(255,255,255,0.72)" : colors.muted },
        ]}
      >
        {tagline}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  wordmark: {
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  lockup: {
    alignItems: "flex-start",
  },
  tagline: {
    marginLeft: 3,
    marginTop: 1,
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
