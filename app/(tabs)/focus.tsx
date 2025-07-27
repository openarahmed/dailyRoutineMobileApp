import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


// --- RESPONSIVE SCALING UTILITIES ---
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
// --- END OF UTILITIES ---


// --- Main Focus Screen Component ---
const FocusScreen = () => {
  // All your state and logic remains exactly the same
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState("25");
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // All your useEffects and handler functions remain exactly the same
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please grant notification permissions to receive alerts.');
        }
      }
    };
    requestPermissions();
  }, []);

  const triggerTimerEndNotification = async () => {
    if (!notificationsEnabled) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: "FOCUS", body: "Time's up! Great work staying focused.", sound: true },
      trigger: null,
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      triggerTimerEndNotification();
      Alert.alert("Time's up!", "Your focus session has ended.");
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerActive, timerSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchActive) {
      interval = setInterval(() => setStopwatchTime((prev) => prev + 10), 10);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isStopwatchActive]);

  const handleToggleStartPause = () => {
    if (mode === 'timer') {
      if (!isTimerActive && timerSeconds === 0) {
        const minutes = parseInt(timerInputMinutes, 10);
        if (isNaN(minutes) || minutes <= 0) {
          Alert.alert("Invalid Input", "Please enter a valid number of minutes.");
          return;
        }
        setTimerSeconds(minutes * 60);
      }
      setIsTimerActive(!isTimerActive);
      Keyboard.dismiss();
    } else {
      setIsStopwatchActive(!isStopwatchActive);
    }
  };

  const handleReset = () => {
    if (mode === 'timer') {
      setIsTimerActive(false);
      const minutes = parseInt(timerInputMinutes, 10) || 25;
      setTimerSeconds(minutes * 60);
    } else {
      setIsStopwatchActive(false);
      setStopwatchTime(0);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${mins}:${secs}`;
  };

  const formatStopwatchTime = (timeInMillis: number) => {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    const milliseconds = (Math.floor(timeInMillis / 10) % 100).toString().padStart(2, '0');
    return { hours, mins, secs, milliseconds };
  };

  const renderTimer = () => (
    <>
      <Text style={styles.timeDisplay}>{formatTime(timerSeconds)}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={timerInputMinutes}
          onChangeText={setTimerInputMinutes}
          keyboardType="numeric"
          editable={!isTimerActive}
          placeholder="25"
          placeholderTextColor="#555"
        />
        <Text style={styles.inputLabel}>minutes</Text>
      </View>
    </>
  );

  const renderStopwatch = () => {
    const { hours, mins, secs, milliseconds } = formatStopwatchTime(stopwatchTime);
    return (
      <>
        <View style={styles.stopwatchDisplayContainer}>
          <Text style={styles.timeDisplay}>{`${hours}:${mins}:${secs}`}</Text>
          <Text style={styles.milliSecondDisplay}>.{milliseconds}</Text>
        </View>
        <View style={styles.inputContainer} />
      </>
    );
  };

  return (
    // Using SafeAreaView and a container to control spacing
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* THIS IS THE NEW STANDARDIZED HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>FOCUS</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.switcherContainer}>
            {["Timer", "Stopwatch"].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m.toLowerCase() as "timer" | "stopwatch")}
                style={[ styles.switcherButton, mode === m.toLowerCase() && styles.switcherActiveButton ]}
              >
                <Text style={[ styles.switcherText, mode === m.toLowerCase() && styles.switcherActiveText ]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.contentContainer}>
            {mode === "timer" ? renderTimer() : renderStopwatch()}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.startButton} onPress={handleToggleStartPause}>
              <LinearGradient colors={["#4188ff", "#345cef"]} style={styles.gradient}>
                <Text style={styles.buttonText}>
                  {isTimerActive || isStopwatchActive ? "Pause" : "Start"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={moderateScale(28)} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.combinedCard}>
            <View style={styles.cardRow}>
              <Ionicons name="notifications-outline" size={moderateScale(24)} color="#fff" />
              <Text style={styles.cardText}>Notification:</Text>
              <TouchableOpacity onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
                  <Text style={styles.cardValueText}>{notificationsEnabled ? "On" : "Off"}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.cardRow, { paddingTop: 0 }]}>
              <Ionicons name="musical-notes-outline" size={moderateScale(24)} color="#fff" />
              <Text style={styles.cardText}>Ambient Sound</Text>
              <TouchableOpacity onPress={() => Alert.alert("Feature unavailable", "This feature requires a new build.")}>
                   <Text style={styles.cardValueText}>Rain</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.tipText}>Tip: Stay away from your phone!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};


// --- UPDATED RESPONSIVE STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b111d",
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(15), // Consistent padding like HomeScreen
  },
  // NEW header container to match HomeScreen
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20),
    marginBottom: verticalScale(25),
  },
  // UPDATED heading style
  heading: {
    fontSize: moderateScale(32, 0.4),
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: 'center', // Explicitly left-aligned
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#18202e",
    borderRadius: moderateScale(25),
    padding: scale(5),
    marginBottom: verticalScale(10), // Reduced margin to accommodate new header spacing
  },
  switcherButton: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(28),
    borderRadius: moderateScale(20),
  },
  switcherActiveButton: {
    backgroundColor: "#3339426c",
  },
  switcherText: {
    color: "#9e9e9e86",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  switcherActiveText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: verticalScale(30),
    height: verticalScale(150),
  },
  timeDisplay: {
    fontSize: moderateScale(74, 0.4),
    fontWeight: "600",
    color: "#7ceffd",
    marginTop: verticalScale(40),
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-light",
  },
  stopwatchDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: verticalScale(20),
  },
  milliSecondDisplay: {
    fontSize: moderateScale(32, 0.4),
    fontWeight: '200',
    color: '#7ceffd',
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-light",
    marginLeft: scale(2),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    height: verticalScale(70),
  },
  input: {
    backgroundColor: "#18202e",
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "600",
    textAlign: "center",
    padding: moderateScale(15),
    width: scale(80),
    borderRadius: moderateScale(10),
  },
  inputLabel: {
    color: "#888",
    fontSize: moderateScale(18),
    marginLeft: scale(10),
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: verticalScale(15),
    marginTop: verticalScale(70),
  },
  startButton: {
    flex: 3,
    marginRight: scale(15),
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(12),
    height: verticalScale(75),
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#18202e",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(12),
    height: verticalScale(75),
  },
  buttonText: {
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  combinedCard: {
    backgroundColor: '#18202e',
    borderRadius: moderateScale(12),
    width: '100%',
    marginBottom: verticalScale(15),
    paddingVertical: verticalScale(10),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
  },
  cardText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '500',
    flex: 1,
    marginLeft: scale(15),
  },
  cardValueText: {
    color: '#A0A0A0',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  tipText: {
    color: '#666',
    fontSize: moderateScale(14),
    marginTop: verticalScale(5),
    fontWeight: '500',
  }
});

export default FocusScreen;