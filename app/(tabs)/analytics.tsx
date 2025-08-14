import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AchievementPath from '../components/AchievementPath';
import DailySummary from '../components/DailySummary';
import EffortBubbleChart from '../components/EffortBubbleChart';
import MonthlyOverview from '../components/MonthlyOverview';
import RoutineBalanceChart from '../components/RoutineBalanceChart';
import WeeklyRoutineChart from '../components/WeeklyRoutineChart';

// --- Helper Functions ---
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
};

const sessionDurationHours = (start, end) => {
    let startMins = timeToMinutes(start);
    let endMins = timeToMinutes(end);
    if (endMins < startMins) endMins += 24 * 60;
    return (endMins - startMins) / 60;
};

// --- Gamification & Achievement Logic ---
const ALL_ACHIEVEMENTS = [
    { id: 'b1', tier: 'beginner', name: 'First Step', description: 'Complete your first task.', points: 10, goal: 1, key: 'totalCompletedTasks' },
    { id: 'b2', tier: 'beginner', name: 'First Streak', description: 'Achieve a 3-day streak.', points: 20, goal: 3, key: 'currentStreak' },
    { id: 'b3', tier: 'beginner', name: 'Weekly Warrior', description: 'Achieve a 7-day streak.', points: 50, goal: 7, key: 'currentStreak' },
    { id: 'b4', tier: 'beginner', name: 'Focused Mind', description: 'Log 25 total hours of work.', points: 50, goal: 25, key: 'totalHoursWorked' },
    { id: 'b5', tier: 'beginner', name: 'Routine Master', description: 'Achieve a 30-day streak.', points: 100, goal: 30, key: 'currentStreak' },
    { id: 'b6', tier: 'beginner', name: 'Centurion', description: 'Log 100 total hours of work.', points: 150, goal: 100, key: 'totalHoursWorked' },
    { id: 'i1', tier: 'intermediate', name: 'Sixty Day Sprint', description: 'Achieve a 60-day streak.', points: 200, goal: 60, key: 'currentStreak' },
    { id: 'i2', tier: 'intermediate', name: 'Quarterly Conqueror', description: 'Achieve a 90-day streak.', points: 300, goal: 90, key: 'currentStreak' },
    { id: 'i3', tier: 'intermediate', name: 'Work Ethic Pro', description: 'Log 500 total hours of work.', points: 400, goal: 500, key: 'totalHoursWorked' },
    { id: 'm1', tier: 'master', name: 'Half-Year Hero', description: 'Achieve a 180-day streak.', points: 500, goal: 180, key: 'currentStreak' },
    { id: 'm2', tier: 'master', name: 'Yearly Titan', description: 'Achieve a 365-day streak.', points: 1000, goal: 365, key: 'currentStreak' },
    { id: 'm3', tier: 'master', name: 'Routine Guru', description: 'Log 1000 total hours of work.', points: 1200, goal: 1000, key: 'totalHoursWorked' },
];

const determineCurrentTier = (achievements) => {
    if (achievements.beginner.some(ach => !ach.unlocked)) return 'beginner';
    if (achievements.intermediate.some(ach => !ach.unlocked)) return 'intermediate';
    if (achievements.master.some(ach => !ach.unlocked)) return 'master';
    return 'master';
};

const determineUserRank = (achievements) => {
    if (achievements.master.some(ach => ach.unlocked)) return 'Master';
    if (achievements.intermediate.some(ach => ach.unlocked)) return 'Intermediate';
    if (achievements.beginner.some(ach => ach.unlocked)) return 'Beginner';
    return 'Newcomer';
};

