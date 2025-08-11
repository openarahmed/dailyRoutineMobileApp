import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { AbstractChartConfig } from "react-native-chart-kit/dist/AbstractChart";
import { useTheme } from "../../context/ThemeContext"; // 👈 Import useTheme

// --- RESPONSIVE SCALING UTILITIES ---
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
// --- END OF UTILITIES ---

type ChartData = {
    labels: string[];
    datasets: { data: number[] }[];
};

type Session = {
    id: string;
    title: string;
    start: string;
    end: string;
    completedAt?: string;
};

// --- Helper Functions (Unchanged) ---
const timeToMinutes = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return 0;
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
};

const sessionDurationHours = (start: string, end: string): number => {
    let startMins = timeToMinutes(start);
    let endMins = timeToMinutes(end);
    if (endMins < startMins) endMins += 24 * 60;
    return (endMins - startMins) / 60;
};

const getDatePart = (isoString: string): string => isoString.split("T")[0];

const daysAgo = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = today.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
};

const getLast7Days = (): string[] => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
};

export default function AnalyticsScreen() {
    const { colors } = useTheme(); // 👈 Get theme colors
    const [completedCount, setCompletedCount] = useState(0);
    const [productiveHours, setProductiveHours] = useState(0);
    const [streak, setStreak] = useState(0);
    const [dailyProgress, setDailyProgress] = useState<Record<string, boolean>>({});
    const [chartData, setChartData] = useState<ChartData>({
        labels: [],
        datasets: [{ data: [] }],
    });

    // Data loading logic is unchanged
    useFocusEffect(
        useCallback(() => {
            const loadAnalyticsData = async () => {
                try {
                    const storedHistory = await AsyncStorage.getItem("completionHistory");
                    if (!storedHistory) {
                        setChartData({ labels: [], datasets: [{ data: [] }] });
                        return;
                    }
                    const allCompletedSessions: Session[] = JSON.parse(storedHistory);

                    // Weekly Stats
                    const sessionsLast7Days = allCompletedSessions.filter(s => s.completedAt && daysAgo(s.completedAt) < 7);
                    setCompletedCount(sessionsLast7Days.length);
                    const totalHours = sessionsLast7Days.reduce((sum, s) => sum + sessionDurationHours(s.start, s.end), 0);
                    setProductiveHours(parseFloat(totalHours.toFixed(2)));

                    // Streak and Daily Progress
                    const completedDatesSet = new Set(allCompletedSessions.map(s => getDatePart(s.completedAt!)));
                    let currentStreak = 0;
                    for (let i = 0; i < 365; i++) {
                        const checkDate = new Date();
                        checkDate.setDate(checkDate.getDate() - i);
                        const checkDateStr = checkDate.toISOString().split("T")[0];
                        if (completedDatesSet.has(checkDateStr)) {
                            currentStreak++;
                        } else if (i > 0) {
                            break;
                        }
                    }
                    setStreak(currentStreak);
                    const last7Days = getLast7Days();
                    const progressMap: Record<string, boolean> = {};
                    last7Days.forEach(date => {
                        progressMap[date] = completedDatesSet.has(date);
                    });
                    setDailyProgress(progressMap);

                    // Chart Data
                    const productiveHoursByDate = new Map<string, number>();
                    allCompletedSessions.forEach(session => {
                        if (session.completedAt) {
                            const dateStr = getDatePart(session.completedAt);
                            const hours = sessionDurationHours(session.start, session.end);
                            const currentHours = productiveHoursByDate.get(dateStr) || 0;
                            productiveHoursByDate.set(dateStr, currentHours + hours);
                        }
                    });

                    const last30DaysDates: Date[] = [];
                    for (let i = 29; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        last30DaysDates.push(d);
                    }
                    const labels = last30DaysDates.map(date => `${date.getMonth() + 1}/${date.getDate()}`);
                    const data = last30DaysDates.map(date => {
                        const dateStr = date.toISOString().split("T")[0];
                        return parseFloat((productiveHoursByDate.get(dateStr) || 0).toFixed(1));
                    });
                    setChartData({ labels, datasets: [{ data }] });

                } catch (err) {
                    console.log("Error loading analytics data:", err);
                }
            };
            loadAnalyticsData();
        }, [])
    );

    const dayLabel = (isoDate: string) => new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const last7Days = getLast7Days();

    // 👈 Dynamic chart configuration based on theme
    const chartConfig: AbstractChartConfig = {
        backgroundColor: colors.focusCardBg || "#18202e",
        backgroundGradientFrom: colors.focusCardBg || "#18202e",
        backgroundGradientTo: colors.focusCardBg || "#18202e",
        decimalPlaces: 1,
        color: (opacity = 1) => colors.accentColor ? `${colors.accentColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : `rgba(65, 136, 255, ${opacity})`,
        labelColor: (opacity = 1) => `${colors.textColor}${Math.round(opacity * 128).toString(16).padStart(2, '0')}`, // 80% opacity
        style: { borderRadius: moderateScale(16) },
        propsForDots: {
            r: moderateScale(4).toString(),
            strokeWidth: moderateScale(1).toString(),
            stroke: colors.focusTimeDisplay || "#7ceffd",
        },
        propsForLabels: {
            fontSize: moderateScale(11),
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundColor }]}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: verticalScale(30) }}>
                <View style={styles.headerContainer}>
                    <Text style={[styles.heading, { color: colors.textColor }]}>Analytics</Text>
                </View>

                <View style={[styles.statsContainer, { backgroundColor: colors.focusCardBg || styles.statsContainer.backgroundColor }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="checkmark-done-circle-outline" size={moderateScale(28)} color={colors.switchTrackOn || "#4caf50"} />
                        <Text style={[styles.statValue, { color: colors.textColor }]}>{completedCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.noSessionsSubText }]}>Sessions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="hourglass-outline" size={moderateScale(28)} color={colors.editIconColor || "#ff9800"} />
                        <Text style={[styles.statValue, { color: colors.textColor }]}>{productiveHours}</Text>
                        <Text style={[styles.statLabel, { color: colors.noSessionsSubText }]}>Hours</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="flame-outline" size={moderateScale(28)} color={colors.deleteIconColor || "#f44336"} />
                        <Text style={[styles.statValue, { color: colors.textColor }]}>{streak}</Text>
                        <Text style={[styles.statLabel, { color: colors.noSessionsSubText }]}>Day Streak</Text>
                    </View>
                </View>

                <Text style={[styles.subHeading, { color: colors.textColor }]}>Day-by-Day Progress</Text>
                <View style={[styles.progressContainer, { backgroundColor: colors.focusCardBg || styles.progressContainer.backgroundColor }]}>
                    {last7Days.map((date) => (
                        <View key={date} style={styles.progressItem}>
                            <Text style={[styles.progressDay, { color: colors.noSessionsSubText }]}>{dayLabel(date)}</Text>
                            <View style={[styles.progressCircle, dailyProgress[date] ? { backgroundColor: colors.switchTrackOn || '#4caf50' } : { backgroundColor: colors.deleteIconColor || '#f44336', opacity: 0.7 }]}>
                                {dailyProgress[date] ? (
                                    <Ionicons name="checkmark-sharp" size={moderateScale(22)} color="#fff" />
                                ) : (
                                    <Ionicons name="close-sharp" size={moderateScale(22)} color="#fff" />
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={[styles.subHeading, { color: colors.textColor }]}>Productivity (Last 30 Days)</Text>
                <View style={[styles.chartContainer, { backgroundColor: colors.focusCardBg || styles.chartContainer.backgroundColor }]}>
                    {chartData.labels.length > 0 ? (
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={chartData}
                                width={scale(1200)}
                                height={verticalScale(220)}
                                yAxisLabel=""
                                yAxisSuffix="h"
                                chartConfig={chartConfig}
                                verticalLabelRotation={30}
                                fromZero={true}
                                showValuesOnTopOfBars={true}
                                segments={4}
                            />
                        </ScrollView>
                    ) : (
                        <View style={styles.chartPlaceholder}>
                            <Text style={[styles.chartText, { color: colors.noSessionsSubText }]}>No data to display chart.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Styles (mostly unchanged, colors are now applied inline) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: scale(15),
    },
    headerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20),
        marginBottom: verticalScale(25),
    },
    heading: {
        fontSize: moderateScale(32, 0.4),
        fontWeight: "bold",
        textAlign: 'left',
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#18202e",
        borderRadius: moderateScale(16),
        paddingVertical: verticalScale(15),
        marginBottom: verticalScale(30),
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statValue: {
        fontSize: moderateScale(22),
        fontWeight: "bold",
        marginTop: verticalScale(8),
    },
    statLabel: {
        fontSize: moderateScale(12),
        marginTop: verticalScale(2),
        textTransform: "uppercase",
        fontWeight: "600",
    },
    subHeading: {
        fontSize: moderateScale(18),
        fontWeight: "700",
        marginBottom: verticalScale(15),
        marginTop: verticalScale(10),
    },
    progressContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#18202e",
        paddingVertical: verticalScale(18),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(16),
        marginBottom: verticalScale(30),
    },
    progressItem: {
        alignItems: "center",
        width: scale(40),
    },
    progressDay: {
        marginBottom: verticalScale(8),
        fontWeight: "700",
        fontSize: moderateScale(12),
    },
    progressCircle: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        justifyContent: "center",
        alignItems: "center",
    },
    chartContainer: {
        backgroundColor: "#18202e",
        borderRadius: moderateScale(16),
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(5),
        marginBottom: verticalScale(60),
        overflow: 'hidden',
    },
    chartPlaceholder: {
        height: verticalScale(220),
        justifyContent: "center",
        alignItems: "center",
    },
    chartText: {
        fontSize: moderateScale(16),
        fontWeight: "600",
    },
});
