import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check } from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, spacing } from "../../constants/theme";
import type { AppStackParamList } from "../../navigation/types";

export function LikesYouScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Likes You" large />
      <View style={styles.content}>
        <EmptyState
          icon={<Check size={22} color={colors.ink} strokeWidth={2.3} />}
          message="No new Likes! Like profiles so they can like you back."
        />
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label="CHECKOUT MATCHES"
          onPress={() => navigation.navigate("Premium", { source: "likes" })}
        />
        <Text style={styles.hint}>
          Upgrade to see who liked you and start chatting instantly.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    fontWeight: "500",
  },
});
