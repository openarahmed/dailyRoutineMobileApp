import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateRoutineScreen() {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sessions, setSessions] = useState<
    {
      id: string;
      title: string;
      start: string;
      end: string;
      notificationId?: string;
    }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ✅ FIX: Combine both focus effects into one
  useFocusEffect(
    useCallback(() => {
      const loadSessionsSmart = async () => {
        const selected = await AsyncStorage.getItem("selectedSessions");

        if (selected) {
          const sessionsFromTemplate = JSON.parse(selected);
          setSessions(sessionsFromTemplate);
          await AsyncStorage.setItem(
            "studyRoutine",
            JSON.stringify(sessionsFromTemplate)
          ); // persist
          await AsyncStorage.removeItem("selectedSessions");
        } else {
          const saved = await AsyncStorage.getItem("studyRoutine");
          if (saved) {
            setSessions(JSON.parse(saved));
          } else {
            setSessions([]);
          }
        }
      };

      loadSessionsSmart();
    }, [])
  );

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Permission required for notifications");
    }
  };

  const saveSessions = async (data: any) => {
    try {
      await AsyncStorage.setItem("studyRoutine", JSON.stringify(data));
      setSessions(data);
    } catch (error) {
      Alert.alert("Error saving routine");
    }
  };

  const cancelNotification = async (notificationId?: string) => {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (error) {
        console.log("Error cancelling notification", error);
      }
    }
  };

  const scheduleNotification = async (title: string, startTime: string) => {
    const date = parseTimeToDate(startTime);
    if (!date) return;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚",
          body: `Time to start: ${title}`,
          sound: "default",
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      return notificationId;
    } catch (error) {
      console.log("Error scheduling notification", error);
    }
  };

  const parseTimeToDate = (timeStr: string): Date | null => {
    const now = new Date();
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return null;

    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

    const result = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    if (result < now) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  };

  const addOrUpdateSession = async () => {
    if (!title || !startTime || !endTime) {
      Alert.alert("Please fill all fields");
      return;
    }

    const notificationsEnabled = await AsyncStorage.getItem(
      "notificationsEnabled"
    );
    let notificationId: string | undefined;

    if (notificationsEnabled === "true") {
      notificationId = await scheduleNotification(title, startTime);
    }

    let updatedSessions;

    if (editingId) {
      const existing = sessions.find((s) => s.id === editingId);
      if (existing?.notificationId) {
        await cancelNotification(existing.notificationId);
      }

      updatedSessions = sessions.map((s) =>
        s.id === editingId
          ? { ...s, title, start: startTime, end: endTime, notificationId }
          : s
      );
    } else {
      const newSession = {
        id: Date.now().toString(),
        title,
        start: startTime,
        end: endTime,
        notificationId,
      };
      updatedSessions = [...sessions, newSession];
    }

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setEditingId(null);
    setTitle("");
    setStartTime("");
    setEndTime("");
  };

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {editingId ? "Edit Study Session" : "Add A Task"}
      </Text>

      <TextInput
        placeholder="Session Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor="#bbb"
      />

      <TouchableOpacity
        onPress={() => setShowStartPicker(true)}
        style={[styles.input, { justifyContent: "center" }]}
      >
        <Text style={{ color: startTime ? "#fff" : "#bbb" }}>
          {startTime || "Select Start Time"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setShowEndPicker(true)}
        style={[styles.input, { justifyContent: "center" }]}
      >
        <Text style={{ color: endTime ? "#fff" : "#bbb" }}>
          {endTime || "Select End Time"}
        </Text>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          mode="time"
          value={new Date()}
          display="spinner"
          is24Hour={false}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartTime(formatTime(date));
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          mode="time"
          value={new Date()}
          display="spinner"
          is24Hour={false}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndTime(formatTime(date));
          }}
        />
      )}

      <TouchableOpacity onPress={addOrUpdateSession} style={styles.addButton}>
        <Text style={styles.addButtonText}>
          {editingId ? "Save Changes" : "Add Task"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.sessionItem}>
            <Text style={styles.sessionTitle}>
              {index + 1}. {item.title}
            </Text>
            <Text style={styles.sessionTime}>
              {item.start} - {item.end}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            No sessions added yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#121212" },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#333",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sessionItem: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  sessionTitle: { fontWeight: "bold", fontSize: 16, color: "#fff" },
  sessionTime: { color: "#aaa" },
});
