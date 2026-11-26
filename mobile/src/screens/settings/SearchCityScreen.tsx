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
import { Check, MapPin, Search, X } from "lucide-react-native";

import { ScreenHeader } from "../../components/ScreenHeader";
import { CITY_OPTIONS } from "../../constants/catalog";
import { colors, radii, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useDating } from "../../context/DatingContext";
import { useToast } from "../../context/ToastContext";
import { defaultMyProfile } from "../../data/profiles";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "SearchCity">;

export function SearchCityScreen({ navigation, route }: Props) {
  const { target } = route.params;
  const { user, updateUser } = useAuth();
  const { preferences, setPreferences } = useDating();
  const { showToast } = useToast();
  const profile = user ?? defaultMyProfile;
  const currentCity = target === "profile" ? profile.city : preferences.city;
  const [query, setQuery] = useState("");

  const cities = useMemo(() => {
    const seen = new Set<string>();
    return CITY_OPTIONS.filter((entry) => {
      const key = `${entry.city}|${entry.state}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((entry) => ({
      ...entry,
      key: `${entry.city}|${entry.state}`,
    }));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cities;
    return cities.filter(
      (entry) =>
        entry.city.toLowerCase().includes(normalized) ||
        entry.state.toLowerCase().includes(normalized)
    );
  }, [cities, query]);

  function choose(city: string, state: string) {
    if (target === "profile") {
      updateUser({ city, state });
      showToast(`City updated to ${city}.`, "success");
    } else {
      setPreferences({ ...preferences, city });
      showToast(`Matches will now be searched in ${city}.`, "success");
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Search city"
        subtitle={
          target === "preferences"
            ? "Choose where your matches come from"
            : "Choose the city on your profile"
        }
        onBack={() => navigation.goBack()}
      />

      <View style={styles.search}>
        <Search size={19} color={colors.muted} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search city"
          placeholderTextColor={colors.faint}
          style={styles.searchInput}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={17} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.listLabel}>
            {query ? "SEARCH RESULTS" : "ALL CITIES"}
          </Text>
        }
        renderItem={({ item }) => {
          const active = item.city === currentCity;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => choose(item.city, item.state)}
              style={({ pressed }) => [
                styles.row,
                active && styles.rowActive,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <View style={[styles.pin, active && styles.pinActive]}>
                <MapPin
                  size={17}
                  color={active ? colors.primary : colors.muted}
                  strokeWidth={2.2}
                />
              </View>
              <Text style={[styles.city, active && styles.cityActive]}>
                {item.city}, {item.state}
              </Text>
              {active ? (
                <View style={styles.check}>
                  <Check size={13} color={colors.white} strokeWidth={3.2} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No cities found</Text>
            <Text style={styles.emptyText}>
              Try a shorter name, or check the spelling.
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
  search: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    paddingVertical: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  listLabel: {
    fontSize: 9.5,
    letterSpacing: 0.9,
    fontWeight: "700",
    color: colors.faint,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 54,
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
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pinActive: {
    backgroundColor: colors.primarySoft,
  },
  city: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: "500",
  },
  cityActive: {
    fontWeight: "700",
    color: colors.primaryDark,
  },
  check: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
});
