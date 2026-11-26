import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronDown, Lightbulb, Sparkles } from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { TextArea } from "../../components/Form";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "AboutMe">;

const MIN_LENGTH = 50;
const MAX_LENGTH = 500;

const starters = [
  "My perfect Sunday looks like...",
  "The way to my heart is...",
  "A fun fact about me...",
];

export function AboutMeScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const [about, setAbout] = useState(profile.about);
  const [tipsOpen, setTipsOpen] = useState(false);

  const trimmed = about.trim();
  const remaining = Math.max(0, MIN_LENGTH - trimmed.length);
  const canSave = trimmed.length >= MIN_LENGTH;

  function save() {
    if (!canSave) {
      showToast(`Add at least ${remaining} more characters.`, "error");
      return;
    }
    updateUser({ about: trimmed });
    showToast("About Me updated. That's a good look.", "success");
    navigation.goBack();
  }

  function addStarter(starter: string) {
    const spacer = about.trim() ? "\n\n" : "";
    setAbout(`${about}${spacer}${starter} `);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="About Me" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextArea
            value={about}
            onChangeText={setAbout}
            placeholder="Describe yourself. What do you currently do? What is quirky about you? What makes you smile? ..."
            minHeight={220}
            maxLength={MAX_LENGTH}
            hint="A little personality goes a long way."
          />

          <View style={styles.countRow}>
            <Text
              style={[
                styles.minimum,
                canSave && styles.minimumDone,
              ]}
            >
              {canSave
                ? "Looking good — you can save now."
                : `Minimum ${MIN_LENGTH} characters · ${remaining} to go`}
            </Text>
          </View>

          <View style={styles.starters}>
            <Text style={styles.startersLabel}>Need a nudge?</Text>
            <View style={styles.starterRow}>
              {starters.map((starter) => (
                <Pressable
                  key={starter}
                  onPress={() => addStarter(starter)}
                  style={({ pressed }) => [
                    styles.starter,
                    { opacity: pressed ? 0.65 : 1 },
                  ]}
                >
                  <Sparkles size={12} color={colors.primary} strokeWidth={2.2} />
                  <Text style={styles.starterText}>{starter}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <PrimaryButton
            label="SAVE"
            variant="secondary"
            onPress={save}
            disabled={!canSave}
            style={styles.save}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setTipsOpen((open) => !open)}
            style={({ pressed }) => [
              styles.howWrite,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={styles.howWriteText}>How to write a great bio?</Text>
            <ChevronDown
              size={17}
              color={colors.secondary}
              strokeWidth={2.2}
              style={{ transform: [{ rotate: tipsOpen ? "180deg" : "0deg" }] }}
            />
          </Pressable>

          {tipsOpen ? (
            <View style={styles.tips}>
              <View style={styles.tipsHeader}>
                <Lightbulb size={18} color={colors.warning} strokeWidth={2.2} />
                <Text style={styles.tipsTitle}>Make it easy to say hi</Text>
              </View>
              <Text style={styles.tip}>• Mention what you love doing on weekends.</Text>
              <Text style={styles.tip}>• Share one specific, happy detail.</Text>
              <Text style={styles.tip}>• Ask a light question people can answer.</Text>
              <Text style={styles.tip}>• Keep it positive and skip ex-partner stories.</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  minimum: {
    flex: 1,
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "500",
  },
  minimumDone: {
    color: colors.successDark,
    fontWeight: "600",
  },
  starters: {
    marginTop: spacing.xl,
  },
  startersLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  starterRow: {
    gap: spacing.sm,
  },
  starter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  starterText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: colors.body,
    flex: 1,
  },
  save: {
    marginTop: spacing.xl,
  },
  howWrite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  howWriteText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondary,
  },
  tips: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 6,
    marginTop: spacing.sm,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.ink,
  },
  tip: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.body,
  },
});
