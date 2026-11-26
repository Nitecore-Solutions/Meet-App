import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react-native";

import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Verification">;
type VerifyKey = "photo" | "phone" | "facebook";

export function VerificationScreen({ navigation }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const [working, setWorking] = useState<VerifyKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function verify(key: VerifyKey) {
    if (working) return;
    setWorking(key);
    timer.current = setTimeout(() => {
      setWorking(null);
      if (key === "photo") {
        updateUser({ verified: true });
        showToast("Photo verified. Your blue tick is live!", "success");
      } else if (key === "phone") {
        updateUser({ phoneVerified: true });
        showToast("Mobile number verified.", "success");
      } else {
        updateUser({ facebookVerified: true });
        showToast("Facebook connected and verified.", "success");
      }
    }, 900);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Verification" onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <BadgeCheck size={26} color={colors.secondary} strokeWidth={2.1} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Get the blue tick</Text>
            <Text style={styles.bannerSub}>
              Verified profiles get more replies and show up with a trusted
              badge.
            </Text>
          </View>
        </View>

        <VerificationCard
          icon={<Camera size={22} color={colors.white} strokeWidth={2.1} />}
          tone={profile.verified ? colors.success : colors.faint}
          label="Photo"
          value={profile.verified ? "Verified" : "Not Verified"}
          verified={profile.verified}
          working={working === "photo"}
          onVerify={() => verify("photo")}
        />

        <VerificationCard
          icon={<Smartphone size={22} color={colors.white} strokeWidth={2.1} />}
          tone={profile.phoneVerified ? colors.success : colors.faint}
          label="Mobile Number"
          value={profile.phone}
          verified={profile.phoneVerified}
          working={working === "phone"}
          onVerify={() => verify("phone")}
        />

        <VerificationCard
          icon={<Text style={styles.facebookIcon}>f</Text>}
          tone={profile.facebookVerified ? "#1877F2" : colors.faint}
          label="Facebook"
          value={profile.facebookVerified ? "Verified" : "Not Verified"}
          verified={profile.facebookVerified}
          working={working === "facebook"}
          onVerify={() => verify("facebook")}
        />

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.infoTitle}>Why verify?</Text>
          </View>
          <Text style={styles.infoText}>
            It tells people you're really you. Verified members are more likely
            to match and start conversations.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <Lock size={17} color={colors.successDark} strokeWidth={2.2} />
          <Text style={styles.privacyText}>
            Your mobile number and Facebook details are never shown publicly.
            Only the verification badge appears on your profile.
          </Text>
        </View>

        <View style={styles.safetyRow}>
          <ShieldCheck size={18} color={colors.ink} strokeWidth={2} />
          <Pressable
            onPress={() => navigation.navigate("Legal", { kind: "safety" })}
            hitSlop={6}
          >
            <Text style={styles.safetyLink}>Read our safety guidelines</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VerificationCard({
  icon,
  tone,
  label,
  value,
  verified,
  working,
  onVerify,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  verified: boolean;
  working: boolean;
  onVerify: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: tone }]}>{icon}</View>
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
      {verified ? (
        <View style={styles.verifiedPill}>
          <ShieldCheck size={13} color={colors.successDark} strokeWidth={2.4} />
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Verify ${label}`}
          onPress={onVerify}
          disabled={working}
          style={({ pressed }) => [
            styles.verifyButton,
            { opacity: working ? 0.7 : pressed ? 0.75 : 1 },
          ]}
        >
          {working ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.verifyText}>Verify now</Text>
          )}
        </Pressable>
      )}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#D6E3FD",
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  bannerSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: "500",
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  verifiedText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: colors.successDark,
  },
  verifyButton: {
    minHeight: 36,
    minWidth: 90,
    borderRadius: radii.sm,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  facebookIcon: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
    marginTop: -3,
  },
  infoCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FFE4D6",
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.ink,
  },
  infoText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.body,
    marginTop: spacing.sm,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  privacyText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.successDark,
    fontWeight: "500",
  },
  safetyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  safetyLink: {
    fontSize: 12.5,
    color: colors.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
