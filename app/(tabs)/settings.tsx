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
import { ThemeName, useTheme } from "../../context/ThemeContext";
import { formatTime } from "../../utils/timeHelpers";

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
  const { colors, themeName, setThemeName } = useTheme();
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [sleepTime, setSleepTime] = useState<Date | null>(null);
  const [showSleepTimePicker, setShowSleepTimePicker] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);

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
          setThemeName(storedTheme as ThemeName);
          setSelectedTheme(storedTheme as ThemeName);
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

  const handleThemeChange = async (theme: ThemeName) => {
    setSelectedTheme(theme);
    setThemeName(theme);
    await AsyncStorage.setItem("userTheme", theme);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundColor }]}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={[styles.heading, { color: colors.textColor }]}>Settings</Text>
        </View>
        
        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <Text style={[styles.text, { color: colors.textColor }]}>Theme</Text>
          <View style={styles.themeButtons}>
            <TouchableOpacity 
              onPress={() => handleThemeChange('light')} 
              style={[styles.themeButton, selectedTheme === 'light' && { borderColor: colors.accentColor }]}
            >
              <Text style={[styles.themeButtonText, { color: colors.textColor }]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleThemeChange('dark')}
              style={[styles.themeButton, selectedTheme === 'dark' && { borderColor: colors.accentColor }]}
            >
              <Text style={[styles.themeButtonText, { color: colors.textColor }]}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleThemeChange('classic')}
              style={[styles.themeButton, selectedTheme === 'classic' && { borderColor: colors.accentColor }]}
            >
              <Text style={[styles.themeButtonText, { color: colors.textColor }]}>Classic</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Link href="/eye-protector" asChild>
          <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="eye-outline" size={moderateScale(22)} color={colors.accentColor} style={{marginRight: scale(15)}}/>
              <Text style={[styles.text, { color: colors.textColor }]}>Eye Protector</Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(22)} color={colors.iconColor} />
          </TouchableOpacity>
        </Link>

        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <Text style={[styles.text, { color: colors.textColor }]}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={isEnabled ? colors.accentColor : colors.switchThumbOff}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <Text style={[styles.text, { color: colors.textColor }]}>Enable Voice Notifications</Text>
          <Switch
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={isVoiceEnabled ? colors.accentColor : colors.switchThumbOff}
            onValueChange={toggleVoiceSwitch}
            value={isVoiceEnabled}
          />
        </View>

        <View style={[styles.settingRow, { backgroundColor: colors.settingRowBg }]}>
          <Text style={[styles.text, { color: colors.textColor }]}>Set Bedtime</Text>
          <TouchableOpacity onPress={() => setShowSleepTimePicker(true)}>
            <Text style={[styles.timeText, { color: colors.accentColor }]}>{sleepTime ? formatTime(sleepTime) : "Tap to set"}</Text>
          </TouchableOpacity>
        </View>

        {showSleepTimePicker && (
          <DateTimePicker
            mode="time"
            value={sleepTime || new Date()}
            display="spinner"
            textColor={Platform.OS === 'ios' ? colors.textColor : colors.modalBg}
            onChange={handleSleepTimeChange}
          />
        )}

        <View style={[styles.testButtonContainer, { backgroundColor: colors.testButtonBg }]}>
          <Button
            title="Test Voice Output"
            onPress={handleTestVoice}
            color={colors.accentColor}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    textAlign: 'left',
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  text: {
    fontSize: moderateScale(16),
  },
  timeText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  themeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    marginLeft: scale(10),
    borderColor: 'transparent',
  },
  themeButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  testButtonContainer: {
    marginTop: verticalScale(30),
    marginHorizontal: scale(20),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
});