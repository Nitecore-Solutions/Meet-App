import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radii, spacing } from "../constants/theme";

export function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? (
        <Text style={styles.hint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function TextField({
  label,
  required,
  hint,
  error,
  containerStyle,
  rightAccessory,
  filled = false,
  ...props
}: TextInputProps & {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  rightAccessory?: React.ReactNode;
  filled?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <FieldLabel label={label} required={required} hint={hint} />
      ) : null}
      <View
        style={[
          styles.inputWrap,
          filled && styles.inputFilled,
          focused && (filled ? styles.inputFilledFocused : styles.inputWrapFocused),
          error ? styles.inputWrapError : null,
        ]}
      >
        <TextInput
          {...props}
          placeholderTextColor={colors.faint}
          style={[styles.input, props.style]}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function TextArea({
  label,
  hint,
  error,
  minHeight = 160,
  value,
  maxLength,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  minHeight?: number;
}) {
  const [focused, setFocused] = useState(false);
  const length = typeof value === "string" ? value.length : 0;

  return (
    <View style={styles.wrap}>
      {label ? <FieldLabel label={label} hint={hint} /> : null}
      <View
        style={[
          styles.textAreaWrap,
          { minHeight },
          focused && styles.inputWrapFocused,
          error ? styles.inputWrapError : null,
        ]}
      >
        <TextInput
          {...props}
          value={value}
          maxLength={maxLength}
          multiline
          textAlignVertical="top"
          placeholderTextColor={colors.faint}
          style={[styles.textArea, props.style]}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
      </View>
      <View style={styles.metaRow}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        {typeof maxLength === "number" ? (
          <Text style={styles.counter}>
            {length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  required: {
    color: colors.primary,
  },
  hint: {
    fontSize: 10.5,
    color: colors.faint,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputWrapFocused: {
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  inputFilled: {
    backgroundColor: "#F4F2F6",
    borderColor: "transparent",
    borderRadius: radii.sm,
  },
  inputFilledFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
  },
  inputWrapError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
    fontWeight: "500",
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  accessory: {
    marginLeft: spacing.sm,
  },
  textAreaWrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
    fontWeight: "500",
    minHeight: 110,
    outlineWidth: 0,
    outlineStyle: "solid",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  counter: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: "600",
    marginLeft: "auto",
  },
  error: {
    fontSize: 11.5,
    color: colors.danger,
    fontWeight: "600",
    flexShrink: 1,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#F3CDCF",
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
  },
});
