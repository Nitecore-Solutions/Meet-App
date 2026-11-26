import React from "react";
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
import { Eye, Heart } from "lucide-react-native";

import { Avatar, TrustBadge } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, spacing } from "../../constants/theme";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import type { AppStackParamList } from "../../navigation/types";

export function VisitorsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { visitorProfiles, likedIds, likeProfile } = useDating();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Visitors"
        subtitle={`${visitorProfiles.length} people checked out your profile`}
        large
      />
      {visitorProfiles.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon={<Eye size={21} color={colors.ink} strokeWidth={2} />}
            message="No visitors yet. A complete profile with good photos gets noticed faster."
          />
        </View>
      ) : (
        <FlatList
          data={visitorProfiles}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const liked = likedIds.includes(item.id);
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate("ProfileDetail", { profileId: item.id })
                }
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Avatar source={item.photo} size={58} online={item.online} />
                <View style={styles.personText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}, {item.age}
                    </Text>
                    {item.verified ? (
                      <TrustBadge kind="verified" size={16} />
                    ) : null}
                    {item.phoneVerified ? (
                      <TrustBadge kind="phone" size={16} />
                    ) : null}
                  </View>
                  <Text style={styles.city} numberOfLines={1}>
                    {item.city}
                  </Text>
                  <Text style={styles.time}>
                    {index < 2
                      ? "Visited just now"
                      : index < 4
                        ? "Visited 2h ago"
                        : item.lastActive}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    liked ? `Liked ${item.name}` : `Like ${item.name} back`
                  }
                  onPress={() => {
                    if (liked) {
                      showToast("You already liked this profile.", "info");
                      return;
                    }
                    likeProfile(item.id);
                    showToast(`Like sent to ${item.name}.`, "success");
                  }}
                  style={({ pressed }) => [
                    styles.likeButton,
                    liked && styles.likeButtonDone,
                    { opacity: pressed ? 0.65 : 1 },
                  ]}
                >
                  <Heart
                    size={16}
                    color={liked ? colors.faint : colors.accent}
                    fill={liked ? colors.faint : "none"}
                    strokeWidth={2.2}
                  />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  personText: {
    flex: 1,
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
    flexShrink: 1,
  },
  city: {
    fontSize: 13,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  time: {
    fontSize: 10.5,
    color: colors.faint,
    marginTop: 3,
    fontWeight: "500",
  },
  likeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFDCEA",
  },
  likeButtonDone: {
    backgroundColor: colors.lineSoft,
    borderColor: colors.line,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
});
