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
import {
  apiConfigured,
  apiFetch,
  clearTokens,
  getAccessToken,
  saveTokens,
  type SessionTokens,
} from "../services/api";
import type { MyProfile, SignUpDraft } from "../types";
import { ageFromDate } from "../utils/format";

const SESSION_KEY = "@pagalpagal/session/v1";
const PROFILE_KEY = "@pagalpagal/profile/v1";

type BackendUser = {
  id?: string;
  name?: string;
  email?: string;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  gender?: string | null;
  interestedIn?: string | null;
  isPlus?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string | null;
};

type SessionResponse = { user: BackendUser; tokens: SessionTokens };
type OtpResponse = {
  otpRequired?: boolean;
  verificationRequired?: boolean;
  devCode?: string;
  email?: string;
};
type SimpleResponse = { ok?: boolean; devCode?: string; devLink?: string };

type RegisterInput = SignUpDraft & { email: string; password: string };
type OtpPurpose = "verify_email" | "login";

type AuthContextValue = {
  ready: boolean;
  user: MyProfile | null;
  signedIn: boolean;
  apiEnabled: boolean;
  /** Legacy mock-mode helpers (used by Welcome/Facebook preview). */
  signIn: (contact: string) => Promise<void>;
  signUp: (draft: SignUpDraft) => Promise<void>;
  /** Email/password + OTP flow. */
  requestLoginOtp: (email: string, password: string) => Promise<OtpResponse>;
  verifyLoginOtp: (email: string, code: string) => Promise<void>;
  registerWithOtp: (input: RegisterInput) => Promise<OtpResponse>;
  verifySignupOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string, purpose: OtpPurpose) => Promise<SimpleResponse>;
  forgotPassword: (email: string) => Promise<SimpleResponse>;
  updateUser: (patch: Partial<MyProfile>) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let pendingDraft: RegisterInput | null = null;

function toAge(day: string, month: string, year: string) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!d || !m || !y) return 26;
  return Math.max(18, Math.min(99, ageFromDate(y, m, d)));
}

