import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  Flag,
  X,
} from "lucide-react-native";

import { REPORT_REASONS } from "../constants/catalog";
import { colors, radii, shadow, spacing } from "../constants/theme";
import type { ReportReason } from "../types";
import { PrimaryButton } from "./Buttons";
import { TextArea } from "./Form";

export function AbusiveOptionsSheet({
  visible,
  onClose,
  onReport,
  onBlock,
}: {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.abusiveCard}>
          <Pressable
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.abusiveClose}
          >
            <X size={20} color={colors.white} strokeWidth={2.6} />
          </Pressable>
          <Text style={styles.abusiveTitle}>Found profile abusive</Text>
          <View style={styles.abusiveRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onReport}
              style={({ pressed }) => [
                styles.abusiveAction,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Flag size={48} color={colors.ink} strokeWidth={1.5} />
              <Text style={styles.abusiveLabel}>Report user</Text>
            </Pressable>
            <View style={styles.abusiveDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={onBlock}
              style={({ pressed }) => [
                styles.abusiveAction,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ban size={48} color={colors.ink} strokeWidth={1.5} />
              <Text style={styles.abusiveLabel}>Block user</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ReportUserSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}) {
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setReason(REPORT_REASONS[0]);
      setDetails("");
      setReasonsOpen(false);
      setError(null);
    }
  }, [visible]);

  function submit() {
    if (details.trim().length < 20) {
      setError("Please add at least 20 characters so the team can help.");
      return;
    }
    onSubmit(reason, details.trim());
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.reportCard,
            { marginBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Report User</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.reportClose}
              >
                <X size={18} color={colors.body} strokeWidth={2.3} />
              </Pressable>
            </View>
            <Text style={styles.reportDescription}>
              Kindly let us know the reason you are reporting this profile. Our
              moderation team will look into the issue within 24 hours.
            </Text>

            <Text style={styles.fieldLabel}>Reason</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose report reason"
              onPress={() => setReasonsOpen((open) => !open)}
              style={styles.reasonField}
            >
              <Text style={styles.reasonText}>{reason}</Text>
              <ChevronDown size={18} color={colors.body} strokeWidth={2.2} />
            </Pressable>
            {reasonsOpen ? (
              <View style={styles.reasonList}>
                {REPORT_REASONS.map((option) => {
                  const active = option === reason;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setReason(option);
                        setReasonsOpen(false);
                      }}
                      style={styles.reasonOption}
                    >
                      <Text
                        style={[
                          styles.reasonOptionText,
                          active && styles.reasonOptionActive,
                        ]}
                      >
                        {option}
                      </Text>
                      {active ? (
                        <Check
                          size={15}
                          color={colors.secondary}
                          strokeWidth={3}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Text style={[styles.fieldLabel, styles.detailsLabel]}>
              Tell us what happened
            </Text>
            <TextArea
              value={details}
              onChangeText={(text) => {
                setDetails(text);
                if (error) setError(null);
              }}
              placeholder="Please explain in detail..."
              minHeight={116}
              error={error}
            />
            <Text style={styles.minimum}>
              Minimum 20 characters/{details.trim().length}
            </Text>
            <PrimaryButton
              label="SUBMIT"
              variant="secondary"
              onPress={submit}
              style={styles.reportSubmit}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  icon,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.confirmCard}>
          <View
            style={[
              styles.confirmIcon,
              {
                backgroundColor: destructive
                  ? colors.dangerSoft
                  : colors.warningSoft,
              },
            ]}
          >
            {icon ?? (
              <AlertTriangle
                size={25}
                color={destructive ? colors.danger : colors.warning}
                strokeWidth={2}
              />
            )}
          </View>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmActions}>
            <PrimaryButton
              label={cancelLabel}
              variant="outline"
              onPress={onClose}
              uppercase={false}
              style={styles.confirmButton}
            />
            <PrimaryButton
              label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={() => {
                onConfirm();
                onClose();
              }}
              uppercase={false}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.lg,
  },
  abusiveCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    ...shadow.raised,
  },
  abusiveClose: {
    position: "absolute",
    right: -12,
    top: -12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    zIndex: 2,
  },
  abusiveTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  abusiveRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  abusiveAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  abusiveDivider: {
    width: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  abusiveLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
  },
  reportCard: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadow.raised,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  reportTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    flex: 1,
    marginLeft: 32,
  },
  reportClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reportDescription: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.body,
    marginTop: spacing.lg,
    marginBottom: 7,
  },
  detailsLabel: {
    marginTop: spacing.md,
  },
  reasonField: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: "500",
  },
  reasonList: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  reasonOptionText: {
    fontSize: 13,
    color: colors.body,
    flex: 1,
  },
  reasonOptionActive: {
    color: colors.secondaryDark,
    fontWeight: "600",
  },
  minimum: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "right",
    marginTop: 5,
  },
  reportSubmit: {
    marginTop: spacing.lg,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.raised,
  },
  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.body,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    alignSelf: "stretch",
  },
  confirmButton: {
    flex: 1,
    minHeight: 46,
  },
});
