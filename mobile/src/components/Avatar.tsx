import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Check, MessageCircle, Smartphone } from "lucide-react-native";

import { colors } from "../constants/theme";

export function Avatar({
  source,
  size = 52,
  online = false,
  ring = false,
  onPress,
  style,
  initials = "PP",
}: {
  source?: ImageSourcePropType | null;
  size?: number;
  online?: boolean;
  ring?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  initials?: string;
}) {
  const content = (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        ring && { borderWidth: 2, borderColor: colors.primarySoft },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.3) }]}>
            {initials}
          </Text>
        </View>
      )}
      {online ? (
        <View
          style={[
            styles.online,
            {
              width: Math.max(12, size * 0.24),
              height: Math.max(12, size * 0.24),
              borderRadius: size,
              borderWidth: Math.max(2, size * 0.035),
            },
          ]}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      {content}
    </Pressable>
  );
}

export function TrustBadge({
  kind,
  size = 20,
}: {
  kind: "phone" | "facebook" | "verified" | "star";
  size?: number;
}) {
  if (kind === "facebook") {
    return (
      <View
        style={[
          styles.trustBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#1877F2",
          },
        ]}
      >
        <Text style={[styles.facebook, { fontSize: size * 0.66 }]}>f</Text>
      </View>
    );
  }

  if (kind === "verified") {
    return (
      <View
        style={[
          styles.trustBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#1C86F5",
          },
        ]}
      >
        <Check size={size * 0.62} color={colors.white} strokeWidth={3.4} />
      </View>
    );
  }

  if (kind === "star") {
    return (
      <View
        style={[
          styles.trustBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.warning,
          },
        ]}
      >
        <Text style={{ color: colors.white, fontSize: size * 0.55 }}>★</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.trustBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.success,
        },
      ]}
    >
      <Smartphone size={size * 0.58} color={colors.white} strokeWidth={2.6} />
    </View>
  );
}

export function NameLine({
  name,
  age,
  city,
  phoneVerified = false,
  facebookVerified = false,
  verified = false,
  stacked = true,
  nameStyle,
}: {
  name: string;
  age?: number;
  city?: string;
  phoneVerified?: boolean;
  facebookVerified?: boolean;
  verified?: boolean;
  stacked?: boolean;
  nameStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.nameBlock}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, nameStyle]} numberOfLines={1}>
          {name}
          {typeof age === "number" ? `, ${age}` : ""}
        </Text>
        {verified ? <TrustBadge kind="verified" size={18} /> : null}
        {phoneVerified ? <TrustBadge kind="phone" size={18} /> : null}
        {facebookVerified ? <TrustBadge kind="facebook" size={18} /> : null}
      </View>
      {city ? (
        <Text style={styles.city} numberOfLines={1}>
          {stacked ? city : city}
        </Text>
      ) : null}
    </View>
  );
}

export function MessageBubbleBadge({
  count,
  size = 20,
}: {
  count?: number;
  size?: number;
}) {
  if (!count) return null;
  return (
    <View
      style={[
        styles.countBadge,
        {
          minWidth: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={styles.countText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    backgroundColor: colors.lineSoft,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  initials: {
    fontWeight: "800",
    color: colors.accentDark,
  },
  online: {
    position: "absolute",
    right: -1,
    bottom: -1,
    backgroundColor: colors.success,
    borderColor: colors.white,
  },
  trustBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  facebook: {
    color: colors.white,
    fontWeight: "900",
    lineHeight: 17,
  },
  nameBlock: {
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontSize: 16.5,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.15,
    flexShrink: 1,
  },
  city: {
    fontSize: 13.5,
    color: colors.body,
    marginTop: 2,
    fontWeight: "500",
  },
  countBadge: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  countText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: "800",
  },
});

export function ChatFlourish() {
  return <MessageCircle size={14} color={colors.success} />;
}
