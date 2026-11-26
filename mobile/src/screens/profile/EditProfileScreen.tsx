import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Plus,
  Smartphone,
} from "lucide-react-native";

import { Checkbox } from "../../components/Chips";
import { PickerSheet } from "../../components/PickerSheet";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  DRINKING_OPTIONS,
  EATING_OPTIONS,
  EDUCATION_OPTIONS,
  LOOKING_FOR_OPTIONS,
  PROFESSION_OPTIONS,
  RELATIONSHIP_OPTIONS,
  SMOKING_OPTIONS,
} from "../../constants/catalog";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";
import type { HiddenFields, MyProfile } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "EditProfile">;

const OPTION_SETS = {
  relationshipStatus: RELATIONSHIP_OPTIONS,
  lookingFor: LOOKING_FOR_OPTIONS,
  education: EDUCATION_OPTIONS,
  profession: PROFESSION_OPTIONS,
  drinking: DRINKING_OPTIONS,
  smoking: SMOKING_OPTIONS,
  eating: EATING_OPTIONS,
} as const;

type PickerField = keyof typeof OPTION_SETS;

const PICKER_TITLES: Record<PickerField, string> = {
  relationshipStatus: "Relationship status",
  lookingFor: "I'm looking for",
  education: "Education",
  profession: "Profession",
  drinking: "Drinking",
  smoking: "Smoking",
  eating: "Eating",
};

const HIDDEN_ROWS: { key: keyof HiddenFields; label: string }[] = [
  { key: "relationship", label: "Relationship" },
  { key: "age", label: "Age" },
  { key: "city", label: "City" },
  { key: "profession", label: "Profession" },
  { key: "education", label: "Education" },
];

