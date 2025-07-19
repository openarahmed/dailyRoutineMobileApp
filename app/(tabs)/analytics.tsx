import { Ionicons } from "@expo/vector-icons"; // Using Ionicons for consistency
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { AbstractChartConfig } from "react-native-chart-kit/dist/AbstractChart";

// Define a specific type for our chart data for better type safety
type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
  }[];
};

// Define the Session type
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
  if (endMins < startMins) endMins += 24 * 60; // Handles overnight sessions
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
  const [completedCount, setCompletedCount] = useState(0);
  const [productiveHours, setProductiveHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyProgress, setDailyProgress] = useState<Record<string, boolean>>(
    {}
  );

  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }],
  });

  useFocusEffect(
    useCallback(() => {
      const loadAnalyticsData = async () => {
        try {
          const storedHistory = await AsyncStorage.getItem("completionHistory");
          if (!storedHistory) {
            console.log("No completion history found.");
            setChartData({ labels: [], datasets: [{ data: [] }] });
            return;
          }

          const allCompletedSessions: Session[] = JSON.parse(storedHistory);

          // Weekly Stats Calculation
          const sessionsLast7Days = allCompletedSessions.filter(
            (s) => s.completedAt && daysAgo(s.completedAt) < 7
          );
          setCompletedCount(sessionsLast7Days.length);
          const totalHours = sessionsLast7Days.reduce(
            (sum, s) => sum + sessionDurationHours(s.start, s.end),
            0
          );
          setProductiveHours(parseFloat(totalHours.toFixed(2)));

          // Streak and Daily Progress Calculation
          const completedDatesSet = new Set(
            allCompletedSessions.map((s) => getDatePart(s.completedAt!))
          );
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
          last7Days.forEach((date) => {
            progressMap[date] = completedDatesSet.has(date);
          });
          setDailyProgress(progressMap);

          // Chart Data Preparation
          const productiveHoursByDate = new Map<string, number>();
          allCompletedSessions.forEach((session) => {
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

          const labels = last30DaysDates.map(
            (date) => `${date.getMonth() + 1}/${date.getDate()}`
          );

          const data = last30DaysDates.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            return productiveHoursByDate.get(dateStr) || 0;
          });

          setChartData({
            labels,
            datasets: [{ data }],
          });
        } catch (err) {
          console.log("Error loading analytics data:", err);
        }
      };

      loadAnalyticsData();
    }, [])
  );

  const dayLabel = (isoDate: string) =>
    new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      timeZone: "UTC",
    });

  const last7Days = getLast7Days();

  const chartConfig: AbstractChartConfig = {
    backgroundColor: "#18202e",
    backgroundGradientFrom: "#18202e",
    backgroundGradientTo: "#18202e",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(65, 136, 255, ${opacity})`, // Blue color from focus screen
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#7ceffd", // Cyan color from focus screen
    },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <Text style={styles.heading}>Analytics</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-done-circle-outline" size={28} color="#4caf50" />
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="hourglass-outline" size={28} color="#ff9800" />
          <Text style={styles.statValue}>{productiveHours}</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={28} color="#f44336" />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <Text style={styles.subHeading}>Day-by-Day Progress</Text>
      <View style={styles.progressContainer}>
        {last7Days.map((date) => (
          <View key={date} style={styles.progressItem}>
            <Text style={styles.progressDay}>{dayLabel(date)}</Text>
            <View
              style={[
                styles.progressCircle,
                dailyProgress[date]
                  ? styles.progressDone
                  : styles.progressMissed,
              ]}
            >
              {dailyProgress[date] ? (
                <Ionicons name="checkmark-sharp" size={22} color="#fff" />
              ) : (
                <Ionicons name="close-sharp" size={22} color="#fff" />
              )}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.subHeading}>Productivity (Last 30 Days)</Text>
      <View style={styles.chartContainer}>
        {chartData.labels.length > 0 ? (
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <BarChart
              data={chartData}
              width={1200}
              height={220}
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
            <Text style={styles.chartText}>No data to display chart.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b111d", // Updated background color
    paddingHorizontal: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#18202e", // Updated card color
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  subHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ddd",
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#18202e", // Updated card color
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 20,
  },
  progressItem: {
    alignItems: "center",
    width: 40,
  },
  progressDay: {
    color: "#b0b0b0",
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 12,
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDone: {
    backgroundColor: "rgba(76, 175, 80, 0.7)", // Green with transparency
  },
  progressMissed: {
    backgroundColor: "rgba(255, 0, 0, 0.5)", // Red with transparency
  },
  chartContainer: {
    backgroundColor: "#18202e", // Updated card color
    borderRadius: 16,
    paddingTop: 10,
    paddingBottom: 5,
    marginBottom: 60,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chartText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "600",
  },
});
