import type { User } from "@/types/auth";

const TOKEN_KEY = "mentora.accessToken";
const USER_KEY = "mentora.user";
const DASHBOARD_DRAFT_KEY = "mentora.dashboardDraft";
const ROOM_DRAFT_KEY_PREFIX = "mentora.roomDraft.";

export interface DashboardDraft {
  topic: string;
  agenda: string;
  scheduledAt: string;
  durationMinutes: number;
  difficulty: string;
  language: string;
  templateKey: string;
  studentGoal: string;
  initialCode: string;
  joinInput: string;
}

export interface RoomDraft {
  chatDraft: string;
  codeDraft: string;
  codeDraftUpdatedAt: string | null;
}

const EMPTY_DASHBOARD_DRAFT: DashboardDraft = {
  topic: "",
  agenda: "",
  scheduledAt: "",
  durationMinutes: 60,
  difficulty: "INTERMEDIATE",
  language: "TYPESCRIPT",
  templateKey: "PAIR_PROGRAMMING",
  studentGoal: "",
  initialCode: "",
  joinInput: ""
};

const EMPTY_ROOM_DRAFT: RoomDraft = {
  chatDraft: "",
  codeDraft: "",
  codeDraftUpdatedAt: null
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readJsonValue<T>(key: string, fallback: T) {
  const storage = getStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    storage.removeItem(key);
    return fallback;
  }
}

function writeJsonValue<T>(key: string, value: T) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

export function getStoredToken() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_KEY);
}

export function getStoredUser() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    storage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredUser(user: User) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(USER_KEY);
}

export function getStoredDashboardDraft() {
  return readJsonValue(DASHBOARD_DRAFT_KEY, EMPTY_DASHBOARD_DRAFT);
}

export function setStoredDashboardDraft(draft: DashboardDraft) {
  writeJsonValue(DASHBOARD_DRAFT_KEY, draft);
}

export function clearStoredDashboardDraft() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(DASHBOARD_DRAFT_KEY);
}

export function getStoredRoomDraft(sessionId: string) {
  return readJsonValue(`${ROOM_DRAFT_KEY_PREFIX}${sessionId}`, EMPTY_ROOM_DRAFT);
}

export function setStoredRoomDraft(sessionId: string, draft: RoomDraft) {
  writeJsonValue(`${ROOM_DRAFT_KEY_PREFIX}${sessionId}`, draft);
}

export function clearStoredRoomDraft(sessionId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(`${ROOM_DRAFT_KEY_PREFIX}${sessionId}`);
}
