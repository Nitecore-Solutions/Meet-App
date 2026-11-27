import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MailCheck } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../../components/Buttons";
import { ErrorBanner, TextField } from "../../components/Form";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim().includes("@")) {
      setError("Enter the email address on your account.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a link to choose a new password.
          </Text>

          {sent ? (
            <View style={styles.successCard}>
              <MailCheck size={28} color={colors.successDark} strokeWidth={2} />
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successText}>
                If an account exists for {email.trim()}, a reset link is on its
                way. It expires in 30 minutes.
              </Text>
              <PrimaryButton
                label="BACK TO LOGIN"
                variant="secondary"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <TextField
                filled
                placeholder="Email address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              {error ? <ErrorBanner message={error} /> : null}
              <PrimaryButton label="SEND RESET LINK" onPress={submit} loading={busy} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing.sm,
    fontWeight: "500",
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  successCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  successText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
  },
  backButton: {
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
});
