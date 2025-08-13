import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
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

export default function AnalyticsScreen() {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [dailySummaryData, setDailySummaryData] = useState(null);
    const [routineBalanceData, setRoutineBalanceData] = useState(null);
    const [weeklyChartData, setWeeklyChartData] = useState({ labels: [], legend: [], data: [], barColors: [] });
    const [effortBubbleData, setEffortBubbleData] = useState(null);
    const [monthlyOverviewData, setMonthlyOverviewData] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const loadAnalyticsData = async () => {
                setIsLoading(true);
                try {
                    // Loading real data from AsyncStorage
                    const routineStr = await AsyncStorage.getItem("studyRoutine");
                    const historyStr = await AsyncStorage.getItem("completionHistory");
                    
                    const routine = routineStr ? JSON.parse(routineStr) : [];
                    const history = historyStr ? JSON.parse(historyStr) : [];
                    
                    const today = new Date();
                    const todayDayIndex = today.getDay();

                    const tasksForToday = routine.filter(task => task.activeDays.includes(todayDayIndex));
                    const completedToday = history.filter(rec => rec.completedAt.startsWith(today.toISOString().split("T")[0]));

                    // Daily Summary Data
                    const totalTasks = tasksForToday.length;
                    const tasksDone = completedToday.length;
                    const completionPercent = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;
                    const hoursCompleted = completedToday.reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0);
                    setDailySummaryData({
                        completionPercent,
                        tasksDone,
                        totalTasks,
                        hoursCompleted: parseFloat(hoursCompleted.toFixed(1)),
                    });

                    // Routine Balance Data
                    const morningTasks = tasksForToday.filter(t => timeToMinutes(t.start) < 720);
                    const eveningTasks = tasksForToday.filter(t => timeToMinutes(t.start) >= 720);
                    const completedMorning = completedToday.filter(c => morningTasks.some(t => t.id === c.id)).length;
                    const completedEvening = completedToday.filter(c => eveningTasks.some(t => t.id === c.id)).length;
                    const morningPercent = morningTasks.length > 0 ? Math.round((completedMorning / morningTasks.length) * 100) : 0;
                    const eveningPercent = eveningTasks.length > 0 ? Math.round((completedEvening / eveningTasks.length) * 100) : 0;
                    setRoutineBalanceData({ morning: morningPercent, evening: eveningPercent });

                    // --- DYNAMIC Weekly & Effort Bubble Data ---
                    const uniqueCategories = [...new Set(routine.map(task => task.category).filter(Boolean))];
                    
                    const colorPalette = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#ef4444', '#f59e0b', '#10b981'];
                    const categoryColors = uniqueCategories.reduce((acc, cat, index) => {
                        acc[cat] = colorPalette[index % colorPalette.length];
                        return acc;
                    }, {});

                    const weeklyLabels = [];
                    const weeklyDataPoints = uniqueCategories.reduce((acc, cat) => {
                        acc[cat] = [];
                        return acc;
                    }, {});
                    const effortDataMap = new Map();

                    // Loop for the last 7 days to show weekly data
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dateStr = d.toISOString().split("T")[0];
                        weeklyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
                        
                        const completedOnDate = history.filter(rec => rec.completedAt.startsWith(dateStr));

                        uniqueCategories.forEach(cat => {
                            const hoursForCat = completedOnDate
                                .filter(rec => {
                                    const session = routine.find(s => s.id === rec.id);
                                    return session && session.category === cat;
                                })
                                .reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0);
                            
                            weeklyDataPoints[cat].push(parseFloat(hoursForCat.toFixed(1)));
                            
                            const currentEffort = effortDataMap.get(cat) || 0;
                            effortDataMap.set(cat, currentEffort + hoursForCat);
                        });
                    }
                    
                    const finalWeeklyData = weeklyLabels.map((_, dayIndex) => 
                        uniqueCategories.map(cat => weeklyDataPoints[cat][dayIndex])
                    );

                    setWeeklyChartData({
                        labels: weeklyLabels,
                        legend: uniqueCategories,
                        data: finalWeeklyData,
                        barColors: uniqueCategories.map(cat => categoryColors[cat]),
                    });
                    
                    const bubbleData = Array.from(effortDataMap.entries())
                        .map(([name, hours]) => ({
                            name,
                            hours: parseFloat(hours.toFixed(1)),
                            fill: categoryColors[name] || '#6b7280'
                        }))
                        .filter(item => item.hours > 0);

                    setEffortBubbleData(bubbleData);

                    // Monthly Overview Data
                    const monthData = [];
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    for(let i = 1; i <= daysInMonth; i++) {
                        const d = new Date(today.getFullYear(), today.getMonth(), i);
                        const dateStr = d.toISOString().split("T")[0];
                        const hoursForDay = history
                            .filter(rec => rec.completedAt.startsWith(dateStr))
                            .reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0);
                        monthData.push({ date: i, hours: hoursForDay, fullDate: d });
                    }
                    setMonthlyOverviewData(monthData);


                } catch (err) {
                    console.error("Error loading analytics data:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadAnalyticsData();
        }, [])
    );

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={colors.textColor} style={{ marginTop: 50 }} />;
        }

        if (activeTab === 'dashboard') {
            return (
                <View style={styles.tabContentContainer}>
                    <DailySummary data={dailySummaryData} />
                    <RoutineBalanceChart data={routineBalanceData} />
                    <WeeklyRoutineChart data={weeklyChartData} />
                    <EffortBubbleChart data={effortBubbleData} />
                    <MonthlyOverview data={monthlyOverviewData} />
                </View>
            );
        }
        if (activeTab === 'motivation') {
            return (
                <View style={styles.tabContentContainer}>
                    <Text style={{ color: colors.textColor }}>Motivated Achiever Content Here</Text>
                </View>
            );
        }
        if (activeTab === 'intelligence') {
            return (
                <View style={styles.tabContentContainer}>
                    <Text style={{ color: colors.textColor }}>Optimized Self Content Here</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundColor }]}>
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={[styles.heading, { color: colors.textColor }]}>Analytics</Text>
                </View>
                <Text style={[styles.subheading, { color: colors.noSessionsSubText }]}>
                    Visualize your progress, find motivation, and get intelligent insights.
                </Text>

                <View style={[styles.tabsContainer, { borderBottomColor: colors.dividerLine }]}>
                    <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.tab, activeTab === 'dashboard' && { borderBottomColor: colors.accentColor }]}>
                        <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? colors.accentColor : colors.textColor }]}>Insightful Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('motivation')} style={[styles.tab, activeTab === 'motivation' && { borderBottomColor: colors.accentColor }]}>
                        <Text style={[styles.tabText, { color: activeTab === 'motivation' ? colors.accentColor : colors.textColor }]}>Motivated Achiever</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('intelligence')} style={[styles.tab, activeTab === 'intelligence' && { borderBottomColor: colors.accentColor }]}>
                        <Text style={[styles.tabText, { color: activeTab === 'intelligence' ? colors.accentColor : colors.textColor }]}>Optimized Self</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    {renderContent()}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 15 },
    headerContainer: { width: '100%', marginTop: Platform.OS === "android" ? 40 : 20 },
    heading: { fontSize: 32, fontWeight: "bold" },
    subheading: { fontSize: 16, marginBottom: 25 },
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 20 },
    tab: { flex: 1, paddingBottom: 10, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
    tabText: { fontSize: 14, fontWeight: '600' },
    contentContainer: { paddingBottom: 40 },
    tabContentContainer: {
        gap: 20,
    },
});
