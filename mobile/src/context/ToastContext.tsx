import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, CheckCircle2, Info } from "lucide-react-native";

import { colors, radii, shadow, spacing } from "../constants/theme";

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -8,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      opacity.setValue(0);
      translateY.setValue(-10);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      timer.current = setTimeout(hide, 2800);
    },
    [hide, opacity, translateY]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const palette =
    toast?.type === "success"
      ? { bg: colors.successSoft, fg: colors.successDark, border: "#C9EBD9" }
      : toast?.type === "error"
        ? { bg: colors.dangerSoft, fg: colors.dangerDark, border: "#F3CDCF" }
        : { bg: colors.secondarySoft, fg: colors.secondaryDark, border: "#D1DFFC" };

  const Icon =
    toast?.type === "success"
      ? CheckCircle2
      : toast?.type === "error"
        ? AlertCircle
        : Info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              top: Math.max(insets.top, 12) + 8,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={[
              styles.toast,
              { backgroundColor: palette.bg, borderColor: palette.border },
            ]}
          >
            <Icon size={18} color={palette.fg} strokeWidth={2.4} />
            <Text style={[styles.text, { color: palette.fg }]} numberOfLines={3}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 560,
    ...shadow.raised,
  },
  text: {
    flexShrink: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "600",
  },
});
