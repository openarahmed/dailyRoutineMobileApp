import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
// ✅ Speech এবং Linking মডিউল ইম্পোর্ট করা হয়েছে
import * as Speech from "expo-speech";
import { Alert, Linking, Platform } from "react-native";

// ✅ নতুন ফাংশন: ভয়েস ইঞ্জিন চেক এবং ইনস্টল করার জন্য
const checkAndInstallTTS = async () => {
  // এই ফিচারটি শুধুমাত্র অ্যান্ড্রয়েডের জন্য প্রযোজ্য
  if (Platform.OS !== "android") {
    return;
  }

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    // যদি ফোনে কোনো ভয়েস ইঞ্জিন না পাওয়া যায়
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

export default function Layout() {
  useEffect(() => {
    async function requestPermissionsAndSetup() {
      // নোটিফিকেশন পারমিশন চাওয়া
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

      // ✅ অ্যাপ চালু হওয়ার সময় ভয়েস ইঞ্জিন চেক করা
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
            // ✅ NEW: Added 'notes' case for the new tab
            case "notes":
              iconName = "document-text-outline";
              break;
            case "analytics":
              iconName = "stats-chart-outline";
              break;
            case "template":
              iconName = "albums-outline";
              break;
            case "settings":
              iconName = "settings-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "#222",
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="focus" options={{ title: "Focus" }} />
      {/* ✅ NEW: Added the 'notes' screen to the tab bar */}
      <Tabs.Screen name="notes" options={{ title: "Notes" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="template" options={{ title: "Templates" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
