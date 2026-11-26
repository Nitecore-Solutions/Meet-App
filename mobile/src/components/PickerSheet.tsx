import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Search, X } from "lucide-react-native";

import { colors, radii, shadow, spacing } from "../constants/theme";
import { PrimaryButton } from "./Buttons";

export type PickerOption = {
  value: string;
  label: string;
  hint?: string;
  leading?: React.ReactNode;
};

export function PickerSheet({
  visible,
  title,
  subtitle,
  options,
  selected,
  onClose,
  onSave,
  multi = false,
  searchPlaceholder = "Search",
  showSearch = true,
  emptyText = "Nothing available right now.",
  saveLabel = "Save",
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  selected: string[];
  onClose: () => void;
  onSave: (values: string[]) => void;
  multi?: boolean;
  searchPlaceholder?: string;
  showSearch?: boolean;
  emptyText?: string;
  saveLabel?: string;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setQuery("");
    }
    // The selection is only re-read when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.hint?.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  const searchable = showSearch && options.length > 6;

  function toggle(value: string) {
    if (!multi) {
      onSave([value]);
      onClose();
      return;
    }
    setDraft((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close picker"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={styles.close}
            >
              <X size={20} color={colors.body} strokeWidth={2.2} />
            </Pressable>
          </View>

          {searchable ? (
            <View style={styles.search}>
              <Search size={18} color={colors.muted} strokeWidth={2.2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
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
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = draft.includes(item.value);
              return (
                <Pressable
                  accessibilityRole={multi ? "checkbox" : "button"}
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                  onPress={() => toggle(item.value)}
                  style={({ pressed }) => [
                    styles.option,
                    { opacity: pressed ? 0.65 : 1 },
                  ]}
                >
                  {item.leading ? (
                    <View style={styles.leading}>{item.leading}</View>
                  ) : null}
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{item.label}</Text>
                    {item.hint ? (
                      <Text style={styles.optionHint}>{item.hint}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.check,
                      multi && styles.checkSquare,
                      isSelected && styles.checkSelected,
                    ]}
                  >
                    {isSelected ? (
                      <Check size={15} color={colors.white} strokeWidth={3.2} />
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No matches found</Text>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            }
          />

          {multi ? (
            <View style={styles.footer}>
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={onClose}
                uppercase={false}
                style={styles.footerButton}
              />
              <PrimaryButton
                label={saveLabel}
                variant="secondary"
                onPress={() => {
                  onSave(draft);
                  onClose();
                }}
                uppercase={false}
                style={styles.footerButton}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    ...shadow.raised,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 4,
    fontWeight: "500",
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    minHeight: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
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
  list: {
    flexShrink: 1,
    flexGrow: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 13,
    minHeight: 50,
  },
  leading: {
    width: 28,
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
  },
  optionHint: {
    fontSize: 11.5,
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
  checkSquare: {
    borderRadius: 6,
  },
  checkSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  empty: {
    paddingTop: spacing.xxxl,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
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
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
});
