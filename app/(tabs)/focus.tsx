import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

// --- Animated SVG Circle for Progress ---
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- Constants ---
const SIZE = 280;
const STROKE_WIDTH = 15;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// --- Premium Focus Screen Component ---
const FocusScreen = () => {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");

  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerInputMinutes, setTimerInputMinutes] = useState("25");

  // Stopwatch States
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchActive, setIsStopwatchActive] = useState(false);

  // Animation
  const animatedProgress = useRef(new Animated.Value(1)).current;

  // Notification for timer completion
  const triggerTimerEndNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Focus Timer",
        body: "Time's up! Great work!",
        sound: true,
      },
      trigger: null,
    });
  };

  // Timer Countdown Logic
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

  // Stopwatch Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchActive) {
      interval = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchActive]);

  // Animation for Timer Progress
  useEffect(() => {
    const progress =
      totalTimerSeconds > 0 ? timerSeconds / totalTimerSeconds : 1;
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [timerSeconds, totalTimerSeconds]);

  // --- Handlers ---
  const handleStartTimer = () => {
    const minutes = parseInt(timerInputMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of minutes.");
      return;
    }
    const totalSeconds = minutes * 60;
    setTotalTimerSeconds(totalSeconds);
    setTimerSeconds(totalSeconds);
    setIsTimerActive(true);
    animatedProgress.setValue(1);
    Keyboard.dismiss();
  };

  const handlePauseTimer = () => setIsTimerActive(false);
  const handleResetTimer = () => {
    setIsTimerActive(false);
    setTimerInputMinutes("25");
    const newTotalSeconds = 25 * 60;
    setTotalTimerSeconds(newTotalSeconds);
    setTimerSeconds(newTotalSeconds);
    animatedProgress.setValue(1);
  };

  const handleStartStopwatch = () => setIsStopwatchActive(true);
  const handlePauseStopwatch = () => setIsStopwatchActive(false);
  const handleResetStopwatch = () => {
    setIsStopwatchActive(false);
    setStopwatchTime(0);
  };

  // --- Formatting ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const formatStopwatchTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
      .toString()
      .padStart(2, "0");
    const seconds = (Math.floor(time / 1000) % 60).toString().padStart(2, "0");
    const milliseconds = (Math.floor(time / 10) % 100)
      .toString()
      .padStart(2, "0");
    return { minutes, seconds, milliseconds };
  };

  const progressAnimation = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCUMFERENCE],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Focus Zone</Text>

      <View style={styles.switcherContainer}>
        {["timer", "stopwatch"].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m as "timer" | "stopwatch")}
            style={[
              styles.switcherButton,
              mode === m && styles.switcherActiveButton,
            ]}
          >
            <Text
              style={[
                styles.switcherText,
                mode === m && styles.switcherActiveText,
              ]}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentContainer}>
        {mode === "timer" && (
          <>
            <View style={styles.timerCircle}>
              <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#2D2D2D"
                  strokeWidth={STROKE_WIDTH}
                />
                <AnimatedCircle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#007BFF"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={progressAnimation}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              </Svg>
              <View style={styles.timeDisplayContainer}>
                <Text style={styles.timeDisplay}>
                  {formatTime(timerSeconds)}
                </Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={timerInputMinutes}
                onChangeText={setTimerInputMinutes}
                keyboardType="numeric"
                editable={!isTimerActive}
              />
              <Text style={styles.inputLabel}>minutes</Text>
            </View>
          </>
        )}

        {mode === "stopwatch" && (
          <View style={styles.timerCircle}>
            <View style={styles.timeDisplayContainer}>
              <Text style={styles.timeDisplay}>
                {formatStopwatchTime(stopwatchTime).minutes}:
                {formatStopwatchTime(stopwatchTime).seconds}
              </Text>
              <Text style={styles.milliSecondDisplay}>
                .{formatStopwatchTime(stopwatchTime).milliseconds}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={mode === "timer" ? handleResetTimer : handleResetStopwatch}
        >
          <Ionicons name="refresh" size={32} color="#EFEFEF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={
            mode === "timer"
              ? isTimerActive
                ? handlePauseTimer
                : handleStartTimer
              : isStopwatchActive
              ? handlePauseStopwatch
              : handleStartStopwatch
          }
        >
          <Ionicons
            name={isTimerActive || isStopwatchActive ? "pause" : "play"}
            size={40}
            color="#121212"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // ✅ FIX: Updated heading style as requested
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 45,
    marginBottom: 20,
    textAlign: "left",
  },
  switcherContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 30,
    padding: 5,
    alignSelf: "center",
    marginBottom: 20,
  },
  switcherButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  switcherActiveButton: {
    backgroundColor: "#007BFF",
  },
  switcherText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  switcherActiveText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  timerCircle: {
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  timeDisplayContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "baseline",
    flexDirection: "row",
  },
  timeDisplay: {
    fontSize: 72,
    fontWeight: "200",
    color: "#EFEFEF",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-light",
  },
  milliSecondDisplay: {
    fontSize: 24,
    color: "#888",
    fontWeight: "200",
    marginLeft: 2,
    lineHeight: 72,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingBottom: 20,
  },
  buttonPrimary: {
    backgroundColor: "#007BFF",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#007BFF",
    shadowRadius: 15,
    shadowOpacity: 0.3,
  },
  buttonSecondary: {
    backgroundColor: "#2D2D2D",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FocusScreen;
