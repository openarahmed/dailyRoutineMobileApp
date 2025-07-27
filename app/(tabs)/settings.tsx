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
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatTime } from "../../utils/timeHelpers"; // Make sure this utility exists

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const runDailyAIChecks = async (force = false) => {
  console.log("Running daily AI checks", { force });
};

export default function SettingsScreen() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState<boolean>(false);

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
          "You will now receive notifications. This does not re-schedule past routines, only new or edited ones, and Eye Protector reminders."
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
      await AsyncStorage.setItem("voiceNotificationsEnabled", newValue.toString());
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
    Speech.speak(testPhrase, {
      language: "en-US",
      onDone: () => console.log("Speech test finished."),
      onError: (error) => console.error("Speech test error:", error),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.heading}>Settings</Text>
        </View>

        <Link href="/eye-protector" asChild>
          <TouchableOpacity style={styles.settingRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons name="eye-outline" size={moderateScale(22)} color="#007AFF" style={{marginRight: scale(15)}}/>
                  <Text style={styles.text}>Eye Protector</Text>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(22)} color="#8A8A8E" />
          </TouchableOpacity>
        </Link>

        <View style={styles.settingRow}>
          <Text style={styles.text}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isEnabled ? "#007AFF" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.text}>Enable Voice Notifications</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isVoiceEnabled ? "#007AFF" : "#f4f3f4"}
            onValueChange={toggleVoiceSwitch}
            value={isVoiceEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.text}>Set Bedtime</Text>
          <TouchableOpacity onPress={() => setShowSleepTimePicker(true)}>
            <Text style={styles.timeText}>{sleepTime ? formatTime(sleepTime) : "Tap to set"}</Text>
          </TouchableOpacity>
        </View>

        {showSleepTimePicker && (
          <DateTimePicker
            mode="time"
            value={sleepTime || new Date()}
            display="spinner"
            onChange={handleSleepTimeChange}
            textColor={Platform.OS === 'ios' ? '#FFFFFF' : '#000'}
          />
        )}

        <View style={styles.testButtonContainer}>
          <Button
            title="Test Voice Output"
            onPress={handleTestVoice}
            color="#007AFF"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b111d",
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(15),
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20),
    marginBottom: verticalScale(25),
  },
  heading: {
    fontSize: moderateScale(32, 0.4),
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: 'left',
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 46, 0.7)",
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  text: {
    fontSize: moderateScale(16),
    color: "#fff",
  },
  timeText: {
    fontSize: moderateScale(16),
    color: "#007AFF",
    fontWeight: "bold",
  },
  testButtonContainer: {
    marginTop: verticalScale(30),
    marginHorizontal: scale(20),
    backgroundColor: '#1C1C1E',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
});