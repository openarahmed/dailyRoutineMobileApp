import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
  notificationId?: string;
  completed?: boolean;
  completedAt?: string;
};

type SessionContextType = {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function loadSessions() {
      try {
        const stored = await AsyncStorage.getItem("studyRoutine");
        if (stored) setSessions(JSON.parse(stored));
      } catch (e) {
        console.log("Error loading sessions:", e);
      }
    }
    loadSessions();
  }, []);

  useEffect(() => {
    async function saveSessions() {
      try {
        await AsyncStorage.setItem("studyRoutine", JSON.stringify(sessions));
      } catch (e) {
        console.log("Error saving sessions:", e);
      }
    }
    saveSessions();
  }, [sessions]);

  return (
    <SessionContext.Provider value={{ sessions, setSessions }}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSessions() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessions must be used within a SessionProvider");
  }
  return context;
}
