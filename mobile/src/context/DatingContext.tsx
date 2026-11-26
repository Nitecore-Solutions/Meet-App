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

import { createInitialChats } from "../data/chats";
import { profiles } from "../data/profiles";
import type {
  Chat,
  DistanceUnit,
  MatchPreferences,
} from "../types";

const STORE_KEY = "@pagalpagal/dating/v1";

export const VISITOR_IDS = [
  "tista",
  "ishita",
  "himani",
  "aarti",
  "rina",
  "angela",
  "pallabi",
];

type PersistedState = {
  likedIds: string[];
  skippedIds: string[];
  blockedIds: string[];
  chats: Chat[];
  preferences: MatchPreferences;
  distanceUnit: DistanceUnit;
};

type DatingContextValue = {
  likedIds: string[];
  skippedIds: string[];
  blockedIds: string[];
  chats: Chat[];
  preferences: MatchPreferences;
  distanceUnit: DistanceUnit;
  visitorIds: string[];
  deckIds: string[];
  unreadCount: number;
  likedProfiles: typeof profiles;
  skippedProfiles: typeof profiles;
  blockedProfiles: typeof profiles;
  visitorProfiles: typeof profiles;
  likeProfile: (id: string) => void;
  skipProfile: (id: string) => void;
  resetSkipped: (id: string) => void;
  resetAllSkipped: () => void;
  blockProfile: (id: string) => void;
  unblockProfile: (id: string) => void;
  restartDeck: () => void;
  ensureChat: (profileId: string) => string;
  sendMessage: (profileId: string, text: string) => void;
  markChatRead: (profileId: string) => void;
  unmatch: (profileId: string) => void;
  setPreferences: (prefs: MatchPreferences) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  getChat: (profileId: string) => Chat | undefined;
};

const DatingContext = createContext<DatingContextValue | null>(null);

const defaultPreferences: MatchPreferences = {
  minAge: 18,
  maxAge: 30,
  city: "Dhanbad",
  showPhotosOnly: false,
  showOtherCities: true,
  radiusKm: 100,
};

const defaultState: PersistedState = {
  likedIds: [],
  skippedIds: [],
  blockedIds: [],
  chats: createInitialChats(),
  preferences: defaultPreferences,
  distanceUnit: "Kilometers",
};

const byIds = (ids: string[]) =>
  ids
    .map((id) => profiles.find((profile) => profile.id === id))
    .filter((profile): profile is (typeof profiles)[number] => Boolean(profile));

