import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

// Function to check for and prompt installation of Google TTS engine
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

export default function TabsLayout() {
  useEffect(() => {
    async function requestPermissionsAndSetup() {
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
      await checkAndInstallTTS();
    }

    requestPermissionsAndSetup();
  }, []);

  return (
    <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "help-circle";

            switch (route.name) {
              case "index":
                iconName = "home-outline";
                break;
              case "focus":
                iconName = "time-outline";
                break;
              case "notes":
                iconName = "document-text-outline";
                break;
              case "analytics":
                iconName = "stats-chart-outline";
                break;
              case "settings":
                iconName = "settings-outline";
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007bff",
          tabBarInactiveTintColor: "gray",
          // Hide headers for all screens in the tab bar by default.
          // Individual screens will override this if they need a header.
          headerShown: false, 
          tabBarStyle: {
            backgroundColor: "#121212",
            borderTopColor: "#222",
          },
        })}
    >
        <Tabs.Screen 
            name="index" 
            options={{ title: "Home" }} 
        />
        <Tabs.Screen 
            name="focus" 
            options={{ title: "Focus" }} 
        />
        <Tabs.Screen 
            name="notes" 
            options={{ title: "Notes" }} 
        />
        <Tabs.Screen 
            name="analytics" 
            options={{ title: "Analytics" }} 
        />
        <Tabs.Screen 
            name="settings" 
            options={{ title: "Settings" }} 
        />

        {/* By removing the <Tabs.Screen name="template" ... /> entry, 
          we resolve the "extraneous route" warning. The header options
          will now be controlled by the template.tsx file itself.
        */}
    </Tabs>
  );
}
