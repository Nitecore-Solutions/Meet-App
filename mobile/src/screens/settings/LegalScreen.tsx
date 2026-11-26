import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  Clock,
  FileText,
  HeartHandshake,
  LifeBuoy,
  Lock,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react-native";

import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Legal">;
type LegalKind = AppStackParamList["Legal"]["kind"];

type LegalSection = {
  heading: string;
  body?: string;
  bullets?: string[];
  note?: string;
};

type LegalDoc = {
  header: string;
  title: string;
  subtitle: string;
  intro: string;
  tint: string;
  accent: string;
  sections: LegalSection[];
};

const DOCS: Record<LegalKind, LegalDoc> = {
  safety: {
    header: "Safety Centre",
    title: "Your safety comes first",
    subtitle:
      "Practical tips for safer chats, safer dates and a better experience.",
    intro:
      "PagalPagal is built for real connections. A few simple habits keep every conversation - and every meet-up - safe. If anything ever feels off, trust your gut and tell us.",
    tint: colors.successSoft,
    accent: colors.successDark,
    sections: [
      {
        heading: "Meet in public, stay in control",
        body: "For a first date, choose a busy public place and keep your plans in your own hands.",
        bullets: [
          "Arrange your own transport there and back.",
          "Tell a friend where you are going, who you are meeting and when you expect to be home.",
          "Stay sober and keep your phone charged.",
          "Have a simple exit plan if you want to leave early.",
        ],
      },
      {
        heading: "Protect your personal details",
        body: "Get to know someone before sharing anything that could identify you.",
        bullets: [
          "Keep your home address, workplace and daily routine private at first.",
          "Never send money, gift cards or one-time passwords, no matter the story.",
          "Do not share financial details, bank information or copies of ID documents.",
          "Be cautious if someone rushes you off the app or asks for your number immediately.",
        ],
      },
      {
        heading: "Verify before you trust",
        body: "A blue tick means the person passed our photo verification. It is a good start, not a guarantee.",
        bullets: [
          "Look for verification badges on the profile.",
          "Have a short video call before meeting in person.",
          "If a profile feels too good to be true, pause and check the details.",
        ],
      },
      {
        heading: "Spot the red flags",
        bullets: [
          "They ask for money, OTPs or help with a financial emergency.",
          "They declare strong feelings unusually fast or try to isolate you.",
          "They refuse video calls or keep cancelling plans.",
          "Their stories, photos or age do not add up.",
          "They pressure you for photos, personal details or a meet-up.",
        ],
        note: "You never owe anyone your time, your location or an explanation. Ending a conversation is always allowed.",
      },
      {
        heading: "If you meet someone",
        bullets: [
          "Share your live location with a trusted friend.",
          "Check in with that friend during the date.",
          "Keep your own cash, cards and transport options with you.",
          "Leave immediately if you feel uncomfortable - you do not need to be polite about it.",
        ],
      },
      {
        heading: "Report and block",
        body: "Use the three-dot menu on any profile or chat to report or block. Blocking removes the connection and hides your profile from them. Reports go to our safety team for review.",
        note: "If you are in immediate danger, call 112. For confidential support, the women's helpline is 181.",
      },
    ],
  },
  terms: {
    header: "Terms of Use",
    title: "The ground rules",
    subtitle: "The agreement between you and PagalPagal.",
    intro:
      "Welcome to PagalPagal. By creating an account or using the app, you agree to these Terms. Please read them carefully - they explain what you can expect from us and what we expect from you.",
    tint: colors.secondarySoft,
    accent: colors.secondaryDark,
    sections: [
      {
        heading: "Who can use PagalPagal",
        body: "PagalPagal is for adults aged 18 and over who are looking to meet people. By using the app you confirm that you meet this age requirement and that the information you provide is accurate.",
        bullets: [
          "You may keep only one personal account.",
          "You must not use the app if you have been previously removed for serious misconduct.",
          "You are responsible for complying with the laws that apply to you.",
        ],
      },
      {
        heading: "Your account",
        body: "You are responsible for the activity on your account and for keeping your sign-in details secure. If you believe someone else has accessed your account, contact us right away.",
      },
      {
        heading: "Using the app respectfully",
        body: "You agree to follow our Code of Conduct. Do not use PagalPagal to harass, threaten, deceive or harm anyone, and do not post content that is illegal or infringes someone else's rights.",
      },
      {
        heading: "Content you share",
        body: "You own the photos, text and other content you upload. You give PagalPagal permission to host, display and review that content so we can operate the service. Do not upload someone else's photos or private information without permission.",
      },
      {
        heading: "Plus memberships and payments",
        body: "Some features require a paid PagalPagal Plus membership. Plans are shown in the app before purchase and renew until cancelled, unless stated otherwise.",
        bullets: [
          "Prices include applicable taxes unless shown otherwise.",
          "You can cancel at any time from Settings - benefits continue until the end of the paid period.",
          "We may change plan prices with advance notice; changes do not apply to a period you have already paid for.",
          "Refunds are handled according to the rules of the store or payment method you used.",
        ],
        note: "This preview build simulates purchases. No real payment is taken and no subscription is created.",
      },
      {
        heading: "Safety and moderation",
        body: "We may review profiles, messages and reports to keep the community safe. We can remove content, limit features or suspend an account when we believe these Terms or our Code of Conduct have been broken.",
      },
      {
        heading: "Disclaimers and liability",
        body: "We work hard to keep PagalPagal safe, but we cannot guarantee the behaviour of other members or that every match will be genuine. Use good judgement, follow our safety tips and meet in public. To the extent permitted by law, PagalPagal is not liable for indirect or unforeseeable losses.",
      },
      {
        heading: "Ending the agreement",
        body: "You can stop using PagalPagal at any time and request account deletion from Help & Support. We may end the agreement if you seriously or repeatedly break these Terms. Some records may be kept where the law requires it.",
      },
      {
        heading: "Changes and contact",
        body: "We may update these Terms as the app evolves. Material changes will be communicated in the app. Questions? Reach us through Help & Support and a real person will reply.",
      },
    ],
  },
  privacy: {
    header: "Privacy Policy",
    title: "Your data, your choices",
    subtitle: "What we collect, why we collect it and how you stay in control.",
    intro:
      "PagalPagal only asks for information we need to run the service and help you make meaningful connections. This summary explains the essentials in plain language.",
    tint: colors.violetSoft,
    accent: colors.violet,
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Account details such as your name, mobile number, email, age and city.",
          "Profile content such as photos, bio, interests, languages and preferences.",
          "Activity such as likes, matches, visits and messages you choose to send.",
          "Device and usage information including app version, device type and approximate location.",
          "Purchase records for Plus memberships and boosts.",
        ],
      },
      {
        heading: "How we use your information",
        bullets: [
          "To show your profile to people who fit your preferences.",
          "To suggest matches and tell you when someone likes or visits you.",
          "To deliver messages and keep the service working.",
          "To review reports, prevent abuse and protect the community.",
          "To process purchases and provide customer support.",
          "To improve features and understand how the app is used.",
        ],
      },
      {
        heading: "What other members can see",
        body: "Your public profile shows the details you add, such as your name, age, city, photos and interests. Your exact location is never shown - only an approximate distance. You can hide selected details from Edit Profile.",
      },
      {
        heading: "What we do not do",
        bullets: [
          "We do not sell your personal information.",
          "We do not show your phone number to other members unless you choose to share it.",
          "We do not read private messages for advertising.",
        ],
      },
      {
        heading: "When we share information",
        body: "We share limited information with service providers who help us operate the app, such as hosting, payment processing and customer support. They may only use it to provide those services. We may also share information when the law requires it or to protect someone's safety.",
      },
      {
        heading: "Your choices and rights",
        bullets: [
          "Access, correct or update your information from Edit Profile and Basic Info.",
          "Hide your age, city, relationship status, profession or education from your profile.",
          "Manage your match preferences and distance settings at any time.",
          "Ask about, export or delete your data by contacting Help & Support.",
          "Withdraw consent where processing relies on it - this may limit some features.",
        ],
      },
      {
        heading: "How long we keep information",
        body: "We keep your information while your account is active and for a limited period afterwards to meet legal obligations, resolve disputes and prevent abuse. When it is no longer needed, we delete it or make it anonymous.",
      },
      {
        heading: "Security",
        body: "We use technical and organisational safeguards to protect your information. No service is completely secure, so choose a strong password, keep your device locked and let us know if you notice anything unusual.",
      },
      {
        heading: "Children",
        body: "PagalPagal is strictly for adults. We do not knowingly collect information from anyone under 18. If you believe a member is underage, report the profile so our safety team can investigate.",
      },
      {
        heading: "Contact us",
        body: "For privacy questions or requests, open Help & Support and choose the privacy topic. We may need to verify your identity before acting on a request.",
      },
    ],
  },
  conduct: {
    header: "Code of Conduct",
    title: "Real people. Real respect.",
    subtitle: "The small rules that make a big difference to everyone here.",
    intro:
      "Behind every profile is a real person. Treat people the way you would want to be treated, be honest about who you are and speak up when something is not right. That is the whole idea.",
    tint: colors.primarySoft,
    accent: colors.primaryDark,
    sections: [
      {
        heading: "Be real",
        bullets: [
          "Use your own recent photos and the correct age.",
          "Keep one personal account - not one for every mood.",
          "Be honest about what you are looking for.",
          "Do not pretend to be someone else or use a profile for someone who does not exist.",
        ],
      },
      {
        heading: "Be respectful",
        bullets: [
          "No harassment, stalking, threats or intimidation.",
          "No hate speech or attacks based on identity, religion, caste, disability or background.",
          "No name-calling, humiliation or repeated unwanted contact.",
          "A polite 'no' is enough - respect it.",
        ],
      },
      {
        heading: "Keep it consensual",
        bullets: [
          "Do not send unsolicited sexual content, photos or links.",
          "Never pressure anyone for photos, personal details or a meet-up.",
          "Do not share private images with anyone or ask for them.",
          "If someone says stop, stop.",
        ],
      },
      {
        heading: "No scams, spam or solicitation",
        bullets: [
          "Do not ask for money, OTPs, gift cards or financial help.",
          "No crypto offers, business pitches, promotion links or advertising.",
          "No fake giveaways or external payment requests.",
          "Do not use the app to collect personal data from other members.",
        ],
      },
      {
        heading: "Protect privacy",
        bullets: [
          "Do not screenshot or share someone's private messages or photos without consent.",
          "Do not reveal someone's address, workplace or other private information.",
          "Respect how much another person chooses to share, even after a chat ends.",
        ],
      },
      {
        heading: "Keep meet-ups safe",
        bullets: [
          "Meet in a public place for the first few dates.",
          "Tell a friend where you are going.",
          "Do not pressure anyone to leave with you or change their plans.",
          "If someone feels unsafe, let them leave without a scene.",
        ],
      },
      {
        heading: "What happens if you break these rules",
        body: "Depending on what happened, we may remove content, send a warning, limit features, suspend your account or permanently ban you. Serious cases - such as threats, fraud or content involving minors - may be reported to the authorities.",
      },
      {
        heading: "If you see something wrong",
        body: "Use the report option on the profile or chat. Include as much detail as you can. You can also block the person immediately so they cannot see or message you. Reports are handled confidentially.",
      },
    ],
  },
};

