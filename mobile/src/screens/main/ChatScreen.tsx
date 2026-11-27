import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Ban,
  Flag,
  Link2Off,
  MoreVertical,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { Avatar } from "../../components/Avatar";
import { BackButton } from "../../components/Buttons";
import {
  AbusiveOptionsSheet,
  ConfirmDialog,
  ReportUserSheet,
} from "../../components/Dialogs";
import { colors, radii, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";
import type { ReportReason } from "../../types";
import { formatChatTime } from "../../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "Chat">;

const prompts = [
  "Say hi 👋",
  "How's your week going?",
  "What's your idea of a perfect date?",
];

export function ChatScreen({ navigation, route }: Props) {
  const { profileId } = route.params;
  const {
    chats,
    getProfile,
    sendMessage,
    markChatRead,
    unmatch,
    blockProfile,
  } = useDating();
  const profile = getProfile(profileId);
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [abusiveOpen, setAbusiveOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const messages = chats.find((chat) => chat.profileId === profileId)?.messages ?? [];

  useEffect(() => {
    markChatRead(profileId);
  }, [markChatRead, profileId]);

  useEffect(() => {
    const timer = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: false }),
      80
    );
    return () => clearTimeout(timer);
  }, [messages.length]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.missing}>Profile unavailable</Text>
        </View>
      </SafeAreaView>
    );
  }

  function send(value = draft) {
    if (!value.trim()) return;
    sendMessage(profileId, value);
    setDraft("");
  }

  function submitReport(reason: ReportReason) {
    showToast(`Report sent: ${reason}. Our team will review it.`, "success");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Pressable
            onPress={() =>
              navigation.navigate("ProfileDetail", { profileId: profile.id })
            }
            style={styles.headerProfile}
          >
            <Avatar source={profile.photo} size={38} online={profile.online} />
            <View style={styles.headerText}>
              <Text style={styles.headerName} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.headerStatus} numberOfLines={1}>
                {profile.online ? "Online now" : profile.lastActive}
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            onPress={() => setAbusiveOpen(true)}
            hitSlop={8}
            style={styles.more}
          >
            <MoreVertical size={21} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Action
            label="View profile"
            color="#3478F6"
            icon={<UserRound size={21} color={colors.white} strokeWidth={2.1} />}
            onPress={() =>
              navigation.navigate("ProfileDetail", { profileId: profile.id })
            }
          />
          <Action
            label="Unmatch"
            color="#F5A623"
            icon={<Link2Off size={21} color={colors.white} strokeWidth={2.1} />}
            onPress={() => setUnmatchOpen(true)}
          />
          <Action
            label="Safety tips"
            color="#22B573"
            icon={<ShieldCheck size={21} color={colors.white} strokeWidth={2.1} />}
            onPress={() => navigation.navigate("Legal", { kind: "safety" })}
          />
          <Action
            label="Block"
            color="#E5484D"
            icon={<Ban size={21} color={colors.white} strokeWidth={2.1} />}
            onPress={() => setBlockOpen(true)}
          />
          <Action
            label="Report"
            color="#F2C200"
            icon={<Flag size={21} color={colors.white} strokeWidth={2.1} />}
            onPress={() => setReportOpen(true)}
          />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={styles.newMatch}>
              <Avatar source={profile.photo} size={88} online={profile.online} />
              <Text style={styles.matchTitle}>
                You matched with {profile.name.split(" ")[0]}
              </Text>
              <Text style={styles.matchSub}>
                Say something better than "hey". A little personality goes a
                long way.
              </Text>
              <View style={styles.prompts}>
                {prompts.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => send(prompt)}
                    style={({ pressed }) => [
                      styles.prompt,
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <Text style={styles.promptText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.dayLabel}>TODAY</Text>
              {messages.map((message) => {
                const mine = message.sender === "me";
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      mine ? styles.messageRowMine : styles.messageRowTheirs,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.bubbleMine : styles.bubbleTheirs,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          mine ? styles.messageTextMine : styles.messageTextTheirs,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>
                      {formatChatTime(message.at)}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message"
              placeholderTextColor={colors.faint}
              style={styles.input}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={() => send()}
              disabled={!draft.trim()}
              hitSlop={8}
            >
              <Send
                size={23}
                color={draft.trim() ? colors.secondary : colors.faint}
                strokeWidth={2.1}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

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
        visible={unmatchOpen}
        title={`Unmatch ${profile.name}?`}
        message="This chat will disappear for both of you. You can't undo it."
        confirmLabel="Unmatch"
        destructive
        onClose={() => setUnmatchOpen(false)}
        onConfirm={() => {
          unmatch(profile.id);
          navigation.goBack();
          showToast("Unmatched.", "info");
        }}
      />
      <ConfirmDialog
        visible={blockOpen}
        title={`Block ${profile.name}?`}
        message="They won't be able to find or message you, and this chat will be removed."
        confirmLabel="Block"
        destructive
        onClose={() => setBlockOpen(false)}
        onConfirm={() => {
          blockProfile(profile.id);
          navigation.goBack();
          showToast("Profile blocked.", "success");
        }}
      />
    </SafeAreaView>
  );
}

function Action({
  label,
  color,
  icon,
  onPress,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.actionCircle, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16.5,
    fontWeight: "700",
    color: colors.ink,
  },
  headerStatus: {
    fontSize: 10.5,
    color: colors.successDark,
    marginTop: 1,
    fontWeight: "600",
  },
  more: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  missing: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    marginLeft: spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  action: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    color: colors.body,
    textAlign: "center",
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: "#F8F6FB",
  },
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  messagesEmpty: {
    justifyContent: "center",
  },
  newMatch: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  matchTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.lg,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  matchSub: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  prompts: {
    marginTop: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  prompt: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promptText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.body,
  },
  dayLabel: {
    alignSelf: "center",
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "700",
    color: colors.faint,
    marginBottom: spacing.lg,
  },
  messageRow: {
    marginBottom: spacing.md,
    maxWidth: "82%",
  },
  messageRowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  messageRowTheirs: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.secondary,
    borderBottomRightRadius: 5,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: colors.white,
  },
  messageTextTheirs: {
    color: colors.ink,
  },
  messageTime: {
    fontSize: 9,
    color: colors.faint,
    marginTop: 3,
    fontWeight: "500",
  },
  inputBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    maxHeight: 96,
    paddingVertical: 10,
    marginRight: spacing.sm,
    outlineWidth: 0,
    outlineStyle: "solid",
  },
});
