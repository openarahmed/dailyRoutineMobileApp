import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Main Focus Screen Component ---
const FocusScreen = () => {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");

  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState("25");

  // Stopwatch States
  const [stopwatchTime, setStopwatchTime] = useState(0); // Time in milliseconds
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);

  // Feature States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // --- Notification Logic ---
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
      content: {
        title: "FOCUS",
        body: "Time's up! Great work staying focused.",
        sound: true,
      },
      trigger: null,
    });
  };

  // --- Timer & Stopwatch Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      triggerTimerEndNotification();
      Alert.alert("Time's up!", "Your focus session has ended.");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchActive) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 10); // Increment by 10ms
      }, 10); // Run every 10ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchActive]);

  // --- Handlers ---
  const handleToggleStartPause = () => {
    if (mode === 'timer') {
      // If timer is at 0 and inactive, first set the time from input
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

  // --- Formatting ---
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

  // --- Render Functions ---
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
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.heading}>FOCUS</Text>

        <View style={styles.switcherContainer}>
          {["Timer", "Stopwatch"].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m.toLowerCase() as "timer" | "stopwatch")}
              style={[
                styles.switcherButton,
                mode === m.toLowerCase() && styles.switcherActiveButton,
              ]}
            >
              <Text style={[
                  styles.switcherText,
                  mode === m.toLowerCase() && styles.switcherActiveText,
                ]}
              >
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
            <LinearGradient
              colors={["#4188ff", "#345cef"]}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>
                {isTimerActive || isStopwatchActive ? "Pause" : "Start"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Feature Cards */}
        <View style={styles.combinedCard}>
          {/* Notification Row */}
          <View style={styles.cardRow}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <Text style={styles.cardText}>Notification:</Text>
            <TouchableOpacity onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
                <Text style={styles.cardValueText}>{notificationsEnabled ? "On" : "Off"}</Text>
            </TouchableOpacity>
          </View>

          {/* Sound Row */}
          <View style={[styles.cardRow, { paddingTop: 0 }]}>
            <Ionicons name="musical-notes-outline" size={24} color="#fff" />
            <Text style={styles.cardText}>Ambient Sound</Text>
            <TouchableOpacity onPress={() => Alert.alert("Feature unavailable", "This feature requires a new build.")}>
                 <Text style={styles.cardValueText}>Rain</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.tipText}>Tip: Stay away from your phone!</Text>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b111d",
paddingTop:20  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  heading: {
    fontSize: 34,
    fontWeight: '600',
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 30,
    textAlign: "center",
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#18202e",
    borderRadius: 25,
    padding: 5,
    marginBottom: 30,
  },
  switcherButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  switcherActiveButton: {
    backgroundColor: "#3339426c",
  },
  switcherText: {
    color: "#9e9e9e86",
    fontSize: 15,
    fontWeight: "600",
  },
  switcherActiveText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 30,
    height: 150,
  },
  timeDisplay: {
    fontSize: 74,
    fontWeight: "600",
    color: "#7ceffd",
    marginTop:40,
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-light",
  },
  stopwatchDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  milliSecondDisplay: {
    fontSize: 32,
    fontWeight: '200',
    color: '#7ceffd',
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-light",
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    height: 70,
        

  },
  input: {
    backgroundColor: "#18202e",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    padding: 15,
    width: 80,
    borderRadius: 10,
  },
  inputLabel: {
    color: "#888",
    fontSize: 18,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 15,
    marginTop: 70, // Added margin top
  },
  startButton: {
    flex: 3, // Increased flex to make it larger
    marginRight: 15,
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 22, // Increased height
    borderRadius: 12,
    height:75,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#18202e",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 22, // Increased height
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  combinedCard: {
    backgroundColor: '#18202e',
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
    paddingVertical: 18, // Add some vertical padding to the card itself
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Adjusted padding
    paddingHorizontal: 20,
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 15,
  },
  cardValueText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '500',
  },
  tipText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  }
});

export default FocusScreen;