function DocumentIcon({
  kind,
  size = 27,
  color,
}: {
  kind: LegalKind;
  size?: number;
  color: string;
}) {
  switch (kind) {
    case "safety":
      return <ShieldCheck size={size} color={color} strokeWidth={2.1} />;
    case "terms":
      return <FileText size={size} color={color} strokeWidth={2.1} />;
    case "privacy":
      return <Lock size={size} color={color} strokeWidth={2.1} />;
    default:
      return <Users size={size} color={color} strokeWidth={2.1} />;
  }
}

export function LegalScreen({ navigation, route }: Props) {
  const { kind } = route.params;
  const doc = DOCS[kind];
  const { showToast } = useToast();

  async function callNumber(number: string, label: string) {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      showToast(`Call ${number} for ${label}.`, "info");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title={doc.header} onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.hero, { backgroundColor: doc.tint }]}>
          <View style={styles.heroIcon}>
            <DocumentIcon kind={kind} color={doc.accent} />
          </View>
          <Text style={styles.heroTitle}>{doc.title}</Text>
          <Text style={styles.heroSubtitle}>{doc.subtitle}</Text>
          <View style={styles.updated}>
            <Clock size={12} color={doc.accent} strokeWidth={2.2} />
            <Text style={[styles.updatedText, { color: doc.accent }]}>
              Updated 18 November 2026
            </Text>
          </View>
        </View>

        {kind === "safety" ? (
          <View style={styles.emergency}>
            <EmergencyCard
              label="Emergency"
              number="112"
              icon={
                <AlertTriangle
                  size={18}
                  color={colors.danger}
                  strokeWidth={2.2}
                />
              }
              onPress={() => callNumber("112", "emergencies")}
            />
            <EmergencyCard
              label="Women's helpline"
              number="181"
              icon={<Phone size={18} color={colors.violet} strokeWidth={2.2} />}
              onPress={() => callNumber("181", "confidential support")}
            />
            <EmergencyCard
              label="Cyber crime"
              number="1930"
              icon={
                <Lock size={18} color={colors.secondary} strokeWidth={2.2} />
              }
              onPress={() => callNumber("1930", "cyber crime support")}
            />
          </View>
        ) : null}

        <Text style={styles.intro}>{doc.intro}</Text>

        {doc.sections.map((section, index) => (
          <View key={section.heading} style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.number, { backgroundColor: doc.tint }]}>
                <Text style={[styles.numberText, { color: doc.accent }]}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>{section.heading}</Text>
            </View>

            {section.body ? (
              <Text style={styles.bodyCopy}>{section.body}</Text>
            ) : null}

            {section.bullets?.length ? (
              <View style={styles.bullets}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: doc.accent }]} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {section.note ? (
              <View style={[styles.note, { borderLeftColor: doc.accent }]}>
                <Text style={styles.noteText}>{section.note}</Text>
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <LifeBuoy size={24} color={colors.secondary} strokeWidth={2.1} />
          </View>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportHint}>
              Our support team is happy to help.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("HelpSupport")}
            style={({ pressed }) => [
              styles.supportButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.supportButtonText}>CONTACT US</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <HeartHandshake size={15} color={colors.faint} strokeWidth={2} />
          <Text style={styles.disclaimer}>
            This is sample copy for the PagalPagal UI preview. It is not legal
            advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmergencyCard({
  label,
  number,
  icon,
  onPress,
}: {
  label: string;
  number: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Call ${label} at ${number}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.emergencyCard,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.emergencyIcon}>{icon}</View>
      <Text style={styles.emergencyLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.emergencyNumber}>{number}</Text>
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
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 290,
    fontWeight: "500",
  },
  updated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: spacing.md,
  },
  updatedText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  emergency: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  emergencyCard: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
  },
  emergencyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emergencyLabel: {
    fontSize: 9.5,
    lineHeight: 13,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "600",
  },
  emergencyNumber: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "800",
    marginTop: 2,
  },
  intro: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.body,
    fontWeight: "500",
    marginTop: spacing.xl,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  number: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  numberText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  bodyCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.body,
    fontWeight: "500",
  },
  bullets: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.body,
    fontWeight: "500",
  },
  note: {
    borderLeftWidth: 3,
    backgroundColor: colors.canvas,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  noteText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.body,
    fontWeight: "600",
  },
  supportCard: {
    marginTop: spacing.xxxl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  supportText: {
    alignItems: "center",
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  supportHint: {
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
  },
  supportButton: {
    minHeight: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  supportButtonText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.white,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  disclaimer: {
    flexShrink: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: colors.faint,
    textAlign: "center",
  },
});
