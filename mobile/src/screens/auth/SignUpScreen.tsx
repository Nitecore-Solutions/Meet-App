import React, { useMemo, useState } from "react";
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
import { ChevronDown, MapPin, Sparkles } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../../components/Buttons";
import { ChoiceChip } from "../../components/Chips";
import { ErrorBanner, TextField } from "../../components/Form";
import { PickerSheet } from "../../components/PickerSheet";
import { CITY_OPTIONS } from "../../constants/catalog";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";
import type { Gender } from "../../types";
import { ageFromDate, isValidAge } from "../../utils/format";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

const GENDERS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "other", label: "Other" },
];

const INTERESTS: {
  value: "women" | "men" | "everyone";
  label: string;
}[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "everyone", label: "Everyone" },
];

function cityOptions() {
  const seen = new Set<string>();
  return CITY_OPTIONS.filter((entry) => {
    const key = `${entry.city}|${entry.state}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((entry) => ({
    value: `${entry.city}|${entry.state}`,
    label: `${entry.city}, ${entry.state}`,
  }));
}

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<Gender>("man");
  const [interestedIn, setInterestedIn] = useState<"women" | "men" | "everyone">(
    "women"
  );
  const [city, setCity] = useState("Dhanbad");
  const [cityState, setCityState] = useState("Jharkhand");
  const [error, setError] = useState<string | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cities = useMemo(cityOptions, []);

  function goBack() {
    if (step === 0) {
      navigation.goBack();
    } else {
      setError(null);
      setStep((current) => Math.max(0, current - 1));
    }
  }

  function next() {
    if (step === 0) {
      if (name.trim().length < 2) {
        setError("Tell us your first name so people know who they're talking to.");
        return;
      }
      setError(null);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!isValidAge(day, month, year)) {
        setError("Enter a valid birth date. PagalPagal is only for adults 18+.");
        return;
      }
      setError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      setError(null);
      setStep(3);
      return;
    }
    setSaving(true);
    void signUp({
      name: name.trim(),
      day,
      month,
      year,
      gender,
      interestedIn,
      city,
      cityState,
    }).finally(() => setSaving(false));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <BackButton onPress={goBack} />
            <Text style={styles.stepLabel}>STEP {step + 1} OF 4</Text>
          </View>
          <View style={styles.progress}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  index <= step && styles.progressBarDone,
                ]}
              />
            ))}
          </View>

          {step === 0 ? (
            <View>
              <Text style={styles.title}>Complete your profile!</Text>
              <Text style={styles.subtitle}>
                It just takes a few seconds, hurry!
              </Text>
              <Text style={styles.question}>
                What should we call you?{" "}
                <Text style={styles.sparkle}>✨</Text>
              </Text>
              <TextField
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (error) setError(null);
                }}
                placeholder="First name"
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={next}
                style={styles.nameInput}
              />
              {error ? <ErrorBanner message={error} /> : null}
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              <Text style={styles.title}>When were you born?</Text>
              <Text style={styles.subtitle}>
                We use your birthday to find people in your age group. You must
                be 18 or older.
              </Text>
              <Text style={styles.question}>Your birth date</Text>
              <View style={styles.dateRow}>
                <TextField
                  value={day}
                  onChangeText={(value) => {
                    setDay(value.replace(/\D/g, "").slice(0, 2));
                    if (error) setError(null);
                  }}
                  placeholder="DD"
                  keyboardType="number-pad"
                  maxLength={2}
                  containerStyle={styles.dateField}
                  style={styles.dateInput}
                />
                <TextField
                  value={month}
                  onChangeText={(value) => {
                    setMonth(value.replace(/\D/g, "").slice(0, 2));
                    if (error) setError(null);
                  }}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                  containerStyle={styles.dateField}
                  style={styles.dateInput}
                />
                <TextField
                  value={year}
                  onChangeText={(value) => {
                    setYear(value.replace(/\D/g, "").slice(0, 4));
                    if (error) setError(null);
                  }}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                  containerStyle={styles.yearField}
                  style={styles.dateInput}
                />
              </View>
              {isValidAge(day, month, year) ? (
                <Text style={styles.ageHint}>
                  You're {ageFromDate(Number(year), Number(month), Number(day))}{" "}
                  — perfect.
                </Text>
              ) : null}
              {error ? <ErrorBanner message={error} /> : null}
            </View>
          ) : null}

          {step === 2 ? (
            <View>
              <Text style={styles.title}>Tell us about you</Text>
              <Text style={styles.subtitle}>
                This helps us show you people who are looking for the same kind
                of connection.
              </Text>
              <Text style={styles.question}>I am a</Text>
              <View style={styles.chipRow}>
                {GENDERS.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    selected={gender === option.value}
                    onPress={() => setGender(option.value)}
                    style={styles.genderChip}
                  />
                ))}
              </View>
              <Text style={[styles.question, styles.questionSpaced]}>
                I'm interested in
              </Text>
              <View style={styles.chipRow}>
                {INTERESTS.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    label={option.label}
                    selected={interestedIn === option.value}
                    onPress={() => setInterestedIn(option.value)}
                    style={styles.genderChip}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View>
              <Text style={styles.title}>Where do you live?</Text>
              <Text style={styles.subtitle}>
                We'll show you people nearby. Your exact location is never
                shared.
              </Text>
              <Text style={styles.question}>Your city</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCityOpen(true)}
                style={({ pressed }) => [
                  styles.cityField,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MapPin size={19} color={colors.primary} strokeWidth={2.2} />
                <View style={styles.cityText}>
                  <Text style={styles.cityValue}>
                    {city}, {cityState}
                  </Text>
                  <Text style={styles.cityHint}>Tap to change your city</Text>
                </View>
                <ChevronDown size={19} color={colors.muted} strokeWidth={2.2} />
              </Pressable>

              <View style={styles.note}>
                <Sparkles size={16} color={colors.primary} strokeWidth={2} />
                <Text style={styles.noteText}>
                  Add photos and a short bio after signing up to get 3x more
                  matches.
                </Text>
              </View>
              {error ? <ErrorBanner message={error} /> : null}
            </View>
          ) : null}

          <PrimaryButton
            label={step === 3 ? "START MATCHING" : "NEXT"}
            variant="dark"
            onPress={next}
            loading={saving}
            style={styles.next}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerSheet
        visible={cityOpen}
        title="Select your city"
        subtitle="Pick the city you'd like to find matches in."
        searchPlaceholder="Search city"
        options={cities}
        selected={[`${city}|${cityState}`]}
        onClose={() => setCityOpen(false)}
        onSave={(values) => {
          const value = values[0];
          if (!value) return;
          const [nextCity, nextState] = value.split("|");
          setCity(nextCity);
          setCityState(nextState);
        }}
        saveLabel="Save city"
      />
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  stepLabel: {
    fontSize: 9.5,
    letterSpacing: 1,
    color: colors.faint,
    fontWeight: "800",
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.xxxl,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lineSoft,
  },
  progressBarDone: {
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing.sm,
    maxWidth: 330,
    fontWeight: "500",
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
  },
  questionSpaced: {
    marginTop: spacing.xxl,
  },
  sparkle: {
    fontSize: 15,
  },
  nameInput: {
    fontSize: 17,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  yearField: {
    flex: 1.5,
  },
  dateInput: {
    textAlign: "center",
    fontSize: 17,
  },
  ageHint: {
    fontSize: 12.5,
    color: colors.successDark,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  genderChip: {
    flex: 1,
  },
  cityField: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 64,
  },
  cityText: {
    flex: 1,
  },
  cityValue: {
    fontSize: 15.5,
    color: colors.ink,
    fontWeight: "600",
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
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.body,
  },
  next: {
    marginTop: spacing.xxxl,
    minHeight: 56,
  },
});
