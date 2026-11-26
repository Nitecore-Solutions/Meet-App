import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Ban,
  Check,
  Eye,
  Heart,
  RotateCcw,
  Search,
  UserRoundX,
  X,
} from "lucide-react-native";

import { Avatar, TrustBadge } from "../../components/Avatar";
import { PrimaryButton } from "../../components/Buttons";
import { ConfirmDialog } from "../../components/Dialogs";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";
import type { Profile } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "ProfileList">;

const MODE_COPY = {
  liked: {
    title: "Liked Profiles",
    subtitle: "People you've sent a like to",
    emptyTitle: "No likes yet",
    emptyMessage:
      "Like profiles in your discovery deck and they'll show up here.",
  },
  skipped: {
    title: "Skipped Profiles",
    subtitle: "Profiles you passed on",
    emptyTitle: "Nothing skipped",
    emptyMessage:
      "Skipped profiles will appear here. You can always bring them back.",
  },
  blocked: {
    title: "Blocked Users",
    subtitle: "People who can't contact you",
    emptyTitle: "Your block list is empty",
    emptyMessage:
      "If someone makes you uncomfortable, you can block them from their profile.",
  },
  visitors: {
    title: "Visitors",
    subtitle: "People who viewed your profile",
    emptyTitle: "No visitors yet",
    emptyMessage:
      "A complete profile with good photos gets noticed faster. Keep building yours.",
  },
} as const;

export function ProfileListScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const {
    likedProfiles,
    skippedProfiles,
    blockedProfiles,
    visitorProfiles,
    likedIds,
    likeProfile,
    resetSkipped,
    resetAllSkipped,
    unblockProfile,
  } = useDating();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const copy = MODE_COPY[mode];

  const data = useMemo(() => {
    const source: Profile[] =
      mode === "liked"
        ? likedProfiles
        : mode === "skipped"
          ? skippedProfiles
          : mode === "blocked"
            ? blockedProfiles
            : visitorProfiles;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((profile) =>
      `${profile.name} ${profile.city}`.toLowerCase().includes(normalized)
    );
  }, [
    mode,
    likedProfiles,
    skippedProfiles,
    blockedProfiles,
    visitorProfiles,
    query,
  ]);

  const right =
    mode === "skipped" && skippedProfiles.length > 0 ? (
      <Pressable
        accessibilityRole="button"
        onPress={() => setResetOpen(true)}
        style={({ pressed }) => [
          styles.headerReset,
          { opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <RotateCcw size={14} color={colors.secondary} strokeWidth={2.4} />
        <Text style={styles.headerResetText}>Reset all</Text>
      </Pressable>
    ) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={copy.title}
        subtitle={copy.subtitle}
        onBack={() => navigation.goBack()}
        right={right}
      />

      <View style={styles.search}>
        <Search size={18} color={colors.muted} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or city"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={
              mode === "liked" ? (
                <Heart size={21} color={colors.accent} strokeWidth={2.2} />
              ) : mode === "blocked" ? (
                <Ban size={21} color={colors.ink} strokeWidth={2.2} />
              ) : mode === "visitors" ? (
                <Eye size={21} color={colors.ink} strokeWidth={2.2} />
              ) : (
                <UserRoundX size={21} color={colors.ink} strokeWidth={2.2} />
              )
            }
            title={query ? "No matches" : copy.emptyTitle}
            message={
              query
                ? `No one here matches "${query.trim()}".`
                : copy.emptyMessage
            }
            action={
              <PrimaryButton
                label="CHECKOUT MATCHES"
                onPress={() =>
                  navigation.navigate("MainTabs", { screen: "Matches" })
                }
                style={styles.emptyButton}
              />
            }
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const liked = likedIds.includes(item.id);
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate("ProfileDetail", { profileId: item.id })
                }
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Avatar source={item.photo} size={58} online={item.online} />
                <View style={styles.person}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}, {item.age}
                    </Text>
                    {item.verified ? (
                      <TrustBadge kind="verified" size={16} />
                    ) : null}
                    {item.phoneVerified ? (
                      <TrustBadge kind="phone" size={16} />
                    ) : null}
                    {item.facebookVerified ? (
                      <TrustBadge kind="facebook" size={16} />
                    ) : null}
                  </View>
                  <Text style={styles.city} numberOfLines={1}>
                    {item.city}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {mode === "visitors"
                      ? "Visited your profile recently"
                      : item.lookingFor}
                  </Text>
                </View>

                {mode === "skipped" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Reset ${item.name}`}
                    onPress={() => {
                      resetSkipped(item.id);
                      showToast(`${item.name} is back in your deck.`, "success");
                    }}
                    style={({ pressed }) => [
                      styles.resetAction,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.resetActionText}>Reset</Text>
                  </Pressable>
                ) : mode === "blocked" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Unblock ${item.name}`}
                    onPress={() => {
                      unblockProfile(item.id);
                      showToast(`${item.name} has been unblocked.`, "info");
                    }}
                    style={({ pressed }) => [
                      styles.unblockAction,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.unblockText}>Unblock</Text>
                  </Pressable>
                ) : mode === "visitors" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      liked ? "Already liked" : `Like ${item.name} back`
                    }
                    onPress={() => {
                      if (liked) {
                        showToast("You already liked this profile.", "info");
                        return;
                      }
                      likeProfile(item.id);
                      showToast(`Like sent to ${item.name}.`, "success");
                    }}
                    style={({ pressed }) => [
                      styles.likeAction,
                      liked && styles.likeActionDone,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Heart
                      size={17}
                      color={liked ? colors.white : colors.accent}
                      fill={liked ? colors.white : "none"}
                      strokeWidth={2.2}
                    />
                  </Pressable>
                ) : (
                  <View style={styles.likedMark}>
                    <Check size={16} color={colors.accent} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            );
          }}
          ListFooterComponent={
            data.length > 0 ? (
              <Text style={styles.footer}>
                {mode === "blocked"
                  ? "Blocked users cannot view or message your profile."
                  : mode === "skipped"
                    ? "Tap Reset to see someone in your deck again."
                    : mode === "visitors"
                      ? "Like them back to start a conversation."
                      : "A like is a gentle hello. No pressure."}
              </Text>
            ) : null
          }
        />
      )}

      <ConfirmDialog
        visible={resetOpen}
        title="Reset all skipped profiles?"
        message="Everyone you've skipped will return to your discovery deck."
        confirmLabel="Reset all"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetAllSkipped();
          showToast("Skipped profiles are back in your deck.", "success");
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
  headerReset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.secondarySoft,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  headerResetText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.secondaryDark,
  },
  search: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 78,
  },
  person: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    flexShrink: 1,
  },
  city: {
    fontSize: 12.5,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  meta: {
    fontSize: 10.5,
    color: colors.faint,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginLeft: 58 + spacing.md,
  },
  resetAction: {
    backgroundColor: colors.success,
    borderRadius: radii.sm,
    minHeight: 36,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  resetActionText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: "700",
  },
  unblockAction: {
    borderWidth: 1,
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    minHeight: 36,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  unblockText: {
    color: colors.danger,
    fontSize: 11.5,
    fontWeight: "700",
  },
  likeAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#FFDCEA",
    alignItems: "center",
    justifyContent: "center",
  },
  likeActionDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  likedMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },
  emptyButton: {
    minWidth: 240,
  },
  footer: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
