import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { BackButton, PrimaryButton } from "../../components/Buttons";
import { ErrorBanner } from "../../components/Form";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

export function OtpScreen({ navigation, route }: Props) {
  const { email, mode, devCode } = route.params;
  const { verifySignupOtp, verifyLoginOtp, resendOtp, apiEnabled } = useAuth();
  const [code, setCode] = useState(devCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function verify() {
    if (code.length !== 6) {
      setError("Enter all 6 digits to continue.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await verifySignupOtp(email, code);
      else await verifyLoginOtp(email, code);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That code could not be verified.");
      setBusy(false);
    }
  }

  async function resend() {
    if (seconds > 0 || busy) return;
    setBusy(true);
    try {
      const result = await resendOtp(
        email,
        mode === "signup" ? "verify_email" : "login"
      );
      if (result.devCode) setCode(result.devCode);
      setSeconds(60);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>
          {mode === "signup" ? "Verify your email" : "Verify it's you"}
        </Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{" "}
          <Text style={styles.contact}>{email}</Text>. Enter it below to continue.
        </Text>

        {!apiEnabled ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>UI PREVIEW</Text>
            <Text style={styles.previewText}>
              No backend URL is configured. Use 123456 as the demo code.
            </Text>
          </View>
        ) : null}

        {devCode && apiEnabled ? (
          <Text style={styles.devHint}>Dev code: {devCode}</Text>
        ) : null}

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.codeRow}
          accessibilityLabel="One time password"
        >
          {Array.from({ length: 6 }).map((_, index) => {
            const digit = code[index];
            const focused = code.length === index;
            return (
              <View
                key={index}
                style={[
                  styles.codeCell,
                  focused && styles.codeCellFocused,
                  error && styles.codeCellError,
                ]}
              >
                <Text style={styles.codeText}>{digit ?? ""}</Text>
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.hiddenInput}
            autoFocus
            textContentType="oneTimeCode"
          />
        </Pressable>

        {error ? <ErrorBanner message={error} /> : null}

        <PrimaryButton
          label="VERIFY & CONTINUE"
          onPress={verify}
          disabled={code.length < 6 || busy}
          loading={busy}
          style={styles.verify}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get the code?</Text>
          <Pressable disabled={seconds > 0 || busy} onPress={resend}>
            <Text
              style={[
                styles.resendLink,
                seconds > 0 && styles.resendLinkDisabled,
              ]}
            >
              {seconds > 0 ? `Resend in ${seconds}s` : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.9,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing.sm,
    maxWidth: 330,
    fontWeight: "500",
  },
  contact: {
    color: colors.ink,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  previewLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.secondaryDark,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.secondaryDark,
    marginTop: 2,
  },
  devHint: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.successDark,
    marginTop: spacing.md,
  },
  codeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    position: "relative",
  },
  codeCell: {
    flex: 1,
    aspectRatio: 0.86,
    maxHeight: 64,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  codeCellFocused: {
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  codeCellError: {
    borderColor: colors.danger,
  },
  codeText: {
    fontSize: 25,
    fontWeight: "700",
    color: colors.ink,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0.01,
    width: "100%",
    height: "100%",
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  verify: {
    marginTop: spacing.xl,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
  },
  resendText: {
    fontSize: 12.5,
    color: colors.muted,
  },
  resendLink: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.secondary,
  },
  resendLinkDisabled: {
    color: colors.faint,
  },
});
