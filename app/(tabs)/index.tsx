import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Components
import CustomTimePicker from "../components/CustomTimePicker";
import TimeBlockCard from "../components/TimeBlockCard";

// Services and Helpers
import { formatCountdown, formatTime, timeStringToDate, timeToMinutes } from "../../utils/timeHelpers";

// --- RESPONSIVE SCALING UTILITIES ---
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// --- GLOBAL CONFIGS ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const VOICE_NOTIFICATION_TASK = "VOICE_NOTIFICATION_TASK";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

TaskManager.defineTask(VOICE_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) { console.error("TaskManager Error:", error); return; }
  if (data) {
    const { voiceMessage } = data as { voiceMessage?: string };
    if (voiceMessage) {
      await delay(1500);
      Speech.speak(voiceMessage);
    }
  }
});

// --- TYPE DEFINITIONS ---
export type Session = {
  id: string;
  title: string;
  start: string;
  end: string;
  notificationId?: string;
  completed?: boolean;
  activeDays: number[]; // (0=Sun, 1=Mon, ...)
  isOneTime?: boolean;
  createdAt?: number;
};
type HistoryRecord = { id: string; title: string; start: string; end: string; completedAt: string; };
type Section = { title: string; iconName: string; data: Session[]; };

// Constants
const WEEK_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_ACTIVE_DAYS = [0, 1, 2, 3, 4, 5, 6];

// --- HELPER FUNCTIONS ---
const getCoinBalance = async (): Promise<number> => {
  try {
    const coinsStr = await AsyncStorage.getItem("userCoins");
    return coinsStr ? parseInt(coinsStr, 10) : 0;
  } catch (e) { return 0; }
};

const saveCoinBalance = async (newBalance: number) => { await AsyncStorage.setItem("userCoins", newBalance.toString()); };

const sessionDurationHours = (start: string, end: string): number => {
  const startMins = timeToMinutes(start);
  let endMins = timeToMinutes(end);
  if (endMins < startMins) endMins += 24 * 60;
  return (endMins - startMins) / 60;
};

