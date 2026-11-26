import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/theme";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { OtpScreen } from "../screens/auth/OtpScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
