import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { useNavigation } from "expo-router";
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
import { useTheme } from "../../context/ThemeContext";
import { formatTime } from "../../utils/timeHelpers";

// --- RESPONSIVE SCALING UTILITIES ---
const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const runDailyAIChecks = async (force = false) => {
  console.log("Running daily AI checks", { force });
};

export default function SettingsScreen() {
  const { colors, themeName, setThemeName } = useTheme();
  const navigation = useNavigation();
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notifEnabled = await AsyncStorage.getItem("notificationsEnabled");
        if (notifEnabled !== null) setIsEnabled(notifEnabled === "true");
        const voiceEnabled = await AsyncStorage.getItem("voiceNotificationsEnabled");
        if (voiceEnabled !== null) setIsVoiceEnabled(voiceEnabled === "true");
        const storedSleepTime = await AsyncStorage.getItem("userSleepTime");
        if (storedSleepTime) {
          setSleepTime(new Date(storedSleepTime));
        } else {
          const defaultSleepTime = new Date();
          defaultSleepTime.setHours(23, 0, 0);
          setSleepTime(defaultSleepTime);
        }
        const storedTheme = await AsyncStorage.getItem("userTheme");
        if (storedTheme) {
          setThemeName(storedTheme as any);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    loadSettings();
  }, [setThemeName]);

  const toggleSwitch = async () => {
    try {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      await AsyncStorage.setItem("notificationsEnabled", newValue.toString());
      if (!newValue) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert("Notifications disabled", "All upcoming notifications have been cancelled.");
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
      Alert.alert("Voice Notifications", `Voice notifications have been ${newValue ? "enabled" : "disabled"}.`);
    } catch (e) {
      Alert.alert("Error", "Failed to update voice notification settings.");
    }
  };

  const handleSleepTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowSleepTimePicker(false);
    if (selectedDate) {
      setSleepTime(selectedDate);
      await AsyncStorage.setItem("userSleepTime", selectedDate.toISOString());
      const todayStr = new Date().toISOString().split("T")[0];
      await AsyncStorage.removeItem(`endOfDayReportScheduled_${todayStr}`);
      await runDailyAIChecks(true);
      Alert.alert("Bedtime Updated", `Your daily report has been rescheduled based on your new bedtime.`);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundColor }]}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: verticalScale(40) }}>
        <View style={styles.headerContainer}>
          <Text style={[styles.heading, { color: colors.textColor }]}>Settings</Text>
        </View>

        {/* --- GENERAL SETTINGS SECTION --- */}
        <Text style={[styles.sectionHeading, { color: colors.inputLabelText }]}>GENERAL</Text>

        {/* Themes */}
        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}
          onPress={() => navigation.navigate("themes")}
          activeOpacity={0.7}
        >
          <View style={styles.iconTextContainer}>
            <Ionicons
              name="color-palette-outline"
              size={moderateScale(22)}
              color={colors.accentColor}
              style={styles.iconStyle}
            />
            <Text style={[styles.text, { color: colors.textColor }]}>Themes</Text>
          </View>
          <Ionicons name="chevron-forward" size={moderateScale(22)} color={colors.iconColor} />
        </TouchableOpacity>

        {/* Eye Protector - use onPress navigate for reliability */}
        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}
          onPress={() => navigation.navigate("eye-protector")}
          activeOpacity={0.7}
        >
          <View style={styles.iconTextContainer}>
            <Ionicons name="eye-outline" size={moderateScale(22)} color={colors.accentColor} style={styles.iconStyle} />
            <Text style={[styles.text, { color: colors.textColor }]}>Eye Protector</Text>
          </View>
          <Ionicons name="chevron-forward" size={moderateScale(22)} color={colors.iconColor} />
        </TouchableOpacity>

        {/* Bedtime */}
        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <View style={styles.iconTextContainer}>
            <Ionicons name="bed-outline" size={moderateScale(22)} color={colors.accentColor} style={styles.iconStyle} />
            <Text style={[styles.text, { color: colors.textColor }]}>Set Bedtime</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSleepTimePicker(true)}>
            <Text style={[styles.timeText, { color: colors.accentColor }]}>{sleepTime ? formatTime(sleepTime) : "Tap to set"}</Text>
          </TouchableOpacity>
        </View>

        {showSleepTimePicker && (
          <DateTimePicker
            mode="time"
            value={sleepTime || new Date()}
            display="spinner"
            textColor={Platform.OS === "ios" ? colors.textColor : colors.modalBg}
            onChange={handleSleepTimeChange}
          />
        )}

        {/* --- NOTIFICATIONS SECTION --- */}
        <Text style={[styles.sectionHeading, { color: colors.inputLabelText, marginTop: verticalScale(20) }]}>NOTIFICATIONS</Text>

        {/* Enable Notifications */}
        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <View style={styles.iconTextContainer}>
            <Ionicons name="notifications-outline" size={moderateScale(22)} color={colors.accentColor} style={styles.iconStyle} />
            <Text style={[styles.text, { color: colors.textColor }]}>Enable Notifications</Text>
          </View>
          <Switch
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={isEnabled ? colors.accentColor : colors.switchThumbOff}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {/* Voice Notifications */}
        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <View style={styles.iconTextContainer}>
            <Ionicons name="volume-high-outline" size={moderateScale(22)} color={colors.accentColor} style={styles.iconStyle} />
            <Text style={[styles.text, { color: colors.textColor }]}>Enable Voice Notifications</Text>
          </View>
          <Switch
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={isVoiceEnabled ? colors.accentColor : colors.switchThumbOff}
            onValueChange={toggleVoiceSwitch}
            value={isVoiceEnabled}
          />
        </View>

        {/* Test Voice Output */}
        <View style={[styles.testButtonContainer, { backgroundColor: colors.testButtonBg }]}>
          <Button title="Test Voice Output" onPress={handleTestVoice} color={colors.accentColor} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: scale(15) },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20),
    marginBottom: verticalScale(25),
  },
  heading: {
    fontSize: moderateScale(32, 0.4),
    fontWeight: "bold",
    textAlign: "left",
  },
  sectionHeading: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    marginLeft: scale(5),
    marginBottom: verticalScale(10),
    marginTop: verticalScale(10),
  },
  settingRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    flexWrap: "nowrap",
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // <-- ensures left side takes available space
  },
  iconStyle: {
    marginRight: scale(15),
  },
  text: { fontSize: moderateScale(16), flexShrink: 1 }, // <-- allow shrink instead of wrapping
  timeText: { fontSize: moderateScale(16), fontWeight: "bold" },
  testButtonContainer: {
    marginTop: verticalScale(30),
    marginHorizontal: scale(20),
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
});
