import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// --- Your Gemini API Key is included ---
const API_KEY = "AIzaSyD0RMBH-dKtgBBEj0VBj7UWmUmhyJp6of4";

// --- Type Definitions ---
type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
};
type HistoryRecord = {
  id: string;
  completedAt: string;
};

// --- Initialize Gemini AI ---
let genAI: GoogleGenerativeAI | null = null;
try {
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  } else {
    console.warn("Gemini API Key is missing.");
  }
} catch (e) {
  console.error("Failed to initialize GoogleGenerativeAI.", e);
}

// --- Helper Function to send notifications ---
const sendNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { screen: "index" } },
    trigger: { seconds: 2 },
  });
};

// --- FEATURE 1: Variable Suggestions for Missed Tasks ---
const checkMissedTaskStreaks = async (
  routine: Session[],
  completedOnDate: Map<string, Set<string>>
) => {
  const THRESHOLD = 3;
  for (const task of routine) {
    let consecutiveMissedDays = 0;
    for (let i = 1; i <= THRESHOLD; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (
        completedOnDate.has(dateStr) &&
        completedOnDate.get(dateStr)!.has(task.id)
      ) {
        consecutiveMissedDays = 0;
        break;
      }
      consecutiveMissedDays++;
    }
    if (consecutiveMissedDays >= THRESHOLD) {
      const suggestionSentStr = await AsyncStorage.getItem(
        `suggestionSent_${task.id}`
      );
      if (suggestionSentStr) {
        const hoursSinceSent =
          (new Date().getTime() - new Date(suggestionSentStr).getTime()) /
          (1000 * 60 * 60);
        if (hoursSinceSent < 72) continue;
      }
      console.log(
        `Task "${task.title}" missed for ${THRESHOLD} days. Generating suggestion.`
      );
      const prompt = `A user hasn't completed their task "${task.title}" for ${THRESHOLD} days. Generate a short, friendly, English push notification (under 25 words) to encourage them. Suggest they might want to adjust their routine.`;
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const suggestionText = result.response.text();
        await sendNotification("💡 A Little Suggestion...", suggestionText);
        await AsyncStorage.setItem(
          `suggestionSent_${task.id}`,
          new Date().toISOString()
        );
        break;
      }
    }
  }
};

// --- FEATURE 2: End-of-Day Report ---
// ✅ PRODUCTION CODE: This function now schedules the notification for 15 mins before bedtime.
const scheduleEndOfDayReport = async (
  routine: Session[],
  completedTodayIds: Set<string>
) => {
  console.log("Checking if End-of-Day report should be scheduled.");
  const todayStr = new Date().toISOString().split("T")[0];
  const reportScheduledKey = `endOfDayReportScheduled_${todayStr}`;
  const alreadyScheduled = await AsyncStorage.getItem(reportScheduledKey);

  if (alreadyScheduled) {
    return;
  }

  const missedTasks = routine.filter((task) => !completedTodayIds.has(task.id));

  if (missedTasks.length > 0) {
    const sleepTimeStr = await AsyncStorage.getItem("userSleepTime");
    let bedtimeHour = 23; // Default 11 PM
    let bedtimeMinute = 0;

    if (sleepTimeStr) {
      const userSleepTime = new Date(sleepTimeStr);
      bedtimeHour = userSleepTime.getHours();
      bedtimeMinute = userSleepTime.getMinutes();
    }

    const notificationTime = new Date();
    notificationTime.setHours(bedtimeHour, bedtimeMinute, 0, 0);
    notificationTime.setMinutes(notificationTime.getMinutes() - 15);

    if (notificationTime.getTime() < Date.now()) {
      await AsyncStorage.setItem(reportScheduledKey, "true");
      return;
    }

    const missedTaskTitles = missedTasks.map((t) => t.title).join(", ");
    const body = `Tasks left for today: ${missedTaskTitles}. Time to wind down!`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Wrap-Up",
        body: body,
      },
      trigger: notificationTime,
    });

    console.log(
      `✅ End-of-Day report scheduled for ${notificationTime.toLocaleTimeString()}`
    );
    await AsyncStorage.setItem(reportScheduledKey, "true");
  }
};

// --- Main AI Engine Function ---
// ✅ PRODUCTION CODE: The 6-hour time limit is restored.
export const runDailyAIChecks = async (forceCheck: boolean = false) => {
  if (!forceCheck) {
    const lastCheckStr = await AsyncStorage.getItem("lastAIDailyCheck");
    if (lastCheckStr) {
      const hoursSinceLastCheck =
        (new Date().getTime() - new Date(lastCheckStr).getTime()) /
        (1000 * 60 * 60);
      if (hoursSinceLastCheck < 6) {
        console.log("AI checks ran less than 6 hours ago. Skipping.");
        return;
      }
    }
  }

  console.log(`Running Daily AI Checks... (Forced: ${forceCheck})`);
  await AsyncStorage.setItem("lastAIDailyCheck", new Date().toISOString());

  try {
    const routineStr = await AsyncStorage.getItem("studyRoutine");
    const historyStr = await AsyncStorage.getItem("completionHistory");
    if (!routineStr) return;

    const routine: Session[] = JSON.parse(routineStr);
    const history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];

    const completedOnDate = new Map<string, Set<string>>();
    history.forEach((rec) => {
      const dateStr = rec.completedAt.split("T")[0];
      if (!completedOnDate.has(dateStr))
        completedOnDate.set(dateStr, new Set());
      completedOnDate.get(dateStr)!.add(rec.id);
    });

    const todayStr = new Date().toISOString().split("T")[0];
    const completedTodayIds = completedOnDate.get(todayStr) || new Set();

    await checkMissedTaskStreaks(routine, completedOnDate);
    await scheduleEndOfDayReport(routine, completedTodayIds);
  } catch (error) {
    console.error("Error during Daily AI Checks:", error);
  }
};

// --- Positive Reinforcement Feature ---
export const checkAndNotifyForStreaks = async (
  completedSession: Session,
  fullHistory: HistoryRecord[]
) => {
  if (!genAI) return;
  const taskHistory = fullHistory.filter((h) => h.id === completedSession.id);
  if (taskHistory.length < 2) return;
  const completedDates = new Set(
    taskHistory.map((h) => h.completedAt.split("T")[0])
  );
  let currentStreak = 0;
  for (let i = 0; i < taskHistory.length + 1; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (completedDates.has(dateStr)) {
      currentStreak++;
    } else {
      break;
    }
  }
  const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];
  if (STREAK_MILESTONES.includes(currentStreak)) {
    const key = `streakNotif_${completedSession.id}_${currentStreak}`;
    const alreadyNotified = await AsyncStorage.getItem(key);
    if (alreadyNotified) return;
    console.log(
      `User hit a ${currentStreak}-day streak for "${completedSession.title}"!`
    );
    const prompt = `A user just completed the task "${completedSession.title}" and is now on a ${currentStreak}-day streak! Generate a short, exciting, English push notification to celebrate this milestone. Make it sound cool and encouraging.`;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const streakText = result.response.text();
    await sendNotification("🔥 Streak Alert!", streakText);
    await AsyncStorage.setItem(key, "true");
  }
};
