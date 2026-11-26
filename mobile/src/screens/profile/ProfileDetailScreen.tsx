import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Cigarette,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Utensils,
  Wine,
} from "lucide-react-native";

import { TrustBadge } from "../../components/Avatar";
import {
  AbusiveOptionsSheet,
  ConfirmDialog,
  ReportUserSheet,
} from "../../components/Dialogs";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import { profileById } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";
import type { ReportReason } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "ProfileDetail">;

export function ProfileDetailScreen({ navigation, route }: Props) {
  const { profileId } = route.params;
  const profile = profileById(profileId);
  const { height } = useWindowDimensions();
  const {
    likedIds,
    likeProfile,
    blockProfile,
    ensureChat,
    getChat,
  } = useDating();
  const { showToast } = useToast();
  const [abusiveOpen, setAbusiveOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.missingHeader}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ArrowLeft size={23} color={colors.ink} />
          </Pressable>
          <Text style={styles.missing}>Profile unavailable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = profile;
  const liked = likedIds.includes(currentProfile.id);
  const hasChat = Boolean(getChat(currentProfile.id));
  const heroHeight = Math.round(Math.min(470, Math.max(340, height * 0.47)));

  const mobile = (() => {
    let seed = 0;
    for (const char of profile.id) seed += char.charCodeAt(0);
    const start = 6 + (seed % 4);
    const digits = String((seed * 97) % 10000).padStart(4, "0");
    return `${start}${digits}XXXXXX`;
  })();

  function openChat() {
    ensureChat(currentProfile.id);
    navigation.navigate("Chat", { profileId: currentProfile.id });
  }

  async function shareProfile() {
    try {
      await Share.share({
        message: `Check out ${currentProfile.name}'s profile on PagalPagal. ${currentProfile.age}, ${currentProfile.city}. Match. Chat. Like. Date. Repeat.`,
      });
    } catch {
      showToast("Sharing isn't available on this device.", "info");
    }
  }

  function submitReport(reason: ReportReason) {
    showToast(`Report sent: ${reason}. Our team will review it.`, "success");
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image source={profile.photo} style={styles.heroPhoto} resizeMode="cover" />
          <View style={styles.heroShade} />
          <View style={styles.heroTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.heroButton}
            >
              <ArrowLeft size={21} color={colors.white} strokeWidth={2.3} />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share profile"
                onPress={shareProfile}
                style={styles.heroButton}
              >
                <Share2 size={19} color={colors.white} strokeWidth={2.2} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profile options"
                onPress={() => setAbusiveOpen(true)}
                style={styles.heroButton}
              >
                <MoreVertical size={20} color={colors.white} strokeWidth={2.3} />
              </Pressable>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {profile.online ? "Online now" : profile.lastActive}
              </Text>
            </View>
            <View style={styles.distancePill}>
              <MapPin size={11} color={colors.white} strokeWidth={2.2} />
              <Text style={styles.distanceText}>
                {profile.distanceKm} km away
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            {profile.verified ? <TrustBadge kind="verified" size={20} /> : null}
            {profile.phoneVerified ? (
              <TrustBadge kind="phone" size={20} />
            ) : null}
            {profile.facebookVerified ? (
              <TrustBadge kind="facebook" size={20} />
            ) : null}
          </View>
          <Text style={styles.location}>
            {profile.city}, {profile.state}
          </Text>

          <View style={styles.quickFacts}>
            <View style={styles.quickFact}>
              <Text style={styles.quickLabel}>Relationship</Text>
              <Text style={styles.quickValue}>{profile.relationshipStatus}</Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickFact}>
              <Text style={styles.quickLabel}>Looking for</Text>
              <Text style={styles.quickValue}>{profile.lookingFor}</Text>
            </View>
          </View>

          <Section title="About">
            <Text style={styles.about}>{profile.about}</Text>
          </Section>

          {profile.mutualInterests.length ? (
            <View style={styles.mutual}>
              <Heart
                size={17}
                color={colors.accent}
                fill={colors.accentSoft}
                strokeWidth={2.1}
              />
              <Text style={styles.mutualText}>
                You both like {profile.mutualInterests.join(" and ")}
              </Text>
            </View>
          ) : null}

          <Section title="Verification">
            <View style={styles.verifyRow}>
              <View style={styles.verifyIcon}>
                <Smartphone size={17} color={colors.white} strokeWidth={2.2} />
              </View>
              <View style={styles.verifyText}>
                <Text style={styles.verifyLabel}>Mobile number</Text>
                <Text style={styles.verifyValue}>{mobile}</Text>
              </View>
              <Pressable
                onPress={() =>
                  showToast(
                    "Access request sent. They can choose to share.",
                    "success"
                  )
                }
                hitSlop={6}
              >
                <Text style={styles.requestLink}>Request Access</Text>
              </Pressable>
            </View>
            {profile.facebookVerified ? (
              <View style={[styles.verifyRow, styles.verifyRowTight]}>
                <TrustBadge kind="facebook" size={30} />
                <Text style={styles.verifyConnected}>Facebook connected</Text>
              </View>
            ) : null}
          </Section>

          <Section title="A little more about them">
            <View style={styles.detailsGrid}>
              <Detail
                icon={<Briefcase size={17} color={colors.secondary} strokeWidth={2} />}
                label="Profession"
                value={profile.profession}
              />
              <Detail
                icon={
                  <GraduationCap size={17} color={colors.violet} strokeWidth={2} />
                }
                label="Education"
                value={profile.education}
              />
              <Detail
                icon={<Wine size={17} color={colors.accent} strokeWidth={2} />}
                label="Drinking"
                value={profile.drinking}
              />
              <Detail
                icon={<Cigarette size={17} color={colors.muted} strokeWidth={2} />}
                label="Smoking"
                value={profile.smoking}
              />
              <Detail
                icon={<Utensils size={17} color={colors.success} strokeWidth={2} />}
                label="Eating"
                value={profile.eating}
              />
              <Detail
                icon={<Star size={17} color={colors.warning} strokeWidth={2} />}
                label="Zodiac"
                value={profile.zodiac}
              />
            </View>
          </Section>

          <Section title="Interests">
            <View style={styles.chipWrap}>
              {profile.interests.map((interest) => {
                const shared = profile.mutualInterests.includes(interest);
                return (
                  <View
                    key={interest}
                    style={[styles.chip, shared && styles.chipShared]}
                  >
                    {shared ? (
                      <Sparkles
                        size={12}
                        color={colors.primaryDark}
                        strokeWidth={2.2}
                      />
                    ) : null}
                    <Text
                      style={[styles.chipText, shared && styles.chipTextShared]}
                    >
                      {interest}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="Languages">
            <View style={styles.chipWrap}>
              {profile.languages.map((language) => (
                <View key={language} style={[styles.chip, styles.languageChip]}>
                  <Text style={styles.languageText}>{language}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Safety">
            <View style={styles.safetyCard}>
              <ShieldCheck
                size={20}
                color={colors.successDark}
                strokeWidth={2.1}
              />
              <Text style={styles.safetyText}>
                Always meet in a public place, tell a friend where you're going,
                and never share financial details. Your safety comes first.
              </Text>
            </View>
          </Section>

          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => navigation.navigate("Legal", { kind: "safety" })}
            >
              <Text style={styles.footerLink}>Safety tips</Text>
            </Pressable>
            <View style={styles.footerDivider} />
            <Pressable onPress={() => setReportOpen(true)}>
              <Text style={styles.footerLink}>Report user</Text>
            </Pressable>
            <View style={styles.footerDivider} />
            <Pressable onPress={() => setBlockOpen(true)}>
              <Text style={styles.footerLink}>Block user</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? "Already liked" : "Like profile"}
          onPress={() => {
            if (liked) {
              showToast("You already liked this profile.", "info");
              return;
            }
            likeProfile(profile.id);
            showToast(`You liked ${profile.name}.`, "success");
          }}
          style={({ pressed }) => [
            styles.likeButton,
            liked && styles.likeButtonActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Heart
            size={23}
            color={liked ? colors.white : colors.accent}
            fill={liked ? colors.white : "none"}
            strokeWidth={2.2}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasChat ? "Send message" : "Say hi"}
          onPress={openChat}
          style={({ pressed }) => [
            styles.messageButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {hasChat ? (
            <Send size={18} color={colors.white} strokeWidth={2.2} />
          ) : (
            <MessageCircle
              size={19}
              color={colors.white}
              strokeWidth={2.2}
            />
          )}
          <Text style={styles.messageText}>
            {hasChat ? "SEND MESSAGE" : "SAY HI"}
          </Text>
        </Pressable>
      </View>

      <AbusiveOptionsSheet
        visible={abusiveOpen}
        onClose={() => setAbusiveOpen(false)}
        onReport={() => {
          setAbusiveOpen(false);
          setReportOpen(true);
        }}
        onBlock={() => {
          setAbusiveOpen(false);
          setBlockOpen(true);
        }}
      />
      <ReportUserSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
      />
      <ConfirmDialog
        visible={blockOpen}
        title={`Block ${profile.name}?`}
        message="You won't see them again and any existing chat will be removed."
        confirmLabel="Block"
        destructive
        icon={<Ban size={25} color={colors.danger} strokeWidth={2} />}
        onClose={() => setBlockOpen(false)}
        onConfirm={() => {
          blockProfile(profile.id);
          showToast("Profile blocked.", "success");
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
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
    paddingBottom: spacing.xxxl,
  },
  hero: {
    width: "100%",
    backgroundColor: colors.lavenderDeep,
    position: "relative",
  },
  heroPhoto: {
    width: "100%",
    height: "100%",
  },
  heroShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    backgroundColor: "rgba(17,13,27,0.16)",
  },
  heroTop: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(17,13,27,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(17,13,27,0.58)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  onlineText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: "600",
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(17,13,27,0.58)",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  distanceText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  location: {
    fontSize: 13.5,
    color: colors.body,
    marginTop: 4,
    fontWeight: "500",
  },
  quickFacts: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  quickFact: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  quickDivider: {
    width: 1,
    backgroundColor: colors.line,
    marginVertical: 3,
  },
  quickLabel: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  quickValue: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.ink,
    fontWeight: "600",
    marginTop: 3,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  },
  about: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.body,
    fontWeight: "500",
  },
  mutual: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  mutualText: {
    flex: 1,
    fontSize: 12,
    color: colors.accentDark,
    fontWeight: "600",
  },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  verifyRowTight: {
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  verifyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyText: {
    flex: 1,
  },
  verifyLabel: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  verifyValue: {
    fontSize: 13.5,
    color: colors.ink,
    fontWeight: "500",
    marginTop: 1,
  },
  verifyConnected: {
    fontSize: 12,
    color: colors.body,
    fontWeight: "500",
  },
  requestLink: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detail: {
    width: "48.8%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.canvas,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: spacing.md,
    minHeight: 64,
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink,
    fontWeight: "600",
    marginTop: 1,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  chipShared: {
    backgroundColor: colors.primarySoft,
    borderColor: "#FFD2BD",
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.body,
  },
  chipTextShared: {
    color: colors.primaryDark,
  },
  languageChip: {
    backgroundColor: colors.secondarySoft,
    borderColor: "#D7E4FD",
  },
  languageText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.secondaryDark,
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: colors.successDark,
    fontWeight: "500",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  footerLink: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "500",
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.line,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  likeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  likeButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  messageButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  messageText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  missingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  missing: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
});
