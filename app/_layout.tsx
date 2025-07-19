// app/_layout.tsx

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

import * as Notifications from "expo-notifications";

import { registerEyeProtectorTask, scheduleReminders } from '../services/eyeProtectorService';

// ✅✅✅ নোটিফিকেশন হ্যান্ডলারটি এখানে ঠিক করা হয়েছে ✅✅✅
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    // 'shouldShowAlert' এর পরিবর্তে নিচের দুটি ব্যবহার করতে হবে
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

const checkAndInstallTTS = async () => {
  // ... আপনার আগের কোড ...
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function requestPermissionsAndSetup() {
      // ... আপনার আগের পারমিশন এবং TTS চেকের কোড ...
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
      await checkAndInstallTTS();

      await registerEyeProtectorTask();
      await scheduleReminders();
    }

    requestPermissionsAndSetup();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="eye-protector" 
            options={{ 
              headerShown: false, 
              presentation: 'modal' 
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}