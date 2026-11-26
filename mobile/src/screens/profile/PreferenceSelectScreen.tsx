import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Check, Search, Sparkles, X } from "lucide-react-native";

import { PrimaryButton } from "../../components/Buttons";
import { ScreenHeader } from "../../components/ScreenHeader";
import {
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
  ZODIAC_OPTIONS,
  ZODIAC_SYMBOLS,
} from "../../constants/catalog";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";
import type { Zodiac } from "../../types";

type Props = NativeStackScreenProps<AppStackParamList, "PreferenceSelect">;

const ZODIAC_DATES: Record<Zodiac, string> = {
  Aquarius: "Jan 20 – Feb 18",
  Pisces: "Feb 19 – Mar 20",
  Aries: "Mar 21 – Apr 19",
  Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22",
  Scorpio: "Oct 23 – Nov 21",
  Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19",
};

const INTEREST_EMOJI: Record<string, string> = {
  Travel: "✈️",
  Music: "🎧",
  Movies: "🎬",
  Foodie: "🍜",
  Fitness: "🏋️",
  Cricket: "🏏",
  Reading: "📚",
  Photography: "📸",
  Dancing: "💃",
  Cooking: "🍳",
  Art: "🎨",
  Gaming: "🎮",
  Fashion: "👗",
  Nature: "🌿",
  Pets: "🐾",
  Coffee: "☕",
  Adventure: "🧭",
  Yoga: "🧘",
  Startups: "🚀",
  Comedy: "😂",
};

const COPY = {
  zodiac: {
    title: "Select zodiac sign",
    subtitle: "Add your sun sign to your profile",
  },
  languages: {
    title: "Select languages",
    subtitle: "Share the languages you can chat in",
  },
  interests: {
    title: "Select interests",
    subtitle: "Pick things you genuinely enjoy",
  },
} as const;

export function PreferenceSelectScreen({ navigation, route }: Props) {
  const { field } = route.params;
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const copy = COPY[field];

  const initial = useMemo(() => {
    if (field === "zodiac") return profile.zodiac ? [profile.zodiac] : [];
    if (field === "languages") return profile.languages;
    return profile.interests;
  }, [field, profile]);

  const [selected, setSelected] = useState<string[]>(initial);
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const list =
      field === "zodiac"
        ? ZODIAC_OPTIONS
        : field === "languages"
          ? LANGUAGE_OPTIONS
          : INTEREST_OPTIONS;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter((option) => option.toLowerCase().includes(normalized));
  }, [field, query]);

  const showSearch = field !== "zodiac";

  function toggle(value: string) {
    if (field === "zodiac") {
      setSelected([value]);
      return;
    }
    setSelected((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length >= 10) {
        showToast("You can choose up to 10.", "info");
        return current;
      }
      return [...current, value];
    });
  }

  function save() {
    if (!selected.length) {
      showToast("Choose at least one option.", "error");
      return;
    }
    if (field === "zodiac") {
      updateUser({ zodiac: selected[0] as Zodiac });
      showToast(`Zodiac set to ${selected[0]}.`, "success");
    } else if (field === "languages") {
      updateUser({ languages: selected });
      showToast("Languages updated.", "success");
    } else {
      updateUser({ interests: selected });
      showToast("Interests updated.", "success");
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={copy.title}
        subtitle={copy.subtitle}
        onBack={() => navigation.goBack()}
      />

      {showSearch ? (
        <View style={styles.search}>
          <Search size={18} color={colors.muted} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              field === "languages" ? "Search language" : "Search interest"
            }
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FlatList
        data={options}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const active = selected.includes(item);
          const leading =
            field === "zodiac"
              ? ZODIAC_SYMBOLS[item as Zodiac]
              : field === "interests"
                ? INTEREST_EMOJI[item] ?? "✨"
                : item.slice(0, 1).toUpperCase();
          const hint =
            field === "zodiac"
              ? ZODIAC_DATES[item as Zodiac]
              : field === "languages"
                ? "Language"
                : "Interest";
          return (
            <Pressable
              accessibilityRole={field === "zodiac" ? "radio" : "checkbox"}
              accessibilityState={{ selected: active, checked: active }}
              onPress={() => toggle(item)}
              style={({ pressed }) => [
                styles.row,
                active && styles.rowActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.leading, active && styles.leadingActive]}>
                <Text style={styles.leadingText}>{leading}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {item}
                </Text>
                <Text style={styles.rowHint}>{hint}</Text>
              </View>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? (
                  <Check size={14} color={colors.white} strokeWidth={3.2} />
                ) : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Try a different spelling or a shorter search.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerHint}>
            <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.footerHintText}>
              {field === "interests"
                ? "You can pick up to 10 interests. Common interests help start better conversations."
                : field === "languages"
                  ? "You can pick up to 10 languages. It helps people know how to say hi."
                  : "Your zodiac sign adds a fun little detail to your profile."}
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selected.length
            ? `${selected.length} selected`
            : "Nothing selected yet"}
        </Text>
        <PrimaryButton
          label="SAVE"
          onPress={save}
          disabled={!selected.length}
          style={styles.save}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  search: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 11,
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowActive: {
    backgroundColor: colors.primaryTint,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderBottomColor: "transparent",
  },
  leading: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  leadingActive: {
    backgroundColor: colors.primarySoft,
  },
  leadingText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: "500",
    color: colors.ink,
  },
  rowLabelActive: {
    fontWeight: "700",
    color: colors.primaryDark,
  },
  rowHint: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  check: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.body,
  },
  emptyText: {
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 4,
    textAlign: "center",
  },
  footerHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  footerHintText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: colors.body,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  selectedCount: {
    flex: 1,
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "600",
  },
  save: {
    minWidth: 150,
    minHeight: 48,
  },
});
