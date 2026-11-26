import React, { useMemo } from "react";
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
  Crown,
  Eye,
  FileText,
  Heart,
  Images,
  Languages,
  LogIn,
  Settings,
  Sparkles,
  Star,
} from "lucide-react-native";

import { TrustBadge } from "../../components/Avatar";
import { MatchmakerCard, UpgradeBanner } from "../../components/UpgradeBanner";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SectionLabel } from "../../components/Section";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "MyProfile">;

export function MyProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { visitorProfiles } = useDating();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;

  const completion = useMemo(() => {
    const checks = [
      profile.photos.length > 1,
      profile.about.trim().length >= 50,
      profile.interests.length >= 3,
      profile.languages.length >= 2,
      Boolean(profile.zodiac),
      profile.verified,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="My Profile"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => navigation.navigate("Settings")}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Settings size={23} color={colors.ink} strokeWidth={2} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={() => navigation.navigate("Photos")}
            style={({ pressed }) => [
              styles.avatarWrap,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Image source={profile.photo} style={styles.avatar} />
            <View style={styles.editBadge}>
              <Camera size={16} color={colors.ink} strokeWidth={2.2} />
            </View>
          </Pressable>

          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            {profile.verified ? <TrustBadge kind="verified" size={19} /> : null}
            {profile.phoneVerified ? (
              <TrustBadge kind="phone" size={19} />
            ) : null}
            {profile.facebookVerified ? (
              <TrustBadge kind="facebook" size={19} />
            ) : null}
          </View>
          <Text style={styles.meta}>
            {profile.city}, {profile.state}
          </Text>
          <View style={styles.pillRow}>
            {profile.isPlus ? (
              <View style={[styles.pill, styles.plusPill]}>
                <Crown size={12} color={colors.primaryDark} strokeWidth={2.4} />
                <Text style={[styles.pillText, styles.plusPillText]}>
                  PLUS MEMBER
                </Text>
              </View>
            ) : null}
            <View style={styles.pill}>
              <Sparkles size={12} color={colors.violet} strokeWidth={2.2} />
              <Text style={styles.pillText}>
                {profile.relationshipStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.completionCard}>
            <View style={styles.completionTop}>
              <View style={styles.completionText}>
                <Text style={styles.completionTitle}>Profile strength</Text>
                <Text style={styles.completionHint}>
                  {completion >= 80
                    ? "Your profile is looking great."
                    : "Add a few more details to get noticed."}
                </Text>
              </View>
              <Text style={styles.completionValue}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>
        </View>

        {!profile.isPlus ? (
          <UpgradeBanner
            onPress={() => navigation.navigate("Premium", { source: "profile" })}
            style={styles.upgrade}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Premium", { source: "profile" })}
            style={({ pressed }) => [
              styles.plusCard,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={styles.plusIcon}>
              <Crown size={25} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.plusText}>
              <Text style={styles.plusTitle}>PagalPagal Plus is active</Text>
              <Text style={styles.plusSub}>
                Unlimited likes, visitor insights and more.
              </Text>
            </View>
            <ChevronRight size={20} color={colors.primaryDark} />
          </Pressable>
        )}

        <MatchmakerCard
          onPress={() =>
            navigation.navigate("Premium", { source: "matchmaker" })
          }
        />

        <SectionLabel style={styles.sectionLabel}>
          Improve your profile
        </SectionLabel>

        <View style={styles.taskList}>
          <TaskCard
            icon={<LogIn size={20} color={colors.violet} strokeWidth={2} />}
            title="Login Frequently"
            detail="Get instant visitors by logging in frequently"
            onPress={() =>
              showToast("You're already logged in and visible. Nice!", "success")
            }
          />
          <TaskCard
            icon={<Images size={20} color={colors.secondary} strokeWidth={2} />}
            title="Photos"
            detail="Add more photos to get more attention"
            value={`${profile.photos.length}/6`}
            onPress={() => navigation.navigate("Photos")}
          />
          <TaskCard
            icon={<FileText size={20} color={colors.success} strokeWidth={2} />}
            title="About Me"
            detail="Users want to know about you"
            onPress={() => navigation.navigate("AboutMe")}
          />
          <TaskCard
            icon={<BadgeCheck size={20} color={colors.secondary} strokeWidth={2} />}
            title="Verifications"
            detail="Get a blue tick badge by verifying photo"
            onPress={() => navigation.navigate("Verification")}
          />
          <TaskCard
            icon={<Crown size={20} color={colors.primary} strokeWidth={2} />}
            title={profile.isPlus ? "Manage Plus" : "Upgrade"}
            detail="Send messages, likes, chat and more"
            onPress={() => navigation.navigate("Premium", { source: "profile" })}
          />
          <TaskCard
            icon={<Eye size={20} color={colors.accent} strokeWidth={2} />}
            title="Visitors"
            detail={`Engage with your ${visitorProfiles.length} new visitors`}
            onPress={() => navigation.navigate("ProfileList", { mode: "visitors" })}
          />
          <TaskCard
            icon={<Star size={20} color={colors.warning} strokeWidth={2} />}
            title="Zodiac sign"
            detail={profile.zodiac || "Mention your zodiac sign"}
            onPress={() =>
              navigation.navigate("PreferenceSelect", { field: "zodiac" })
            }
          />
          <TaskCard
            icon={<Languages size={20} color={colors.secondary} strokeWidth={2} />}
            title="Languages"
            detail={
              profile.languages.length
                ? profile.languages.join(", ")
                : "Mention languages you know"
            }
            onPress={() =>
              navigation.navigate("PreferenceSelect", { field: "languages" })
            }
          />
          <TaskCard
            icon={<Heart size={20} color={colors.accent} strokeWidth={2} />}
            title="Interests"
            detail={
              profile.interests.length
                ? profile.interests.join(", ")
                : "Add interests to find common ground"
            }
            onPress={() =>
              navigation.navigate("PreferenceSelect", { field: "interests" })
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Settings")}
          style={({ pressed }) => [
            styles.settingsRow,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.settingsIcon}>
            <Settings size={20} color={colors.body} strokeWidth={2} />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Account & settings</Text>
            <Text style={styles.settingsHint}>
              Privacy, distance, orders and support
            </Text>
          </View>
          <ChevronRight size={19} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <Text style={styles.footer}>
          Your profile is your first hello. Make it count.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskCard({
  icon,
  title,
  detail,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.task,
        { opacity: pressed ? 0.68 : 1 },
      ]}
    >
      <View style={styles.taskIcon}>{icon}</View>
      <View style={styles.taskText}>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      {value ? <Text style={styles.taskValue}>{value}</Text> : null}
      <ChevronRight size={19} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: colors.primarySoft,
  },
  editBadge: {
    position: "absolute",
    right: 2,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  name: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 13.5,
    color: colors.body,
    marginTop: 3,
    fontWeight: "500",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.violetSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.violet,
  },
  plusPill: {
    backgroundColor: colors.primarySoft,
  },
  plusPillText: {
    color: colors.primaryDark,
  },
  completionCard: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
    backgroundColor: colors.lavender,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  completionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  completionText: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  completionHint: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 2,
  },
  completionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.violet,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  upgrade: {
    marginTop: spacing.xl,
  },
  plusCard: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFDCCB",
    padding: spacing.lg,
  },
  plusIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: {
    flex: 1,
  },
  plusTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.ink,
  },
  plusSub: {
    fontSize: 11.5,
    color: colors.body,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionLabel: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  taskList: {
    gap: spacing.md,
  },
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.surface,
  },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: colors.ink,
  },
  taskDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 2,
  },
  taskValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  settingsRow: {
    marginTop: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.ink,
  },
  settingsHint: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xxl,
    fontWeight: "500",
  },
});
