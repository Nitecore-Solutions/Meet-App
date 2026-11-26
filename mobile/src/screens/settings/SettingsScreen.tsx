import React, { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Crown,
  Eye,
  Camera,
  Gift,
  Heart,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react-native";

import { ConfirmDialog } from "../../components/Dialogs";
import { PickerSheet } from "../../components/PickerSheet";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  CardGroup,
  MenuRow,
  Pill,
  SectionLabel,
} from "../../components/Section";
import { UpgradeBanner } from "../../components/UpgradeBanner";
import { FOOTER_LINKS } from "../../constants/catalog";
import { APP_VERSION, SUPPORT_EMAIL } from "../../constants/config";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import { coupleStories } from "../../data/couples";
import type { AppStackParamList } from "../../navigation/types";
import { formatRupees } from "../../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;
type SettingsTab = "account" | "orders";

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const {
    distanceUnit,
    setDistanceUnit,
    likedProfiles,
    skippedProfiles,
    blockedProfiles,
  } = useDating();
  const { showToast } = useToast();
  const [tab, setTab] = useState<SettingsTab>("account");
  const [distanceOpen, setDistanceOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isPlus = Boolean(user?.isPlus);

  async function inviteFriends() {
    try {
      await Share.share({
        message:
          "I'm on PagalPagal — the playful way to meet someone new. Join me and let's find our people. Match. Chat. Like. Date. Repeat.",
      });
    } catch {
      showToast("Sharing isn't available on this device.", "info");
    }
  }

  async function followInstagram() {
    try {
      await Linking.openURL("https://instagram.com/pagalpagal");
    } catch {
      showToast("Couldn't open Instagram right now.", "error");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        <Tab
          label="ACCOUNT"
          active={tab === "account"}
          onPress={() => setTab("account")}
        />
        <Tab
          label="MY ORDERS"
          active={tab === "orders"}
          onPress={() => setTab("orders")}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tab === "account" ? (
          <>
            {!isPlus ? (
              <UpgradeBanner
                onPress={() =>
                  navigation.navigate("Premium", { source: "settings" })
                }
              />
            ) : (
              <View style={styles.memberCard}>
                <View style={styles.memberIcon}>
                  <Crown size={24} color={colors.primaryDark} strokeWidth={2.2} />
                </View>
                <View style={styles.memberText}>
                  <Text style={styles.memberTitle}>PagalPagal Plus</Text>
                  <Text style={styles.memberSub}>
                    Active — enjoy unlimited likes and visitor insights.
                  </Text>
                </View>
                <Pill label="ACTIVE" tone="success" />
              </View>
            )}

            <View style={styles.coupleSection}>
              <View style={styles.coupleHeader}>
                <View style={styles.divider} />
                <Text style={styles.coupleTitle}>THEY MET ON PAGALPAGAL</Text>
                <View style={styles.divider} />
              </View>
              <View style={styles.coupleCard}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.coupleList}
                >
                  {coupleStories.map((story) => (
                    <Pressable
                      key={story.id}
                      onPress={() =>
                        showToast(
                          `${story.names} found each other here. Your story is next.`,
                          "info"
                        )
                      }
                      style={({ pressed }) => [
                        styles.couple,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Image source={story.photo} style={styles.couplePhoto} />
                      <Text style={styles.coupleNames} numberOfLines={2}>
                        {story.names}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <SectionLabel style={styles.section}>
              Liked / Skipped / Blocked profiles
            </SectionLabel>
            <CardGroup>
              <MenuRow
                title="Liked Profiles"
                value={`${likedProfiles.length} profiles`}
                icon={<Heart size={19} color={colors.accent} strokeWidth={2} />}
                onPress={() =>
                  navigation.navigate("ProfileList", { mode: "liked" })
                }
              />
              <MenuRow
                title="Skipped Profiles"
                value={`${skippedProfiles.length} profiles`}
                icon={<Eye size={19} color={colors.muted} strokeWidth={2} />}
                onPress={() =>
                  navigation.navigate("ProfileList", { mode: "skipped" })
                }
              />
              <MenuRow
                title="Blocked Users"
                value={`${blockedProfiles.length} profiles`}
                icon={<ShieldCheck size={19} color={colors.danger} strokeWidth={2} />}
                onPress={() =>
                  navigation.navigate("ProfileList", { mode: "blocked" })
                }
              />
            </CardGroup>

            <SectionLabel style={styles.section}>Show distance in</SectionLabel>
            <CardGroup>
              <MenuRow
                title={distanceUnit}
                icon={<Sparkles size={19} color={colors.secondary} strokeWidth={2} />}
                onPress={() => setDistanceOpen(true)}
              />
            </CardGroup>

            <SectionLabel style={styles.section}>Share the love</SectionLabel>
            <CardGroup>
              <MenuRow
                title="Follow us on Instagram"
                icon={<Camera size={19} color={colors.accent} strokeWidth={2} />}
                onPress={followInstagram}
              />
              <MenuRow
                title="Invite Friends"
                icon={<Gift size={19} color={colors.primary} strokeWidth={2} />}
                onPress={inviteFriends}
              />
            </CardGroup>

            <SectionLabel style={styles.section}>Account</SectionLabel>
            <CardGroup>
              <MenuRow
                title="Edit Profile"
                icon={<UserRound size={19} color={colors.secondary} strokeWidth={2} />}
                onPress={() => navigation.navigate("EditProfile")}
              />
              <MenuRow
                title="Account Settings"
                value="Profile, city, contact details"
                icon={<ShieldCheck size={19} color={colors.success} strokeWidth={2} />}
                onPress={() => navigation.navigate("EditProfile")}
              />
              <MenuRow
                title="Safety & Privacy"
                icon={<ShieldCheck size={19} color={colors.violet} strokeWidth={2} />}
                onPress={() => navigation.navigate("Legal", { kind: "safety" })}
              />
              <MenuRow
                title="Log out"
                icon={<LogOut size={19} color={colors.danger} strokeWidth={2} />}
                danger
                arrow={false}
                onPress={() => setLogoutOpen(true)}
              />
            </CardGroup>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Help and Support"
              onPress={() => navigation.navigate("HelpSupport")}
              style={({ pressed }) => [
                styles.helpButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.helpText}>HELP & SUPPORT</Text>
            </Pressable>

            <View style={styles.legalRow}>
              {FOOTER_LINKS.map((link, index) => (
                <React.Fragment key={link.key}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("Legal", { kind: link.key })
                    }
                    hitSlop={6}
                  >
                    <Text style={styles.legalLink}>{link.label}</Text>
                  </Pressable>
                  {index < FOOTER_LINKS.length - 1 ? (
                    <View style={styles.legalDivider} />
                  ) : null}
                </React.Fragment>
              ))}
            </View>
            <Text style={styles.version}>PagalPagal v{APP_VERSION}</Text>
          </>
        ) : (
          <OrdersTab
            isPlus={isPlus}
            onUpgrade={() =>
              navigation.navigate("Premium", { source: "orders" })
            }
            onAllOrders={() => navigation.navigate("Orders")}
            onHelp={() => navigation.navigate("HelpSupport")}
            onEmail={async () => {
              try {
                await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
              } catch {
                showToast(`Write to us at ${SUPPORT_EMAIL}`, "info");
              }
            }}
          />
        )}
      </ScrollView>

      <PickerSheet
        visible={distanceOpen}
        title="Show distance in"
        options={[
          { value: "Kilometers", label: "Kilometers" },
          { value: "Miles", label: "Miles" },
        ]}
        selected={[distanceUnit]}
        onClose={() => setDistanceOpen(false)}
        onSave={(values) => {
          const unit = values[0];
          if (unit === "Kilometers" || unit === "Miles") {
            setDistanceUnit(unit);
            showToast(`Distance will be shown in ${unit.toLowerCase()}.`, "success");
          }
        }}
        showSearch={false}
      />

      <ConfirmDialog
        visible={logoutOpen}
        title="Log out of PagalPagal?"
        message="Your matches and chats stay safe on this device. You can log back in anytime."
        confirmLabel="Log out"
        destructive
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          void signOut();
          showToast("Logged out. See you soon!", "info");
        }}
      />
    </SafeAreaView>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.tab}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  );
}

function OrdersTab({
  isPlus,
  onUpgrade,
  onAllOrders,
  onHelp,
  onEmail,
}: {
  isPlus: boolean;
  onUpgrade: () => void;
  onAllOrders: () => void;
  onHelp: () => void;
  onEmail: () => void;
}) {
  const orders = [
    {
      id: "PP-24118",
      name: "PagalPagal Plus",
      detail: "1 Month plan",
      amount: 399,
      date: "22 Oct 2026",
      status: "Expired",
    },
    {
      id: "PP-24092",
      name: "Profile Boost",
      detail: "30 minutes of priority placement",
      amount: 99,
      date: "3 Sep 2026",
      status: "Completed",
    },
  ];

  return (
    <>
      <View style={styles.planCard}>
        <View style={styles.planTop}>
          <View style={styles.planIcon}>
            <Crown size={25} color={colors.primaryDark} strokeWidth={2.2} />
          </View>
          <View style={styles.planText}>
            <Text style={styles.planLabel}>
              {isPlus ? "PagalPagal Plus" : "Free membership"}
            </Text>
            <Text style={styles.planSub}>
              {isPlus
                ? "Your Plus benefits are active."
                : "Upgrade for unlimited likes and visitor insights."}
            </Text>
          </View>
          <Pill
            label={isPlus ? "ACTIVE" : "FREE"}
            tone={isPlus ? "success" : "neutral"}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onUpgrade}
          style={({ pressed }) => [
            styles.planButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.planButtonText}>
            {isPlus ? "MANAGE MEMBERSHIP" : "SEE PLUS PLANS"}
          </Text>
          <ChevronRight size={17} color={colors.white} strokeWidth={2.4} />
        </Pressable>
      </View>

      <SectionLabel style={styles.section}>Recent orders</SectionLabel>
      <View style={styles.orderList}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderIcon}>
              {order.name.includes("Plus") ? (
                <Crown size={20} color={colors.primary} strokeWidth={2.1} />
              ) : (
                <Zap size={20} color={colors.secondary} strokeWidth={2.1} />
              )}
            </View>
            <View style={styles.orderText}>
              <Text style={styles.orderName}>{order.name}</Text>
              <Text style={styles.orderDetail}>{order.detail}</Text>
              <Text style={styles.orderMeta}>
                {order.date} · {order.id}
              </Text>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderAmount}>
                {formatRupees(order.amount)}
              </Text>
              <Text
                style={[
                  styles.orderStatus,
                  order.status === "Completed" && styles.orderStatusDone,
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAllOrders}
        style={({ pressed }) => [
          styles.allOrders,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <ReceiptText size={18} color={colors.secondary} strokeWidth={2} />
        <Text style={styles.allOrdersText}>View all orders & receipts</Text>
        <ChevronRight size={18} color={colors.ink} strokeWidth={2} />
      </Pressable>

      <SectionLabel style={styles.section}>Billing help</SectionLabel>
      <CardGroup>
        <MenuRow
          title="Questions about a charge?"
          icon={<ShieldCheck size={19} color={colors.success} strokeWidth={2} />}
          onPress={onHelp}
        />
        <MenuRow
          title="Email billing support"
          icon={<ReceiptText size={19} color={colors.secondary} strokeWidth={2} />}
          onPress={onEmail}
        />
      </CardGroup>
      <Text style={styles.ordersNote}>
        Payments in this preview are simulated. No money is ever charged.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    paddingHorizontal: spacing.xl,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.faint,
  },
  tabLabelActive: {
    color: colors.secondary,
  },
  tabUnderline: {
    height: 2.5,
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabUnderlineActive: {
    backgroundColor: colors.secondary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "#FFDCCB",
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  memberIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  memberText: {
    flex: 1,
  },
  memberTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  memberSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 2,
  },
  coupleSection: {
    marginTop: spacing.xxl,
  },
  coupleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  coupleTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.muted,
  },
  coupleCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
  },
  coupleList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  couple: {
    width: 108,
    alignItems: "center",
  },
  couplePhoto: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.lavender,
  },
  coupleNames: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    color: colors.body,
    marginTop: spacing.sm,
    fontWeight: "500",
  },
  section: {
    marginTop: spacing.xxl,
  },
  helpButton: {
    marginTop: spacing.xxl,
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.primary,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
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
  version: {
    fontSize: 9.5,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.lg,
    fontWeight: "500",
  },
  planCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFE1D3",
    padding: spacing.lg,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  planText: {
    flex: 1,
  },
  planLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  planSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 2,
  },
  planButton: {
    marginTop: spacing.lg,
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  planButtonText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  orderList: {
    gap: spacing.md,
  },
  orderCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    flex: 1,
  },
  orderName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  orderDetail: {
    fontSize: 11.5,
    color: colors.body,
    marginTop: 1,
  },
  orderMeta: {
    fontSize: 10,
    color: colors.faint,
    marginTop: 5,
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.ink,
  },
  orderStatus: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: colors.faint,
    marginTop: 5,
    textTransform: "uppercase",
  },
  orderStatusDone: {
    color: colors.successDark,
  },
  allOrders: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  allOrdersText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.ink,
  },
  ordersNote: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xxl,
  },
});
