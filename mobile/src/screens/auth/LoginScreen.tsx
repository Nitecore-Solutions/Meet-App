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
import { ErrorBanner, TextField } from "../../components/Form";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function login() {
    if (!contact.trim() && !password) {
      setError("Add your email or phone number and password to continue.");
      return;
    }
    setError(null);
    void signIn(contact.trim());
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
              placeholder="Email or phone number"
              value={contact}
              onChangeText={(value) => {
                setContact(value);
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
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
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
            <Pressable
              onPress={() =>
                showToast("A reset link would be sent by the backend.", "info")
              }
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </Pressable>

            <PrimaryButton label="LOGIN" onPress={login} />

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <PrimaryButton
              label="LOGIN WITH FACEBOOK"
              variant="secondary"
              onPress={() => {
                showToast("Facebook login is a preview shortcut.", "info");
                void signIn("facebook-preview");
              }}
              icon={
                <View style={styles.facebookTile}>
                  <Text style={styles.facebookLetter}>f</Text>
                </View>
              }
            />
          </View>

          <View style={styles.otpBlock}>
            <Text style={styles.otpHint}>Didn't remember password?</Text>
            <PrimaryButton
              label="LOGIN WITH OTP"
              variant="outline"
              onPress={() =>
                navigation.navigate("Otp", {
                  contact: contact.trim() || "your phone number",
                })
              }
              style={styles.otpButton}
            />
          </View>

          <View style={styles.spacer} />
          <Text style={styles.previewNote}>
            UI preview · any email and password will work. No real account is
            created.
          </Text>
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
    alignSelf: "flex-end",
    paddingVertical: 2,
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
  facebookTile: {
    width: 23,
    height: 23,
    borderRadius: 4,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  facebookLetter: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 17,
    lineHeight: 20,
    marginTop: -2,
  },
  otpBlock: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  otpHint: {
    fontSize: 12.5,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "500",
  },
  otpButton: {
    borderRadius: radii.sm,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xxl,
  },
  previewNote: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.faint,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
