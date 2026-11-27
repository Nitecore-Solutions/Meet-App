import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronDown,
  Clock,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { TextArea, TextField } from "../../components/Form";
import { ScreenHeader } from "../../components/ScreenHeader";
import { SUPPORT_EMAIL } from "../../constants/config";
import { colors, radii, spacing } from "../../constants/theme";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "HelpSupport">;

const FAQS = [
  {
    question: "How do I get more matches?",
    answer:
      "Add at least three clear photos, write a warm bio, and keep your interests updated. Profiles with a verified photo and an active recent login get seen more often.",
  },
  {
    question: "Why can't I see who liked me?",
    answer:
      "Likes are revealed when you like someone back, or with PagalPagal Plus. Plus also unlocks visitor insights and unlimited likes.",
  },
  {
    question: "How does photo verification work?",
    answer:
      "Open My Profile → Verifications → Photo and follow the short selfie check. Once approved, a blue tick appears on your profile.",
  },
  {
    question: "How do I manage or cancel Plus?",
    answer:
      "Go to Settings → My Orders to see your plan. Open Manage Membership to upgrade or cancel. Cancelling keeps your benefits until the end of the current billing period.",
  },
  {
    question: "How do I report or block someone?",
    answer:
      "Open their profile and use the three-dot menu, or tap Block or report user under the profile. Blocked people can't see or message you, and reports go to our safety team.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "For safety, account deletion needs a verified request. Email us from the address linked to your profile and our team will help within 48 hours.",
  },
];

export function HelpSupportScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function emailSupport() {
    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=Help%20with%20PagalPagal`
      );
    } catch {
      showToast(`Write to us at ${SUPPORT_EMAIL}`, "info");
    }
  }

  function sendMessage() {
    if (subject.trim().length < 3 || message.trim().length < 10) {
      showToast("Add a subject and a little more detail.", "error");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubject("");
      setMessage("");
      showToast(
        "Message received. Our support team will reply by email.",
        "success"
      );
    }, 650);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Help & Support" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <LifeBuoy size={28} color={colors.secondary} strokeWidth={2} />
            </View>
            <Text style={styles.heroTitle}>How can we help?</Text>
            <Text style={styles.heroText}>
              Real humans, straight answers. We're one message away.
            </Text>
            <View style={styles.hours}>
              <Clock size={13} color={colors.body} strokeWidth={2} />
              <Text style={styles.hoursText}>Mon–Sat, 9 AM – 9 PM IST</Text>
            </View>
          </View>

          <View style={styles.contacts}>
            <Contact
              icon={<MessageCircle size={22} color={colors.secondary} strokeWidth={2} />}
              label="Live chat"
              onPress={() =>
                showToast(
                  "Our support team usually replies within 24 hours.",
                  "info"
                )
              }
            />
            <Contact
              icon={<Mail size={22} color={colors.primary} strokeWidth={2} />}
              label="Email us"
              onPress={emailSupport}
            />
            <Contact
              icon={<ShieldCheck size={22} color={colors.success} strokeWidth={2} />}
              label="Safety"
              onPress={() => navigation.navigate("Legal", { kind: "safety" })}
            />
          </View>

          <Text style={styles.sectionTitle}>Frequently asked</Text>
          <View style={styles.faqList}>
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <View key={faq.question} style={styles.faq}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    onPress={() => setOpenFaq(open ? null : index)}
                    style={({ pressed }) => [
                      styles.faqHeader,
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <ChevronDown
                      size={18}
                      color={colors.muted}
                      strokeWidth={2.2}
                      style={{
                        transform: [{ rotate: open ? "180deg" : "0deg" }],
                      }}
                    />
                  </Pressable>
                  {open ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
                </View>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.formTitle}>Still need help?</Text>
            </View>
            <Text style={styles.formHint}>
              Tell us what's happening and we'll point you in the right
              direction.
            </Text>
            <View style={styles.formFields}>
              <TextField
                label="Subject"
                value={subject}
                onChangeText={setSubject}
                placeholder="What do you need help with?"
                maxLength={80}
              />
              <TextArea
                label="Message"
                value={message}
                onChangeText={setMessage}
                placeholder="Share as much detail as you can..."
                minHeight={120}
                maxLength={600}
              />
              <PrimaryButton
                label="SEND MESSAGE"
                variant="secondary"
                onPress={sendMessage}
                loading={sending}
                icon={<Send size={16} color={colors.white} strokeWidth={2.2} />}
              />
            </View>
          </View>

          <View style={styles.legalLinks}>
            <Pressable onPress={() => navigation.navigate("Legal", { kind: "terms" })}>
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
            <View style={styles.legalDivider} />
            <Pressable
              onPress={() => navigation.navigate("Legal", { kind: "privacy" })}
            >
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
            <View style={styles.legalDivider} />
            <Pressable
              onPress={() => navigation.navigate("Legal", { kind: "conduct" })}
            >
              <Text style={styles.legalLink}>Code of Conduct</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            We usually reply within one business day.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Contact({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.contact,
        { opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <View style={styles.contactIcon}>{icon}</View>
      <Text style={styles.contactLabel}>{label}</Text>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    backgroundColor: colors.lavender,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  heroText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  hours: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.md,
  },
  hoursText: {
    fontSize: 10.5,
    color: colors.body,
    fontWeight: "600",
  },
  contacts: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  contact: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.ink,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  faqList: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  faq: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 19,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.body,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 0,
  },
  formCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFE4D6",
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  formHint: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.body,
    marginTop: 4,
  },
  formFields: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  legalLink: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  legalDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.line,
  },
  footer: {
    fontSize: 9.5,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