export function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const [pickerField, setPickerField] = useState<PickerField | null>(null);

  const pickerOptions = useMemo(
    () =>
      pickerField
        ? OPTION_SETS[pickerField].map((option) => ({
            value: option,
            label: option,
          }))
        : [],
    [pickerField]
  );

  function toggleHidden(key: keyof HiddenFields) {
    const hidden = { ...profile.hidden, [key]: !profile.hidden[key] };
    updateUser({ hidden });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Edit Profile"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("MyProfile")}
            style={({ pressed }) => [
              styles.previewButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.previewText}>Preview</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.photoGrid}>
          {Array.from({ length: 6 }).map((_, index) => {
            const photo = profile.photos[index];
            if (photo) {
              return (
                <Pressable
                  key={`photo-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit photo ${index + 1}`}
                  onPress={() => navigation.navigate("Photos")}
                  style={({ pressed }) => [
                    styles.photoCell,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Image source={photo} style={styles.photo} />
                  {index === 0 ? (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>MAIN</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            }
            return (
              <Pressable
                key={`empty-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Add photo ${index + 1}`}
                onPress={() => navigation.navigate("Photos")}
                style={({ pressed }) => [
                  styles.photoCell,
                  styles.emptyCell,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Plus size={28} color={colors.disabled} strokeWidth={1.7} />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.photoHint}>
          Add up to 6 photos. Profiles with 3+ photos get 3x more matches.
        </Text>

        <EditCard
          label="Basic info"
          value={`${profile.name}, ${profile.age}, ${profile.city}`}
          onPress={() => navigation.navigate("BasicInfo")}
        />

        <View style={styles.verificationCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Verification")}
            style={({ pressed }) => [
              styles.verificationHeader,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={styles.cardLabel}>Verification</Text>
            <ChevronRight size={19} color={colors.ink} strokeWidth={2} />
          </Pressable>
          <VerificationRow
            icon={<Camera size={16} color={colors.white} strokeWidth={2.2} />}
            tone={profile.verified ? colors.success : colors.faint}
            label="Photo"
            value={profile.verified ? "Verified" : "Not Verified"}
          />
          <VerificationRow
            icon={<Smartphone size={16} color={colors.white} strokeWidth={2.2} />}
            tone={profile.phoneVerified ? colors.success : colors.faint}
            label="Mobile Number"
            value={profile.phone}
          />
          <VerificationRow
            icon={<Text style={styles.facebookIcon}>f</Text>}
            tone={profile.facebookVerified ? "#1877F2" : colors.faint}
            label="Facebook"
            value={profile.facebookVerified ? "Verified" : "Not Verified"}
            last
          />
        </View>

        <EditCard
          label="Relationship status"
          value={profile.relationshipStatus}
          onPress={() => setPickerField("relationshipStatus")}
        />
        <EditCard
          label="I'm looking for"
          value={profile.lookingFor}
          onPress={() => setPickerField("lookingFor")}
        />
        <EditCard
          label="Interests"
          value={
            profile.interests.length ? profile.interests.join(", ") : "Not Specified"
          }
          onPress={() =>
            navigation.navigate("PreferenceSelect", { field: "interests" })
          }
        />
        <EditCard
          label="About me"
          value={
            profile.about.length > 90
              ? `${profile.about.slice(0, 90).trim()}...`
              : profile.about || "Not Specified"
          }
          onPress={() => navigation.navigate("AboutMe")}
        />
        <EditCard
          label="Education"
          value={profile.education || "Not Specified"}
          onPress={() => setPickerField("education")}
        />
        <EditCard
          label="Profession"
          value={profile.profession || "Not Specified"}
          onPress={() => setPickerField("profession")}
        />
        <EditCard
          label="Drinking"
          value={profile.drinking || "Not Specified"}
          onPress={() => setPickerField("drinking")}
        />
        <EditCard
          label="Smoking"
          value={profile.smoking || "Not Specified"}
          onPress={() => setPickerField("smoking")}
        />
        <EditCard
          label="Eating"
          value={profile.eating || "Not Specified"}
          onPress={() => setPickerField("eating")}
        />
        <EditCard
          label="Zodiac sign"
          value={profile.zodiac || "Not Specified"}
          onPress={() =>
            navigation.navigate("PreferenceSelect", { field: "zodiac" })
          }
        />
        <EditCard
          label="Languages I know"
          value={
            profile.languages.length
              ? profile.languages.join(", ")
              : "Not Specified"
          }
          onPress={() =>
            navigation.navigate("PreferenceSelect", { field: "languages" })
          }
        />

        <View style={styles.hideCard}>
          <Text style={styles.cardLabel}>Hide these on my profile</Text>
          {HIDDEN_ROWS.map((row) => (
            <Pressable
              key={row.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: profile.hidden[row.key] }}
              onPress={() => toggleHidden(row.key)}
              style={({ pressed }) => [
                styles.hiddenRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Checkbox
                checked={profile.hidden[row.key]}
                onChange={() => toggleHidden(row.key)}
              />
              <Text style={styles.hiddenLabel}>{row.label}</Text>
            </Pressable>
          ))}
          <View style={styles.hideNote}>
            <BadgeCheck size={15} color={colors.secondary} strokeWidth={2} />
            <Text style={styles.hideNoteText}>
              Hidden details stay saved but won't appear on your public profile.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            showToast("Profile updated. Looking good!", "success");
            navigation.goBack();
          }}
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.saveText}>SAVE CHANGES</Text>
        </Pressable>
      </ScrollView>

      <PickerSheet
        visible={Boolean(pickerField)}
        title={pickerField ? PICKER_TITLES[pickerField] : ""}
        subtitle="Choose the option that fits you best."
        options={pickerOptions}
        selected={
          pickerField ? [String(profile[pickerField as keyof MyProfile])] : []
        }
        onClose={() => setPickerField(null)}
        onSave={(values) => {
          if (!pickerField || !values[0]) return;
          updateUser({ [pickerField]: values[0] } as Partial<MyProfile>);
          showToast("Profile updated.", "success");
        }}
        searchPlaceholder="Search options"
        showSearch={pickerOptions.length > 12}
      />
    </SafeAreaView>
  );
}

function EditCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.editCard,
        { opacity: pressed ? 0.68 : 1 },
      ]}
    >
      <View style={styles.editText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <ChevronRight size={19} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}

function VerificationRow({
  icon,
  tone,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.verificationRow, !last && styles.verificationBorder]}>
      <View style={[styles.verificationIcon, { backgroundColor: tone }]}>
        {icon}
      </View>
      <View style={styles.verificationText}>
        <Text style={styles.verificationLabel}>{label}</Text>
        <Text style={styles.verificationValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  previewButton: {
    backgroundColor: colors.secondary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photoCell: {
    width: "31.4%",
    aspectRatio: 0.78,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.lineSoft,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  emptyCell: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(17,13,27,0.68)",
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mainBadgeText: {
    color: colors.white,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  photoHint: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  editCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 76,
    backgroundColor: colors.surface,
  },
  editText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    marginTop: 3,
    fontWeight: "500",
  },
  verificationCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  verificationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  verificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationText: {
    flex: 1,
  },
  verificationLabel: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "500",
  },
  verificationValue: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "500",
    marginTop: 1,
  },
  facebookIcon: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
    marginTop: -2,
  },
  hideCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: spacing.sm,
  },
  hiddenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  hiddenLabel: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "500",
  },
  hideNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  hideNoteText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.secondaryDark,
    fontWeight: "500",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  saveText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
});
