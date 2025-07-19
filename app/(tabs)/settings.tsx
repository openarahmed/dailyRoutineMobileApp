// app/(tabs)/settings.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { Link } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Import helper functions from the utils file
import { formatTime } from "../../utils/timeHelpers";
// Mock import, assuming this service exists
// import { runDailyAIChecks } from "../../services/aiSuggestions";
const runDailyAIChecks = async (force = false) => {
  console.log("Running daily AI checks", { force });
};

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [showSleepTimePicker, setShowSleepTimePicker] =
    useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem("notificationsEnabled").then((value) => {
      setIsEnabled(value === null ? true : value === "true");
    });
    AsyncStorage.getItem("voiceNotificationsEnabled").then((value) => {
      setIsVoiceEnabled(value === null ? true : value === "true");
    });
    AsyncStorage.getItem("userSleepTime").then((value) => {
      if (value) {
        setSleepTime(new Date(value));
      } else {
        const defaultSleepTime = new Date();
        defaultSleepTime.setHours(23, 0, 0);
        setSleepTime(defaultSleepTime);
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
        Alert.alert(
          "Notifications disabled",
          "All upcoming notifications have been cancelled."
        );
      } else {
        Alert.alert(
          "Notifications enabled",
          "You will now receive notifications for your tasks. Note: This does not re-schedule past routines, only new or edited ones."
        );
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update notification settings.");
    }
  };

  const toggleVoiceSwitch = async () => {
    try {
      const newValue = !isVoiceEnabled;
      setIsVoiceEnabled(newValue);
      await AsyncStorage.setItem(
        "voiceNotificationsEnabled",
        newValue.toString()
      );
      Alert.alert(
        "Voice Notifications",
        `Voice notifications have been ${newValue ? "enabled" : "disabled"}.`
      );
    } catch (e) {
      Alert.alert("Error", "Failed to update voice notification settings.");
    }
  };

  const handleSleepTimeChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowSleepTimePicker(false);
    if (selectedDate) {
      setSleepTime(selectedDate);
      await AsyncStorage.setItem("userSleepTime", selectedDate.toISOString());

      const todayStr = new Date().toISOString().split("T")[0];
      await AsyncStorage.removeItem(`endOfDayReportScheduled_${todayStr}`);

      await runDailyAIChecks(true);

      Alert.alert(
        "Bedtime Updated",
        `Your daily report has been rescheduled based on your new bedtime.`
      );
    }
  };

  const handleTestVoice = () => {
    const testPhrase = "This is a voice test from the application.";
    console.log("Attempting to speak:", testPhrase);
    Speech.speak(testPhrase, {
      language: "en-US",
      onDone: () => console.log("Speech test finished."),
      onError: (error) => console.error("Speech test error:", error),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      {/* ✅ Eye Protector অপশনটি এখানে যোগ করা হয়েছে */}
      <Link href="/eye-protector" asChild>
        <TouchableOpacity style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="eye-outline" size={22} color="#007AFF" style={{marginRight: 15}}/>
                <Text style={styles.text}>Eye Protector</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#8A8A8E" />
        </TouchableOpacity>
      </Link>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Enable Notifications</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Enable Voice Notifications</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isVoiceEnabled ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={toggleVoiceSwitch}
          value={isVoiceEnabled}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.text}>Set Bedtime</Text>
        <TouchableOpacity onPress={() => setShowSleepTimePicker(true)}>
          <Text style={styles.timeText}>{formatTime(sleepTime)}</Text>
        </TouchableOpacity>
      </View>

      {showSleepTimePicker && (
        <DateTimePicker
          mode="time"
          value={sleepTime || new Date()}
          display="spinner"
          onChange={handleSleepTimeChange}
        />
      )}

      <View style={styles.testButtonContainer}>
        <Button
          title="Test Voice Output"
          onPress={handleTestVoice}
          color="#007bff"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#0b111d",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e1e52",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
  timeText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
  },
  testButtonContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
});