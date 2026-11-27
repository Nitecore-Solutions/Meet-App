import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MessageCircle, Search } from "lucide-react-native";

import { Avatar } from "../../components/Avatar";
import { PrimaryButton } from "../../components/Buttons";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import type { AppStackParamList } from "../../navigation/types";
import type { Profile } from "../../types";
import { formatChatTime } from "../../utils/format";

export function MessagesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { chats, getProfile } = useDating();

  const rows = useMemo(
    () =>
      chats
        .map((chat) => ({
          chat,
          profile: getProfile(chat.profileId),
        }))
        .filter(
          (row): row is { chat: (typeof chats)[number]; profile: Profile } =>
            Boolean(row.profile)
        )
        .sort(
          (a, b) =>
            new Date(b.chat.updatedAt).getTime() -
            new Date(a.chat.updatedAt).getTime()
        ),
    [chats, getProfile]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Messages"
        large
        right={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search messages"
              onPress={() => undefined}
              hitSlop={8}
            >
              <Search size={21} color={colors.ink} strokeWidth={2} />
            </Pressable>
          </View>
        }
      />

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon={
              <MessageCircle
                size={22}
                color={colors.accent}
                strokeWidth={2.1}
              />
            }
            title="No messages yet"
            message="When you and someone both like each other, your conversation will show up here."
            action={
              <PrimaryButton
                label="FIND MATCHES"
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
          data={rows}
          keyExtractor={(row) => row.chat.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const { chat, profile } = item;
            const last = chat.messages[chat.messages.length - 1];
            const unread = chat.unread > 0;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${profile.name}`}
                onPress={() => navigation.navigate("Chat", { profileId: profile.id })}
                style={({ pressed }) => [
                  styles.row,
                  unread && styles.rowUnread,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Avatar source={profile.photo} size={60} online={profile.online} />
                <View style={styles.rowText}>
                  <View style={styles.topLine}>
                    <Text
                      style={[styles.name, unread && styles.nameUnread]}
                      numberOfLines={1}
                    >
                      {profile.name}
                    </Text>
                    <Text style={styles.time}>
                      {formatChatTime(chat.updatedAt)}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text
                      style={[
                        styles.preview,
                        unread && styles.previewUnread,
                        !last && styles.previewNew,
                      ]}
                      numberOfLines={1}
                    >
                      {last
                        ? `${last.sender === "me" ? "You: " : ""}${last.text}`
                        : "You matched! Say hi 👋"}
                    </Text>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                  {chat.newMatch ? (
                    <View style={styles.newPill}>
                      <Text style={styles.newPillText}>NEW MATCH</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <Text style={styles.footerNote}>
              Only people you match with can send you a message. Stay safe and
              keep the conversation respectful.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 2,
    borderRadius: radii.md,
  },
  rowUnread: {
    backgroundColor: colors.accentSoft + "55",
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  topLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: "600",
    color: colors.ink,
  },
  nameUnread: {
    fontWeight: "800",
  },
  time: {
    fontSize: 10.5,
    color: colors.faint,
    fontWeight: "500",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 3,
  },
  preview: {
    flex: 1,
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "500",
  },
  previewUnread: {
    color: colors.body,
    fontWeight: "600",
  },
  previewNew: {
    color: colors.accentDark,
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  newPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 5,
  },
  newPillText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: colors.accentDark,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginLeft: 60 + spacing.md,
  },
  footerNote: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.faint,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },
  emptyButton: {
    minWidth: 240,
  },
});
