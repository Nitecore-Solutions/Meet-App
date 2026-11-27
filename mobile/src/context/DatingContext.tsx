import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { apiConfigured, apiFetch, getAccessToken } from "../services/api";
import {
  mapBackendConversation,
  mapBackendMessage,
  mapBackendProfile,
  type BackendConversation,
  type BackendProfile,
} from "../services/mappers";
import type {
  Chat,
  ChatMessage,
  DistanceUnit,
  MatchPreferences,
  Profile,
} from "../types";

const STORE_KEY = "@pagalpagal/dating/v1";

type PersistedState = {
  likedIds: string[];
  skippedIds: string[];
  blockedIds: string[];
  preferences: MatchPreferences;
  distanceUnit: DistanceUnit;
};

type DatingContextValue = {
  ready: boolean;
  apiEnabled: boolean;
  profiles: Profile[];
  likedIds: string[];
  skippedIds: string[];
  blockedIds: string[];
  chats: Chat[];
  preferences: MatchPreferences;
  distanceUnit: DistanceUnit;
  visitorIds: string[];
  deckIds: string[];
  unreadCount: number;
  likedProfiles: Profile[];
  skippedProfiles: Profile[];
  blockedProfiles: Profile[];
  visitorProfiles: Profile[];
  getProfile: (id: string) => Profile | undefined;
  likeProfile: (id: string) => Promise<void>;
  skipProfile: (id: string) => Promise<void>;
  resetSkipped: (id: string) => void;
  resetAllSkipped: () => void;
  blockProfile: (id: string) => Promise<void>;
  unblockProfile: (id: string) => Promise<void>;
  restartDeck: () => Promise<void>;
  ensureChat: (profileId: string) => Promise<string>;
  sendMessage: (profileId: string, text: string) => Promise<void>;
  markChatRead: (profileId: string) => Promise<void>;
  unmatch: (profileId: string) => Promise<void>;
  setPreferences: (prefs: MatchPreferences) => Promise<void>;
  setDistanceUnit: (unit: DistanceUnit) => void;
  getChat: (profileId: string) => Chat | undefined;
  refresh: () => Promise<void>;
};

const DatingContext = createContext<DatingContextValue | null>(null);

const defaultPreferences: MatchPreferences = {
  minAge: 18,
  maxAge: 99,
  city: "",
  showPhotosOnly: false,
  showOtherCities: true,
  radiusKm: 100,
};

const defaultState: PersistedState = {
  likedIds: [],
  skippedIds: [],
  blockedIds: [],
  preferences: defaultPreferences,
  distanceUnit: "Kilometers",
};

