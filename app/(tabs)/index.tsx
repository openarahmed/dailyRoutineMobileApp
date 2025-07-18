import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Components
import CustomTimePicker from "../components/CustomTimePicker";
import TimeBlockCard from "../components/TimeBlockCard";

// Services and Helpers
import { checkAndNotifyForStreaks, runDailyAIChecks } from "../../services/aiSuggestions";
import { formatCountdown, formatTime, timeStringToDate, timeToMinutes } from "../../utils/timeHelpers";

// --- GLOBAL CONFIGS ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const VOICE_NOTIFICATION_TASK = "VOICE_NOTIFICATION_TASK";
TaskManager.defineTask(VOICE_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) { console.error("TaskManager Error:", error); return; }
  if (data) {
    const { voiceMessage } = data as { voiceMessage?: string };
    if (voiceMessage) Speech.speak(voiceMessage);
  }
});

// --- TYPE DEFINITIONS ---
type Session = { id: string; title: string; start: string; end: string; notificationId?: string; completed?: boolean; };
type HistoryRecord = { id: string; title: string; start: string; end: string; completedAt: string; };
type Section = { title: string; iconName: string; data: Session[]; };

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

// =================================================================
// --- MAIN HOME SCREEN COMPONENT ---
// =================================================================
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [headingText, setHeadingText] = useState("My Daily Routine");
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionStartDate, setNewSessionStartDate] = useState<Date | null>(null);
  const [newSessionEndDate, setNewSessionEndDate] = useState<Date | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | "editStart" | "editEnd" | null>(null);
  const [currentTask, setCurrentTask] = useState<Session | null>(null);
  const [nextTask, setNextTask] = useState<Session | null>(null);
  const [countdownMs, setCountdownMs] = useState<number | null>(null);
  const allMessages = useRef(["Time to focus on: {task}. Let’s get to work.", "Let’s make progress. Starting: {task}."]).current;

  // --- Functions ---
 const scheduleNotification = useCallback(async (title: string, triggerDate: Date) => {
  const voiceEnabledValue = await AsyncStorage.getItem("voiceNotificationsEnabled");
  const isVoiceOn = voiceEnabledValue !== "false";
  const messageTemplate = allMessages[Math.floor(Math.random() * allMessages.length)];
  const voiceMessage = messageTemplate.replace("{task}", title);

  const now = new Date();

  if (triggerDate.getTime() <= now.getTime()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  console.log(`⏰ Scheduling "${title}" at ${triggerDate.toLocaleString()}`);

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚 Study Time!",
        body: `Time to start: ${title}`,
        sound: true, // Ensure sound is enabled for the notification itself
        data: { voiceMessage: isVoiceOn ? voiceMessage : "" }
      },
      trigger: {
        type: 'date',
        date: triggerDate,
      },
    });
    return id;
  } catch (error) {
    console.error("Notification scheduling error:", error);
    return null;
  }
}, [allMessages]);

  const loadAndSyncSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setCoins(await getCoinBalance());

      let routineToLoad: Session[] = [];
      const selectedTemplate = await AsyncStorage.getItem("selectedSessions");

      if (selectedTemplate) {
        routineToLoad = JSON.parse(selectedTemplate);
        await AsyncStorage.setItem("studyRoutine", JSON.stringify(routineToLoad));
        await AsyncStorage.removeItem("selectedSessions");
      } else {
        const stored = await AsyncStorage.getItem("studyRoutine");
        routineToLoad = stored ? JSON.parse(stored) : [];
      }

      const historyStr = await AsyncStorage.getItem("completionHistory");
      const history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
      const todayStr = new Date().toISOString().split("T")[0];
      const completedTodayIds = new Set(history.filter(rec => rec.completedAt.startsWith(todayStr)).map(rec => rec.id));
      const syncedSessions = routineToLoad.map(session => ({ ...session, completed: completedTodayIds.has(session.id) }));

      setSessions(syncedSessions);
      setIsLoading(false);

      const scheduleAndSaveNotifications = async (sessionsToUpdate: Session[]) => {
        const notificationsEnabled = await AsyncStorage.getItem("notificationsEnabled");
        if (notificationsEnabled === "true") {
          const sessionsWithNotifIds = [...sessionsToUpdate];
          for (let i = 0; i < sessionsWithNotifIds.length; i++) {
            const session = sessionsWithNotifIds[i];
            const triggerDate = timeStringToDate(session.start);
            const notificationId = await scheduleNotification(session.title, triggerDate);
            if (notificationId) {
                sessionsWithNotifIds[i].notificationId = notificationId;
            }
          }
          await AsyncStorage.setItem("studyRoutine", JSON.stringify(sessionsWithNotifIds));
        }
      };
      
      scheduleAndSaveNotifications(syncedSessions);

    } catch (err) { 
      console.error("Error loading and syncing sessions:", err); 
      setIsLoading(false); 
    }
  }, [scheduleNotification]);

  const handleAddSession = useCallback(async () => {
    if (!newSessionTitle || !newSessionStartDate || !newSessionEndDate) return Alert.alert("Please fill all fields");
    const newSession: Session = { id: Date.now().toString(), title: newSessionTitle, start: formatTime(newSessionStartDate), end: formatTime(newSessionEndDate) };
    const updatedSessions = [...sessions, newSession];
    await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
    setCreateModalVisible(false);
    setNewSessionTitle("");
    setNewSessionStartDate(null);
    setNewSessionEndDate(null);
    await loadAndSyncSessions();
  }, [newSessionTitle, newSessionStartDate, newSessionEndDate, sessions, loadAndSyncSessions]);

  const deleteSession = useCallback(async (id: string) => {
    const sessionToDelete = sessions.find((s) => s.id === id);
    if (sessionToDelete?.notificationId) await Notifications.cancelScheduledNotificationAsync(sessionToDelete.notificationId);
    const filtered = sessions.filter((s) => s.id !== id);
    await AsyncStorage.setItem("studyRoutine", JSON.stringify(filtered));
    setSessions(filtered);
  }, [sessions]);

  const toggleCompletion = useCallback(async (sessionToToggle: Session) => {
    const updatedSessions = sessions.map(s => s.id === sessionToToggle.id ? { ...s, completed: !s.completed } : s);
    setSessions(updatedSessions);
    const isNowCompleted = !sessionToToggle.completed;
    const historyStr = await AsyncStorage.getItem("completionHistory");
    let history: HistoryRecord[] = historyStr ? JSON.parse(historyStr) : [];
    const currentCoins = await getCoinBalance();
    const coinsForThisSession = Math.round(sessionDurationHours(sessionToToggle.start, sessionToToggle.end));
    let newCoinBalance = currentCoins;
    if (isNowCompleted) {
      history.push({ ...sessionToToggle, completedAt: new Date().toISOString() });
      newCoinBalance += coinsForThisSession;
      checkAndNotifyForStreaks(sessionToToggle, history);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      history = history.filter(rec => !(rec.id === sessionToToggle.id && rec.completedAt.startsWith(todayStr)));
      newCoinBalance = Math.max(0, currentCoins - coinsForThisSession);
    }
    await AsyncStorage.setItem("completionHistory", JSON.stringify(history));
    await saveCoinBalance(newCoinBalance);
    setCoins(newCoinBalance);
  }, [sessions]);

  const openEditModal = useCallback((session: Session) => {
    setEditSession(session);
    setEditModalVisible(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editSession) return;
    const updatedSessions = sessions.map(s => s.id === editSession.id ? editSession : s);
    await AsyncStorage.setItem("studyRoutine", JSON.stringify(updatedSessions));
    setEditModalVisible(false);
    setEditSession(null);
    await loadAndSyncSessions();
  }, [sessions, editSession, loadAndSyncSessions]);

  // --- Effects ---
  useEffect(() => {
    async function setupNotifications() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default-channel', {
          name: 'Default Channel',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: null,
        });
      }
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      if (status === "granted") await Notifications.registerTaskAsync(VOICE_NOTIFICATION_TASK);
    }
    setupNotifications();
    const foregroundListener = Notifications.addNotificationReceivedListener(notification => {
        const voiceMessage = notification.request.content.data?.voiceMessage as string;
        if (voiceMessage) Speech.speak(voiceMessage);
    });
    return () => foregroundListener.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAndSyncSessions();
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) setHeadingText("Good Morning!");
      else if (hour >= 12 && hour < 17) setHeadingText("Good Afternoon!");
      else if (hour >= 17 && hour < 21) setHeadingText("Good Evening!");
      else setHeadingText("Good Night!");
      const timer = setTimeout(() => setHeadingText("My Daily Routine"), 5000);
      runDailyAIChecks();
      return () => clearTimeout(timer);
    }, [loadAndSyncSessions])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const uncompleted = sessions.filter(s => !s.completed).sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const current = uncompleted.find(s => nowMins >= timeToMinutes(s.start) && nowMins < timeToMinutes(s.end)) || null;
      const next = uncompleted.find(s => timeToMinutes(s.start) > nowMins) || uncompleted[0] || null;
      setCurrentTask(current);
      setNextTask(next);
      if (next) {
        const nextStart = timeStringToDate(next.start);
        if (nextStart.getTime() < Date.now()) nextStart.setDate(nextStart.getDate() + 1);
        setCountdownMs(Math.max(0, nextStart.getTime() - Date.now()));
      } else {
        setCountdownMs(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  // --- Data Grouping ---
  const groupedSessions = React.useMemo(() => {
    const blocks: Section[] = [
      { title: "Morning", iconName: "wb-sunny", data: [] },
      { title: "Midday", iconName: "brightness-5", data: [] },
      { title: "Evening", iconName: "wb-twilight", data: [] },
      { title: "Night", iconName: "bedtime", data: [] },
    ];
    if (!sessions.length) return [];
    const morningStart = timeToMinutes("4:00 AM");
    const middayStart = timeToMinutes("12:00 PM");
    const eveningStart = timeToMinutes("5:00 PM");
    const nightStart = timeToMinutes("9:00 PM");
    sessions.forEach(session => {
        const sessionStart = timeToMinutes(session.start);
        if (sessionStart >= morningStart && sessionStart < middayStart) blocks[0].data.push(session);
        else if (sessionStart >= middayStart && sessionStart < eveningStart) blocks[1].data.push(session);
        else if (sessionStart >= eveningStart && sessionStart < nightStart) blocks[2].data.push(session);
        else blocks[3].data.push(session);
    });
    blocks.forEach(block => block.data.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    return blocks.filter((block) => block.data.length > 0);
  }, [sessions]);

  // --- Render ---
  if (isLoading) {
    return (
        <LinearGradient colors={["#10101A", "#0A0A0A"]} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
        </LinearGradient>
    );
  }

  return (
   <LinearGradient colors={['#0e0f1bff', '#0e0f1bff']} style={styles.container}>
      <CustomTimePicker
        isVisible={isTimePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        initialTime={ timePickerTarget === "start" ? newSessionStartDate : timePickerTarget === "end" ? newSessionEndDate : timePickerTarget === "editStart" && editSession ? timeStringToDate(editSession.start) : timePickerTarget === "editEnd" && editSession ? timeStringToDate(editSession.end) : new Date() }
        onTimeSelect={(date) => {
          if (timePickerTarget === "start") setNewSessionStartDate(date);
          else if (timePickerTarget === "end") setNewSessionEndDate(date);
          else if (timePickerTarget === "editStart") setEditSession((prev) => (prev ? { ...prev, start: formatTime(date) } : null));
          else if (timePickerTarget === "editEnd") setEditSession((prev) => (prev ? { ...prev, end: formatTime(date) } : null));
        }}
      />
      
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>{headingText}</Text>
      </View>

        {sessions.length > 0 && (
         <LinearGradient
            colors={['#1c1f37ff', '#121121ff', '#2e2025ff']} // 🎨 বাম থেকে ডানে তিনটি নতুন কালার
            locations={[0, 0.7, 1]}                    // কালারগুলোর অবস্থান
            start={{ x: 0, y: 0 }}                     // বাম দিক থেকে শুরু
            end={{ x: 1, y: 0 }}                       // ডান দিকে শেষ
            style={styles.statusContainer}
        >
           <View style={styles.statusRow}>
               <MaterialIcons name="play-arrow" size={20} color="#34D399" />
               <Text style={styles.statusText} numberOfLines={1}>{currentTask ? `Current: ${currentTask.title}` : "No current task."}</Text>
           </View>
           <View style={styles.statusRow}>
               <MaterialIcons name="skip-next" size={20} color="#FBBF24" />
               <Text style={styles.statusText} numberOfLines={1}>
                   {nextTask ? `Next: ${nextTask.title} in ` : "No upcoming tasks."}
                   {nextTask && <Text style={{fontWeight: 'bold'}}>{formatCountdown(countdownMs ?? 0)}</Text>}
               </Text>
           </View>
        </LinearGradient>
        )}
    
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {groupedSessions.map((section) => (
          <TimeBlockCard key={section.title} section={section} onToggle={toggleCompletion} onEdit={openEditModal} onDelete={deleteSession} />
        ))}
        {groupedSessions.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 50, opacity: 0.7 }}>
            <Text style={{ color: "#A0A0A0", fontSize: 16 }}>No sessions today.</Text>
            <Text style={{ color: "#777", fontSize: 14, marginTop: 4 }}>Tap the '+' button to add one.</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => {
        setNewSessionTitle("");
        setNewSessionStartDate(null);
        setNewSessionEndDate(null);
        setCreateModalVisible(true);
      }}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Create Session Modal */}
      <Modal visible={isCreateModalVisible} animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <LinearGradient colors={["#1C1C1E", "#0A0A0A"]} style={styles.fullScreenModal}>
            <View style={styles.fullScreenModalHeader}>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="chevron-back" size={32} color="#007AFF" /></TouchableOpacity>
                <Text style={styles.fullScreenModalTitle}>Create Session</Text><View style={{width: 32}} />
            </View>
            <ScrollView style={styles.fullScreenModalContent}>
                <TouchableOpacity style={styles.templateButton} onPress={() => { setCreateModalVisible(false); navigation.navigate('template'); }}>
                    <Ionicons name="albums-outline" size={22} color="#007AFF" />
                    <Text style={styles.templateButtonText}>Start with a Template</Text>
                </TouchableOpacity>
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} />
                </View>
                <Text style={styles.inputLabel}>TASK NAME</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="create-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput placeholder="e.g., Morning Exercise" placeholderTextColor="#888" style={styles.textInput} value={newSessionTitle} onChangeText={setNewSessionTitle} />
                </View>
                <Text style={styles.inputLabel}>DURATION</Text>
                <View style={styles.timeInputRow}>
                    <TouchableOpacity onPress={() => { setTimePickerTarget("start"); setTimePickerVisible(true); }} style={styles.timeInput}>
                        <Ionicons name="time-outline" size={20} color="#888" style={styles.inputIcon}/>
                        <Text style={{ color: newSessionStartDate ? "#fff" : "#888", fontSize: 16 }}>{newSessionStartDate ? formatTime(newSessionStartDate) : "Start Time"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setTimePickerTarget("end"); setTimePickerVisible(true); }} style={styles.timeInput}>
                        <Ionicons name="time" size={20} color="#888" style={styles.inputIcon}/>
                        <Text style={{ color: newSessionEndDate ? "#fff" : "#888", fontSize: 16 }}>{newSessionEndDate ? formatTime(newSessionEndDate) : "End Time"}</Text>
                    </TouchableOpacity>
                </View>
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
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="chevron-back" size={32} color="#007AFF" /></TouchableOpacity>
                <Text style={styles.fullScreenModalTitle}>Edit Session</Text><View style={{width: 32}} />
            </View>
            <ScrollView style={styles.fullScreenModalContent}>
                <Text style={styles.inputLabel}>TASK NAME</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="create-outline" size={22} color="#888" style={styles.inputIcon} />
                    <TextInput placeholder="Session Title" placeholderTextColor="#888" style={styles.textInput} value={editSession?.title ?? ""} onChangeText={(text) => setEditSession((prev) => prev ? { ...prev, title: text } : null)} />
                </View>
                <Text style={styles.inputLabel}>DURATION</Text>
                <View style={styles.timeInputRow}>
                    <TouchableOpacity onPress={() => { setTimePickerTarget("editStart"); setTimePickerVisible(true); }} style={styles.timeInput}>
                        <Ionicons name="time-outline" size={20} color="#888" style={styles.inputIcon}/>
                        <Text style={{ color: "#fff", fontSize: 16 }}>{editSession?.start || "Select Start Time"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setTimePickerTarget("editEnd"); setTimePickerVisible(true); }} style={styles.timeInput}>
                        <Ionicons name="time" size={20} color="#888" style={styles.inputIcon}/>
                        <Text style={{ color: "#fff", fontSize: 16 }}>{editSession?.end || "Select End Time"}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={saveEdit} style={[styles.modalMainActionBtn, (!editSession?.title || !editSession?.start || !editSession?.end) && styles.disabledBtn]} disabled={!editSession?.title || !editSession?.start || !editSession?.end}>
                    <Text style={styles.modalMainActionBtnText}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
      </Modal>

    </LinearGradient>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15, backgroundColor: '#000' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { marginTop: Platform.OS === "android" ? 50 : 70, marginBottom: 25, paddingHorizontal: 5 },
    heading: { fontSize: 32, fontWeight: "bold", color: "#FFFFFF", minHeight: 40 },
    statusContainer: { 
        marginBottom: 20, 
        padding: 14, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.1)', 
        marginHorizontal: 5 
    },
    statusRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
    statusText: { color: "#E0E0E0", fontSize: 14, flexShrink: 1, marginLeft: 8 },
    fab: { position: "absolute", width: 60, height: 60, alignItems: "center", justifyContent: "center", bottom: 30, alignSelf: 'center', backgroundColor: "#007AFF", borderRadius: 30 },
    // Modal Styles
    fullScreenModal:{flex:1},
    fullScreenModalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:Platform.OS==='android'?40:60,paddingBottom:15,paddingHorizontal:20},
    fullScreenModalTitle:{color:'#fff',fontSize:20,fontWeight:'bold'},
    fullScreenModalContent:{flex:1,paddingHorizontal:20,paddingTop:20,paddingBottom:40},
    templateButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0, 122, 255, 0.15)',paddingVertical:15,borderRadius:14,borderWidth:1,borderColor:'rgba(0, 122, 255, 0.3)'},
    templateButtonText:{color:'#007AFF',fontSize:17,fontWeight:'600',marginLeft:10},
    dividerContainer:{flexDirection:'row',alignItems:'center',marginVertical:25},
    dividerLine:{flex:1,height:1,backgroundColor:'#3A3A3C'},
    dividerText:{color:'#8A8A8E',marginHorizontal:15,fontWeight:'600'},
    inputLabel:{color:'#8A8A8E',fontSize:13,fontWeight:'600',textTransform:'uppercase',marginBottom:10,marginLeft:5},
    inputContainer:{flexDirection:'row',alignItems:'center',backgroundColor:'#333',borderRadius:12,marginBottom:25},
    inputIcon:{paddingLeft:15},
    textInput:{flex:1,paddingVertical:15,paddingHorizontal:10,color:'#fff',fontSize:16},
    timeInputRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:25},
    timeInput:{flexDirection:'row',alignItems:'center',backgroundColor:'#333',borderRadius:12,paddingVertical:15,width:'48%'},
    modalMainActionBtn:{backgroundColor:"#007AFF",paddingVertical:15,borderRadius:14,alignItems:"center",marginTop:10},
    modalMainActionBtnText:{color:"#fff",fontWeight:"bold",fontSize:17},
    disabledBtn:{backgroundColor:'#3A3A3C'}
});