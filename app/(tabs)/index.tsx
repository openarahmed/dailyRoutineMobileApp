import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
  notificationId?: string;
};

type Section = {
  title: string;
  iconName: string;
  timeRange: string;
  data: Session[];
};

export default function HomeScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [countdownMs, setCountdownMs] = useState<number | null>(null);

  const loadSessions = async () => {
    try {
      // Check if a new template was selected
      const selected = await AsyncStorage.getItem("selectedSessions");
      if (selected) {
        const selectedSessions = JSON.parse(selected);
        setSessions(selectedSessions);

        // Save as main routine permanently
        await AsyncStorage.setItem(
          "studyRoutine",
          JSON.stringify(selectedSessions)
        );

        // Remove to prevent reloading next time
        await AsyncStorage.removeItem("selectedSessions");
      } else {
        // Otherwise load saved routine normally
        const stored = await AsyncStorage.getItem("studyRoutine");
        setSessions(stored ? JSON.parse(stored) : []);
      }
    } catch (err) {
      console.log("Error loading sessions:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const saveSessions = async (data: Session[]) => {
    try {
      await AsyncStorage.setItem("studyRoutine", JSON.stringify(data));
      setSessions(data);
    } catch (err) {
      console.log("Error saving sessions:", err);
    }
  };

  const deleteSession = async (id: string) => {
    const sessionToDelete = sessions.find((s) => s.id === id);
    if (sessionToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        sessionToDelete.notificationId
      );
    }
    const filtered = sessions.filter((s) => s.id !== id);
    await saveSessions(filtered);
  };

  const openEditModal = (session: Session) => {
    setEditSession(session);
    setModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editSession?.title || !editSession.start || !editSession.end) {
      Alert.alert("Please fill in all fields");
      return;
    }

    const updatedSessions = await Promise.all(
      sessions.map(async (s) => {
        if (s.id === editSession.id) {
          if (s.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(
              s.notificationId
            );
          }

          const notificationsEnabled = await AsyncStorage.getItem(
            "notificationsEnabled"
          );
          let newNotificationId;
          if (notificationsEnabled === "true") {
            newNotificationId = await scheduleNotification(
              editSession.title,
              editSession.start
            );
          }

          return { ...editSession, notificationId: newNotificationId };
        }
        return s;
      })
    );

    await saveSessions(updatedSessions);
    setModalVisible(false);
    setEditSession(null);
  };

  const scheduleNotification = async (title: string, timeStr: string) => {
    const date = timeStringToDate(timeStr);
    if (!date) return;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚 Study Time!",
          body: `Time to start: ${title}`,
          sound: "default",
        },
        trigger: { type: "date", date },
      });
      return id;
    } catch (err) {
      console.log("Error scheduling notification:", err);
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  const timeStringToDate = (timeStr: string): Date => {
    const now = new Date();
    if (!timeStr) return now;
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return now;
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
    if (result < now) result.setDate(result.getDate() + 1);
    return result;
  };

  const timeToMinutes = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const timeBlocks: Section[] = [
    {
      title: "Morning",
      iconName: "wb-sunny",
      timeRange: "6:00 AM – 9:00 AM",
      data: [] as Session[],
    },
    {
      title: "Midday",
      iconName: "brightness-5",
      timeRange: "9:00 AM – 1:00 PM",
      data: [] as Session[],
    },
    {
      title: "Evening",
      iconName: "wb-twilight",
      timeRange: "1:00 PM – 7:00 PM",
      data: [] as Session[],
    },
    {
      title: "Night",
      iconName: "bedtime",
      timeRange: "7:00 PM – 11:59 PM",
      data: [] as Session[],
    },
  ];

  // Distribute sessions into time blocks
  sessions.forEach((session) => {
    const sessionStartMinutes = timeToMinutes(session.start);
    for (const block of timeBlocks) {
      const [startRange, endRange] = block.timeRange.split(" – ");
      const startMinutes = timeToMinutes(startRange);
      const endMinutes = timeToMinutes(endRange);
      if (
        sessionStartMinutes >= startMinutes &&
        sessionStartMinutes <= endMinutes
      ) {
        block.data.push(session);
        break;
      }
    }
  });

  // Filter out empty blocks
  const filteredTimeBlocks = timeBlocks.filter(
    (block) => block.data.length > 0
  );

  // Calculate current and next session
  const sortedSessions = [...sessions].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
  );
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let current: Session | null = null;
  let next: Session | null = null;

  for (const s of sortedSessions) {
    const start = timeToMinutes(s.start);
    const end = timeToMinutes(s.end);
    if (nowMinutes >= start && nowMinutes < end) {
      current = s;
    } else if (start > nowMinutes && !next) {
      next = s;
    }
  }

  // Format countdown for live timer (hrs, mins, secs)
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "starting now";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
    parts.push(`${seconds} sec`);

    return parts.join(" ");
  };

  // Live countdown state & effect
  useEffect(() => {
    if (!next) {
      setCountdownMs(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const nextStart = timeStringToDate(next.start).getTime();
      const diff = nextStart - now;
      setCountdownMs(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [next]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Daily Routine</Text>

      {current ? (
        <Text style={styles.statusText}>
          ▶️ <Text style={{ fontWeight: "bold" }}>Current Task:</Text>{" "}
          {current.title}
        </Text>
      ) : next ? (
        <Text style={styles.statusText}>
          ▶️ <Text style={{ fontWeight: "bold" }}>No task now.</Text> Next in{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatCountdown(countdownMs ?? 0)}
          </Text>
          .
        </Text>
      ) : (
        <Text style={styles.statusText}>
          ▶️{" "}
          <Text style={{ fontWeight: "bold" }}>
            No active or upcoming tasks.
          </Text>
        </Text>
      )}

      {next ? (
        <Text style={styles.statusText}>
          ⏭️ <Text style={{ fontWeight: "bold" }}>Upcoming Task:</Text>{" "}
          {next.title}
          {countdownMs !== null && (
            <Text style={{ fontWeight: "bold", color: "#fff" }}>
              : in {formatCountdown(countdownMs)}
            </Text>
          )}
        </Text>
      ) : (
        <Text style={styles.statusText}>
          ⏭️ <Text style={{ fontWeight: "bold" }}>Upcoming Task:</Text> No
          upcoming task
        </Text>
      )}

      <SectionList
        sections={filteredTimeBlocks}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name={section.iconName}
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.sessionItem}>
            <Text style={styles.sessionText}>
              {item.start} – {item.end} - {item.title}
            </Text>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openEditModal(item)}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Alert.alert(
                  "Delete Session",
                  "Are you sure you want to delete this session?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteSession(item.id),
                    },
                  ]
                );
              }}
            >
              <MaterialIcons name="delete" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#ccc", marginTop: 20 }}>
            No sessions added yet.
          </Text>
        }
        stickySectionHeadersEnabled={false}
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Session</Text>

            <TextInput
              placeholder="Session Title"
              placeholderTextColor="gray"
              style={[styles.input, { color: "#fff" }]}
              value={editSession?.title}
              onChangeText={(text) =>
                setEditSession((prev) =>
                  prev ? { ...prev, title: text } : null
                )
              }
            />

            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.input}
            >
              <Text style={{ color: "#fff" }}>
                {editSession?.start || "Select Start Time"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.input}
            >
              <Text style={{ color: "#fff" }}>
                {editSession?.end || "Select End Time"}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                mode="time"
                value={
                  editSession ? timeStringToDate(editSession.start) : new Date()
                }
                display="spinner"
                is24Hour={false}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) {
                    setEditSession((prev) =>
                      prev ? { ...prev, start: formatTime(selectedDate) } : null
                    );
                  }
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                mode="time"
                value={
                  editSession ? timeStringToDate(editSession.end) : new Date()
                }
                display="spinner"
                is24Hour={false}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) {
                    setEditSession((prev) =>
                      prev ? { ...prev, end: formatTime(selectedDate) } : null
                    );
                  }
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditSession(null);
                }}
                style={[styles.modalBtn, { backgroundColor: "#666" }]}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={styles.modalBtn}>
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 8,
  },
  statusText: {
    color: "#ccc",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  sessionItem: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  sessionText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  iconButton: {
    marginLeft: 10,
    padding: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
});