export default function AnalyticsScreen() {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    
    const [dailySummaryData, setDailySummaryData] = useState(null);
    const [routineBalanceData, setRoutineBalanceData] = useState(null);
    const [weeklyChartData, setWeeklyChartData] = useState(null);
    const [effortBubbleData, setEffortBubbleData] = useState(null);
    const [monthlyOverviewData, setMonthlyOverviewData] = useState(null);
    const [achievementData, setAchievementData] = useState(null);
    const [userRank, setUserRank] = useState('Newcomer');

    useFocusEffect(
        useCallback(() => {
            const loadAllData = async () => {
                setIsLoading(true);
                try {
                    const routineStr = await AsyncStorage.getItem("studyRoutine");
                    const historyStr = await AsyncStorage.getItem("completionHistory");
                    const routine = routineStr ? JSON.parse(routineStr) : [];
                    const history = historyStr ? JSON.parse(historyStr) : [];
                    
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth();

                    // --- Motivation Tab Logic ---
                    const totalHoursWorked = history.reduce((sum, rec) => sum + sessionDurationHours(rec.start, rec.end), 0);
                    const totalCompletedTasks = history.length;
                    const uniqueDates = [...new Set(history.map(rec => rec.completedAt.split('T')[0]))].sort((a, b) => new Date(b) - new Date(a));
                    let currentStreak = 0;
                    if (uniqueDates.length > 0) {
                        const todayStr = today.toISOString().split('T')[0];
                        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                        const yesterdayStr = yesterday.toISOString().split('T')[0];
                        if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
                            currentStreak = 1;
                            for (let i = 0; i < uniqueDates.length - 1; i++) {
                                const diff = new Date(uniqueDates[i]) - new Date(uniqueDates[i + 1]);
                                if (Math.round(diff / (1000 * 60 * 60 * 24)) === 1) { currentStreak++; } 
                                else { break; }
                            }
                        }
                    }
                    const userStats = { totalCompletedTasks, totalHoursWorked, currentStreak };

                    const processedAchievements = { beginner: [], intermediate: [], master: [] };
                    ALL_ACHIEVEMENTS.forEach(ach => {
                        const unlocked = userStats[ach.key] >= ach.goal;
                        const progress = unlocked ? ach.goal : (userStats[ach.key] || 0);
                        if(processedAchievements[ach.tier]) {
                            processedAchievements[ach.tier].push({ ...ach, unlocked, progress: Math.min(progress, ach.goal) });
                        }
                    });
                    
                    const rank = determineUserRank(processedAchievements);
                    const currentTier = determineCurrentTier(processedAchievements);
                    const achievementsForDisplay = { [currentTier]: processedAchievements[currentTier] };
                    setAchievementData(achievementsForDisplay);
                    setUserRank(rank);

                    // --- Dashboard Tab Logic (Your original code, unaltered) ---
                    if (activeTab === 'dashboard') {
                        const todayDayIndex = today.getDay();
                        const tasksForToday = routine.filter(task => task.activeDays.includes(todayDayIndex));
                        const completedToday = history.filter(rec => rec.completedAt.startsWith(today.toISOString().split("T")[0]));
                        setDailySummaryData({
                            completionPercent: tasksForToday.length > 0 ? Math.round((completedToday.length / tasksForToday.length) * 100) : 0,
                            tasksDone: completedToday.length,
                            totalTasks: tasksForToday.length,
                            hoursCompleted: completedToday.reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0)
                        });

                        const historyThisMonth = history.filter(rec => new Date(rec.completedAt).getMonth() === month && new Date(rec.completedAt).getFullYear() === year);
                        let completedMorningCount = 0, completedEveningCount = 0;
                        historyThisMonth.forEach(rec => { (timeToMinutes(rec.start) < 12 * 60) ? completedMorningCount++ : completedEveningCount++; });
                        const totalCompletedThisMonth = completedMorningCount + completedEveningCount;
                        setRoutineBalanceData({
                            morning: totalCompletedThisMonth > 0 ? Math.round((completedMorningCount / totalCompletedThisMonth) * 100) : 0,
                            evening: totalCompletedThisMonth > 0 ? 100 - Math.round((completedMorningCount / totalCompletedThisMonth) * 100) : 0,
                        });
                        
                        const effortDataMap = new Map();
                        const weeklyDataPointsByTitle = new Map();
                        for (let i = 6; i >= 0; i--) {
                            const d = new Date(); d.setDate(d.getDate() - i);
                            const dateStr = d.toISOString().split("T")[0];
                            const completedOnDate = history.filter(rec => rec.completedAt.startsWith(dateStr));
                            completedOnDate.forEach(rec => {
                                const session = routine.find(s => s.id === rec.id);
                                if (session && rec.title) {
                                    const hours = sessionDurationHours(session.start, session.end);
                                    const currentTotalEffort = effortDataMap.get(rec.title) || 0;
                                    effortDataMap.set(rec.title, currentTotalEffort + hours);
                                    if (!weeklyDataPointsByTitle.has(rec.title)) weeklyDataPointsByTitle.set(rec.title, Array(7).fill(0));
                                    weeklyDataPointsByTitle.get(rec.title)[6 - i] += hours;
                                }
                            });
                        }
                        const top5Titles = Array.from(effortDataMap.entries()).sort(([, hoursA], [, hoursB]) => hoursB - hoursA).slice(0, 5).map(([title]) => title);
                        const weeklyLabels = [];
                        for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); weeklyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' })); }
                        const finalWeeklyData = weeklyLabels.map((_, dayIndex) => top5Titles.map(title => {
                            const titleData = weeklyDataPointsByTitle.get(title) || Array(7).fill(0);
                            return parseFloat(titleData[dayIndex].toFixed(1));
                        }));
                        const colorPalette = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899'];
                        const titleColors = top5Titles.reduce((acc, title, index) => { acc[title] = colorPalette[index % colorPalette.length]; return acc; }, {});
                        setWeeklyChartData({ labels: weeklyLabels, legend: top5Titles, data: finalWeeklyData, barColors: top5Titles.map(title => titleColors[title]) });
                        const bubbleData = Array.from(effortDataMap.entries()).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)), fill: titleColors[name] || '#6b7280' })).filter(item => item.hours > 0);
                        setEffortBubbleData(bubbleData);
                        
                        const monthData = [];
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let i = 1; i <= daysInMonth; i++) {
                            const d = new Date(Date.UTC(year, month, i));
                            const dateStr = d.toISOString().split("T")[0];
                            const hoursForDay = history.filter(rec => rec.completedAt.startsWith(dateStr)).reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0);
                            monthData.push({ date: d.getUTCDate(), hours: parseFloat(hoursForDay.toFixed(1)), fullDate: d.toISOString() });
                        }
                        setMonthlyOverviewData(monthData);
                    }
                } catch (err) {
                    console.error("Error loading all data:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadAllData();
        }, [activeTab])
    );
    
    const renderContent = () => {
        if (isLoading) { return <ActivityIndicator size="large" color={colors.textColor} style={{ marginTop: 50 }} />; }
        switch (activeTab) {
            case 'dashboard':
                return (
                    <View style={styles.tabContentContainer}>
                        <DailySummary data={dailySummaryData} />
                        <RoutineBalanceChart data={routineBalanceData} />
                        <WeeklyRoutineChart data={weeklyChartData} />
                        <EffortBubbleChart data={effortBubbleData} />
                        <MonthlyOverview data={monthlyOverviewData} />
                    </View>
                );
            case 'motivation':
                return (
                    <View style={styles.tabContentContainer}>
                        <AchievementPath data={achievementData} userRank={userRank} />
                    </View>
                );
            case 'intelligence':
                return <View style={styles.tabContentContainer}><Text style={{color: colors.textColor}}>AI Suggestions Here</Text></View>;
            default: return null;
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundColor }]}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.headerContainer}>
                    <Text style={[styles.heading, { color: colors.textColor }]}>Analytics</Text>
                </View>
                <Text style={[styles.subheading, { color: colors.noSessionsSubText }]}>
                    Your current rank: <Text style={{ fontWeight: 'bold', color: colors.textColor }}>{userRank}</Text>
                </Text>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}>
                        <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? colors.accentColor : colors.textColor }]}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('motivation')} style={[styles.tab, activeTab === 'motivation' && styles.activeTab]}>
                        <Text style={[styles.tabText, { color: activeTab === 'motivation' ? colors.accentColor : colors.textColor }]}>Motivation</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('intelligence')} style={[styles.tab, activeTab === 'intelligence' && styles.activeTab]}>
                        <Text style={[styles.tabText, { color: activeTab === 'intelligence' ? colors.accentColor : colors.textColor }]}>AI Suggestions</Text>
                    </TouchableOpacity>
                </View>

                {renderContent()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    scrollContentContainer: { flexGrow: 1, paddingHorizontal: 15, },
    headerContainer: { width: '100%', marginTop: Platform.OS === "android" ? 40 : 20 },
    heading: { fontSize: 32, fontWeight: "bold" },
    subheading: { fontSize: 16, marginBottom: 25 },
    tabsContainer: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(128, 128, 128, 0.2)',
        marginBottom: 20 
    },
    tab: { 
        flex: 1, 
        paddingBottom: 12, 
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#3498db',
    },
    tabText: { fontSize: 14, fontWeight: '600' },
    tabContentContainer: {
        gap: 20,
        flex: 1,
        paddingBottom: 40,
    },
});