import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// ✅ FIX: The correct import path for your helper functions is assumed to be correct.
import {
  formatCountdown,
  formatTime,
  timeStringToDate,
  timeToMinutes,
} from "../../utils/timeHelpers";

// ✅ FIX: The correct import for the AI functions is now used.
import {
  checkAndNotifyForStreaks,
  runDailyAIChecks,
} from "../../services/aiSuggestions";

// --- GLOBAL NOTIFICATION HANDLER CONFIGURATION ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- Type Definitions ---
type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
  notificationId?: string;
  completed?: boolean;
};
type HistoryRecord = {
  id: string;
  title: string;
  start: string;
  end: string;
  completedAt: string;
};
type Section = {
  title: string;
  iconName: string;
  timeRange: string;
  data: Session[];
};

// --- Custom Time Picker Component (Memoized for performance) ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0")
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0")
);
const periods = ["AM", "PM"];

const PickerColumn = React.memo(
  ({
    data,
    initialValue,
    onValueChange,
  }: {
    data: string[];
    initialValue: string;
    onValueChange: (value: string) => void;
  }) => {
    const flatListRef = useRef<FlatList>(null);
    const paddedData = ["", ...data, ""];

    useEffect(() => {
      const initialIndex = data.indexOf(initialValue);
      if (initialIndex !== -1 && flatListRef.current) {
        setTimeout(
          () =>
            flatListRef.current?.scrollToIndex({
              index: initialIndex,
              animated: false,
            }),
          0
        );
      }
    }, [initialValue, data]);

    const renderListItem = useCallback(
      ({ item }: { item: string }) => (
        <View
          style={{
            height: ITEM_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={styles.pickerItem}>{item}</Text>
        </View>
      ),
      []
    );

    return (
      <FlatList
        ref={flatListRef}
        data={paddedData}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.y / ITEM_HEIGHT
          );
          if (data[index]) {
            onValueChange(data[index]);
          }
        }}
        initialScrollIndex={initialValue ? data.indexOf(initialValue) : 0}
      />
    );
  }
);
PickerColumn.displayName = "PickerColumn";

const CustomTimePicker = ({
  isVisible,
  onClose,
  onTimeSelect,
  initialTime,
}: {
  isVisible: boolean;
  onClose: () => void;
  onTimeSelect: (date: Date) => void;
  initialTime: Date | null;
}) => {
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  useEffect(() => {
    if (isVisible) {
      const timeToSet = initialTime || new Date();
      setSelectedHour(
        (timeToSet.getHours() % 12 || 12).toString().padStart(2, "0")
      );
      setSelectedMinute(timeToSet.getMinutes().toString().padStart(2, "0"));
      setSelectedPeriod(timeToSet.getHours() >= 12 ? "PM" : "AM");
    }
  }, [isVisible, initialTime]);

  const handleSelect = () => {
    let hour24 = parseInt(selectedHour, 10);
    if (selectedPeriod === "PM" && hour24 < 12) hour24 += 12;
    if (selectedPeriod === "AM" && hour24 === 12) hour24 = 0; // Midnight case
    const newDate = new Date();
    newDate.setHours(hour24, parseInt(selectedMinute, 10), 0, 0);
    onTimeSelect(newDate);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.pickerModalBackground}>
        <View style={styles.pickerModalContainer}>
          <Text style={styles.pickerTitle}>Select Time</Text>
          <View style={styles.pickerColumnsContainer}>
            <View style={styles.selectionIndicator} />
            <PickerColumn
              data={hours}
              initialValue={selectedHour}
              onValueChange={setSelectedHour}
            />
            <Text style={styles.pickerSeparator}>:</Text>
            <PickerColumn
              data={minutes}
              initialValue={selectedMinute}
              onValueChange={setSelectedMinute}
            />
            <PickerColumn
              data={periods}
              initialValue={selectedPeriod}
              onValueChange={setSelectedPeriod}
            />
          </View>
          <View style={styles.pickerButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.pickerBtn, { backgroundColor: "#666" }]}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSelect} style={styles.pickerBtn}>
              <Text style={{ color: "#fff" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SessionItem = React.memo(
  ({
    item,
    onToggle,
    onEdit,
    onDelete,
  }: {
    item: Session;
    onToggle: (item: Session) => void;
    onEdit: (item: Session) => void;
    onDelete: (id: string) => void;
  }) => {
    const handleDeletePress = () => {
      Alert.alert(
        "Delete Session",
        "Are you sure you want to delete this session?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item.id),
          },
        ]
      );
    };

    return (
      <View style={styles.sessionItem}>
        <TouchableOpacity
          onPress={() => onToggle(item)}
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
        >
          <Text style={styles.checkboxText}>
            {item.completed ? "☑️" : "✅"}
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.sessionText,
            item.completed && styles.sessionTextCompleted,
          ]}
        >
          {`${item.start} – ${item.end} - ${item.title}`}
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onEdit(item)}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleDeletePress}>
          <MaterialIcons name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    );
  }
);
SessionItem.displayName = "SessionItem";

