import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronRight, MapPin } from "lucide-react-native";

import { AgeRangeSlider } from "../../components/AgeRangeSlider";
import { PrimaryButton } from "../../components/Buttons";
import { CheckRow } from "../../components/Chips";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";
import type { MatchPreferences } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "MatchPreferences">;

const RADII = [25, 50, 100, 250];

export function MatchPreferencesScreen({ navigation }: Props) {
  const { preferences, setPreferences } = useDating();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<MatchPreferences>(preferences);

  useEffect(() => {
    setDraft((current) =>
      current.city === preferences.city
        ? current
        : { ...current, city: preferences.city }
    );
  }, [preferences.city]);

  function patch(next: Partial<MatchPreferences>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function save() {
    setPreferences(draft);
    showToast("Match preferences saved.", "success");
    navigation.goBack();
  }

  function reset() {
    setDraft({
      minAge: 18,
      maxAge: 30,
      city: "Dhanbad",
      showPhotosOnly: false,
      showOtherCities: true,
      radiusKm: 100,
    });
    showToast("Preferences reset to defaults.", "info");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Match preferences"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            onPress={reset}
            style={({ pressed }) => [
              styles.resetButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.ageHeader}>
            <Text style={styles.cardTitle}>Age range</Text>
            <Text style={styles.ageValue}>
              {draft.minAge} to {draft.maxAge}
            </Text>
          </View>
          <AgeRangeSlider
            min={draft.minAge}
            max={draft.maxAge}
            onChange={(min, max) => patch({ minAge: min, maxAge: max })}
          />
          <View style={styles.ageLabels}>
            <Text style={styles.ageHint}>18</Text>
            <Text style={styles.ageHint}>60</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate("SearchCity", { target: "preferences" })
          }
          style={({ pressed }) => [
            styles.card,
            styles.cityCard,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <View style={styles.cityIcon}>
            <MapPin size={20} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cityText}>
            <Text style={styles.cardTitle}>City</Text>
            <Text style={styles.cityValue}>{draft.city}</Text>
            <Text style={styles.cityHint}>
              Matches will show within {draft.radiusKm} km radius
            </Text>
          </View>
          <ChevronRight size={20} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <View style={styles.radiusCard}>
          <Text style={styles.cardTitle}>Match radius</Text>
          <Text style={styles.radiusHint}>
            How far are you happy to travel for a good coffee?
          </Text>
          <View style={styles.radiusRow}>
            {RADII.map((radius) => {
              const active = draft.radiusKm === radius;
              return (
                <Pressable
                  key={radius}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => patch({ radiusKm: radius })}
                  style={({ pressed }) => [
                    styles.radiusChip,
                    active && styles.radiusChipActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      active && styles.radiusChipTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <CheckRow
            label="Show profiles with photos only"
            checked={draft.showPhotosOnly}
            onChange={() => patch({ showPhotosOnly: !draft.showPhotosOnly })}
          />
          <View style={styles.rowDivider} />
          <CheckRow
            label="When matches from my preferences are over, show matches from other cities"
            checked={draft.showOtherCities}
            onChange={() => patch({ showOtherCities: !draft.showOtherCities })}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            You'll only see people aged 18 and above. Preferences change what
            appears in your deck, not who can see your profile.
          </Text>
        </View>

        <PrimaryButton label="SAVE" onPress={save} style={styles.save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  resetText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  ageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  ageValue: {
    fontSize: 14.5,
    fontWeight: "600",
    color: colors.ink,
  },
  ageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -spacing.xs,
  },
  ageHint: {
    fontSize: 10,
    color: colors.faint,
    fontWeight: "500",
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  cityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cityText: {
    flex: 1,
  },
  cityValue: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "600",
    marginTop: 3,
  },
  cityHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
  radiusCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  radiusHint: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 3,
  },
  radiusRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  radiusChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radiusChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.body,
  },
  radiusChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.lineSoft,
  },
  note: {
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.faint,
    textAlign: "center",
  },
  save: {
    marginTop: spacing.sm,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
});
