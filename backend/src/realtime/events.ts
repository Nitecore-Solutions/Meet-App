import { EventEmitter } from "node:events";

export type RealtimeEvent =
  | {
      type: "message";
      matchId: string;
      participantIds: string[];
      message: unknown;
    }
  | {
      type: "read";
      matchId: string;
      participantIds: string[];
      readerId: string;
      readAt: string;
    }
  | {
      type: "typing";
      matchId: string;
      participantIds: string[];
      userId: string;
      typing: boolean;
    }
  | {
      type: "match";
      matchId: string;
      participantIds: string[];
    }
  | {
      type: "match:removed";
      matchId: string;
      participantIds: string[];
    };

class RealtimeBus extends EventEmitter {
  emitEvent(event: RealtimeEvent) {
    this.emit("event", event);
  }

  onEvent(listener: (event: RealtimeEvent) => void) {
    this.on("event", listener);
    return () => this.off("event", listener);
  }
}

export const realtimeBus = new RealtimeBus();
