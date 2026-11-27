import React, { useMemo, useState } from "react";
import {
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
  ChevronRight,
  CreditCard,
  Crown,
  Download,
  LifeBuoy,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react-native";

import { ScreenHeader } from "../../components/ScreenHeader";
import { Pill, SectionLabel } from "../../components/Section";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";
import { formatRupees } from "../../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "Orders">;

type OrderStatus = "Active" | "Completed" | "Expired" | "Refunded";
type OrderCategory = "plus" | "boost";
type Order = {
  id: string;
  name: string;
  detail: string;
  amount: number;
  date: string;
  status: OrderStatus;
  category: OrderCategory;
  method: string;
  txn: string;
};

const BASE_ORDERS: Order[] = [
  {
    id: "PP-24118",
    name: "PagalPagal Plus",
    detail: "1 Month plan · 22 Sep – 22 Oct 2026",
    amount: 399,
    date: "22 Oct 2026",
    status: "Expired",
    category: "plus",
    method: "UPI",
    txn: "TXN77420918",
  },
  {
    id: "PP-24092",
    name: "Profile Boost",
    detail: "30 minutes of priority placement",
    amount: 99,
    date: "3 Sep 2026",
    status: "Completed",
    category: "boost",
    method: "UPI",
    txn: "TXN77319044",
  },
  {
    id: "PP-24071",
    name: "PagalPagal Plus",
    detail: "6 Months plan · 12 Feb – 12 Aug 2026",
    amount: 1499,
    date: "12 Aug 2026",
    status: "Completed",
    category: "plus",
    method: "Card · **** 4821",
    txn: "TXN76918220",
  },
  {
    id: "PP-24045",
    name: "Super Like Pack",
    detail: "5 Super Likes",
    amount: 149,
    date: "30 Jun 2026",
    status: "Completed",
    category: "boost",
    method: "Card · **** 4821",
    txn: "TXN76183005",
  },
];

type Filter = "all" | "plus" | "boost";

export function OrdersScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPlus = Boolean(user?.isPlus);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const orders = useMemo<Order[]>(() => {
    if (!isPlus) return BASE_ORDERS;
    return [
      {
        id: "PP-261118",
        name: "PagalPagal Plus",
        detail: "1 Month plan · 18 Nov – 18 Dec 2026",
        amount: 399,
        date: "18 Nov 2026",
        status: "Active",
        category: "plus",
        method: "UPI",
        txn: "TXN88201463",
      },
      ...BASE_ORDERS,
    ];
  }, [isPlus]);

  const visibleOrders = useMemo(
    () =>
      filter === "all"
        ? orders
        : orders.filter((order) => order.category === filter),
    [filter, orders]
  );

  const totalSpent = orders
    .filter((order) => order.status !== "Refunded")
    .reduce((total, order) => total + order.amount, 0);

  function openPremium() {
    navigation.navigate("Premium", { source: "orders" });
  }

  function downloadReceipt(order: Order) {
    showToast(`Receipt ${order.id} saved to Downloads (demo).`, "success");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Orders & receipts"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Billing help"
            onPress={() => navigation.navigate("HelpSupport")}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <LifeBuoy size={21} color={colors.ink} strokeWidth={2.1} />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.membership}>
          <View style={styles.membershipTop}>
            <View style={styles.membershipIcon}>
              <Crown size={25} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.membershipText}>
              <Text style={styles.membershipTitle}>
                {isPlus ? "PagalPagal Plus" : "PagalPagal Free"}
              </Text>
              <Text style={styles.membershipSub}>
                {isPlus
                  ? "Unlimited likes, visitor insights and more."
                  : "Upgrade to unlock the full PagalPagal experience."}
              </Text>
            </View>
            <Pill
              label={isPlus ? "ACTIVE" : "FREE"}
              tone={isPlus ? "success" : "neutral"}
            />
          </View>

          <View style={styles.stats}>
            <Stat label="Lifetime spend" value={formatRupees(totalSpent)} />
            <View style={styles.statDivider} />
            <Stat label="Orders" value={String(orders.length)} />
            <View style={styles.statDivider} />
            <Stat label="Member since" value={user?.joined ?? "Nov 2026"} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={openPremium}
            style={({ pressed }) => [
              styles.manageButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.manageText}>
              {isPlus ? "EXTEND OR MANAGE MEMBERSHIP" : "EXPLORE PLUS PLANS"}
            </Text>
            <ChevronRight size={17} color={colors.white} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.demoNote}>
          <Sparkles size={15} color={colors.secondary} strokeWidth={2.2} />
          <Text style={styles.demoText}>
            Your Plus purchases and receipts appear here.
          </Text>
        </View>

        <View style={styles.filterRow}>
          <FilterChip
            label="All"
            count={orders.length}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterChip
            label="Plus"
            count={orders.filter((order) => order.category === "plus").length}
            active={filter === "plus"}
            onPress={() => setFilter("plus")}
          />
          <FilterChip
            label="Boosts"
            count={orders.filter((order) => order.category === "boost").length}
            active={filter === "boost"}
            onPress={() => setFilter("boost")}
          />
        </View>

        <SectionLabel style={styles.sectionLabel}>Payment history</SectionLabel>

        <View style={styles.orderList}>
          {visibleOrders.map((order) => {
            const expanded = expandedId === order.id;
            const gst = Math.round(order.amount - order.amount / 1.18);
            const base = order.amount - gst;

            return (
              <View key={order.id} style={styles.orderCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`${order.name}, ${formatRupees(order.amount)}`}
                  onPress={() => setExpandedId(expanded ? null : order.id)}
                  style={({ pressed }) => [
                    styles.orderHead,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.orderIcon,
                      order.category === "boost" && styles.boostIcon,
                    ]}
                  >
                    {order.category === "plus" ? (
                      <Crown
                        size={20}
                        color={colors.primary}
                        strokeWidth={2.1}
                      />
                    ) : (
                      <Zap
                        size={20}
                        color={colors.secondary}
                        strokeWidth={2.1}
                      />
                    )}
                  </View>
                  <View style={styles.orderText}>
                    <Text style={styles.orderName}>{order.name}</Text>
                    <Text style={styles.orderDetail} numberOfLines={2}>
                      {order.detail}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {order.date} · {order.id}
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>
                      {formatRupees(order.amount)}
                    </Text>
                    <Pill
                      label={order.status.toUpperCase()}
                      tone={
                        order.status === "Active"
                          ? "success"
                          : order.status === "Completed"
                            ? "blue"
                            : order.status === "Refunded"
                              ? "warning"
                              : "neutral"
                      }
                    />
                  </View>
                  <ChevronDown
                    size={17}
                    color={colors.muted}
                    strokeWidth={2.1}
                    style={{
                      transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                    }}
                  />
                </Pressable>

                {expanded ? (
                  <View style={styles.receipt}>
                    <View style={styles.receiptHead}>
                      <View style={styles.receiptHeadLeft}>
                        <ReceiptText
                          size={15}
                          color={colors.secondary}
                          strokeWidth={2.1}
                        />
                        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
                      </View>
                      <Text style={styles.receiptId}>{order.id}</Text>
                    </View>

                    <ReceiptLine label="Item total" value={formatRupees(base)} />
                    <ReceiptLine
                      label="GST (18%, included)"
                      value={formatRupees(gst)}
                    />
                    <View style={styles.receiptDivider} />
                    <ReceiptLine
                      label="Total paid"
                      value={formatRupees(order.amount)}
                      strong
                    />

                    <View style={styles.metaList}>
                      <MetaRow
                        icon={
                          <CreditCard
                            size={15}
                            color={colors.muted}
                            strokeWidth={2}
                          />
                        }
                        label="Payment method"
                        value={order.method}
                      />
                      <MetaRow
                        icon={
                          <ShieldCheck
                            size={15}
                            color={colors.muted}
                            strokeWidth={2}
                          />
                        }
                        label="Transaction ID"
                        value={order.txn}
                      />
                      <MetaRow
                        icon={
                          <ReceiptText
                            size={15}
                            color={colors.muted}
                            strokeWidth={2}
                          />
                        }
                        label="Billed to"
                        value={user?.name ?? "PagalPagal member"}
                      />
                    </View>

                    <View style={styles.receiptActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => downloadReceipt(order)}
                        style={({ pressed }) => [
                          styles.receiptButton,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Download
                          size={16}
                          color={colors.secondary}
                          strokeWidth={2.2}
                        />
                        <Text style={styles.receiptButtonText}>
                          Download receipt
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => navigation.navigate("HelpSupport")}
                        style={({ pressed }) => [
                          styles.receiptButton,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <LifeBuoy
                          size={16}
                          color={colors.body}
                          strokeWidth={2.1}
                        />
                        <Text
                          style={[
                            styles.receiptButtonText,
                            styles.helpButtonText,
                          ]}
                        >
                          Get help
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {visibleOrders.length === 0 ? (
          <View style={styles.empty}>
            <ReceiptText size={24} color={colors.faint} strokeWidth={1.8} />
            <Text style={styles.emptyTitle}>No orders here yet</Text>
            <Text style={styles.emptyText}>
              Purchases in this category will appear here.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("HelpSupport")}
          style={({ pressed }) => [
            styles.helpCard,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={styles.helpIcon}>
            <LifeBuoy size={20} color={colors.successDark} strokeWidth={2.1} />
          </View>
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>Questions about a charge?</Text>
            <Text style={styles.helpHint}>
              We usually reply within one business day.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <Text style={styles.footer}>
          Receipts are available for every purchase made with this account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filter,
        active && styles.filterActive,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text
          style={[
            styles.filterCountText,
            active && styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function ReceiptLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.receiptLine}>
      <Text style={[styles.receiptLabel, strong && styles.receiptLabelStrong]}>
        {label}
      </Text>
      <Text style={[styles.receiptValue, strong && styles.receiptValueStrong]}>
        {value}
      </Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      {icon}
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  membership: {
    backgroundColor: colors.primaryTint,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#FFE1D3",
    padding: spacing.lg,
  },
  membershipTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  membershipIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipText: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  membershipSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.body,
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  statLabel: {
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.muted,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.line,
    marginVertical: 2,
  },
  manageButton: {
    marginTop: spacing.md,
    minHeight: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  manageText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.white,
  },
  demoNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.md,
  },
  demoText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.secondaryDark,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.body,
  },
  filterTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  filterCount: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterCountActive: {
    backgroundColor: colors.primary,
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.muted,
  },
  filterCountTextActive: {
    color: colors.white,
  },
  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  orderList: {
    gap: spacing.md,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  orderHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  boostIcon: {
    backgroundColor: colors.secondarySoft,
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
    fontSize: 11,
    lineHeight: 15,
    color: colors.body,
    marginTop: 2,
  },
  orderMeta: {
    fontSize: 9.5,
    color: colors.faint,
    marginTop: 5,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  orderAmount: {
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.ink,
  },
  receipt: {
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    padding: spacing.lg,
  },
  receiptHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  receiptHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  receiptTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: colors.muted,
  },
  receiptId: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.faint,
  },
  receiptLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  receiptLabel: {
    fontSize: 11.5,
    color: colors.body,
    fontWeight: "500",
  },
  receiptLabelStrong: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "800",
  },
  receiptValue: {
    fontSize: 11.5,
    color: colors.body,
    fontWeight: "600",
  },
  receiptValueStrong: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "800",
  },
  receiptDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.line,
    marginVertical: spacing.sm,
  },
  metaList: {
    gap: 7,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  metaLabel: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: "500",
  },
  metaValue: {
    flex: 1,
    fontSize: 10.5,
    color: colors.ink,
    fontWeight: "600",
    textAlign: "right",
  },
  receiptActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  receiptButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  receiptButtonText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.secondary,
  },
  helpButtonText: {
    color: colors.body,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    borderRadius: radii.lg,
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.ink,
  },
  emptyText: {
    fontSize: 11.5,
    color: colors.muted,
    textAlign: "center",
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.ink,
  },
  helpHint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.xxl,
    fontWeight: "500",
  },
});
