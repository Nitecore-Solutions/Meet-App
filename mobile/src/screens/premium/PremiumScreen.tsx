import React, { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Eye,
  Heart,
  Lock,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { Pill } from "../../components/Section";
import { PREMIUM_PLANS } from "../../constants/catalog";
import { colors, radii, shadow, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { profilePhotos } from "../../data/images";
import type { AppStackParamList } from "../../navigation/types";
import type { PremiumPlan } from "../../types";
import { formatRupees } from "../../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "Premium">;

const FEATURES = [
  {
    key: "visitors",
    title: "Find out who viewed you",
    subtitle:
      "Unravel your profile visitors with insights by matchmaker, every single day.",
    tint: colors.accentSoft,
    accent: colors.accent,
    icon: <Eye size={31} color={colors.accent} strokeWidth={2} />,
  },
  {
    key: "likes",
    title: "Like without limits",
    subtitle:
      "Send as many likes as you want and turn more maybes into real conversations.",
    tint: colors.primarySoft,
    accent: colors.primary,
    icon: <Heart size={31} color={colors.primary} strokeWidth={2} />,
  },
  {
    key: "chat",
    title: "Chat with anyone",
    subtitle:
      "Start the conversation first. Plus lets you message anyone you're interested in.",
    tint: colors.secondarySoft,
    accent: colors.secondary,
    icon: <MessageCircle size={31} color={colors.secondary} strokeWidth={2} />,
  },
  {
    key: "boost",
    title: "Be seen first",
    subtitle:
      "Priority discovery puts your profile in front of more people who fit your vibe.",
    tint: colors.violetSoft,
    accent: colors.violet,
    icon: <Zap size={31} color={colors.violet} strokeWidth={2} />,
  },
] as const;

const BENEFITS = [
  "See everyone who viewed you",
  "Unlimited likes every day",
  "Message anyone you like",
  "Priority placement in discovery",
  "Exclusive Plus badge",
];

export function PremiumScreen({ navigation, route }: Props) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const planScroll = useRef<ScrollView>(null);
  const paymentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedId, setSelectedId] = useState(PREMIUM_PLANS[0].id);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [membershipEnd, setMembershipEnd] = useState("");

  const selectedPlan =
    PREMIUM_PLANS.find((plan) => plan.id === selectedId) ?? PREMIUM_PLANS[0];
  const pageWidth = Math.max(260, width - spacing.xl * 2);
  const isPlus = Boolean(user?.isPlus);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const source = route.params?.source;

  useEffect(
    () => () => {
      if (paymentTimer.current) clearTimeout(paymentTimer.current);
    },
    []
  );

  function goToFeature(index: number) {
    setFeatureIndex(index);
    planScroll.current?.scrollTo({ x: index * pageWidth, animated: true });
  }

  function openCheckout() {
    setPaymentMethod("upi");
    setPayOpen(true);
  }

  function closeCheckout() {
    if (paying) return;
    setPayOpen(false);
  }

  function membershipEndDate(plan: PremiumPlan) {
    const months = Number(plan.id.replace("m", "")) || 1;
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function completePurchase() {
    setPaying(true);
    paymentTimer.current = setTimeout(() => {
      updateUser({ isPlus: true });
      setPaying(false);
      setPayOpen(false);
      setMembershipEnd(membershipEndDate(selectedPlan));
      setSuccess(true);
    }, 1250);
  }

  if (success) {
    return (
      <SafeAreaView style={styles.successSafe} edges={["top", "bottom"]}>
        <View style={styles.successTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.successClose,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <X size={21} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.successTopLabel}>PAGALPAGAL PLUS</Text>
          <View style={styles.successCloseSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.successContent,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xxl },
          ]}
        >
          <View style={styles.successHalo}>
            <View style={styles.successRing} />
            <View style={styles.successBadge}>
              <CheckCircle2
                size={46}
                color={colors.success}
                fill={colors.successSoft}
                strokeWidth={1.9}
              />
              <View style={styles.successCrown}>
                <Crown size={16} color={colors.white} strokeWidth={2.4} />
              </View>
            </View>
            <View style={[styles.confetti, styles.confettiOne]} />
            <View style={[styles.confetti, styles.confettiTwo]} />
            <View style={[styles.confetti, styles.confettiThree]} />
            <View style={[styles.confetti, styles.confettiFour]} />
          </View>

          <Text style={styles.successTitle}>Welcome to Plus, {firstName}!</Text>
          <Text style={styles.successText}>
            Your membership is active. More likes, more visibility and more
            people to meet are waiting.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successCardTop}>
              <View style={styles.successCardIcon}>
                <Crown size={20} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.successCardText}>
                <Text style={styles.successCardTitle}>PagalPagal Plus</Text>
                <Text style={styles.successCardSub}>
                  {selectedPlan.label} membership
                </Text>
              </View>
              <Pill label="ACTIVE" tone="success" />
            </View>
            <View style={styles.successDivider} />
            <SuccessRow label="Plan" value={selectedPlan.label} />
            <SuccessRow label="Valid until" value={membershipEnd} />
            <SuccessRow
              label="Paid"
              value={formatRupees(selectedPlan.price)}
              strong
            />
          </View>

          <View style={styles.successBenefits}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.successBenefit}>
                <View style={styles.successCheck}>
                  <Check size={11} color={colors.successDark} strokeWidth={3} />
                </View>
                <Text style={styles.successBenefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label="START EXPLORING"
            onPress={() => navigation.goBack()}
            icon={<Sparkles size={17} color={colors.white} strokeWidth={2.2} />}
            style={styles.successCta}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Orders")}
            style={({ pressed }) => [
              styles.receiptLink,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.receiptLinkText}>VIEW MY RECEIPT</Text>
          </Pressable>
          <Text style={styles.successFinePrint}>
            This is a simulated purchase for the UI preview. No payment was
            taken.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xxl },
        ]}
      >
        <ImageBackground
          source={profilePhotos.couple1}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroBottomShade} />
          <SafeAreaView edges={["top"]} style={styles.heroSafe}>
            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Crown size={14} color={colors.warning} strokeWidth={2.3} />
                <Text style={styles.heroBadgeText}>PAGALPAGAL PLUS</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close premium"
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <X size={20} color={colors.white} strokeWidth={2.3} />
              </Pressable>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Meet deeper. Unlock more.</Text>
              <Text style={styles.heroSubtitle}>
                Make every connection count with the complete PagalPagal
                experience.
              </Text>
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <Star
                      key={index}
                      size={12}
                      color={colors.warning}
                      fill={colors.warning}
                      strokeWidth={1.5}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  4.8 · 1 lakh+ happy members
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.body}>
          {isPlus ? (
            <View style={styles.activeNote}>
              <ShieldCheck
                size={19}
                color={colors.successDark}
                strokeWidth={2.2}
              />
              <Text style={styles.activeNoteText}>
                Plus is already active on your account. Buying a plan extends
                your membership from today.
              </Text>
            </View>
          ) : null}

          <ScrollView
            ref={planScroll}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / pageWidth
              );
              setFeatureIndex(Math.max(0, Math.min(FEATURES.length - 1, index)));
            }}
            style={[styles.featureScroll, { width: pageWidth }]}
          >
            {FEATURES.map((feature) => (
              <View
                key={feature.key}
                style={[styles.feature, { width: pageWidth }]}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.tint },
                  ]}
                >
                  {feature.icon}
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.dots}>
            {FEATURES.map((feature, index) => (
              <Pressable
                key={feature.key}
                accessibilityRole="button"
                accessibilityLabel={`Show benefit ${index + 1}: ${feature.title}`}
                accessibilityState={{ selected: featureIndex === index }}
                onPress={() => goToFeature(index)}
                hitSlop={8}
                style={[
                  styles.dot,
                  featureIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.planHeading}>
            <View style={styles.planLine} />
            <Text style={styles.planHeadingText}>CHOOSE YOUR PLAN</Text>
            <View style={styles.planLine} />
          </View>

          <View style={styles.plans}>
            {PREMIUM_PLANS.map((plan) => {
              const active = plan.id === selectedPlan.id;
              return (
                <Pressable
                  key={plan.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${plan.label}, ${formatRupees(
                    plan.price
                  )}`}
                  onPress={() => setSelectedId(plan.id)}
                  style={({ pressed }) => [
                    styles.planCard,
                    active && styles.planCardActive,
                    { opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <View style={styles.planBadgeSlot}>
                    {plan.badge ? (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.planLabel,
                      active && styles.planLabelActive,
                    ]}
                  >
                    {plan.label}
                  </Text>
                  <Text style={styles.planPerMonth}>
                    {plan.id === "1m"
                      ? "Billed monthly"
                      : `${formatRupees(plan.perMonth)}/mo`}
                  </Text>
                  <Text
                    style={[
                      styles.planPrice,
                      active && styles.planPriceActive,
                    ]}
                  >
                    {formatRupees(plan.price)}
                  </Text>
                  <View
                    style={[
                      styles.planRadio,
                      active && styles.planRadioActive,
                    ]}
                  >
                    {active ? (
                      <Check
                        size={11}
                        color={colors.white}
                        strokeWidth={3.2}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.savings}>
            <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.savingsText}>
              Save up to 48% with the 12-month plan. One simple payment, a year
              of better connections.
            </Text>
          </View>

          <PrimaryButton
            label={isPlus ? "EXTEND PLUS" : "CONTINUE"}
            onPress={openCheckout}
            icon={
              <Crown size={17} color={colors.white} strokeWidth={2.2} />
            }
            style={styles.cta}
          />

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck
                size={14}
                color={colors.successDark}
                strokeWidth={2.2}
              />
              <Text style={styles.trustText}>Cancel anytime</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Lock size={13} color={colors.muted} strokeWidth={2.1} />
              <Text style={styles.trustText}>Secure checkout</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Star size={13} color={colors.warning} strokeWidth={2.1} />
              <Text style={styles.trustText}>Loved by members</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              showToast(
                "There are no other purchases to restore on this account.",
                "info"
              )
            }
            style={({ pressed }) => [
              styles.restore,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.restoreText}>RESTORE PURCHASE</Text>
          </Pressable>

          <Text style={styles.finePrint}>
            Plans renew automatically until cancelled. This preview simulates
            checkout, so no payment is taken. By continuing you agree to our{" "}
            <Text
              style={styles.finePrintLink}
              onPress={() => navigation.navigate("Legal", { kind: "terms" })}
            >
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text
              style={styles.finePrintLink}
              onPress={() => navigation.navigate("Legal", { kind: "privacy" })}
            >
              Privacy Policy
            </Text>
            .
          </Text>
          {source ? <Text style={styles.sourceTag}>Opened from {source}</Text> : null}
        </View>
      </ScrollView>

      <Modal
        visible={payOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCheckout}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close checkout"
            style={StyleSheet.absoluteFill}
            onPress={closeCheckout}
            disabled={paying}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Complete your purchase</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close checkout"
                onPress={closeCheckout}
                disabled={paying}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.sheetClose,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <X size={19} color={colors.ink} strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.sheetPlan}>
              <View style={styles.sheetPlanIcon}>
                <Crown size={21} color={colors.primaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.sheetPlanText}>
                <Text style={styles.sheetPlanTitle}>
                  PagalPagal Plus · {selectedPlan.label}
                </Text>
                <Text style={styles.sheetPlanSub}>
                  {selectedPlan.id === "1m"
                    ? "1 month of Plus benefits"
                    : `${formatRupees(selectedPlan.perMonth)}/month, billed once`}
                </Text>
              </View>
              <Text style={styles.sheetPlanPrice}>
                {formatRupees(selectedPlan.price)}
              </Text>
            </View>

            <Text style={styles.sheetLabel}>PAYMENT METHOD</Text>
            <View style={styles.methods}>
              <PaymentMethod
                title="UPI"
                detail="Google Pay, PhonePe, Paytm"
                icon={
                  <Smartphone
                    size={20}
                    color={colors.secondary}
                    strokeWidth={2}
                  />
                }
                active={paymentMethod === "upi"}
                onPress={() => setPaymentMethod("upi")}
              />
              <PaymentMethod
                title="Credit / debit card"
                detail="Visa, Mastercard, RuPay"
                icon={
                  <CreditCard
                    size={20}
                    color={colors.violet}
                    strokeWidth={2}
                  />
                }
                active={paymentMethod === "card"}
                onPress={() => setPaymentMethod("card")}
              />
            </View>

            <View style={styles.sheetTotal}>
              <Text style={styles.sheetTotalLabel}>Total due today</Text>
              <Text style={styles.sheetTotalValue}>
                {formatRupees(selectedPlan.price)}
              </Text>
            </View>

            <PrimaryButton
              label={`PAY ${formatRupees(selectedPlan.price)}`}
              onPress={completePurchase}
              loading={paying}
              icon={<Lock size={16} color={colors.white} strokeWidth={2.2} />}
              style={styles.payButton}
            />

            <View style={styles.sheetDemo}>
              <ShieldCheck
                size={14}
                color={colors.successDark}
                strokeWidth={2.2}
              />
              <Text style={styles.sheetDemoText}>
                Demo checkout - no real payment will be taken.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SuccessRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.successRow}>
      <Text style={styles.successRowLabel}>{label}</Text>
      <Text
        style={[
          styles.successRowValue,
          strong && styles.successRowValueStrong,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentMethod({
  title,
  detail,
  icon,
  active,
  onPress,
}: {
  title: string;
  detail: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.method,
        active && styles.methodActive,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={styles.methodIcon}>{icon}</View>
      <View style={styles.methodText}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodDetail}>{detail}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
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
    height: 272,
    justifyContent: "flex-end",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(20, 12, 30, 0.26)",
  },
  heroBottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
    backgroundColor: "rgba(20, 12, 30, 0.48)",
  },
  heroSafe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: "space-between",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(20, 12, 30, 0.55)",
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.white,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(20, 12, 30, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    paddingTop: spacing.xxl,
  },
  heroTitle: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.85)",
    marginTop: 5,
    maxWidth: 300,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stars: {
    flexDirection: "row",
    gap: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  ratingText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  activeNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activeNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: colors.successDark,
    fontWeight: "600",
  },
  featureScroll: {
    alignSelf: "center",
  },
  feature: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  featureIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  featureSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 300,
    fontWeight: "500",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.ink,
  },
  planHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  planLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  planHeadingText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.body,
  },
  plans: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: "center",
    minHeight: 146,
  },
  planCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  planBadgeSlot: {
    minHeight: 18,
    justifyContent: "center",
  },
  planBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  planBadgeText: {
    fontSize: 6.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: colors.white,
  },
  planLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 4,
  },
  planLabelActive: {
    color: colors.primaryDark,
  },
  planPerMonth: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  planPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginTop: "auto",
    paddingTop: spacing.md,
  },
  planPriceActive: {
    color: colors.primaryDark,
  },
  planRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  planRadioActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  savings: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  savingsText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.body,
    fontWeight: "600",
  },
  cta: {
    marginTop: spacing.lg,
    borderRadius: radii.pill,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: "wrap",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustText: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "600",
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  restore: {
    alignSelf: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  restoreText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.muted,
  },
  finePrint: {
    fontSize: 9,
    lineHeight: 14,
    color: colors.faint,
    textAlign: "center",
    paddingHorizontal: spacing.md,
    fontWeight: "500",
  },
  finePrintLink: {
    color: colors.secondary,
    fontWeight: "700",
  },
  sourceTag: {
    fontSize: 8,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    ...shadow.raised,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.md,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPlan: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#FFE1D3",
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  sheetPlanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPlanText: {
    flex: 1,
  },
  sheetPlanTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.ink,
  },
  sheetPlanSub: {
    fontSize: 10,
    color: colors.body,
    marginTop: 2,
  },
  sheetPlanPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  sheetLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  methods: {
    gap: spacing.sm,
  },
  method: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  methodActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  methodText: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.ink,
  },
  methodDetail: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.secondary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  sheetTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: spacing.md,
    marginTop: spacing.lg,
  },
  sheetTotalLabel: {
    fontSize: 12.5,
    color: colors.body,
    fontWeight: "600",
  },
  sheetTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  payButton: {
    marginTop: spacing.md,
    borderRadius: radii.pill,
  },
  sheetDemo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  sheetDemoText: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "500",
  },
  successSafe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  successTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  successClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successCloseSpacer: {
    width: 38,
  },
  successTopLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.muted,
  },
  successContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: "center",
  },
  successHalo: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: spacing.md,
  },
  successRing: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.successSoft,
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  successCrown: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  confettiOne: {
    backgroundColor: colors.primary,
    top: 18,
    left: 12,
    transform: [{ rotate: "24deg" }],
  },
  confettiTwo: {
    backgroundColor: colors.secondary,
    top: 34,
    right: 10,
    borderRadius: 4,
  },
  confettiThree: {
    backgroundColor: colors.accent,
    bottom: 22,
    left: 4,
    width: 6,
    height: 11,
    transform: [{ rotate: "38deg" }],
  },
  confettiFour: {
    backgroundColor: colors.warning,
    bottom: 12,
    right: 20,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  successTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  successText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 310,
    fontWeight: "500",
  },
  successCard: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  successCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  successCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successCardText: {
    flex: 1,
  },
  successCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  successCardSub: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 1,
  },
  successDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  successRowLabel: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "500",
  },
  successRowValue: {
    fontSize: 11.5,
    color: colors.ink,
    fontWeight: "700",
  },
  successRowValueStrong: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  successBenefits: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  successBenefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  successCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successBenefitText: {
    fontSize: 12,
    color: colors.body,
    fontWeight: "500",
  },
  successCta: {
    alignSelf: "stretch",
    marginTop: spacing.xl,
    borderRadius: radii.pill,
  },
  receiptLink: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  receiptLinkText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.secondary,
  },
  successFinePrint: {
    fontSize: 9,
    lineHeight: 14,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 300,
  },
});
