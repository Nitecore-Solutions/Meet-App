import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { profilePhotos } from "../data/images";
import { defaultMyProfile } from "../data/profiles";
import type { MyProfile, SignUpDraft } from "../types";

const SESSION_KEY = "@pagalpagal/session/v1";
const PROFILE_KEY = "@pagalpagal/profile/v1";

type AuthContextValue = {
  ready: boolean;
  user: MyProfile | null;
  signedIn: boolean;
  signIn: (contact: string) => Promise<void>;
  signUp: (draft: SignUpDraft) => Promise<void>;
  updateUser: (patch: Partial<MyProfile>) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAge(day: string, month: string, year: string) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return 26;
  const now = new Date();
  let age = now.getFullYear() - y;
  const hadBirthday =
    now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return Math.max(18, Math.min(99, age));
}

function joinMonth() {
  return new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<MyProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [session, storedProfile] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
        ]);
        if (!mounted) return;
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile) as MyProfile;
          setUser(parsed);
        }
        if (session === "signed-in") {
          setSignedIn(true);
          if (!storedProfile) setUser(defaultMyProfile);
        }
      } catch {
        // A broken local cache should never block the preview.
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistProfile = useCallback((next: MyProfile) => {
    setUser(next);
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const signIn = useCallback(async () => {
    const next = user ?? defaultMyProfile;
    persistProfile(next);
    setSignedIn(true);
    await AsyncStorage.setItem(SESSION_KEY, "signed-in").catch(() => {});
  }, [persistProfile, user]);

  const signUp = useCallback(
    async (draft: SignUpDraft) => {
      const signupPhoto =
        draft.gender === "woman" ? profilePhotos.aisha : profilePhotos.arjun;
      const next: MyProfile = {
        ...defaultMyProfile,
        name: draft.name.trim() || "Aarav",
        age: toAge(draft.day, draft.month, draft.year),
        city: draft.city || defaultMyProfile.city,
        state: draft.cityState || defaultMyProfile.state,
        gender: draft.gender,
        interestedIn: draft.interestedIn,
        joined: joinMonth(),
        phone: "New member",
        phoneVerified: false,
        photo: signupPhoto,
        photos: [signupPhoto],
      };
      persistProfile(next);
      setSignedIn(true);
      await AsyncStorage.setItem(SESSION_KEY, "signed-in").catch(() => {});
    },
    [persistProfile]
  );

  const updateUser = useCallback(
    (patch: Partial<MyProfile>) => {
      const base = user ?? defaultMyProfile;
      const next = { ...base, ...patch };
      persistProfile(next);
    },
    [persistProfile, user]
  );

  const signOut = useCallback(async () => {
    setSignedIn(false);
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ ready, user, signedIn, signIn, signUp, updateUser, signOut }),
    [ready, user, signedIn, signIn, signUp, updateUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
