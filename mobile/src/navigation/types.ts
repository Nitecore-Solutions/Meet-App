import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Otp: { email: string; mode: "signup" | "login"; devCode?: string };
  ForgotPassword: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Matches: undefined;
  Online: undefined;
  LikesYou: undefined;
  Visitors: undefined;
  Messages: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  MyProfile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  BasicInfo: undefined;
  Photos: undefined;
  AboutMe: undefined;
  Verification: undefined;
  PreferenceSelect: {
    field: "zodiac" | "languages" | "interests";
  };
  MatchPreferences: undefined;
  SearchCity: { target: "profile" | "preferences" };
  ProfileDetail: { profileId: string };
  Chat: { profileId: string };
  Premium: { source?: string } | undefined;
  ProfileList: { mode: "liked" | "skipped" | "blocked" | "visitors" };
  HelpSupport: undefined;
  Legal: { kind: "safety" | "terms" | "privacy" | "conduct" };
  Orders: undefined;
};
