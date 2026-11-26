import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Eye,
  Heart,
  MessageCircle,
  MessagesSquare,
  UserRound,
} from "lucide-react-native";

import { ONLINE_NOW } from "../constants/config";
import { colors, shadow } from "../constants/theme";
import { useDating } from "../context/DatingContext";
import type { MainTabParamList } from "./types";

type IconProps = {
  focused: boolean;
  color: string;
};

function OnlineIcon({ focused, color }: IconProps) {
  return (
    <View>
      <UserRound size={23} color={color} strokeWidth={focused ? 2.4 : 2} />
      <View style={[styles.greenDot, focused && styles.greenDotActive]} />
    </View>
  );
}

function HeartIcon({ focused, color }: IconProps) {
  return (
    <Heart
      size={23}
      color={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? colors.accent : "none"}
    />
  );
}

const tabs: Record<
  keyof MainTabParamList,
  {
    label: string;
    render: (props: IconProps) => React.ReactNode;
    badge?: "visitors" | "messages";
  }
> = {
  Matches: {
    label: "Matches",
    render: ({ focused, color }) => (
      <MessagesSquare
        size={23}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
      />
    ),
  },
  Online: {
    label: `${ONLINE_NOW.toLocaleString("en-IN")} Online`,
    render: (props) => <OnlineIcon {...props} />,
  },
  LikesYou: {
    label: "Likes you",
    render: (props) => <HeartIcon {...props} />,
  },
  Visitors: {
    label: "Visitors",
    render: ({ focused, color }) => (
      <Eye size={23} color={color} strokeWidth={focused ? 2.5 : 2} />
    ),
    badge: "visitors",
  },
  Messages: {
    label: "Messages",
    render: ({ focused, color }) => (
      <MessageCircle
        size={23}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
        fill={focused ? "rgba(247,36,114,0.10)" : "none"}
      />
    ),
    badge: "messages",
  },
};

export function PagalTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount, visitorIds } = useDating();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 6) },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const config = tabs[route.name as keyof MainTabParamList];
        const options = descriptors[route.key].options;
        const color = focused
          ? route.name === "Online"
            ? colors.successDark
            : colors.accent
          : colors.muted;
        const badgeCount =
          config.badge === "visitors"
            ? visitorIds.length
            : config.badge === "messages"
              ? unreadCount
              : 0;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ?? config.label
            }
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View style={styles.iconWrap}>
              {config.render({ focused, color })}
              {badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.label,
                { color },
                route.name === "Online" && styles.onlineLabel,
                focused && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 6,
    paddingHorizontal: 4,
    ...shadow.card,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    gap: 2,
  },
  iconWrap: {
    position: "relative",
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  labelActive: {
    fontWeight: "700",
  },
  onlineLabel: {
    fontSize: 9.2,
  },
  greenDot: {
    position: "absolute",
    right: -1,
    top: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  greenDotActive: {
    width: 10,
    height: 10,
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: colors.white,
  },
});
