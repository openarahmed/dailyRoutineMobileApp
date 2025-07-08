import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("notificationsEnabled").then((value) => {
      if (value !== null) {
        setIsEnabled(value === "true");
      }
    });
  }, []);

  const toggleSwitch = async () => {
    try {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      await AsyncStorage.setItem("notificationsEnabled", newValue.toString());

      if (!newValue) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert("Notifications disabled");
      } else {
        Alert.alert("Notifications enabled");
      }
    } catch (e) {
      Alert.alert("Error toggling notifications");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.switchRow}>
        <Text style={styles.text}>Enable Notifications</Text>
        <Switch onValueChange={toggleSwitch} value={isEnabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000000", // black background
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#fff", // white text here too
  },
});
