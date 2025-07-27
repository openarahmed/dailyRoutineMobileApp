// services/eyeProtectorService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const EYE_PROTECTOR_TASK = 'EYE_PROTECTOR_BACKGROUND_TASK';

type EyeProtectorSettings = {
  isEnabled: boolean;
  startTime: string; 
  endTime: string;
  eyeSound: string;
  breakSound: string;
};

TaskManager.defineTask(EYE_PROTECTOR_TASK, async () => {
  try {
    console.log('👁️ Background task running to ensure reminders are scheduled...');
    await scheduleReminders();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Eye Protector Task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerEyeProtectorTask() {
    try {
        if (await TaskManager.isTaskRegisteredAsync(EYE_PROTECTOR_TASK)) {
          console.log('Eye Protector task already registered.');
          return;
        }
        await BackgroundFetch.registerTaskAsync(EYE_PROTECTOR_TASK, {
          minimumInterval: 60 * 60, // runs roughly every hour
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('Eye Protector background task registered successfully.');
    } catch (error) {
        console.error('Failed to register Eye Protector task:', error);
    }
}

export async function scheduleReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('Cleared all previous scheduled notifications.');

  const settingsStr = await AsyncStorage.getItem('@eye_protector_settings');
  const settings: EyeProtectorSettings = settingsStr 
    ? JSON.parse(settingsStr) 
    : { isEnabled: false, startTime: '09:00', endTime: '17:00', eyeSound: 'default', breakSound: 'default' };

  if (!settings.isEnabled) {
    console.log('Eye Protector is disabled. No new reminders will be set.');
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const officeStart = new Date(`${todayStr}T${settings.startTime}:00`);
  const officeEnd = new Date(`${todayStr}T${settings.endTime}:00`);

  if (now >= officeEnd) {
    console.log('Office hours for today are over. Reminders will be set tomorrow.');
    return;
  }
  
  console.log(`Scheduling reminders from ${settings.startTime} to ${settings.endTime}`);
  
  const EYE_INTERVAL_MINUTES = 20; 
  const LONG_BREAK_INTERVAL_MINUTES = 60;

  // Schedule 20-minute eye breaks
  let eyeBreakTime = new Date(officeStart.getTime());
  let eyeCounter = 0;
  while (eyeBreakTime <= officeEnd) {
    if (eyeBreakTime > now && eyeBreakTime.getMinutes() !== officeStart.getMinutes()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `eye-protector-eye-${eyeCounter++}`,
        content: {
          title: '👀 Time for an Eye Break!',
          body: 'Look at something 20 feet away for 20 seconds.',
          sound: settings.eyeSound === 'default' ? true : settings.eyeSound,
        },
        // ✅ UPDATED TRIGGER FORMAT
        trigger: { type: 'date', date: eyeBreakTime },
      });
    }
    eyeBreakTime.setMinutes(eyeBreakTime.getMinutes() + EYE_INTERVAL_MINUTES);
  }

  // Schedule 60-minute long breaks
  let longBreakTime = new Date(officeStart.getTime());
  let longBreakCounter = 0;
  while (longBreakTime <= officeEnd) {
    if (longBreakTime > now) {
        await Notifications.scheduleNotificationAsync({
            identifier: `eye-protector-long-${longBreakCounter++}`,
            content: {
                title: '🧠 Take a Short Break!',
                body: 'Step away from your screen for 5 minutes.',
                sound: settings.breakSound === 'default' ? true : settings.breakSound,
            },
            // ✅ UPDATED TRIGGER FORMAT
            trigger: { type: 'date', date: longBreakTime },
        });
    }
    longBreakTime.setMinutes(longBreakTime.getMinutes() + LONG_BREAK_INTERVAL_MINUTES);
  }
  
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`Successfully scheduled ${scheduled.length} reminders.`);
}