const calculateNextTriggerDate = (session: Session): Date | null => {
    const now = new Date();
    if (!session.activeDays || session.activeDays.length === 0) return null;

    for (let i = 0; i < 8; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayIndex = checkDate.getDay();

        if (session.activeDays.includes(dayIndex)) {
            const triggerTime = timeStringToDate(session.start);
            const triggerDateTime = new Date(checkDate);
            triggerDateTime.setHours(triggerTime.getHours(), triggerTime.getMinutes(), 0, 0);

            if (triggerDateTime.getTime() > now.getTime()) {
                return triggerDateTime;
            }
        }
    }
    return null;
};
// =================================================================
// --- WeekDayScroller Component ---
// =================================================================
const WeekDayScroller = ({ selectedDay, onDaySelect, taskCounts }: { 
    selectedDay: number, 
    onDaySelect: (dayIndex: number) => void,
    taskCounts: { [key: number]: number } 
}) => {
    
    return (
        <View style={styles.scrollerContainer}>
            {WEEK_DAY_LABELS.map((dayName, index) => {
                const isSelected = index === selectedDay;
                const count = taskCounts[index] || 0;

                return (
                    <TouchableOpacity 
                        key={index}
                        style={[styles.dateButton, isSelected && styles.selectedDateButton]}
                        onPress={() => onDaySelect(index)}
                    >
                        <View style={[styles.dateTopHalf, isSelected && styles.selectedDateTopHalf]}>
                            <Text style={[styles.dateDayName, isSelected && styles.selectedDateText]}>{dayName}</Text>
                        </View>
                        
                        {/* ✅ নতুন শ্যাডো লাইনটি এখানে যোগ করা হয়েছে */}
                        <View style={styles.dividerShadow} />

                        <View style={[styles.dateBottomHalf, isSelected && styles.selectedDateBottomHalf]}>
                            <Text style={[styles.dateDayNumber, isSelected && styles.selectedDateText]}>{count}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
// =================================================================
// --- DaySelector Component (For Modals) ---
// =================================================================
type DaySelectorProps = { selectedDays: number[]; onDayToggle: (dayIndex: number) => void; };

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onDayToggle }) => (
    <View style={styles.daySelectorContainer}>
        {WEEK_DAY_LABELS.map((day, index) => {
            const isSelected = selectedDays.includes(index);
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.dayButton, isSelected && styles.selectedDay]}
                    onPress={() => onDayToggle(index)}
                >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

// =================================================================
// --- MAIN HOME SCREEN COMPONENT ---
// =================================================================
export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [displayedSessions, setDisplayedSessions] = useState<Session[]>([]);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [taskCounts, setTaskCounts] = useState<{ [key: number]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [coins, setCoins] = useState(0);
    const [headingText, setHeadingText] = useState("My Routine");
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState("");
    const [newSessionStartDate, setNewSessionStartDate] = useState<Date | null>(null);
    const [newSessionEndDate, setNewSessionEndDate] = useState<Date | null>(null);
    const [newSessionActiveDays, setNewSessionActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [isOneTimeTask, setIsOneTimeTask] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editSession, setEditSession] = useState<Session | null>(null);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | "editStart" | "editEnd" | null>(null);
    const [currentTask, setCurrentTask] = useState<Session | null>(null);
    const [nextTask, setNextTask] = useState<Session | null>(null);
    const [countdownMs, setCountdownMs] = useState<number | null>(null);
    const [isCoinInfoModalVisible, setCoinInfoModalVisible] = useState(false);
    const allMessages = useRef(["Time to focus on: {task}. Let’s get to work.", "Let’s make progress. Starting: {task}."]).current;

    // --- Functions ---
    const scheduleNotification = useCallback(async (session: Session) => {
        const { id, title } = session;
        const triggerDate = calculateNextTriggerDate(session);
        if (!triggerDate) return null;

        const voiceEnabledValue = await AsyncStorage.getItem("voiceNotificationsEnabled");
        const isVoiceOn = voiceEnabledValue !== "false";
        const messageTemplate = allMessages[Math.floor(Math.random() * allMessages.length)];
        const voiceMessage = messageTemplate.replace("{task}", title);

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Time to start!",
                    body: `${title}`,
                    sound: true,
                    data: { voiceMessage: isVoiceOn ? voiceMessage : "", taskId: id }
                },
                trigger: triggerDate,
            });
            console.log(`✅ Notification scheduled for "${title}" at ${triggerDate.toLocaleString()}`);
            return notificationId;
        } catch (error) {
            console.error("Notification scheduling error:", error);
            return null;
        }
    }, [allMessages]);

    const syncSessionStatus = useCallback(async () => {
        try {
            const historyStr = await AsyncStorage.getItem("completionHistory");
            const history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
            const todayStr = new Date().toISOString().split("T")[0];
            const completedTodayIds = new Set(history.filter(rec => rec.completedAt.startsWith(todayStr)).map(rec => rec.id));

            setAllSessions(prevSessions =>
                prevSessions.map(session => ({
                    ...session,
                    completed: completedTodayIds.has(session.id),
                }))
            );
            setCoins(await getCoinBalance());
        } catch (err) {
            console.error("Error syncing session status:", err);
        }
    }, []);

    const loadAllSessions = useCallback(async () => {
        setIsLoading(true);
        try {
            const stored = await AsyncStorage.getItem("studyRoutine");
            const routineToLoad: Session[] = stored ? JSON.parse(stored) : [];
            setAllSessions(routineToLoad);
        } catch (err) {
            console.error("Error loading sessions:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllSessions();
    }, [loadAllSessions]);
    
    useFocusEffect(
        useCallback(() => {
            const checkForTemplate = async () => {
                const selectedTemplate = await AsyncStorage.getItem("selectedSessions");

                if (selectedTemplate) {
                    console.log("🔄 New template found, applying...");
                    setIsLoading(true);
                    await Notifications.cancelAllScheduledNotificationsAsync();
                    const templateSessions: Omit<Session, 'activeDays' | 'id'>[] = JSON.parse(selectedTemplate);

                    const newRoutine = templateSessions.map((s, index) => ({
                        ...s,
                        id: `${Date.now()}-${index}`,
                        activeDays: DEFAULT_ACTIVE_DAYS,
                        isOneTime: false,
                        createdAt: Date.now(),
                    }));

                    const notificationsEnabled = await AsyncStorage.getItem("notificationsEnabled");
                    if (notificationsEnabled === 'true') {
                        for (const session of newRoutine) {
                            const notificationId = await scheduleNotification(session);
                            if (notificationId) session.notificationId = notificationId;
                        }
                    }
                    
                    await AsyncStorage.setItem("studyRoutine", JSON.stringify(newRoutine));
                    await AsyncStorage.removeItem("selectedSessions");
                    setAllSessions(newRoutine);
                    setIsLoading(false);
                } else {
                    syncSessionStatus();
                }
            };

            checkForTemplate();
        }, [scheduleNotification, syncSessionStatus])
    );

    useEffect(() => {
        const counts: { [key: number]: number } = {};
        for (let i = 0; i < 7; i++) {
            counts[i] = allSessions.filter(s => s.activeDays.includes(i)).length;
        }
        setTaskCounts(counts);

        const filtered = allSessions.filter(session => 
            session.activeDays && session.activeDays.includes(selectedDay)
        );
        setDisplayedSessions(filtered);
    }, [selectedDay, allSessions]);

    const handleAddSession = useCallback(async () => {
        if (!newSessionTitle || !newSessionStartDate || !newSessionEndDate) {
            return Alert.alert("Error", "Please fill all the fields.");
        }
        if (!isOneTimeTask && newSessionActiveDays.length === 0) {
            return Alert.alert("Error", "Please select at least one active day for a repeating task.");
        }

        const newSession: Session = {
            id: Date.now().toString(),
            title: newSessionTitle,
            start: formatTime(newSessionStartDate),
            end: formatTime(newSessionEndDate),
            activeDays: isOneTimeTask ? [new Date().getDay()] : newSessionActiveDays,
            isOneTime: isOneTimeTask,
            createdAt: Date.now(),
        };

        const notificationsEnabled = await AsyncStorage.getItem("notificationsEnabled");
        if (notificationsEnabled === "true") {
            const notificationId = await scheduleNotification(newSession);
            if (notificationId) newSession.notificationId = notificationId;
        }

        const updatedSessions = [...allSessions, newSession];
        await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
        setAllSessions(updatedSessions);

        setCreateModalVisible(false);
        setNewSessionTitle("");
        setNewSessionStartDate(null);
        setNewSessionEndDate(null);
        setNewSessionActiveDays(DEFAULT_ACTIVE_DAYS);
        setIsOneTimeTask(false);
    }, [newSessionTitle, newSessionStartDate, newSessionEndDate, newSessionActiveDays, allSessions, scheduleNotification, isOneTimeTask]);

    const deleteSession = useCallback(async (id: string) => {
        const sessionToDelete = allSessions.find((s) => s.id === id);
        if (sessionToDelete?.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(sessionToDelete.notificationId);
        }
        const filtered = allSessions.filter((s) => s.id !== id);
        await AsyncStorage.setItem("studyRoutine", JSON.stringify(filtered));
        setAllSessions(filtered);
    }, [allSessions]);

    // ✅✅✅ toggleCompletion ফাংশনটি নতুন কয়েন এবং আনডু লজিক দিয়ে আপডেট করা হয়েছে ✅✅✅
    const toggleCompletion = useCallback(async (sessionToToggle: Session) => {
        const isCompleting = !sessionToToggle.completed;

        // Optimistic UI Update
        const updatedSessions = allSessions.map(s => s.id === sessionToToggle.id ? { ...s, completed: isCompleting } : s);
        setAllSessions(updatedSessions);

        try {
            const historyStr = await AsyncStorage.getItem("completionHistory");
            let history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
            const todayStr = new Date().toISOString().split("T")[0];

            if (isCompleting) {
                history.push({
                    id: sessionToToggle.id,
                    title: sessionToToggle.title,
                    start: sessionToToggle.start,
                    end: sessionToToggle.end,
                    completedAt: new Date().toISOString(),
                });

                // ✅ নতুন কয়েন লজিক: প্রতি ঘন্টায় ১ কয়েন
                const coinsEarned = Math.round(sessionDurationHours(sessionToToggle.start, sessionToToggle.end));
                if (coinsEarned > 0) {
                    const currentCoins = await getCoinBalance();
                    const newTotal = currentCoins + coinsEarned;
                    await saveCoinBalance(newTotal);
                    setCoins(newTotal);
                }
            } else {
                // ✅ আনডু লজিক: কয়েন ফেরত নেওয়া
                const recordToUndo = history.find(rec => rec.id === sessionToToggle.id && rec.completedAt.startsWith(todayStr));
                if (recordToUndo) {
                    const coinsToDeduct = Math.round(sessionDurationHours(recordToUndo.start, recordToUndo.end));
                    if (coinsToDeduct > 0) {
                        const currentCoins = await getCoinBalance();
                        const newTotal = Math.max(0, currentCoins - coinsToDeduct);
                        await saveCoinBalance(newTotal);
                        setCoins(newTotal);
                    }
                }
                history = history.filter(rec => rec.id !== sessionToToggle.id || !rec.completedAt.startsWith(todayStr));
            }

            await AsyncStorage.setItem("completionHistory", JSON.stringify(history));
            await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));

        } catch (e) {
            console.error("Error toggling completion:", e);
            // Revert state on error
            setAllSessions(allSessions);
        }
    }, [allSessions]);


    const openEditModal = useCallback((session: Session) => {
        setEditSession(session);
        setEditModalVisible(true);
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editSession) return;
        const updatedSessions = allSessions.map(s => s.id === editSession.id ? editSession : s);
        await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
        setAllSessions(updatedSessions);
        setEditModalVisible(false);
        setEditSession(null);
    }, [allSessions, editSession]);

    useEffect(() => {
        async function setupNotifications() {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === "granted") {
                await Notifications.registerTaskAsync(VOICE_NOTIFICATION_TASK);
                console.log('Voice notification task registered successfully.');
            } else {
                console.warn('Notification permissions not granted for voice task.');
            }
        }
        setupNotifications();

        const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
            const voiceMessage = notification.request.content.data?.voiceMessage as string;
            if (voiceMessage) {
                setTimeout(() => { Speech.speak(voiceMessage); }, 1500);
            }
        });
        return () => foregroundListener.remove();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const todayIndex = now.getDay();
            
            if (selectedDay !== todayIndex) {
                setCurrentTask(null);
                setNextTask(null);
                setCountdownMs(null);
                return;
            }

            const uncompleted = displayedSessions.filter(s => !s.completed)
                                                .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

            const nowMins = now.getHours() * 60 + now.getMinutes();
            
            const current = uncompleted.find(s => nowMins >= timeToMinutes(s.start) && nowMins < timeToMinutes(s.end)) || null;
            const next = uncompleted.find(s => timeToMinutes(s.start) > nowMins) || null;

            setCurrentTask(current);
            setNextTask(next);

            if (next) {
                const nextStart = timeStringToDate(next.start);
                const nextDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextStart.getHours(), nextStart.getMinutes());
                
                if (nextDateTime.getTime() < now.getTime()) {
                    nextDateTime.setDate(nextDateTime.getDate() + 1);
                }
                setCountdownMs(Math.max(0, nextDateTime.getTime() - now.getTime()));
            } else {
                setCountdownMs(null);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [displayedSessions, selectedDay]);

    const groupedSessions = useMemo(() => {
        if (displayedSessions.length === 0) return [];
        const blocks: Section[] = [
            { title: "Morning", iconName: "wb-sunny", data: [] },
            { title: "Midday", iconName: "brightness-5", data: [] },
            { title: "Evening", iconName: "wb-twilight", data: [] },
            { title: "Night", iconName: "bedtime", data: [] },
        ];
        displayedSessions.forEach(session => {
            const sessionStart = timeToMinutes(session.start);
            if (sessionStart >= timeToMinutes("4:00 AM") && sessionStart < timeToMinutes("12:00 PM")) blocks[0].data.push(session);
            else if (sessionStart >= timeToMinutes("12:00 PM") && sessionStart < timeToMinutes("5:00 PM")) blocks[1].data.push(session);
            else if (sessionStart >= timeToMinutes("5:00 PM") && sessionStart < timeToMinutes("9:00 PM")) blocks[2].data.push(session);
            else blocks[3].data.push(session);
        });
        blocks.forEach(block => block.data.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
        return blocks.filter((block) => block.data.length > 0);
    }, [displayedSessions]);

    if (isLoading) {
        return (
            <LinearGradient colors={["#1c1636", "#121212"]} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#0e091fff", "#0e091fff"]} style={styles.container}>
            <CustomTimePicker
                isVisible={isTimePickerVisible}
                onClose={() => setTimePickerVisible(false)}
                initialTime={
                    timePickerTarget === "start" ? newSessionStartDate :
                    timePickerTarget === "end" ? newSessionEndDate :
                    timePickerTarget === "editStart" && editSession ? timeStringToDate(editSession.start) :
                    timePickerTarget === "editEnd" && editSession ? timeStringToDate(editSession.end) : new Date()
                }
                onTimeSelect={(date) => {
                    if (timePickerTarget === "start") setNewSessionStartDate(date);
                    else if (timePickerTarget === "end") setNewSessionEndDate(date);
                    else if (timePickerTarget === "editStart") setEditSession((prev) => (prev ? { ...prev, start: formatTime(date) } : null));
                    else if (timePickerTarget === "editEnd") setEditSession((prev) => (prev ? { ...prev, end: formatTime(date) } : null));
                }}
            />

            <View style={styles.headerContainer}>
                <Text style={styles.heading}>My Routine</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="search" size={moderateScale(24)} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="calendar-outline" size={moderateScale(24)} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.coinContainer} onPress={() => setCoinInfoModalVisible(true)}>
                        <Text style={styles.coinIcon}>🪙</Text>
                        <Text style={styles.coinText}>{coins}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <WeekDayScroller 
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
                taskCounts={taskCounts}
            />

            {displayedSessions.length > 0 && (
                <LinearGradient
                    colors={['#2A2A3A', '#1A1A2A']}
                    start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}
                    style={styles.statusContainer}
                >
                    <View style={styles.statusRow}>
                        <MaterialIcons name="play-arrow" size={moderateScale(20)} color="#34D399" />
                        <Text style={styles.statusText} numberOfLines={1}>{currentTask ? `Current: ${currentTask.title}` : "No current task."}</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <MaterialIcons name="skip-next" size={moderateScale(20)} color="#FBBF24" />
                        <Text style={styles.statusText} numberOfLines={1}>
                            {nextTask ? (
                                <>
                                    {`Next: ${nextTask.title} in `}
                                    <Text style={{ fontWeight: 'bold' }}>{formatCountdown(countdownMs ?? 0)}</Text>
                                </>
                            ) : (
                                "No upcoming tasks."
                            )}
                        </Text>
                    </View>
                </LinearGradient>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: verticalScale(100) }}>
                {groupedSessions.length > 0 ? (
                    groupedSessions.map((section) => (
                        <TimeBlockCard key={section.title} section={section} onToggle={toggleCompletion} onEdit={openEditModal} onDelete={deleteSession} />
                    ))
                ) : (
                    <View style={styles.noSessionsContainer}>
                        <Text style={styles.noSessionsText}>No sessions for this day.</Text>
                        <Text style={styles.noSessionsSubText}>Enjoy your day or add a new task!</Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
                <Ionicons name="add" size={moderateScale(32)} color="white" />
            </TouchableOpacity>

            {/* Create Session Modal */}
            <Modal visible={isCreateModalVisible} animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <LinearGradient colors={["#1C1C1E", "#0A0A0A"]} style={styles.fullScreenModal}>
                    <View style={styles.fullScreenModalHeader}>
                        <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="chevron-back" size={moderateScale(32)} color="#007AFF" /></TouchableOpacity>
                        <Text style={styles.fullScreenModalTitle}>Create Session</Text>
                        <View style={{width: moderateScale(32)}} />
                    </View>
                    <ScrollView style={styles.fullScreenModalContent} keyboardShouldPersistTaps="handled">
                        <TouchableOpacity style={styles.templateButton} onPress={() => { setCreateModalVisible(false); navigation.navigate('template'); }}>
                            <Ionicons name="albums-outline" size={moderateScale(22)} color="#007AFF" />
                            <Text style={styles.templateButtonText}>Start with a Template</Text>
                        </TouchableOpacity>
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} />
                        </View>
                        <Text style={styles.inputLabel}>TASK NAME</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="create-outline" size={moderateScale(22)} color="#888" style={styles.inputIcon} />
                            <TextInput placeholder="e.g., Finish physics homework" placeholderTextColor="#888" style={styles.textInput} value={newSessionTitle} onChangeText={setNewSessionTitle} />
                        </View>
                        <Text style={styles.inputLabel}>DURATION</Text>
                        <View style={styles.timeInputRow}>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("start"); setTimePickerVisible(true); }} style={styles.timeInput}>
                                <Ionicons name="time-outline" size={moderateScale(20)} color="#888" style={styles.inputIcon}/>
                                <Text style={{ color: newSessionStartDate ? "#fff" : "#888", fontSize: moderateScale(16) }}>{newSessionStartDate ? formatTime(newSessionStartDate) : "Start Time"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("end"); setTimePickerVisible(true); }} style={styles.timeInput}>
                                <Ionicons name="time" size={moderateScale(20)} color="#888" style={styles.inputIcon}/>
                                <Text style={{ color: newSessionEndDate ? "#fff" : "#888", fontSize: moderateScale(16) }}>{newSessionEndDate ? formatTime(newSessionEndDate) : "End Time"}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.oneTimeTaskButton} onPress={() => setIsOneTimeTask(!isOneTimeTask)}>
                            <MaterialIcons name={isOneTimeTask ? "check-box" : "check-box-outline-blank"} size={moderateScale(24)} color={isOneTimeTask ? "#007AFF" : "#888"} />
                            <Text style={styles.oneTimeTaskText}>One-Time Task (for today only)</Text>
                        </TouchableOpacity>
                        
                        {!isOneTimeTask && (
                            <>
                                <Text style={styles.inputLabel}>ACTIVE DAYS</Text>
                                <DaySelector
                                    selectedDays={newSessionActiveDays}
                                    onDayToggle={(dayIndex) => {
                                        setNewSessionActiveDays((prevDays) => {
                                            const newActiveDays = prevDays.includes(dayIndex)
                                                ? prevDays.filter(d => d !== dayIndex)
                                                : [...prevDays, dayIndex].sort();
                                            return newActiveDays;
                                        });
                                    }}
                                />
                            </>
                        )}

                        <TouchableOpacity onPress={handleAddSession} style={[styles.modalMainActionBtn, (!newSessionTitle || !newSessionStartDate || !newSessionEndDate) && styles.disabledBtn]} disabled={!newSessionTitle || !newSessionStartDate || !newSessionEndDate}>
                            <Text style={styles.modalMainActionBtnText}>Add to My Day</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </LinearGradient>
            </Modal>

            {/* Edit Session Modal */}
            <Modal visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <LinearGradient colors={["#1C1C1E", "#0A0A0A"]} style={styles.fullScreenModal}>
                    <View style={styles.fullScreenModalHeader}>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="chevron-back" size={moderateScale(32)} color="#007AFF" /></TouchableOpacity>
                        <Text style={styles.fullScreenModalTitle}>Edit Session</Text><View style={{ width: moderateScale(32) }} />
                    </View>
                    <ScrollView style={styles.fullScreenModalContent} keyboardShouldPersistTaps="handled">
                        <Text style={styles.inputLabel}>TASK NAME</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="create-outline" size={moderateScale(22)} color="#888" style={styles.inputIcon} />
                            <TextInput placeholder="Session Title" placeholderTextColor="#888" style={styles.textInput} value={editSession?.title ?? ""} onChangeText={(text) => setEditSession((prev) => prev ? { ...prev, title: text } : null)} />
                        </View>

                        {editSession && !editSession.isOneTime && (
                            <>
                                <Text style={styles.inputLabel}>ACTIVE DAYS</Text>
                                <DaySelector
                                    selectedDays={editSession.activeDays}
                                    onDayToggle={(dayIndex) => {
                                        setEditSession((prev) => {
                                            if (!prev) return null;
                                            const newActiveDays = prev.activeDays.includes(dayIndex)
                                                ? prev.activeDays.filter(d => d !== dayIndex)
                                                : [...prev.activeDays, dayIndex].sort();
                                            return { ...prev, activeDays: newActiveDays };
                                        });
                                    }}
                                />
                            </>
                        )}
                        
                        <Text style={styles.inputLabel}>DURATION</Text>
                        <View style={styles.timeInputRow}>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("editStart"); setTimePickerVisible(true); }} style={styles.timeInput}>
                                <Ionicons name="time-outline" size={moderateScale(20)} color="#888" style={styles.inputIcon} />
                                <Text style={{ color: "#fff", fontSize: moderateScale(16) }}>{editSession?.start || "Start Time"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("editEnd"); setTimePickerVisible(true); }} style={styles.timeInput}>
                                <Ionicons name="time" size={moderateScale(20)} color="#888" style={styles.inputIcon} />
                                <Text style={{ color: "#fff", fontSize: moderateScale(16) }}>{editSession?.end || "End Time"}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={saveEdit} style={[styles.modalMainActionBtn, (!editSession?.title || !editSession?.start || !editSession?.end) && styles.disabledBtn]} disabled={!editSession?.title || !editSession?.start || !editSession?.end}>
                            <Text style={styles.modalMainActionBtnText}>Save Changes</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </LinearGradient>
            </Modal>

            {/* Coin Info Modal */}
            <Modal
                visible={isCoinInfoModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCoinInfoModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.infoModalContainer}>
                        <Text style={styles.infoModalTitle}>What are Coins? 🪙</Text>
                        <Text style={styles.infoModalText}>This is your self-reward. Each coin is worth 10 Taka.</Text>
                        <Text style={styles.infoModalText}>Take the money from yourself for the coins you earn, and enjoy a treat!</Text>
                        <TouchableOpacity style={styles.infoModalButton} onPress={() => setCoinInfoModalVisible(false)}>
                            <Text style={styles.infoModalButtonText}>Got It!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: scale(15) },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { 
        marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(60), 
        marginBottom: verticalScale(14), 
        paddingHorizontal: scale(5), 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    heading: { fontSize: moderateScale(26, 0.4), fontWeight: "bold", color: "#FFFFFF" },
    headerIcons: { flexDirection: 'row', alignItems: 'center',  },
    iconButton: { marginLeft: scale(16) },
    coinContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        paddingHorizontal: scale(12), 
        paddingVertical: verticalScale(6), 
        borderRadius: moderateScale(20),
        marginLeft: scale(16),
    },
    coinIcon: { fontSize: moderateScale(16), marginRight: scale(6) },
    coinText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: moderateScale(16) },
    
     scrollerContainer: {
        paddingBottom: verticalScale(10),
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dateButton: {
        borderRadius: moderateScale(15),
        width: scale(46),
        height: verticalScale(50),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        // শ্যাডো দেখানোর জন্য elevation যোগ করা হয়েছে
        elevation: 5,
    },
    selectedDateButton: {
        borderColor: '#c9395a',
    },
     dateTopHalf: {
        flex: 1,
        backgroundColor: '#1c1c1e', // ✅ পরিবর্তন: এখানে গাঢ় রঙটি দেওয়া হয়েছে
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateBottomHalf: {
        flex: 1,
        backgroundColor: '#2c2c2e', // ✅ পরিবর্তন: এখানে হালকা রঙটি দেওয়া হয়েছে
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDateTopHalf: {
        backgroundColor: '#c9395a',
    },
    selectedDateBottomHalf: {
        backgroundColor: '#7e2237',
    },
    // ✅✅✅ শ্যাডো লাইনের জন্য নতুন স্টাইল ✅✅✅
    dividerShadow: {
        height: 1.5,
        width: '100%',
        backgroundColor: 'rgba(50, 48, 48, 0.3)', // হালকা কালো রঙের লাইন
        // iOS-এর জন্য শ্যাডো
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.5,
        shadowRadius: 1,
        // Android-এর জন্য elevation
        elevation: 3,
    },
    dateDayName: {
        color: '#AEAEB2',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    dateDayNumber: {
        color: '#FFFFFF',
        fontSize: moderateScale(18),
        fontWeight: 'bold',
    },
    selectedDateText: {
        color: '#FFFFFF',
    },
    statusContainer: { 
        marginBottom: verticalScale(7),
        paddingHorizontal:moderateScale(14),
        paddingVertical: verticalScale(5),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: 'rgba(89, 80, 137, 0.45)',
    },
    statusRow: { flexDirection: "row", alignItems: "center",},
    statusText: { color: "#E0E0E0", fontSize: moderateScale(12), flexShrink: 1, marginLeft: scale(8) },
    
    noSessionsContainer: { alignItems: "center", marginTop: verticalScale(80), opacity: 0.7, paddingHorizontal: scale(20) },
    noSessionsText: { color: "#A0A0A0", fontSize: moderateScale(18), fontWeight: '600' },
    noSessionsSubText: { color: "#777", fontSize: moderateScale(14), marginTop: verticalScale(8) },
    
    daySelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(20) },
    dayButton: { 
        width: moderateScale(42), 
        height: moderateScale(42), 
        borderRadius: moderateScale(21), 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#3A3A3C' 
    },
    selectedDay: { backgroundColor: '#007AFF' },
    dayText: { color: '#fff', fontWeight: 'bold', fontSize: moderateScale(14) },
    selectedDayText: { color: '#fff' },
    fab: {
        position: 'absolute',
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        right: scale(20),
        bottom: verticalScale(30),
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fullScreenModal: { flex: 1 },
    fullScreenModalHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: Platform.OS === 'android' ? verticalScale(40) : verticalScale(60), 
        paddingBottom: verticalScale(15), 
        paddingHorizontal: scale(20) 
    },
    fullScreenModalTitle: { color: '#fff', fontSize: moderateScale(20), fontWeight: 'bold' },
    fullScreenModalContent: { 
        flex: 1, 
        paddingHorizontal: scale(20), 
    },
    templateButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'rgba(0, 122, 255, 0.15)', 
        paddingVertical: verticalScale(15), 
        borderRadius: moderateScale(14), 
        borderWidth: 1, 
        borderColor: 'rgba(0, 122, 255, 0.3)' 
    },
    templateButtonText: { color: '#007AFF', fontSize: moderateScale(17), fontWeight: '600', marginLeft: scale(10) },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: verticalScale(25) },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#3A3A3C' },
    dividerText: { color: '#8A8A8E', marginHorizontal: scale(15), fontWeight: '600' },
    inputLabel: { 
        color: '#8A8A8E', 
        fontSize: moderateScale(13), 
        fontWeight: '600', 
        textTransform: 'uppercase', 
        marginBottom: verticalScale(10), 
        marginLeft: scale(5), 
        marginTop: verticalScale(10) 
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#31313643', 
        borderRadius: moderateScale(12), 
        marginBottom: verticalScale(20) 
    },
    inputIcon: { paddingHorizontal: scale(15) },
    textInput: { 
        flex: 1, 
        paddingVertical: verticalScale(15), 
        paddingRight: scale(15),
        color: '#fff', 
        fontSize: moderateScale(16) 
    },
    timeInputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(20) },
    timeInput: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#31313643', 
        borderRadius: moderateScale(12), 
        paddingVertical: verticalScale(15), 
        width: '48.5%'
    },
    modalMainActionBtn: { 
        backgroundColor: "#007AFF", 
        paddingVertical: verticalScale(15), 
        borderRadius: moderateScale(14), 
        alignItems: "center", 
        marginTop: verticalScale(30),
        marginBottom: verticalScale(40)
    },
    modalMainActionBtnText: { color: "#fff", fontWeight: "bold", fontSize: moderateScale(17) },
    disabledBtn: { backgroundColor: '#31313643' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(20) },
    infoModalContainer: { 
        width: '100%', 
        backgroundColor: '#1C1C1E', 
        borderRadius: moderateScale(14), 
        padding: moderateScale(25), 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    infoModalTitle: { fontSize: moderateScale(20), fontWeight: 'bold', color: '#FFFFFF', marginBottom: verticalScale(15) },
    infoModalText: { 
        fontSize: moderateScale(16), 
        color: '#E5E5EA', 
        textAlign: 'center', 
        marginBottom: verticalScale(10), 
        lineHeight: moderateScale(24) 
    },
    infoModalButton: { 
        backgroundColor: '#007AFF', 
        borderRadius: moderateScale(10), 
        paddingVertical: verticalScale(12), 
        paddingHorizontal: scale(30), 
        marginTop: verticalScale(15) 
    },
    infoModalButtonText: { color: '#FFFFFF', fontSize: moderateScale(16), fontWeight: 'bold' },
    oneTimeTaskButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(10), marginBottom: verticalScale(15) },
    oneTimeTaskText: { color: '#fff', marginLeft: scale(12), fontSize: moderateScale(16) },
    
    // Styles for SessionItem
    sessionItem:{
        flexDirection:'row',
        alignItems:'center',
        padding: moderateScale(12),
        marginBottom: verticalScale(8),
        borderRadius: moderateScale(18),
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(47, 43, 69, 0.28)',
    },
    sessionItemCompleted:{
        backgroundColor:'rgba(0, 122, 255, 0.2)', 
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    taskIconContainer:{
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent:'center',
        alignItems:'center',
        marginRight: scale(12),
    },
    taskTextContainer:{
        flex:1,
        marginRight: scale(10),
    },
    sessionTimeText:{
        color:'#AEAEB2',
        fontSize: moderateScale(13),
    },
    sessionText:{
        color:'#FFFFFF',
        fontSize: moderateScale(15),
        marginTop: verticalScale(2)
    },
    sessionTextCompleted:{
        color:'#8E8E93',
        textDecorationLine:'line-through',
    },
    checkboxWrapper: {
        padding: moderateScale(5), // Makes it easier to tap
    },
    checkboxBase: {
        width: moderateScale(28),
        height: moderateScale(28),
        borderRadius: moderateScale(14),
        borderWidth: 2,
        borderColor: '#4A4466',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },

    // Styles for TimeBlockCard
    cardContainer: {
        borderRadius: moderateScale(20),
        marginBottom: verticalScale(12),
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(89, 80, 137, 0.45)',
    },
    cornerGradient: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        opacity: 0.5, 
    },
    contentContainer: {
        paddingHorizontal: scale(10),
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(2),
        backgroundColor: 'transparent',
    },
    timeBlockHeader:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom: verticalScale(10)
    },
    timeBlockTitle:{
        color:'#FFFFFF',
        fontSize: moderateScale(20),
        fontWeight:'bold',
        marginLeft: scale(10)
    },
});
