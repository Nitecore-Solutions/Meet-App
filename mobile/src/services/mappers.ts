import type { ImageSourcePropType } from "react-native";

import { profilePhotos } from "../data/images";
import type { Chat, ChatMessage, Gender, Profile, Zodiac } from "../types";

const fallbacks: ImageSourcePropType[] = [
  profilePhotos.aisha,
  profilePhotos.khushi,
  profilePhotos.ishita,
  profilePhotos.rina,
  profilePhotos.aarti,
  profilePhotos.arjun,
];

const ZODIACS: Zodiac[] = [
  "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo",
  "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn",
];

export type BackendProfile = {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  relationshipStatus?: string | null;
  lookingFor?: string | null;
  profession?: string | null;
  education?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  eating?: string | null;
  zodiac?: string | null;
  languages?: string[];
  interests?: string[];
  online?: boolean;
  verified?: boolean;
  phoneVerified?: boolean;
  facebookVerified?: boolean;
  distanceKm?: number | null;
  mutualInterests?: string[];
  lastActiveAt?: string | null;
  avatarUrl?: string | null;
  avatar?: { url?: string | null } | null;
  photos?: { url?: string | null }[];
};

function image(url: string | null | undefined, index: number): ImageSourcePropType {
  return url ? { uri: url } : (fallbacks[index % fallbacks.length] as ImageSourcePropType);
}

export function mapBackendProfile(p: BackendProfile, index = 0): Profile {
  const zodiac = ZODIACS.find((z) => z.toLowerCase() === String(p.zodiac ?? "").toLowerCase());
  const photoUrls = (p.photos ?? []).map((photo) => photo.url).filter(Boolean) as string[];
  const avatar = p.avatar?.url ?? p.avatarUrl ?? photoUrls[0];
  return {
    id: p.id,
    name: p.name,
    age: p.age ?? 25,
    city: p.city ?? "",
    state: p.state ?? "",
    distanceKm: p.distanceKm ?? 0,
    photo: image(avatar, index),
    photos: photoUrls.length
      ? photoUrls.map((url, i) => image(url, i))
      : [image(avatar, index)],
    online: Boolean(p.online),
    verified: Boolean(p.verified),
    phoneVerified: Boolean(p.phoneVerified),
    facebookVerified: Boolean(p.facebookVerified),
    relationshipStatus: p.relationshipStatus ?? "",
    lookingFor: p.lookingFor ?? "",
    about: p.bio ?? "",
    profession: p.profession ?? "",
    education: p.education ?? "",
    drinking: p.drinking ?? "",
    smoking: p.smoking ?? "",
    eating: p.eating ?? "",
    zodiac: zodiac ?? "Aries",
    languages: p.languages ?? [],
    interests: p.interests ?? [],
    lastActive: p.lastActiveAt ?? "",
    mutualInterests: p.mutualInterests ?? [],
    gender: (p.gender as Gender | undefined) ?? undefined,
  };
}

export type BackendMessage = {
  id: string;
  text?: string | null;
  senderId: string;
  mine?: boolean;
  createdAt: string;
};

export function mapBackendMessage(message: BackendMessage, viewerId: string): ChatMessage {
  return {
    id: message.id,
    text: message.text ?? "",
    sender: message.mine ?? message.senderId === viewerId ? "me" : "them",
    at: message.createdAt,
  };
}

export type BackendConversation = {
  id: string;
  profileId: string;
  profile?: BackendProfile;
  lastMessage?: BackendMessage | null;
  unread: number;
  newMatch: boolean;
  updatedAt: string;
};

export function mapBackendConversation(
  conversation: BackendConversation,
  viewerId: string,
  profile?: Profile
): Chat {
  return {
    id: conversation.id,
    profileId: conversation.profileId,
    messages: conversation.lastMessage
      ? [mapBackendMessage(conversation.lastMessage, viewerId)]
      : [],
    unread: conversation.unread ?? 0,
    updatedAt: conversation.updatedAt,
    newMatch: Boolean(conversation.newMatch),
    ...(profile ? { profile } : {}),
  } as Chat;
}