export function DatingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const hydrated = useRef(false);
  const [ready, setReady] = useState(false);

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
            preferences: {
              ...defaultPreferences,
              ...(parsed.preferences ?? {}),
            },
          });
        }
      } catch {
        // Keep the in-memory demo data.
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

  const likeProfile = useCallback((id: string) => {
    setState((current) => {
      if (current.likedIds.includes(id)) return current;
      return {
        ...current,
        likedIds: [id, ...current.likedIds],
        skippedIds: current.skippedIds.filter((item) => item !== id),
      };
    });
  }, []);

  const skipProfile = useCallback((id: string) => {
    setState((current) => {
      if (current.skippedIds.includes(id)) return current;
      return {
        ...current,
        skippedIds: [id, ...current.skippedIds],
        likedIds: current.likedIds.filter((item) => item !== id),
      };
    });
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

  const blockProfile = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      blockedIds: [id, ...current.blockedIds.filter((item) => item !== id)],
      likedIds: current.likedIds.filter((item) => item !== id),
      skippedIds: current.skippedIds.filter((item) => item !== id),
      chats: current.chats.filter((chat) => chat.profileId !== id),
    }));
  }, []);

  const unblockProfile = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      blockedIds: current.blockedIds.filter((item) => item !== id),
    }));
  }, []);

  const restartDeck = useCallback(() => {
    setState((current) => ({ ...current, skippedIds: [], likedIds: [] }));
  }, []);

  const ensureChat = useCallback((profileId: string) => {
    const id = `chat-${profileId}`;
    setState((current) => {
      if (current.chats.some((chat) => chat.profileId === profileId)) {
        return current;
      }
      return {
        ...current,
        chats: [
          {
            id,
            profileId,
            unread: 0,
            newMatch: true,
            updatedAt: new Date().toISOString(),
            messages: [],
          },
          ...current.chats,
        ],
      };
    });
    return id;
  }, []);

  const sendMessage = useCallback((profileId: string, text: string) => {
    const value = text.trim();
    if (!value) return;
    setState((current) => {
      const existing = current.chats.find(
        (chat) => chat.profileId === profileId
      );
      const message = {
        id: `message-${Date.now()}`,
        text: value,
        sender: "me" as const,
        at: new Date().toISOString(),
      };
      if (!existing) {
        return {
          ...current,
          chats: [
            {
              id: `chat-${profileId}`,
              profileId,
              messages: [message],
              unread: 0,
              updatedAt: message.at,
              newMatch: true,
            },
            ...current.chats,
          ],
        };
      }
      return {
        ...current,
        chats: current.chats.map((chat) =>
          chat.profileId === profileId
            ? {
                ...chat,
                messages: [...chat.messages, message],
                unread: 0,
                updatedAt: message.at,
                newMatch: false,
              }
            : chat
        ),
      };
    });
  }, []);

  const markChatRead = useCallback((profileId: string) => {
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.profileId === profileId ? { ...chat, unread: 0 } : chat
      ),
    }));
  }, []);

  const unmatch = useCallback((profileId: string) => {
    setState((current) => ({
      ...current,
      chats: current.chats.filter((chat) => chat.profileId !== profileId),
    }));
  }, []);

  const setPreferences = useCallback((prefs: MatchPreferences) => {
    setState((current) => ({ ...current, preferences: prefs }));
  }, []);

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    setState((current) => ({ ...current, distanceUnit: unit }));
  }, []);

  const unreadCount = useMemo(
    () => state.chats.reduce((total, chat) => total + chat.unread, 0),
    [state.chats]
  );

  const deckIds = useMemo(() => {
    const blocked = new Set(state.blockedIds);
    return profiles
      .filter((profile) => !state.likedIds.includes(profile.id))
      .filter((profile) => !state.skippedIds.includes(profile.id))
      .filter((profile) => !blocked.has(profile.id))
      .filter((profile) => profile.gender !== "man")
      .map((profile) => profile.id);
  }, [state.likedIds, state.skippedIds, state.blockedIds]);

  const getChat = useCallback(
    (profileId: string) =>
      state.chats.find((chat) => chat.profileId === profileId),
    [state.chats]
  );

  const value = useMemo<DatingContextValue>(
    () => ({
      likedIds: state.likedIds,
      skippedIds: state.skippedIds,
      blockedIds: state.blockedIds,
      chats: state.chats,
      preferences: state.preferences,
      distanceUnit: state.distanceUnit,
      visitorIds: VISITOR_IDS,
      deckIds,
      unreadCount,
      likedProfiles: byIds(state.likedIds),
      skippedProfiles: byIds(state.skippedIds),
      blockedProfiles: byIds(state.blockedIds),
      visitorProfiles: byIds(VISITOR_IDS),
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
    }),
    [
      state.likedIds,
      state.skippedIds,
      state.blockedIds,
      state.chats,
      state.preferences,
      state.distanceUnit,
      deckIds,
      unreadCount,
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
    ]
  );

  // `ready` is intentionally part of the provider contract for future API
  // hydration. It is safe to render preview data immediately today.
  void ready;

  return (
    <DatingContext.Provider value={value}>{children}</DatingContext.Provider>
  );
}

export function useDating(): DatingContextValue {
  const context = useContext(DatingContext);
  if (!context) throw new Error("useDating must be used inside DatingProvider");
  return context;
}
