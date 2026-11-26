import type { Chat } from "../types";

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function yesterdayEvening() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(18, 44, 0, 0);
  return date.toISOString();
}

/**
 * Demo conversations are seeded relative to the moment the app starts so the
 * inbox always reads as "fresh" and new outgoing messages sort after them.
 */
export function createInitialChats(): Chat[] {
  const khushiAt = minutesAgo(35);

  return [
    {
      id: "chat-khushi",
      profileId: "khushi",
      unread: 1,
      newMatch: false,
      updatedAt: khushiAt,
      messages: [
        {
          id: "m-khushi-1",
          text: "Hey! We matched. How's your day going? 😊",
          sender: "them",
          at: khushiAt,
        },
      ],
    },
    {
      id: "chat-oindrila",
      profileId: "oindrila",
      unread: 0,
      newMatch: true,
      updatedAt: yesterdayEvening(),
      messages: [],
    },
  ];
}
