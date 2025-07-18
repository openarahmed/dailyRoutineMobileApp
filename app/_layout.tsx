import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";

// ✅ Set global notification handler with all required properties
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // ✅ FIX: Added missing properties for iOS to satisfy NotificationBehavior type
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Function to check for Text-to-Speech engine
const checkAndInstallTTS = async () => {
  if (Platform.OS !== "android") {
    return;
  }
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (!voices || voices.length === 0) {
      Alert.alert(
        "Voice Data Missing",
        "Your phone is missing the required voice data for audio notifications. Please install the Google Text-to-Speech engine from the Play Store.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Install",
            onPress: () =>
              Linking.openURL("market://details?id=com.google.android.tts"),
          },
        ]
      );
    }
  } catch (error) {
    console.error("Failed to check for available voices:", error);
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // useEffect hook to run setup tasks on app start
  React.useEffect(() => {
    async function requestPermissionsAndSetup() {
      // Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        await AsyncStorage.setItem(
          "notificationsEnabled",
          newStatus === "granted" ? "true" : "false"
        );
      } else {
        await AsyncStorage.setItem("notificationsEnabled", "true");
      }

      // Check for voice engine
      await checkAndInstallTTS();
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
          <Stack.Screen name="+not-found" />
        </Stack>

        {/* Global Footer */}
        {/* <Text style={styles.footerText}>Made with ❤️ by Shakil Ahmed</Text> */}
      </View>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  footerText: {
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    paddingVertical: 10,
    backgroundColor: "#121212", // optional
  },
});
