// utils/notifications.ts

import * as Notifications from "expo-notifications";
import { timeStringToDate } from "./timeHelpers"; // Make sure this import is correct

// NOTE: This scheduleNotification function might be redundant if HomeScreen.tsx uses its own.
// If this file is not imported and used elsewhere for scheduling, you can remove this file.
export const scheduleNotification = async (
  title: string,
  timeStr: string
): Promise<string | undefined> => {
  const date = timeStringToDate(timeStr);
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚",
        body: `Time to start: ${title}`,
        sound: "default", // Consider using 'true' for default sound or a specific sound file
      },
      trigger: { type: "date", date },
    });
    return id;
  } catch (err) {
    console.log("Notification error in utils/notifications.ts:", err);
  }
};
