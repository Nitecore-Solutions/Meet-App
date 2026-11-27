import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Eye, EyeOff } from "lucide-react-native";

import { BackButton, PrimaryButton } from "../../components/Buttons";
import { GoogleButton } from "../../components/GoogleButton";
import { ErrorBanner, TextField } from "../../components/Form";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { requestLoginOtp } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    const value = email.trim();
    if (!value.includes("@") || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await requestLoginOtp(value, password);
      showToast("We emailed you a 6-digit sign-in code.", "success");
      navigation.navigate("Otp", {
        email: value,
        mode: "login",
        ...(result.devCode ? { devCode: result.devCode } : {}),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the code. Try again.");
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>
            Welcome back. Your next great conversation is waiting.
          </Text>

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
              textContentType="username"
              returnKeyType="next"
            />
            <TextField
              filled
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (error) setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              rightAccessory={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword((current) => !current)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <Eye size={20} color={colors.faint} strokeWidth={2} />
                  ) : (
                    <EyeOff size={20} color={colors.faint} strokeWidth={2} />
                  )}
                </Pressable>
              }
            />
            {error ? <ErrorBanner message={error} /> : null}

            <PrimaryButton label="CONTINUE" onPress={login} loading={busy} />

            <Pressable
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <GoogleButton
              onPress={() =>
                showToast(
                  "Google sign-in will be available once OAuth is configured.",
                  "info"
                )
              }
            />
          </View>

          <View style={styles.spacer} />
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
    fontSize: 36,
    lineHeight: 43,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -1.2,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  forgot: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 12.5,
    color: colors.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationColor: colors.line,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  orText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xxl,
  },
  googleTile: {
    width: 23,
    height: 23,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