export function DatingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [visitorIds, setVisitorIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          setState({
            ...defaultState,
            ...parsed,
            preferences: { ...defaultPreferences, ...(parsed.preferences ?? {}) },
          });
        }
      } catch {
        // Ignore a broken cache.
      } finally {
        hydrated.current = true;
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    void AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const refresh = useCallback(async () => {
    if (!apiConfigured) return;
    const token = await getAccessToken();
    if (!token) return;
    try {
      const prefs = state.preferences;
      const query = new URLSearchParams({
        limit: "50",
        minAge: String(prefs.minAge),
        maxAge: String(prefs.maxAge),
        radiusKm: String(prefs.radiusKm),
        showPhotosOnly: String(prefs.showPhotosOnly),
        showOtherCities: String(prefs.showOtherCities),
      });
      if (prefs.city) query.set("city", prefs.city);

      const [discovery, conversations, likes] = await Promise.all([
        apiFetch<{ profiles: BackendProfile[] }>(`/api/discover?${query}`, { token }),
        apiFetch<{ conversations: BackendConversation[] }>("/api/chats", { token }),
        apiFetch<{ likes: { profile: BackendProfile }[] }>("/api/likes", { token }),
      ]);

      const merged = new Map<string, Profile>();
      discovery.profiles.forEach((profile, index) =>
        merged.set(profile.id, mapBackendProfile(profile, index))
      );
      likes.likes.forEach((like) =>
        merged.set(like.profile.id, mapBackendProfile(like.profile))
      );

      const mappedChats = conversations.conversations.map((conversation) => {
        const profile = conversation.profile
          ? mapBackendProfile(conversation.profile)
          : merged.get(conversation.profileId);
        if (profile) merged.set(profile.id, profile);
        return mapBackendConversation(conversation, "", profile);
      });

      for (const id of [...state.likedIds, ...state.blockedIds]) {
        if (merged.has(id)) continue;
        try {
          const result = await apiFetch<{ profile: BackendProfile }>(`/api/users/${id}`, {
            token: token ?? undefined,
          });
          merged.set(id, mapBackendProfile(result.profile));
        } catch {
          // Profile may have been removed; skip it.
        }
      }

      setProfiles([...merged.values()]);
      setChats(mappedChats);
      setVisitorIds(likes.likes.map((like) => like.profile.id));
    } catch {
      // Keep the previous state if the API is temporarily unavailable.
    }
  }, [state.likedIds, state.blockedIds, state.preferences]);

  useEffect(() => {
    if (apiConfigured && ready && state.likedIds.length === 0) return;
    if (apiConfigured && ready) void refresh();
  }, [apiConfigured, ready, refresh, state.likedIds.length]);

  useEffect(() => {
    if (!apiConfigured) return;
    let socket: WebSocket | null = null;
    let closed = false;
    (async () => {
      const token = await getAccessToken();
      if (!token || closed) return;
      const url = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/^http/, "ws");
      socket = new WebSocket(`${url.replace(/\/+$/, "")}/ws?token=${encodeURIComponent(token)}`);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type?: string;
            matchId?: string;
            message?: {
              id: string;
              text?: string | null;
              senderId: string;
              mine?: boolean;
              createdAt: string;
            };
          };
          if (data.type === "message:new" && data.message && data.matchId) {
            const message: ChatMessage = mapBackendMessage(data.message, "");
            setChats((current) =>
              current.map((chat) =>
                chat.id === data.matchId && !chat.messages.some((m) => m.id === message.id)
                  ? {
                      ...chat,
                      messages: [...chat.messages, message],
                      unread: message.sender === "them" ? chat.unread + 1 : chat.unread,
                      updatedAt: message.at,
                      newMatch: false,
                    }
                  : chat
              )
            );
          }
          if (data.type === "match:new") void refresh();
        } catch {
          // Ignore malformed events.
        }
      };
    })();
    return () => {
      closed = true;
      socket?.close();
    };
  }, [refresh]);

  const getProfile = useCallback(
    (id: string) => profiles.find((profile) => profile.id === id),
    [profiles]
  );

  const likeProfile = useCallback(
    async (id: string) => {
      if (apiConfigured) {
        try {
          const token = await getAccessToken();
          const result = await apiFetch<{ matched: boolean }>(`/api/users/${id}/like`, {
            method: "POST",
            token: token ?? undefined,
          });
          if (result.matched) await refresh();
        } catch {
          // Still update locally so the UI stays responsive.
        }
      }
      setState((current) => ({
        ...current,
        likedIds: [id, ...current.likedIds.filter((item) => item !== id)],
        skippedIds: current.skippedIds.filter((item) => item !== id),
      }));
    },
    [refresh]
  );

  const skipProfile = useCallback(async (id: string) => {
    if (apiConfigured) {
      try {
        const token = await getAccessToken();
        await apiFetch(`/api/users/${id}/pass`, { method: "POST", token: token ?? undefined });
      } catch {
        // Ignore.
      }
    }
    setState((current) => ({
      ...current,
      skippedIds: [id, ...current.skippedIds.filter((item) => item !== id)],
      likedIds: current.likedIds.filter((item) => item !== id),
    }));
  }, []);

  const resetSkipped = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      skippedIds: current.skippedIds.filter((item) => item !== id),
    }));
  }, []);

  const resetAllSkipped = useCallback(() => {
    setState((current) => ({ ...current, skippedIds: [] }));
  }, []);

  const blockProfile = useCallback(
    async (id: string) => {
      if (apiConfigured) {
        try {
          const token = await getAccessToken();
          await apiFetch(`/api/users/${id}/block`, { method: "POST", token: token ?? undefined });
        } catch {
          // Ignore.
        }
      }
      setState((current) => ({
        ...current,
        blockedIds: [id, ...current.blockedIds.filter((item) => item !== id)],
        likedIds: current.likedIds.filter((item) => item !== id),
        skippedIds: current.skippedIds.filter((item) => item !== id),
      }));
      setChats((current) => current.filter((chat) => chat.profileId !== id));
    },
    []
  );

  const unblockProfile = useCallback(async (id: string) => {
    if (apiConfigured) {
      try {
        const token = await getAccessToken();
        await apiFetch(`/api/users/${id}/block`, { method: "DELETE", token: token ?? undefined });
      } catch {
        // Ignore.
      }
    }
    setState((current) => ({
      ...current,
      blockedIds: current.blockedIds.filter((item) => item !== id),
    }));
  }, []);

  const restartDeck = useCallback(async () => {
    setState((current) => ({ ...current, skippedIds: [], likedIds: [] }));
    await refresh();
  }, [refresh]);

  const ensureChat = useCallback(async (profileId: string) => {
    const existing = chats.find((chat) => chat.profileId === profileId);
    if (existing) return existing.id;
    if (!apiConfigured) {
      const id = `chat-${profileId}`;
      setChats((current) => [
        {
          id,
          profileId,
          unread: 0,
          newMatch: true,
          updatedAt: new Date().toISOString(),
          messages: [],
        },
        ...current,
      ]);
      return id;
    }
    try {
      const token = await getAccessToken();
      const result = await apiFetch<{ id: string; profile?: BackendProfile }>(
        `/api/chats/with/${profileId}`,
        { token: token ?? undefined }
      );
      const profile = result.profile
        ? mapBackendProfile(result.profile)
        : getProfile(profileId);
      if (profile) setProfiles((current) => [...current.filter((p) => p.id !== profile.id), profile]);
      const chat: Chat = {
        id: result.id,
        profileId,
        messages: [],
        unread: 0,
        newMatch: true,
        updatedAt: new Date().toISOString(),
      };
      setChats((current) =>
        current.some((item) => item.id === chat.id) ? current : [chat, ...current]
      );
      return result.id;
    } catch {
      return "";
    }
  }, [chats, getProfile]);

  const sendMessage = useCallback(
    async (profileId: string, text: string) => {
      const value = text.trim();
      if (!value) return;
      const chat = chats.find((item) => item.profileId === profileId);
      if (!apiConfigured || !chat) {
        const message: ChatMessage = {
          id: `local-${Date.now()}`,
          text: value,
          sender: "me",
          at: new Date().toISOString(),
        };
        setChats((current) =>
          current.map((item) =>
            item.profileId === profileId
              ? { ...item, messages: [...item.messages, message], updatedAt: message.at }
              : item
          )
        );
        return;
      }
      try {
        const token = await getAccessToken();
        const result = await apiFetch<{
          message: {
            id: string;
            text?: string | null;
            senderId: string;
            mine?: boolean;
            createdAt: string;
          };
        }>(`/api/chats/${chat.id}/messages`, {
          method: "POST",
          token: token ?? undefined,
          body: { type: "text", text: value },
        });
        const message = mapBackendMessage(result.message, "");
        setChats((current) =>
          current.map((item) =>
            item.id === chat.id && !item.messages.some((m) => m.id === message.id)
              ? {
                  ...item,
                  messages: [...item.messages, message],
                  updatedAt: message.at,
                  newMatch: false,
                }
              : item
          )
        );
      } catch {
        // Ignore send failures; the UI stays usable.
      }
    },
    [chats]
  );

  const markChatRead = useCallback(async (profileId: string) => {
    const chat = chats.find((item) => item.profileId === profileId);
    if (!chat) return;
    setChats((current) =>
      current.map((item) => (item.profileId === profileId ? { ...item, unread: 0 } : item))
    );
    if (!apiConfigured) return;
    try {
      const token = await getAccessToken();
      await apiFetch(`/api/chats/${chat.id}/read`, { method: "POST", token: token ?? undefined });
    } catch {
      // Ignore.
    }
  }, [chats]);

  const unmatch = useCallback(
    async (profileId: string) => {
      const chat = chats.find((item) => item.profileId === profileId);
      if (apiConfigured && chat) {
        try {
          const token = await getAccessToken();
          await apiFetch(`/api/chats/${chat.id}`, { method: "DELETE", token: token ?? undefined });
        } catch {
          // Ignore.
        }
      }
      setChats((current) => current.filter((item) => item.profileId !== profileId));
    },
    [chats]
  );

  const setPreferences = useCallback(
    async (prefs: MatchPreferences) => {
      setState((current) => ({ ...current, preferences: prefs }));
      if (!apiConfigured) return;
      try {
        const token = await getAccessToken();
        await apiFetch("/api/users/me", {
          method: "PATCH",
          token: token ?? undefined,
          body: {
            minAge: prefs.minAge,
            maxAge: prefs.maxAge,
            city: prefs.city || null,
            showPhotosOnly: prefs.showPhotosOnly,
            showOtherCities: prefs.showOtherCities,
            radiusKm: prefs.radiusKm,
          },
        });
        await refresh();
      } catch {
        // Ignore.
      }
    },
    [refresh]
  );

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    setState((current) => ({ ...current, distanceUnit: unit }));
  }, []);

  const unreadCount = useMemo(
    () => chats.reduce((total, chat) => total + chat.unread, 0),
    [chats]
  );

  const deckIds = useMemo(() => {
    const blocked = new Set(state.blockedIds);
    return profiles
      .filter((profile) => !state.likedIds.includes(profile.id))
      .filter((profile) => !state.skippedIds.includes(profile.id))
      .filter((profile) => !blocked.has(profile.id))
      .filter((profile) => profile.gender !== "man")
      .map((profile) => profile.id);
  }, [profiles, state.likedIds, state.skippedIds, state.blockedIds]);

  const byIds = useCallback(
    (ids: string[]) => ids.map(getProfile).filter((p): p is Profile => Boolean(p)),
    [getProfile]
  );

  const getChat = useCallback(
    (profileId: string) => chats.find((chat) => chat.profileId === profileId),
    [chats]
  );

  const value = useMemo<DatingContextValue>(
    () => ({
      ready,
      apiEnabled: apiConfigured,
      profiles,
      likedIds: state.likedIds,
      skippedIds: state.skippedIds,
      blockedIds: state.blockedIds,
      chats,
      preferences: state.preferences,
      distanceUnit: state.distanceUnit,
      visitorIds,
      deckIds,
      unreadCount,
      likedProfiles: byIds(state.likedIds),
      skippedProfiles: byIds(state.skippedIds),
      blockedProfiles: byIds(state.blockedIds),
      visitorProfiles: byIds(visitorIds),
      getProfile,
      likeProfile,
      skipProfile,
      resetSkipped,
      resetAllSkipped,
      blockProfile,
      unblockProfile,
      restartDeck,
      ensureChat,
      sendMessage,
      markChatRead,
      unmatch,
      setPreferences,
      setDistanceUnit,
      getChat,
      refresh,
    }),
    [
      ready,
      profiles,
      state,
      chats,
      visitorIds,
      deckIds,
      unreadCount,
      byIds,
      getProfile,
      likeProfile,
      skipProfile,
      resetSkipped,
      resetAllSkipped,
      blockProfile,
      unblockProfile,
      restartDeck,
      ensureChat,
      sendMessage,
      markChatRead,
      unmatch,
      setPreferences,
      setDistanceUnit,
      getChat,
      refresh,
    ]
  );

  return <DatingContext.Provider value={value}>{children}</DatingContext.Provider>;
}

export function useDating(): DatingContextValue {
  const context = useContext(DatingContext);
  if (!context) throw new Error("useDating must be used inside DatingProvider");
  return context;
}
