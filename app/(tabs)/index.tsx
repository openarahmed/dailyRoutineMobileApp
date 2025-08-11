import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import CustomTimePicker from "../components/CustomTimePicker";
import TimeBlockCard from "../components/TimeBlockCard";

import { useTheme } from "../../context/ThemeContext";
import { formatCountdown, formatTime, timeStringToDate, timeToMinutes } from "../../utils/timeHelpers";

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

export type Session = {
    id: string;
    title: string;
    start: string;
    end: string;
    notificationId?: string;
    completed?: boolean;
    activeDays: number[];
    isOneTime?: boolean;
    createdAt?: number;
};
type HistoryRecord = { id: string; title: string; start: string; end: string; completedAt: string; };
type Section = { title: string; iconName: string; data: Session[]; };

const WEEK_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_ACTIVE_DAYS = [0, 1, 2, 3, 4, 5, 6];

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

const WeekDayScroller = ({ selectedDay, onDaySelect, taskCounts, colors }: { 
    selectedDay: number, 
    onDaySelect: (dayIndex: number) => void,
    taskCounts: { [key: number]: number },
    colors: any 
}) => {
    return (
        <View style={styles.scrollerContainer}>
            {WEEK_DAY_LABELS.map((dayName, index) => {
                const isSelected = index === selectedDay;
                const count = taskCounts[index] || 0;
                return (
                    <TouchableOpacity 
                        key={index}
                          style={[styles.dateButton, { borderColor: isSelected ? colors.accentColor : colors.weekDayButtonBorder }]}
    onPress={() => onDaySelect(index)}
                    >
                        <View style={[styles.dateTopHalf, { backgroundColor: isSelected ? colors.selectedTopBg : colors.unselectedTopBg }]}>
                            <Text style={[styles.dateDayName, { color: isSelected ? colors.selectedText : colors.unselectedDayNameText }]}>{dayName}</Text>
                        </View>
                        <View style={[styles.dateBottomHalf, { backgroundColor: isSelected ? colors.selectedBottomBg : colors.unselectedBottomBg }]}>
                            <Text style={[styles.dateDayNumber, { color: isSelected ? colors.selectedText : colors.unselectedDayNumberText }]}>{count}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

type DaySelectorProps = { selectedDays: number[]; onDayToggle: (dayIndex: number) => void; colors: any };
const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onDayToggle, colors }) => (
    <View style={styles.daySelectorContainer}>
        {WEEK_DAY_LABELS.map((day, index) => {
            const isSelected = selectedDays.includes(index);
            return (
                <TouchableOpacity
                    key={index}
                    style={[styles.dayButton, { backgroundColor: isSelected ? colors.accentColor : colors.modalDayButtonBg }]}
                    onPress={() => onDayToggle(index)}
                >
                    <Text style={[styles.dayText, { color: isSelected ? colors.selectedDayText : colors.dayText }]}>{day}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

export default function HomeScreen() {
    const { colors, themeName } = useTheme();
    const navigation = useNavigation<any>();
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [displayedSessions, setDisplayedSessions] = useState<Session[]>([]);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [taskCounts, setTaskCounts] = useState<{ [key: number]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [coins, setCoins] = useState(0);
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState("");
    const [newSessionStartDate, setNewSessionStartDate] = useState<Date | null>(null);
    const [newSessionEndDate, setNewSessionEndDate] = useState<Date | null>(null);
    const [newSessionActiveDays, setNewSessionActiveDays] = useState<number[]>(DEFAULT_ACTIVE_DAYS);
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

    const toggleCompletion = useCallback(async (sessionToToggle: Session) => {
        const isCompleting = !sessionToToggle.completed;
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
                const coinsEarned = Math.round(sessionDurationHours(sessionToToggle.start, sessionToToggle.end));
                if (coinsEarned > 0) {
                    const currentCoins = await getCoinBalance();
                    const newTotal = currentCoins + coinsEarned;
                    await saveCoinBalance(newTotal);
                    setCoins(newTotal);
                }
            } else {
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
            const uncompleted = displayedSessions.filter(s => !s.completed).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
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
        if (!displayedSessions || displayedSessions.length === 0) {
            return [];
        }
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
            <LinearGradient colors={[colors.backgroundColor, colors.backgroundColor]} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.textColor} />
            </LinearGradient>
        );
    }

    // Now define the gradient colors for the status container right before the return statement.
    const statusCardGradientColors = colors.statusCardGradient || [colors.statusCardBg, colors.statusCardBg];

    return (
        <LinearGradient colors={[colors.backgroundColor, colors.backgroundColor]} style={styles.container}>
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
                <Text style={[styles.heading, { color: colors.routineTitleColor }]}>My Routine</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="search" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="calendar-outline" size={24} color={colors.textColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.coinContainer, { backgroundColor: colors.coinContainerBg }]} onPress={() => setCoinInfoModalVisible(true)}>
                        <Text style={styles.coinIcon}>🪙</Text>
                        <Text style={[styles.coinText, { color: colors.coinText }]}>{coins}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <WeekDayScroller 
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
                taskCounts={taskCounts}
                colors={{
                    accentColor: colors.accentColor,
                    // এই লাইনটিকেই পরিবর্তন করতে হবে
                    borderColor: colors.weekDayButtonBorder, 
                    selectedTopBg: colors.selectedTopBg,
                    unselectedTopBg: colors.unselectedTopBg,
                    selectedBottomBg: colors.selectedBottomBg,
                    unselectedBottomBg: colors.unselectedBottomBg,
                    selectedText: colors.selectedText,
                    unselectedDayNameText: colors.unselectedDayNameText,
                    unselectedDayNumberText: colors.unselectedDayNumberText,
                    dividerShadowColor: colors.dividerShadowColor,
                }}
            />

  {displayedSessions.length > 0 && (
    <LinearGradient
        colors={colors.statusCardGradient || [colors.statusCardBg, colors.statusCardBg]}
        start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}
        style={[styles.statusContainer, { borderColor: colors.statusCardBorder }]}
    >
        {/* আইকন এখন থিমের রঙ ব্যবহার করবে */}
        <View style={[styles.statusIconContainer, { backgroundColor: colors.statusIconBg }]}>
            <Ionicons name="play" size={18} color={colors.statusIconColor} />
        </View>

        <View style={styles.statusTextContainer}>
            {/* প্রথম লাইন এখন থিমের রঙ ব্যবহার করবে */}
            <Text style={[styles.statusText, { color: colors.statusInfoText }]}>
                {currentTask ? `Current: ${currentTask.title}` : "No current task."}
            </Text>

            {/* দ্বিতীয় লাইন এখন থিমের রঙ ব্যবহার করবে */}
            <Text style={[styles.statusText, { color: colors.statusInfoText, marginTop: 2 }]} numberOfLines={1}>
                {nextTask ? (
                    <>
                        {'Next: '}
                        <Text style={{ color: colors.accentColor, fontWeight: 'bold' }}>
                            {`${nextTask.title} in ${formatCountdown(countdownMs ?? 0)}`}
                        </Text>
                    </>
                ) : (
                    "No upcoming tasks."
                )}
            </Text>
        </View>
    </LinearGradient>
)}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {groupedSessions.length > 0 ? (
                    groupedSessions.map((section) => (
                        <TimeBlockCard 
                            key={section.title} 
                            section={section} 
                            onToggle={toggleCompletion} 
                            onEdit={openEditModal} 
                            onDelete={deleteSession} 
                        />
                    ))
                ) : (
                    <View style={styles.noSessionsContainer}>
                        <Text style={[styles.noSessionsText, { color: colors.noSessionsText }]}>No sessions for this day.</Text>
                        <Text style={[styles.noSessionsSubText, { color: colors.noSessionsSubText }]}>Enjoy your day or add a new task!</Text>
                    </View>
                )}
            </ScrollView>

            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accentColor }]} onPress={() => setCreateModalVisible(true)}>
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>

            {/* Create Session Modal */}
            <Modal visible={isCreateModalVisible} animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
                <LinearGradient colors={[colors.modalBg, colors.modalBg]} style={styles.fullScreenModal}>
                    <View style={styles.fullScreenModalHeader}>
                        <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="chevron-back" size={32} color={colors.accentColor} /></TouchableOpacity>
                        <Text style={[styles.fullScreenModalTitle, { color: colors.modalTitleText }]}>Create Session</Text>
                        <View style={{width: 32}} />
                    </View>
                    <ScrollView style={styles.fullScreenModalContent} keyboardShouldPersistTaps="handled">
                        <TouchableOpacity style={styles.templateButton} onPress={() => { setCreateModalVisible(false); navigation.navigate('template'); }}>
                            <Ionicons name="albums-outline" size={22} color={colors.accentColor} />
                            <Text style={[styles.templateButtonText, { color: colors.accentColor }]}>Start with a Template</Text>
                        </TouchableOpacity>
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.dividerLine }]} /><Text style={[styles.dividerText, { color: colors.dividerText }]}>OR</Text><View style={[styles.dividerLine, { backgroundColor: colors.dividerLine }]} />
                        </View>
                        <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>TASK NAME</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="create-outline" size={22} color={colors.inputIcon} style={styles.inputIcon} />
                            <TextInput placeholder="e.g., Finish physics homework" placeholderTextColor={colors.inputPlaceholder} style={[styles.textInput, { color: colors.inputText }]} value={newSessionTitle} onChangeText={setNewSessionTitle} />
                        </View>
                        <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>DURATION</Text>
                        <View style={styles.timeInputRow}>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("start"); setTimePickerVisible(true); }} style={[styles.timeInput, { backgroundColor: colors.inputBg }]}>
                                <Ionicons name="time-outline" size={20} color={colors.inputIcon} style={styles.inputIcon}/>
                                <Text style={{ color: newSessionStartDate ? colors.inputText : colors.inputPlaceholder, fontSize: 16 }}>{newSessionStartDate ? formatTime(newSessionStartDate) : "Start Time"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("end"); setTimePickerVisible(true); }} style={[styles.timeInput, { backgroundColor: colors.inputBg }]}>
                                <Ionicons name="time" size={20} color={colors.inputIcon} style={styles.inputIcon}/>
                                <Text style={{ color: newSessionEndDate ? colors.inputText : colors.inputPlaceholder, fontSize: 16 }}>{newSessionEndDate ? formatTime(newSessionEndDate) : "End Time"}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.oneTimeTaskButton} onPress={() => setIsOneTimeTask(!isOneTimeTask)}>
                            <MaterialIcons name={isOneTimeTask ? "check-box" : "check-box-outline-blank"} size={24} color={isOneTimeTask ? colors.accentColor : colors.inputIcon} />
                            <Text style={[styles.oneTimeTaskText, { color: colors.inputText }]}>One-Time Task (for today only)</Text>
                        </TouchableOpacity>
                        
                        {!isOneTimeTask && (
                            <>
                                <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>ACTIVE DAYS</Text>
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
                                    colors={{
                                      accentColor: colors.accentColor,
                                      modalDayButtonBg: colors.modalDayButtonBg,
                                      selectedDayText: colors.selectedDayText,
                                      dayText: colors.dayText,
                                    }}
                                />
                            </>
                        )}

                        <TouchableOpacity onPress={handleAddSession} style={[styles.modalMainActionBtn, { backgroundColor: (!newSessionTitle || !newSessionStartDate || !newSessionEndDate) ? colors.disabledBtnBg : colors.accentColor }]} disabled={!newSessionTitle || !newSessionStartDate || !newSessionEndDate}>
                            <Text style={[styles.modalMainActionBtnText, { color: colors.modalMainActionBtnText }]}>Add to My Day</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </LinearGradient>
            </Modal>

            {/* Edit Session Modal */}
            <Modal visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <LinearGradient colors={[colors.modalBg, colors.modalBg]} style={styles.fullScreenModal}>
                    <View style={styles.fullScreenModalHeader}>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="chevron-back" size={32} color={colors.accentColor} /></TouchableOpacity>
                        <Text style={[styles.fullScreenModalTitle, { color: colors.modalTitleText }]}>Edit Session</Text><View style={{ width: 32 }} />
                    </View>
                    <ScrollView style={styles.fullScreenModalContent} keyboardShouldPersistTaps="handled">
                        <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>TASK NAME</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="create-outline" size={22} color={colors.inputIcon} style={styles.inputIcon} />
                            <TextInput placeholder="Session Title" placeholderTextColor={colors.inputPlaceholder} style={[styles.textInput, { color: colors.inputText }]} value={editSession?.title ?? ""} onChangeText={(text) => setEditSession((prev) => prev ? { ...prev, title: text } : null)} />
                        </View>

                        {editSession && !editSession.isOneTime && (
                            <>
                                <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>ACTIVE DAYS</Text>
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
                                    colors={{
                                      accentColor: colors.accentColor,
                                      modalDayButtonBg: colors.modalDayButtonBg,
                                      selectedDayText: colors.selectedDayText,
                                      dayText: colors.dayText,
                                    }}
                                />
                            </>
                        )}
                        
                        <Text style={[styles.inputLabel, { color: colors.inputLabelText }]}>DURATION</Text>
                        <View style={styles.timeInputRow}>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("editStart"); setTimePickerVisible(true); }} style={[styles.timeInput, { backgroundColor: colors.inputBg }]}>
                                <Ionicons name="time-outline" size={20} color={colors.inputIcon} style={styles.inputIcon} />
                                <Text style={{ color: colors.inputText, fontSize: 16 }}>{editSession?.start || "Start Time"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setTimePickerTarget("editEnd"); setTimePickerVisible(true); }} style={[styles.timeInput, { backgroundColor: colors.inputBg }]}>
                                <Ionicons name="time" size={20} color={colors.inputIcon} style={styles.inputIcon} />
                                <Text style={{ color: colors.inputText, fontSize: 16 }}>{editSession?.end || "End Time"}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={saveEdit} style={[styles.modalMainActionBtn, { backgroundColor: (!editSession?.title || !editSession?.start || !editSession?.end) ? colors.disabledBtnBg : colors.accentColor }]} disabled={!editSession?.title || !editSession?.start || !editSession?.end}>
                            <Text style={[styles.modalMainActionBtnText, { color: colors.modalMainActionBtnText }]}>Save Changes</Text>
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
                    <View style={[styles.infoModalContainer, { backgroundColor: colors.modalBg, borderColor: colors.modalBorder }]}>
                        <Text style={[styles.infoModalTitle, { color: colors.modalTitleText }]}>What are Coins? 🪙</Text>
                        <Text style={[styles.infoModalText, { color: colors.modalText }]}>This is your self-reward. Each coin is worth 10 Taka.</Text>
                        <Text style={[styles.infoModalText, { color: colors.modalText }]}>Take the money from yourself for the coins you earn, and enjoy a treat!</Text>
                        <TouchableOpacity style={[styles.infoModalButton, { backgroundColor: colors.accentColor }]} onPress={() => setCoinInfoModalVisible(false)}>
                            <Text style={[styles.infoModalButtonText, { color: colors.modalMainActionBtnText }]}>Got It!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { 
        marginTop: Platform.OS === "android" ? 40 : 60, 
        marginBottom: 14, 
        paddingHorizontal: 5, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    heading: { fontSize: 26, fontWeight: "bold" },
    headerIcons: { flexDirection: 'row', alignItems: 'center', },
    iconButton: { marginLeft: 16 },
    coinContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20,
        marginLeft: 16,
    },
    coinIcon: { fontSize: 16, marginRight: 6 },
    coinText: { fontWeight: 'bold', fontSize: 16 },
    
    scrollerContainer: {
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
   
    dateButton: {
        borderRadius: 14,
        width: 42,
        height: 48,
        overflow: 'hidden',
        borderWidth: 1,
    },
    dateTopHalf: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end', // লেখাকে নিচে পাঠায়
        paddingBottom: 2,           // নিজের বক্সের একদম নিচে ২ পিক্সেল জায়গা রাখে
    },
    dateBottomHalf: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start', // লেখাকে উপরে পাঠায়
    },
   
    dateDayName: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateDayNumber: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusContainer: {
        marginBottom: 15,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16, // ছবির মতো গোল কর্নার
        borderWidth: 1,
        flexDirection: 'row', // আইকন এবং টেক্সটকে পাশাপাশি আনে
        alignItems: 'center', // আইকন এবং টেক্সটকে উল্লম্বভাবে মাঝখানে রাখে
    },
    // নতুন আইকন কন্টেইনারের জন্য স্টাইল
    statusIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16, // এটিকে বৃত্তাকার করে
        backgroundColor: '#DEF7EC', // হালকা সবুজ ব্যাকগ্রাউন্ড
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12, // আইকন এবং টেক্সটের মধ্যে স্পেস
    },
    // নতুন টেক্সট কন্টেইনারের জন্য স্টাইল
    statusTextContainer: {
        flex: 1, // বাকি জায়গা পুরোটাই নেয়
    },
    statusText: {
        fontSize: 14, // আপনার চাহিদা অনুযায়ী ফন্ট সাইজ বাড়ানো হয়েছে
        flexShrink: 1,
    },
    
    noSessionsContainer: { alignItems: "center", marginTop: 80, opacity: 0.7, paddingHorizontal: 20 },
    noSessionsText: { fontSize: 18, fontWeight: '600' },
    noSessionsSubText: { fontSize: 14, marginTop: 8 },
    
    daySelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    dayButton: { 
        width: 42, 
        height: 42, 
        borderRadius: 21, 
        justifyContent: 'center', 
        alignItems: 'center', 
    },
    dayText: { fontWeight: 'bold', fontSize: 14 },
    
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        right: 20,
        bottom: 30,
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
        paddingTop: Platform.OS === "android" ? 40 : 60, 
        paddingBottom: 15, 
        paddingHorizontal: 20 
    },
    fullScreenModalTitle: { fontSize: 20, fontWeight: "bold" },
    fullScreenModalContent: { 
        flex: 1, 
        paddingHorizontal: 20, 
    },
    templateButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 15, 
        borderRadius: 14, 
        borderWidth: 1, 
    },
    templateButtonText: { fontSize: 17, fontWeight: '600', marginLeft: 10 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 15, fontWeight: '600' },
    inputLabel: { 
        fontSize: 13, 
        fontWeight: '600', 
        textTransform: 'uppercase', 
        marginBottom: 10, 
        marginLeft: 5, 
        marginTop: 10 
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 12, 
        marginBottom: 20 
    },
    inputIcon: { paddingHorizontal: 15 },
    textInput: { 
        flex: 1, 
        paddingVertical: 15, 
        paddingRight: 15,
        fontSize: 16 
    },
    timeInputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    timeInput: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 12, 
        paddingVertical: 15, 
        width: '48.5%'
    },
    modalMainActionBtn: { 
        paddingVertical: 15, 
        borderRadius: 14, 
        alignItems: "center", 
        marginTop: 30,
        marginBottom: 40
    },
    modalMainActionBtnText: { fontWeight: "bold", fontSize: 17 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    infoModalContainer: { 
        width: '100%', 
        borderRadius: 14, 
        padding: 25, 
        alignItems: 'center',
        borderWidth: 1,
    },
    infoModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    infoModalText: { 
        fontSize: 16, 
        textAlign: 'center', 
        marginBottom: 10, 
        lineHeight: 24 
    },
    infoModalButton: { 
        borderRadius: 10, 
        paddingVertical: 12, 
        paddingHorizontal: 30, 
        marginTop: 15 
    },
    infoModalButtonText: { fontSize: 16, fontWeight: 'bold' },
    oneTimeTaskButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 15 },
    oneTimeTaskText: { marginLeft: 12, fontSize: 16 },
});