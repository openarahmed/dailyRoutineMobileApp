// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Alert, Platform, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { registerEyeProtectorTask } from '../services/eyeProtectorService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Notification handler for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// A placeholder for your TTS check function
const checkAndInstallTTS = async () => {
  console.log("Checking and installing TTS if needed...");
  // Your actual TTS logic goes here
};

// Function to request notification permissions
async function requestPermissionsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Notifications are needed for reminders to work.');
    return false;
  }
  
  if (Platform.OS === 'android') {
    // This channel is a default fallback. Specific channels should be created where needed.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Load fonts and check for errors
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Add other fonts here if you have them
  });

  useEffect(() => {
    async function setupAppAndHideSplash() {
      try {
        // Run all setup tasks concurrently for faster loading
        await Promise.all([
            (async () => {
                const permissionsGranted = await requestPermissionsAsync();
                if (permissionsGranted) {
                    await registerEyeProtectorTask();
                }
            })(),
            checkAndInstallTTS(),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen once everything is ready
        await SplashScreen.hideAsync();
      }
    }

    // Only run setup and hide splash screen if fonts are loaded or there's an error
    if (fontsLoaded || fontError) {
      setupAppAndHideSplash();
    }
  }, [fontsLoaded, fontError]);

  // If fonts are not loaded and there is no error, return null to keep the splash screen visible.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render the app layout
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
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
