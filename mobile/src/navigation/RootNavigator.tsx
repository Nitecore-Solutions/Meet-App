import React from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandWordmark } from "../components/Brand";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const { ready, signedIn } = useAuth();

  if (!ready) {
    return (
      <SafeAreaView style={styles.boot}>
        <BrandWordmark size={32} />
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Finding your people…</Text>
      </SafeAreaView>
    );
  }

  return signedIn ? <AppNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
  },
  spinner: {
    marginTop: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "500",
  },
});
