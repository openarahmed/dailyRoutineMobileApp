import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Alert, Platform, View } from "react-native";
import "react-native-reanimated";
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { registerEyeProtectorTask } from '../services/eyeProtectorService';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const checkAndInstallTTS = async () => {
  console.log("Checking and installing TTS if needed...");
};

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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return true;
}

function RootLayoutContent() {
  const { themeName, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundColor }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBackground },
          headerTintColor: colors.headerText,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="eye-protector" 
          options={{ 
            headerShown: false, 
            presentation: 'modal',
            contentStyle: { backgroundColor: colors.backgroundColor } 
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  useEffect(() => {
    async function setupAppAndHideSplash() {
      try {
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
        await SplashScreen.hideAsync();
      }
    }
    if (fontsLoaded || fontError) {
      setupAppAndHideSplash();
    }
  }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) {
    return null;
  }
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}