import type { MyProfile } from "../types";
import { profilePhotos } from "./images";

/**
 * Neutral starting shape for the signed-in profile. Real values come from the
 * backend (/api/users/me); this only keeps forms and empty states type-safe.
 */
export const defaultMyProfile: MyProfile = {
  id: "me",
  name: "",
  age: 18,
  city: "",
  state: "",
  distanceKm: 0,
  photo: profilePhotos.arjun,
  photos: [],
  online: false,
  verified: false,
  phoneVerified: false,
  facebookVerified: false,
  relationshipStatus: "",
  lookingFor: "",
  about: "",
  profession: "",
  education: "",
  drinking: "",
  smoking: "",
  eating: "",
  zodiac: "Aries",
  languages: [],
  interests: [],
  lastActive: "",
  mutualInterests: [],
  gender: "man",
  interestedIn: "everyone",
  phone: "",
  email: "",
  joined: "",
  hidden: {
    relationship: false,
    age: false,
    city: false,
    profession: false,
    education: false,
  },
  isPlus: false,
};
