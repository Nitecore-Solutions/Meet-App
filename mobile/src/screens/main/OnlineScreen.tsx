import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Avatar, TrustBadge } from "../../components/Avatar";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, radii, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import type { AppStackParamList } from "../../navigation/types";

export function OnlineScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { ensureChat, blockedIds, profiles } = useDating();

  const onlineProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.gender !== "man" &&
          profile.online &&
          !blockedIds.includes(profile.id)
      ),
    [profiles, blockedIds]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={`New and Online (${onlineProfiles.length})`} large />
      <FlatList
        data={onlineProfiles}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              onPress={() =>
                navigation.navigate("ProfileDetail", { profileId: item.id })
              }
              style={({ pressed }) => [
                styles.person,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Avatar source={item.photo} size={64} online={item.online} />
              <View style={styles.personText}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.verified ? (
                    <TrustBadge kind="verified" size={17} />
                  ) : null}
                  {item.phoneVerified ? (
                    <TrustBadge kind="phone" size={17} />
                  ) : null}
                  {item.facebookVerified ? (
                    <TrustBadge kind="facebook" size={17} />
                  ) : null}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.age}, {item.city}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chat now with ${item.name}`}
              onPress={() => {
                ensureChat(item.id);
                navigation.navigate("Chat", { profileId: item.id });
              }}
              style={({ pressed }) => [
                styles.chatButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.chatLabel}>Chat Now</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <Text style={styles.footerText}>
              Tip: tap a profile to see their full story.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
  },
  person: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minWidth: 0,
  },
  personText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15.5,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  chatButton: {
    backgroundColor: colors.success,
    borderRadius: radii.sm,
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chatLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginLeft: spacing.xl + 64 + spacing.md,
  },
  listFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: 11.5,
    color: colors.faint,
    textAlign: "center",
    fontWeight: "500",
  },
});