// --- BACKGROUND TASK FOR VOICE NOTIFICATIONS ---
const VOICE_NOTIFICATION_TASK = "VOICE_NOTIFICATION_TASK";
TaskManager.defineTask(VOICE_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("TaskManager Error in VOICE_NOTIFICATION_TASK:", error);
    return;
  }
  if (data) {
    const { voiceMessage } = data as { voiceMessage?: string };
    if (voiceMessage) {
      console.log("VOICE_NOTIFICATION_TASK attempting to speak:", voiceMessage);
      Speech.speak(voiceMessage, {
        language: "en-US",
        onDone: () =>
          console.log("VOICE_NOTIFICATION_TASK: Speech finished successfully."),
        onError: (speechError) =>
          console.error("VOICE_NOTIFICATION_TASK: Speech error:", speechError),
      });
    }
  }
});

const setupNotificationHandler = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      await Notifications.registerTaskAsync(VOICE_NOTIFICATION_TASK);
      console.log("Voice notification task registered successfully.");
    } else {
      console.warn("Notification permissions not granted.");
    }
  } catch (error) {
    console.error("Failed to register voice notification task", error);
  }
};

// --- COIN MANAGEMENT ---
const getCoinBalance = async (): Promise<number> => {
  try {
    const coinsStr = await AsyncStorage.getItem("userCoins");
    return coinsStr ? parseInt(coinsStr, 10) : 0;
  } catch (e) {
    return 0;
  }
};

const saveCoinBalance = async (newBalance: number) => {
  try {
    await AsyncStorage.setItem("userCoins", newBalance.toString());
  } catch (e) {
    console.error("Failed to save coin balance", e);
  }
};