function joinMonth() {
  return new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function fromBackendUser(user: BackendUser): MyProfile {
  return {
    ...defaultMyProfile,
    id: "me",
    name: user.name ?? defaultMyProfile.name,
    email: user.email ?? "",
    phone: user.email ?? "New member",
    age: user.age ?? defaultMyProfile.age,
    city: user.city ?? defaultMyProfile.city,
    state: user.state ?? defaultMyProfile.state,
    gender: (user.gender as MyProfile["gender"]) ?? defaultMyProfile.gender,
    interestedIn:
      (user.interestedIn as MyProfile["interestedIn"]) ?? defaultMyProfile.interestedIn,
    verified: Boolean(user.emailVerified),
    isPlus: Boolean(user.isPlus),
    photo: user.avatarUrl ? { uri: user.avatarUrl } : defaultMyProfile.photo,
    joined: joinMonth(),
  };
}

function fromDraft(draft: RegisterInput): MyProfile {
  const signupPhoto =
    draft.gender === "woman" ? profilePhotos.aisha : profilePhotos.arjun;
  return {
    ...defaultMyProfile,
    id: "me",
    name: draft.name.trim() || "Aarav",
    age: toAge(draft.day, draft.month, draft.year),
    city: draft.city || defaultMyProfile.city,
    state: draft.cityState || defaultMyProfile.state,
    gender: draft.gender,
    interestedIn: draft.interestedIn,
    email: draft.email,
    phone: draft.email,
    verified: false,
    joined: joinMonth(),
    photo: signupPhoto,
    photos: [signupPhoto],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<MyProfile | null>(null);

  const persistProfile = useCallback((next: MyProfile) => {
    setUser(next);
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const finishSession = useCallback(
    async (tokens: SessionTokens, backendUser?: BackendUser) => {
      await saveTokens(tokens);
      let profile: MyProfile;
      if (backendUser) {
        profile = fromBackendUser(backendUser);
      } else if (pendingDraft) {
        profile = fromDraft(pendingDraft);
      } else {
        profile = user ?? defaultMyProfile;
      }
      persistProfile(profile);
      setSignedIn(true);
      await AsyncStorage.setItem(SESSION_KEY, "signed-in").catch(() => {});
    },
    [persistProfile, user]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [session, storedProfile, token] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
          getAccessToken(),
        ]);
        if (!mounted) return;
        if (storedProfile) setUser(JSON.parse(storedProfile) as MyProfile);
        if (apiConfigured && token) {
          try {
            const result = await apiFetch<{ user: BackendUser }>("/api/auth/session", {
              token,
            });
            if (mounted) {
              setUser(fromBackendUser(result.user));
              setSignedIn(true);
            }
          } catch {
            await clearTokens().catch(() => {});
          }
        } else if (session === "signed-in") {
          setSignedIn(true);
          if (!storedProfile) setUser(defaultMyProfile);
        }
      } catch {
        // A broken local cache should never block the app.
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Legacy preview helpers. */
  const signIn = useCallback(
    async (contact: string) => {
      const next: MyProfile = {
        ...(user ?? defaultMyProfile),
        email: contact.includes("@") ? contact : (user?.email ?? ""),
        phone: contact,
      };
      persistProfile(next);
      setSignedIn(true);
      await AsyncStorage.setItem(SESSION_KEY, "signed-in").catch(() => {});
    },
    [persistProfile, user]
  );

  const signUp = useCallback(
    async (draft: SignUpDraft) => {
      const next = fromDraft({ ...draft, email: "", password: "" });
      persistProfile(next);
      setSignedIn(true);
      await AsyncStorage.setItem(SESSION_KEY, "signed-in").catch(() => {});
    },
    [persistProfile]
  );

  const requestLoginOtp = useCallback(async (email: string, password: string) => {
    if (!apiConfigured) return { otpRequired: true, devCode: "123456", email };
    return apiFetch<OtpResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }, []);

  const verifyLoginOtp = useCallback(
    async (email: string, code: string) => {
      if (!apiConfigured) {
        await signIn(email);
        return;
      }
      const result = await apiFetch<SessionResponse>("/api/auth/verify-login-otp", {
        method: "POST",
        body: { email, code },
      });
      await finishSession(result.tokens, result.user);
    },
    [finishSession, signIn]
  );

  const registerWithOtp = useCallback(async (input: RegisterInput) => {
    pendingDraft = input;
    if (!apiConfigured) return { verificationRequired: true, devCode: "123456", email: input.email };
    return apiFetch<OtpResponse>("/api/auth/register", {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
        age: toAge(input.day, input.month, input.year),
        gender: input.gender,
        city: input.city,
        state: input.cityState,
        interestedIn: input.interestedIn,
      },
    });
  }, []);

  const verifySignupOtp = useCallback(
    async (email: string, code: string) => {
      if (!apiConfigured) {
        await signUp(pendingDraft ?? {
          name: "",
          day: "",
          month: "",
          year: "",
          gender: "man",
          interestedIn: "women",
          city: "",
          cityState: "",
        });
        return;
      }
      const result = await apiFetch<SessionResponse>("/api/auth/verify-email", {
        method: "POST",
        body: { email, code },
      });
      await finishSession(result.tokens, result.user);
      pendingDraft = null;
    },
    [finishSession, signUp]
  );

  const resendOtp = useCallback(async (email: string, purpose: OtpPurpose) => {
    if (!apiConfigured) return { ok: true, devCode: "123456" };
    return apiFetch<SimpleResponse>("/api/auth/resend-otp", {
      method: "POST",
      body: { email, purpose },
    });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    if (!apiConfigured) return { ok: true };
    return apiFetch<SimpleResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }, []);

  const updateUser = useCallback(
    (patch: Partial<MyProfile>) => {
      persistProfile({ ...(user ?? defaultMyProfile), ...patch });
    },
    [persistProfile, user]
  );

  const signOut = useCallback(async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("@pagalpagal/refresh-token");
      const accessToken = await getAccessToken();
      if (apiConfigured && refreshToken && accessToken) {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: { refreshToken },
          token: accessToken,
        }).catch(() => {});
      }
    } finally {
      await clearTokens().catch(() => {});
      setSignedIn(false);
      await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      signedIn,
      apiEnabled: apiConfigured,
      signIn,
      signUp,
      requestLoginOtp,
      verifyLoginOtp,
      registerWithOtp,
      verifySignupOtp,
      resendOtp,
      forgotPassword,
      updateUser,
      signOut,
    }),
    [
      ready,
      user,
      signedIn,
      signIn,
      signUp,
      requestLoginOtp,
      verifyLoginOtp,
      registerWithOtp,
      verifySignupOtp,
      resendOtp,
      forgotPassword,
      updateUser,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
