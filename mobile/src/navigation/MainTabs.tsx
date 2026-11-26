import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { MatchesScreen } from "../screens/main/MatchesScreen";
import { OnlineScreen } from "../screens/main/OnlineScreen";
import { LikesYouScreen } from "../screens/main/LikesYouScreen";
import { VisitorsScreen } from "../screens/main/VisitorsScreen";
import { MessagesScreen } from "../screens/main/MessagesScreen";
import { PagalTabBar } from "./TabBar";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Matches"
      tabBar={(props) => <PagalTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: "#FFFFFF" },
        animation: "fade",
      }}
    >
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Online" component={OnlineScreen} />
      <Tab.Screen name="LikesYou" component={LikesYouScreen} />
      <Tab.Screen name="Visitors" component={VisitorsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  );
}
