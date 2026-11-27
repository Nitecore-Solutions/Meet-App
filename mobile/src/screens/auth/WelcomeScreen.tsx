import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";

import { BrandLockup } from "../../components/Brand";
import { PrimaryButton } from "../../components/Buttons";
import { GoogleButton } from "../../components/GoogleButton";
import { APP_TAGLINE } from "../../constants/config";
import { useAuth } from "../../context/AuthContext";
import { colors, radii, spacing } from "../../constants/theme";
import { useToast } from "../../context/ToastContext";
import { profilePhotos } from "../../data/images";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { accountCreated } = useAuth();

  function showTerms() {
    Alert.alert(
      "Terms & privacy",
      "PagalPagal is strictly for adults aged 18 and over. Be kind, keep personal information safe, and report anything that feels wrong."
    );
  }

  function handleSocial() {
    showToast("Google sign-in will be available once OAuth is configured.", "info");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandWrap}>
          <BrandLockup size={32} tagline="Find your kind of crazy" />
        </View>

        <View style={styles.photoStrip}>
          <Image source={profilePhotos.arjun} style={styles.photo} />
          <Image source={profilePhotos.khushi} style={styles.photo} />
          <Image source={profilePhotos.rohan} style={styles.photo} />
          <Image source={profilePhotos.aisha} style={styles.photo} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.tagline}>MATCH. CHAT. LIKE.</Text>
          <Text style={styles.tagline}>
            DATE. <Text style={styles.highlight}>REPEAT.</Text>
          </Text>
          <Text style={styles.caption}>
            {APP_TAGLINE} Meet real people, make real connections and find
            someone who matches your kind of pagal.
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <PrimaryButton
            label={accountCreated ? "SIGN IN" : "SIGN UP NOW"}
            pill
            onPress={() =>
              navigation.navigate(accountCreated ? "Login" : "SignUp")
            }
            iconRight={<ArrowRight size={18} color={colors.white} strokeWidth={2.4} />}
          />
          <GoogleButton onPress={handleSocial} />
          <PrimaryButton
            label="LOGIN"
            pill
            variant="outline"
            onPress={() => navigation.navigate("Login")}
          />
          <Text style={styles.terms}>
            By signing up, you accept our{" "}
            <Text style={styles.link} onPress={showTerms}>
              terms
            </Text>{" "}
            and{" "}
            <Text style={styles.link} onPress={showTerms}>
              privacy policy
            </Text>
            .
          </Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  brandWrap: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  photoStrip: {
    flexDirection: "row",
    gap: 2,
    height: 188,
    marginTop: spacing.xxl,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  photo: {
    flex: 1,
    height: "100%",
    resizeMode: "cover",
  },
  hero: {
    marginTop: spacing.xxl,
    paddingHorizontal: 2,
  },
  tagline: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "900",
    fontStyle: "italic",
    color: colors.ink,
    letterSpacing: -1.3,
  },
  highlight: {
    backgroundColor: "#FFD32A",
    color: colors.ink,
  },
  caption: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.muted,
    marginTop: spacing.md,
    maxWidth: 320,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
    minHeight: spacing.xl,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  terms: {
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.body,
    textAlign: "center",
    marginTop: 4,
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "700",
    color: colors.ink,
  },
});
