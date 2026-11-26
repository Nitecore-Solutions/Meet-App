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
import { ChevronRight, Info, Mail, MapPin, Phone } from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { ChoiceChip } from "../../components/Chips";
import { ErrorBanner, TextField } from "../../components/Form";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";
import type { Gender } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "BasicInfo">;

const GENDERS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "other", label: "Other" },
];

const INTERESTED_IN: {
  value: "women" | "men" | "everyone";
  label: string;
}[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "everyone", label: "Everyone" },
];

export function BasicInfoScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [interestedIn, setInterestedIn] = useState(profile.interestedIn);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const numericAge = Number(age);
    if (name.trim().length < 2) {
      setError("Please enter your first name.");
      return;
    }
    if (!Number.isInteger(numericAge) || numericAge < 18 || numericAge > 99) {
      setError("Age must be between 18 and 99.");
      return;
    }
    setError(null);
    updateUser({
      name: name.trim(),
      age: numericAge,
      gender,
      interestedIn,
    });
    showToast("Basic info updated.", "success");
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Basic info" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label="First name"
            required
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            placeholder="Your first name"
            autoCapitalize="words"
            maxLength={24}
          />

          <TextField
            label="Age"
            required
            value={age}
            onChangeText={(value) => {
              setAge(value.replace(/\D/g, "").slice(0, 2));
              if (error) setError(null);
            }}
            placeholder="Age"
            keyboardType="number-pad"
            maxLength={2}
            hint="Shown on your public profile unless hidden."
          />

          <Text style={styles.question}>I am a</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={gender === option.value}
                onPress={() => setGender(option.value)}
                style={styles.chip}
              />
            ))}
          </View>

          <Text style={[styles.question, styles.questionSpaced]}>
            I'm interested in
          </Text>
          <View style={styles.chipRow}>
            {INTERESTED_IN.map((option) => (
              <ChoiceChip
                key={option.value}
                label={option.label}
                selected={interestedIn === option.value}
                onPress={() => setInterestedIn(option.value)}
                style={styles.chip}
              />
            ))}
          </View>

          <Text style={[styles.question, styles.questionSpaced]}>City</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("SearchCity", { target: "profile" })}
            style={({ pressed }) => [
              styles.cityRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.cityIcon}>
              <MapPin size={20} color={colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.cityText}>
              <Text style={styles.cityValue}>
                {profile.city}, {profile.state}
              </Text>
              <Text style={styles.cityHint}>Tap to search another city</Text>
            </View>
            <ChevronRight size={19} color={colors.ink} strokeWidth={2} />
          </Pressable>

          {error ? <ErrorBanner message={error} /> : null}

          <View style={styles.note}>
            <Info size={16} color={colors.secondary} strokeWidth={2} />
            <Text style={styles.noteText}>
              Your exact location is never shown. Only your city helps us find
              people nearby.
            </Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Contact details</Text>
            <View style={styles.contactRow}>
              <Phone size={16} color={colors.muted} strokeWidth={2} />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
            <View style={styles.contactRow}>
              <Mail size={16} color={colors.muted} strokeWidth={2} />
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
            <Text style={styles.contactHint}>
              These are never shown publicly.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="SAVE" onPress={save} />
        </View>
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
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  question: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    marginTop: spacing.sm,
  },
  questionSpaced: {
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cityText: {
    flex: 1,
  },
  cityValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  cityHint: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.secondaryDark,
    fontWeight: "500",
  },
  contactCard: {
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  contactTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 2,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contactText: {
    fontSize: 13.5,
    color: colors.ink,
    fontWeight: "500",
  },
  contactHint: {
    fontSize: 10.5,
    color: colors.faint,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
});