// --- MAIN HOME SCREEN COMPONENT ---
export default function HomeScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coins, setCoins] = useState(0);
  const [headingText, setHeadingText] = useState("My Daily Routine");
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionStartDate, setNewSessionStartDate] = useState<Date | null>(
    null
  );
  const [newSessionEndDate, setNewSessionEndDate] = useState<Date | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [countdownMs, setCountdownMs] = useState<number | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<
    "start" | "end" | "editStart" | "editEnd" | null
  >(null);

  const allMessages = useRef([
    "Time to focus on: {task}. Let’s get to work.",
    "Let’s make progress. Starting: {task}.",
  ]).current;

  // --- Notification Scheduling Logic ---
  const scheduleNotification = useCallback(
    async (title: string, triggerDate: Date) => {
      if (triggerDate.getTime() < Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const voiceEnabledValue = await AsyncStorage.getItem(
        "voiceNotificationsEnabled"
      );
      const isVoiceOn =
        voiceEnabledValue === null ? true : voiceEnabledValue === "true";

      console.log(`Scheduling for "${title}". Voice enabled: ${isVoiceOn}`);

      const randomIndex = Math.floor(Math.random() * allMessages.length);
      const messageTemplate = allMessages[randomIndex];
      const voiceMessage = messageTemplate.replace("{task}", title);

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "📚 Study Time!",
            body: `Time to start: ${title}`,
            sound: true,
            data: {
              voiceMessage: isVoiceOn ? voiceMessage : "",
            },
          },
          trigger: { type: "date", date: triggerDate },
        });
        console.log(
          `Scheduled notification for "${title}" at ${triggerDate.toLocaleTimeString()} with ID: ${id}`
        );
        return id;
      } catch (err) {
        console.log("Error scheduling notification:", err);
        return undefined;
      }
    },
    [allMessages]
  );

  // --- Data Loading and Syncing Logic ---
  const loadAndSyncSessions = useCallback(async () => {
    try {
      const currentCoins = await getCoinBalance();
      setCoins(currentCoins);

      let routineToLoad: Session[] = [];
      const selected = await AsyncStorage.getItem("selectedSessions");

      if (selected) {
        routineToLoad = JSON.parse(selected);
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log("New template applied. All old notifications cancelled.");

        const notificationsEnabled = await AsyncStorage.getItem(
          "notificationsEnabled"
        );
        if (notificationsEnabled === "true") {
          for (const session of routineToLoad) {
            const triggerDate = timeStringToDate(session.start);
            const notificationId = await scheduleNotification(
              session.title,
              triggerDate
            );
            session.notificationId = notificationId;
          }
          console.log("Notifications scheduled for the new template.");
        }

        await AsyncStorage.setItem(
          "studyRoutine",
          JSON.stringify(routineToLoad)
        );
        await AsyncStorage.removeItem("selectedSessions");
      } else {
        const stored = await AsyncStorage.getItem("studyRoutine");
        routineToLoad = stored ? JSON.parse(stored) : [];
      }

      const historyStr = await AsyncStorage.getItem("completionHistory");
      const history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
      const todayStr = new Date().toISOString().split("T")[0];
      const completedTodayIds = new Set(
        history
          .filter((rec) => rec.completedAt.startsWith(todayStr))
          .map((rec) => rec.id)
      );
      const syncedSessions = routineToLoad.map((session: Session) => ({
        ...session,
        completed: completedTodayIds.has(session.id),
      }));
      setSessions(syncedSessions);
    } catch (err) {
      console.log("Error loading and syncing sessions:", err);
    }
  }, [scheduleNotification]);

  // --- Effects ---
  useEffect(() => {
    setupNotificationHandler();
    const foregroundNotificationListener =
      Notifications.addNotificationReceivedListener(async (notification) => {
        console.log("Foreground notification received:", notification);
        const voiceEnabled = await AsyncStorage.getItem(
          "voiceNotificationsEnabled"
        );
        if (voiceEnabled === "true") {
          const voiceMessage = notification.request.content.data
            ?.voiceMessage as string;
          if (voiceMessage) {
            setTimeout(() => {
              Speech.stop();
              Speech.speak(voiceMessage, { language: "en-US" });
            }, 1000);
          }
        }
      });
    return () => {
      foregroundNotificationListener.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAndSyncSessions();
      const hour = new Date().getHours();
      let currentGreeting = "";
      if (hour >= 4 && hour < 12) currentGreeting = "Good morning!";
      else if (hour >= 12 && hour < 17) currentGreeting = "Good afternoon!";
      else if (hour >= 17 && hour < 21) currentGreeting = "Good evening!";
      else currentGreeting = "Good night!";
      setHeadingText(currentGreeting);
      const timer = setTimeout(() => {
        setHeadingText("My Daily Routine");
      }, 5000);
      runDailyAIChecks();
      return () => clearTimeout(timer);
    }, [loadAndSyncSessions])
  );

  // --- CRUD Operations ---
  const handleAddSession = useCallback(async () => {
    if (!newSessionTitle || !newSessionStartDate || !newSessionEndDate) {
      Alert.alert("Please fill all fields");
      return;
    }
    const notificationsEnabled = await AsyncStorage.getItem(
      "notificationsEnabled"
    );
    let notificationId;
    if (notificationsEnabled === "true" && newSessionStartDate) {
      notificationId = await scheduleNotification(
        newSessionTitle,
        newSessionStartDate
      );
    }
    const newSession: Session = {
      id: Date.now().toString(),
      title: newSessionTitle,
      start: formatTime(newSessionStartDate),
      end: formatTime(newSessionEndDate),
      notificationId,
    };
    const updatedSessions = [...sessions, newSession];
    await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
    setSessions(updatedSessions);

    setNewSessionTitle("");
    setNewSessionStartDate(null);
    setNewSessionEndDate(null);
    setCreateModalVisible(false);
  }, [
    newSessionTitle,
    newSessionStartDate,
    newSessionEndDate,
    sessions,
    scheduleNotification,
  ]);

  const deleteSession = useCallback(
    async (id: string) => {
      const sessionToDelete = sessions.find((s) => s.id === id);
      if (sessionToDelete?.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          sessionToDelete.notificationId
        );
      }
      const filtered = sessions.filter((s) => s.id !== id);
      await AsyncStorage.setItem("studyRoutine", JSON.stringify(filtered));
      setSessions(filtered);
    },
    [sessions]
  );

  const toggleCompletion = useCallback(
    async (sessionToToggle: Session) => {
      const isNowCompleted = !sessionToToggle.completed;
      const updatedUISessions = sessions.map((session) =>
        session.id === sessionToToggle.id
          ? { ...session, completed: isNowCompleted }
          : session
      );
      setSessions(updatedUISessions);
      try {
        const historyStr = await AsyncStorage.getItem("completionHistory");
        let history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
        const currentCoins = await getCoinBalance();
        let newCoinBalance = currentCoins;
        const durationInHours = sessionDurationHours(
          sessionToToggle.start,
          sessionToToggle.end
        );
        const coinsForThisSession = Math.round(durationInHours);

        if (isNowCompleted) {
          history.push({
            ...sessionToToggle,
            completedAt: new Date().toISOString(),
          });
          newCoinBalance += coinsForThisSession;
          checkAndNotifyForStreaks(sessionToToggle, history);
        } else {
          const todayStr = new Date().toISOString().split("T")[0];
          history = history.filter(
            (rec) =>
              !(
                rec.id === sessionToToggle.id &&
                rec.completedAt.startsWith(todayStr)
              )
          );
          newCoinBalance = Math.max(0, currentCoins - coinsForThisSession);
        }
        await AsyncStorage.setItem(
          "completionHistory",
          JSON.stringify(history)
        );
        await saveCoinBalance(newCoinBalance);
        setCoins(newCoinBalance);
      } catch (err) {
        console.error("Failed to update completion history:", err);
        setSessions(sessions); // Revert UI on error
      }
    },
    [sessions]
  );

  const openEditModal = useCallback((session: Session) => {
    setEditSession(session);
    setEditModalVisible(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editSession?.title || !editSession.start || !editSession.end) {
      Alert.alert("Please fill in all fields");
      return;
    }
    const sessionToSave = { ...editSession };

    const updatedSessions = await Promise.all(
      sessions.map(async (s) => {
        if (s.id === sessionToSave.id) {
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
            const triggerDate = timeStringToDate(sessionToSave.start);
            newNotificationId = await scheduleNotification(
              sessionToSave.title,
              triggerDate
            );
          }
          return { ...sessionToSave, notificationId: newNotificationId };
        }
        return s;
      })
    );
    await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    setEditModalVisible(false);
    setEditSession(null);
  }, [sessions, editSession, scheduleNotification]);

  // --- Current/Next Task Logic ---
  const { current, next } = React.useMemo(() => {
    const uncompletedSessions = sessions.filter((s) => !s.completed);
    const sorted = [...uncompletedSessions].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    let currentSession: Session | null = null;
    let nextSession: Session | null = null;

    for (const s of sorted) {
      const startMinutes = timeToMinutes(s.start);
      let endMinutes = timeToMinutes(s.end);

      if (endMinutes < startMinutes) {
        if (
          (nowMins >= startMinutes && nowMins <= 1439) ||
          (nowMins >= 0 && nowMins < endMinutes)
        ) {
          currentSession = s;
          break;
        }
      } else {
        if (nowMins >= startMinutes && nowMins < endMinutes) {
          currentSession = s;
          break;
        }
      }
    }

    if (currentSession) {
      const currentIndex = sorted.findIndex((s) => s.id === currentSession!.id);
      if (currentIndex + 1 < sorted.length) {
        nextSession = sorted[currentIndex + 1];
      } else {
        nextSession = sorted[0];
      }
    } else {
      for (const s of sorted) {
        if (timeToMinutes(s.start) > nowMins) {
          nextSession = s;
          break;
        }
      }
      if (!nextSession && sorted.length > 0) {
        nextSession = sorted[0];
      }
    }

    return { current: currentSession, next: nextSession };
  }, [sessions]);

  useEffect(() => {
    if (!next) {
      setCountdownMs(null);
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const tick = () => {
      const now = new Date();
      const nextStartDateTime = timeStringToDate(next.start);

      if (nextStartDateTime.getTime() < now.getTime()) {
        nextStartDateTime.setDate(nextStartDateTime.getDate() + 1);
      }

      const diff = nextStartDateTime.getTime() - now.getTime();

      if (diff < 1000) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        loadAndSyncSessions();
      } else {
        setCountdownMs(diff);
      }
    };

    tick();
    intervalId = setInterval(tick, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [next, loadAndSyncSessions]);

  const groupedSessions = React.useMemo(() => {
    const blocks: Section[] = [
      {
        title: "Morning",
        iconName: "wb-sunny",
        timeRange: "4:00 AM – 8:59 AM",
        data: [],
      },
      {
        title: "Midday",
        iconName: "brightness-5",
        timeRange: "9:00 AM – 12:59 PM",
        data: [],
      },
      {
        title: "Evening",
        iconName: "wb-twilight",
        timeRange: "1:00 PM – 6:59 PM",
        data: [],
      },
      {
        title: "Night",
        iconName: "bedtime",
        timeRange: "7:00 PM – 3:59 AM",
        data: [],
      },
    ];

    if (!sessions || sessions.length === 0) return [];

    const nightStartMins = timeToMinutes("7:00 PM");
    const nightEndMins = timeToMinutes("3:59 AM");
    const morningStartMins = timeToMinutes("4:00 AM");
    const morningEndMins = timeToMinutes("8:59 AM");
    const middayStartMins = timeToMinutes("9:00 AM");
    const middayEndMins = timeToMinutes("12:59 PM");
    const eveningStartMins = timeToMinutes("1:00 PM");
    const eveningEndMins = timeToMinutes("6:59 PM");

    sessions.forEach((session) => {
      const sessionStartMins = timeToMinutes(session.start);

      if (
        sessionStartMins >= nightStartMins ||
        sessionStartMins <= nightEndMins
      ) {
        blocks[3].data.push(session);
      } else if (
        sessionStartMins >= morningStartMins &&
        sessionStartMins <= morningEndMins
      ) {
        blocks[0].data.push(session);
      } else if (
        sessionStartMins >= middayStartMins &&
        sessionStartMins <= middayEndMins
      ) {
        blocks[1].data.push(session);
      } else if (
        sessionStartMins >= eveningStartMins &&
        sessionStartMins <= eveningEndMins
      ) {
        blocks[2].data.push(session);
      }
    });

    blocks.forEach((block) => {
      block.data.sort((a, b) => {
        const aMinutes = timeToMinutes(a.start);
        const bMinutes = timeToMinutes(b.start);
        if (block.title === "Night") {
          const boundary = timeToMinutes("12:00 PM");
          if (aMinutes >= boundary && bMinutes < boundary) return -1;
          if (aMinutes < boundary && bMinutes >= boundary) return 1;
        }
        return aMinutes - bMinutes;
      });
    });

    return blocks.filter((block) => block.data.length > 0);
  }, [sessions]);

  const renderSessionItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionItem
        item={item}
        onToggle={toggleCompletion}
        onEdit={openEditModal}
        onDelete={deleteSession}
      />
    ),
    [toggleCompletion, openEditModal, deleteSession]
  );

  return (
    <View style={styles.container}>
      <CustomTimePicker
        isVisible={isTimePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        initialTime={
          timePickerTarget === "start"
            ? newSessionStartDate
            : timePickerTarget === "end"
            ? newSessionEndDate
            : timePickerTarget === "editStart" && editSession
            ? timeStringToDate(editSession.start)
            : timePickerTarget === "editEnd" && editSession
            ? timeStringToDate(editSession.end)
            : new Date()
        }
        onTimeSelect={(date) => {
          if (timePickerTarget === "start") setNewSessionStartDate(date);
          if (timePickerTarget === "end") setNewSessionEndDate(date);
          if (timePickerTarget === "editStart")
            setEditSession((prev) =>
              prev ? { ...prev, start: formatTime(date) } : null
            );
          if (timePickerTarget === "editEnd")
            setEditSession((prev) =>
              prev ? { ...prev, end: formatTime(date) } : null
            );
        }}
      />

      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.heading}>{headingText}</Text>
        </View>
        <View style={styles.coinContainer}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>▶️ </Text>
          {current ? (
            <Text style={styles.statusText} numberOfLines={1}>
              <Text style={{ fontWeight: "bold" }}>Current Task: </Text>
              {current.title}
            </Text>
          ) : (
            <Text style={[styles.statusText, { fontWeight: "bold" }]}>
              No task now. Enjoy your break!
            </Text>
          )}
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>⏭️ </Text>
          {next ? (
            <Text style={styles.statusText} numberOfLines={1}>
              <Text style={{ fontWeight: "bold" }}>Upcoming: </Text>
              {`${next.title} in `}
              <Text style={{ fontWeight: "bold" }}>
                {formatCountdown(countdownMs ?? 0)}
              </Text>
            </Text>
          ) : (
            <Text style={[styles.statusText, { fontWeight: "bold" }]}>
              No more tasks for today.
            </Text>
          )}
        </View>
      </View>

      <SectionList
        sections={groupedSessions}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name={section.iconName as any}
              size={20}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={renderSessionItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#ccc", marginTop: 20 }}>
            No sessions added yet.
          </Text>
        }
        stickySectionHeadersEnabled={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setNewSessionStartDate(null);
          setNewSessionEndDate(null);
          setNewSessionTitle("");
          setCreateModalVisible(true);
        }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Create Session Modal */}
      <Modal visible={isCreateModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Session</Text>
            <TextInput
              placeholder="Session Title"
              placeholderTextColor="gray"
              style={styles.input}
              value={newSessionTitle}
              onChangeText={setNewSessionTitle}
            />
            <TouchableOpacity
              onPress={() => {
                setTimePickerTarget("start");
                setTimePickerVisible(true);
              }}
              style={styles.input}
            >
              <Text style={{ color: newSessionStartDate ? "#fff" : "gray" }}>
                {newSessionStartDate
                  ? formatTime(newSessionStartDate)
                  : "Select Start Time"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTimePickerTarget("end");
                setTimePickerVisible(true);
              }}
              style={styles.input}
            >
              <Text style={{ color: newSessionEndDate ? "#fff" : "gray" }}>
                {newSessionEndDate
                  ? formatTime(newSessionEndDate)
                  : "Select End Time"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: "#666" }]}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddSession}
                style={styles.modalBtn}
              >
                <Text style={{ color: "#fff" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Session Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Session</Text>
            <TextInput
              placeholder="Session Title"
              placeholderTextColor="gray"
              style={styles.input}
              value={editSession?.title ?? ""}
              onChangeText={(text) =>
                setEditSession((prev) =>
                  prev ? { ...prev, title: text } : null
                )
              }
            />
            <TouchableOpacity
              onPress={() => {
                setTimePickerTarget("editStart");
                setTimePickerVisible(true);
              }}
              style={styles.input}
            >
              <Text style={{ color: "#fff" }}>
                {editSession?.start || "Select Start Time"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTimePickerTarget("editEnd");
                setTimePickerVisible(true);
              }}
              style={styles.input}
            >
              <Text style={{ color: "#fff" }}>
                {editSession?.end || "Select End Time"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
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
  container: { flex: 1, backgroundColor: "#000", padding: 12 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 35,
    marginBottom: 8,
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  coinIcon: { fontSize: 16, marginRight: 5 },
  coinText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    minHeight: 34,
  },
  statusContainer: {
    marginBottom: 10,
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  statusText: { color: "#ccc", fontSize: 14, flexShrink: 1 },
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
  sectionHeaderText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  sessionItem: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  sessionText: { flex: 1, color: "#fff", fontSize: 14, marginLeft: 5 },
  sessionTextCompleted: { textDecorationLine: "line-through", color: "#888" },
  iconButton: { marginLeft: 10, padding: 6 },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxCompleted: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  checkboxText: { fontSize: 18 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
    textAlign: "center",
  },
  input: {
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    color: "#fff",
    fontSize: 16,
    justifyContent: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  modalBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: "#007bff",
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { height: 2, width: 0 },
  },
  pickerModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContainer: {
    width: "80%",
    backgroundColor: "#2C2C2E",
    borderRadius: 14,
    padding: 20,
  },
  pickerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerColumnsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: PICKER_HEIGHT,
    overflow: "hidden",
  },
  pickerItem: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
  },
  pickerSeparator: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  selectionIndicator: {
    position: "absolute",
    width: "100%",
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    alignSelf: "center",
    top: ITEM_HEIGHT,
  },
  pickerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#444",
    paddingTop: 10,
  },
  pickerBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
