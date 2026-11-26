import type { ImageSourcePropType } from "react-native";

export type Gender = "woman" | "man" | "other";

export type Zodiac =
  | "Aquarius"
  | "Pisces"
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn";

export type Profile = {
  id: string;
  name: string;
  gender?: Gender;
  age: number;
  city: string;
  state: string;
  distanceKm: number;
  photo: ImageSourcePropType;
  photos: ImageSourcePropType[];
  online: boolean;
  verified: boolean;
  phoneVerified: boolean;
  facebookVerified: boolean;
  relationshipStatus: string;
  lookingFor: string;
  about: string;
  profession: string;
  education: string;
  drinking: string;
  smoking: string;
  eating: string;
  zodiac: Zodiac;
  languages: string[];
  interests: string[];
  lastActive: string;
  mutualInterests: string[];
};

export type HiddenFields = {
  relationship: boolean;
  age: boolean;
  city: boolean;
  profession: boolean;
  education: boolean;
};

export type MyProfile = Omit<Profile, "id"> & {
  id: "me";
  gender: Gender;
  interestedIn: "women" | "men" | "everyone";
  phone: string;
  email: string;
  joined: string;
  hidden: HiddenFields;
  isPlus: boolean;
};

export type MatchPreferences = {
  minAge: number;
  maxAge: number;
  city: string;
  showPhotosOnly: boolean;
  showOtherCities: boolean;
  radiusKm: number;
};

export type DistanceUnit = "Kilometers" | "Miles";

export type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "them";
  at: string;
};

export type Chat = {
  id: string;
  profileId: string;
  messages: ChatMessage[];
  unread: number;
  updatedAt: string;
  newMatch: boolean;
};

export type ReportReason =
  | "Photo is inappropriate"
  | "Harassment or abuse"
  | "Fake profile"
  | "Spam or scam"
  | "Underage user"
  | "Some other reason";

export type SignUpDraft = {
  name: string;
  day: string;
  month: string;
  year: string;
  gender: Gender;
  interestedIn: "women" | "men" | "everyone";
  city: string;
  cityState: string;
};

export type PremiumPlan = {
  id: string;
  label: string;
  price: number;
  perMonth: number;
  badge?: string;
};
