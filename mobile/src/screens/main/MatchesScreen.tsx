import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react-native";

import {
  AbusiveOptionsSheet,
  ConfirmDialog,
  ReportUserSheet,
} from "../../components/Dialogs";
import { Avatar, TrustBadge } from "../../components/Avatar";
import { BrandWordmark } from "../../components/Brand";
import { PrimaryButton } from "../../components/Buttons";
import { EmptyState } from "../../components/EmptyState";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";
import type { ReportReason } from "../../types";

export function MatchesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();
  const {
    deckIds,
    preferences,
    likeProfile,
    skipProfile,
    restartDeck,
    ensureChat,
    blockProfile,
    getChat,
    getProfile,
  } = useDating();
  const { showToast } = useToast();
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const [abusiveOpen, setAbusiveOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const filteredIds = useMemo(
    () =>
      deckIds.filter((id) => {
        const item = getProfile(id);
        if (!item) return false;
        return item.age >= preferences.minAge && item.age <= preferences.maxAge;
      }),
    [deckIds, preferences.minAge, preferences.maxAge, getProfile]
  );

  const profile = getProfile(filteredIds[0] ?? "");
  const photoHeight = Math.round(Math.min(386, Math.max(270, height * 0.37)));

  useEffect(() => {
    opacity.setValue(0.15);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [profile?.id, opacity, translateY]);

  function openChat() {
    if (!profile) return;
    ensureChat(profile.id);
    navigation.navigate("Chat", { profileId: profile.id });
  }

  async function forwardProfile() {
    if (!profile) return;
    try {
      await Share.share({
        message: `Check out ${profile.name}'s profile on PagalPagal. ${profile.age}, ${profile.city}. Match. Chat. Like. Date. Repeat.`,
      });
    } catch {
      showToast("Sharing isn't available on this device.", "info");
    }
  }

  function submitReport(reason: ReportReason) {
    if (!profile) return;
    showToast(`Report sent: ${reason}. Our team will review it.`, "success");
    skipProfile(profile.id);
  }

  const mobile = useMemo(() => {
    if (!profile) return "";
    let seed = 0;
    for (const char of profile.id) seed += char.charCodeAt(0);
    const start = 6 + (seed % 4);
    const digits = String((seed * 97) % 10000).padStart(4, "0");
    return `${start}${digits}XXXXXX`;
  }, [profile]);

  const hasChat = profile ? Boolean(getChat(profile.id)) : false;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <BrandWordmark size={24} />
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Match filters"
            onPress={() => navigation.navigate("MatchPreferences")}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <SlidersHorizontal size={22} color={colors.ink} strokeWidth={2} />
          </Pressable>
          <Avatar
            source={user?.photo}
            size={34}
            online
            onPress={() => navigation.navigate("MyProfile")}
            initials="PP"
          />
        </View>
      </View>

      <View style={styles.body}>
        {profile ? (
          <>
            <Animated.View
              style={[
                styles.deck,
                { opacity, transform: [{ translateY }] },
              ]}
            >
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.cardShadow}>
                  <View style={styles.card}>
                    <View style={[styles.photoWrap, { height: photoHeight }]}>
                      <Image
                        source={profile.photo}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                      <View style={styles.photoTop}>
                        <View style={styles.onlinePill}>
                          <View style={styles.onlineDot} />
                          <Text style={styles.onlineText}>
                            {profile.online ? "Online now" : profile.lastActive}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <PrimaryButton
                        label={hasChat ? "SEND MESSAGE" : "SAY HI"}
                        variant="secondary"
                        onPress={openChat}
                        icon={<Send size={17} color={colors.white} strokeWidth={2.2} />}
                        iconRight={
                          <ArrowRight
                            size={18}
                            color={colors.white}
                            strokeWidth={2.4}
                          />
                        }
                        style={styles.messageButton}
                      />

                      <View style={styles.nameRow}>
                        <Text style={styles.name}>
                          {profile.name}, {profile.age}, {profile.city}
                        </Text>
                        {profile.verified ? (
                          <TrustBadge kind="verified" size={19} />
                        ) : null}
                        {profile.phoneVerified ? (
                          <TrustBadge kind="phone" size={19} />
                        ) : null}
                      </View>
                      <Text style={styles.subline}>{profile.relationshipStatus}</Text>
                      <Text style={styles.subline}>
                        Looking for {profile.lookingFor.toLowerCase()}
                      </Text>

                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Verification</Text>
                        <View style={styles.verifyRow}>
                          <TrustBadge kind="phone" size={24} />
                          <Text style={styles.verifyText}>Mobile {mobile}</Text>
                          <Pressable
                            onPress={() =>
                              showToast(
                                "Access request sent. They can choose to share.",
                                "success"
                              )
                            }
                          >
                            <Text style={styles.requestLink}>Request Access</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Relationship status</Text>
                        <Text style={styles.detailValue}>
                          {profile.relationshipStatus}
                        </Text>
                      </View>

                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>I'm looking for</Text>
                        <Text style={styles.detailValue}>
                          {profile.lookingFor}
                        </Text>
                      </View>

                      <View style={styles.mutualRow}>
                        <Heart
                          size={15}
                          color={colors.accent}
                          strokeWidth={2.2}
                        />
                        <Text style={styles.mutualText}>
                          You both like{" "}
                          {profile.mutualInterests.slice(0, 2).join(" and ")}
                        </Text>
                      </View>

                      <View style={styles.footerLinks}>
                        <Pressable onPress={forwardProfile}>
                          <Text style={styles.footerLink}>Forward to a Friend</Text>
                        </Pressable>
                        <View style={styles.footerDivider} />
                        <Pressable onPress={() => setAbusiveOpen(true)}>
                          <Text style={styles.footerLink}>Block or report user</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            <View style={styles.actionBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip profile"
                onPress={() => skipProfile(profile.id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.skipButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <X size={20} color={colors.muted} strokeWidth={2.4} />
                <Text style={styles.skipText}>SKIP</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Like profile"
                onPress={() => {
                  likeProfile(profile.id);
                  showToast(`You liked ${profile.name}.`, "success");
                }}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.likeButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <CheckCircle2
                  size={20}
                  color={colors.secondary}
                  strokeWidth={2.4}
                />
                <Text style={styles.likeText}>LIKE</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              mood="sad"
              icon={<Heart size={21} color={colors.accent} strokeWidth={2.2} />}
              title="You're all caught up"
              message="There are no more profiles in this age range. Widen your preferences or reset the deck to see people again."
              action={
                <>
                  <PrimaryButton
                    label="UPDATE PREFERENCES"
                    variant="outline"
                    onPress={() => navigation.navigate("MatchPreferences")}
                    style={styles.emptyButton}
                  />
                  <PrimaryButton
                    label="START OVER"
                    variant="primary"
                    onPress={restartDeck}
                    style={styles.emptyButton}
                  />
                </>
              }
            />
          </View>
        )}
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
        title={`Block ${profile?.name ?? "this user"}?`}
        message="You won't see them again and any existing chat will be removed. This can't be undone from here."
        confirmLabel="Block"
        destructive
        onClose={() => setBlockOpen(false)}
        onConfirm={() => {
          if (profile) {
            blockProfile(profile.id);
            showToast("Profile blocked.", "success");
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  body: {
    flex: 1,
    backgroundColor: colors.lavender,
  },
  deck: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.md,
    paddingBottom: 98,
  },
  cardShadow: {
    ...shadow.card,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  photoWrap: {
    width: "100%",
    backgroundColor: colors.lavenderDeep,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoTop: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  onlinePill: {
    backgroundColor: "rgba(19,16,29,0.62)",
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  cardBody: {
    padding: spacing.lg,
  },
  messageButton: {
    minHeight: 50,
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 19,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  subline: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  detailSection: {
    marginTop: spacing.xl,
  },
  detailLabel: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    fontWeight: "500",
  },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  verifyText: {
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: "500",
  },
  requestLink: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "700",
  },
  mutualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginTop: spacing.xl,
  },
  mutualText: {
    fontSize: 12,
    color: colors.accentDark,
    fontWeight: "600",
    flex: 1,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  footerLink: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
  },
  footerDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.line,
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    ...shadow.card,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  skipButton: {
    borderColor: colors.line,
  },
  likeButton: {
    borderColor: colors.secondary,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.muted,
  },
  likeText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.secondary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    alignSelf: "stretch",
    minWidth: 260,
  },
});
