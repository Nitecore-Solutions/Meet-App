import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  type Theme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { colors } from "./src/constants/theme";
import { AuthProvider } from "./src/context/AuthContext";
import { DatingProvider } from "./src/context/DatingContext";
import { ToastProvider } from "./src/context/ToastContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.surface,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
    notification: colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DatingProvider>
          <ToastProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ToastProvider>
        </DatingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
