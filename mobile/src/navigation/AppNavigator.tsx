import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/theme";
import { AboutMeScreen } from "../screens/profile/AboutMeScreen";
import { BasicInfoScreen } from "../screens/profile/BasicInfoScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { MyProfileScreen } from "../screens/profile/MyProfileScreen";
import { PhotosScreen } from "../screens/profile/PhotosScreen";
import { PreferenceSelectScreen } from "../screens/profile/PreferenceSelectScreen";
import { ProfileDetailScreen } from "../screens/profile/ProfileDetailScreen";
import { VerificationScreen } from "../screens/profile/VerificationScreen";
import { ChatScreen } from "../screens/main/ChatScreen";
import { HelpSupportScreen } from "../screens/settings/HelpSupportScreen";
import { LegalScreen } from "../screens/settings/LegalScreen";
import { MatchPreferencesScreen } from "../screens/settings/MatchPreferencesScreen";
import { OrdersScreen } from "../screens/settings/OrdersScreen";
import { SearchCityScreen } from "../screens/settings/SearchCityScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { PremiumScreen } from "../screens/premium/PremiumScreen";
import { ProfileListScreen } from "../screens/profile/ProfileListScreen";
import { MainTabs } from "./MainTabs";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
      <Stack.Screen name="Photos" component={PhotosScreen} />
      <Stack.Screen name="AboutMe" component={AboutMeScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="PreferenceSelect" component={PreferenceSelectScreen} />
      <Stack.Screen name="MatchPreferences" component={MatchPreferencesScreen} />
      <Stack.Screen name="SearchCity" component={SearchCityScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="ProfileList" component={ProfileListScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  );
}
