import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight, Crown } from "lucide-react-native";

import { colors, radii, spacing } from "../constants/theme";

export function UpgradeBanner({
  onPress,
  title = "Upgrade Now",
  message = "Chat, send messages and connect instantly!",
  cta = "UPGRADE NOW",
  style,
}: {
  onPress: () => void;
  title?: string;
  message?: string;
  cta?: string;
  style?: object;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }, style]}
    >
      <View style={styles.decorOne} />
      <View style={styles.decorTwo} />
      <View style={styles.headRow}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={styles.crown}>
          <Crown size={34} color={colors.primary} strokeWidth={2.1} />
        </View>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{cta}</Text>
        <ArrowRight size={18} color={colors.white} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

export function MatchmakerCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.matchmaker, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.matchmakerText}>
        <Text style={styles.matchmakerTitle}>Matchmaker</Text>
        <Text style={styles.matchmakerSub}>
          Talk to matchmakers and experts
        </Text>
      </View>
      <ArrowRight size={20} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFDCCB",
    padding: spacing.lg,
    overflow: "hidden",
  },
  decorOne: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.35)",
    top: -54,
    right: 58,
  },
  decorTwo: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.24)",
    bottom: -26,
    right: -20,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.body,
    marginTop: 3,
    maxWidth: 230,
    fontWeight: "500",
  },
  crown: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    minHeight: 46,
    borderRadius: radii.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  matchmaker: {
    backgroundColor: "#FFF0F6",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFDCEA",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  matchmakerText: {
    flex: 1,
  },
  matchmakerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  matchmakerSub: {
    fontSize: 12.5,
    color: colors.body,
    marginTop: 3,
    fontWeight: "500",
  },
});
