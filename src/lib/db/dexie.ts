import Dexie, { type Table } from "dexie";

export type SessionStatus = "active" | "completed" | "abandoned";

export interface SessionRow {
  id: string;
  rawIdea: string;
  currentStep: number; // 1..4
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
}

class EnhancedDB extends Dexie {
  sessions!: Table<SessionRow, string>;

  constructor() {
    super("enhanced");
    this.version(1).stores({
      sessions: "id, updatedAt",
    });
  }
}

export const db = new EnhancedDB();
