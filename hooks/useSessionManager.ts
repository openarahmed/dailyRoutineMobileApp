// hooks/useSessionManager.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "../types";

const STORAGE_KEY = "sessions";

export async function loadSessions(): Promise<Session[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (e) {
    console.error("Error loading sessions", e);
    return [];
  }
}

export async function saveSessions(sessions: Session[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Error saving sessions", e);
  }
}

export async function deleteSession(
  id: string,
  sessions: Session[]
): Promise<Session[]> {
  const filtered = sessions.filter((s) => s.id !== id);
  await saveSessions(filtered);
  return filtered;
}

export async function toggleSessionCompletion(
  id: string,
  sessions: Session[]
): Promise<Session[]> {
  const updated = sessions.map((s) =>
    s.id === id ? { ...s, completed: !s.completed } : s
  );
  await saveSessions(updated);
  return updated;
}
