import React from "react";
import { Text, View } from "react-native";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryTheme,
} from "victory-native";

type Session = {
  id: string;
  completed?: boolean;
  completedAt?: string;
};

type Props = {
  sessions: Session[];
};

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0]; // yyyy-mm-dd
}

export default function ProgressChart({ sessions }: Props) {
  const last7Days = getLast7Days();

  // Count completed sessions per day
  const data = last7Days.map((day) => {
    const dayKey = formatDateKey(day);
    const count = sessions.filter(
      (s) => s.completed && s.completedAt && s.completedAt.startsWith(dayKey)
    ).length;
    return { day: dayKey.slice(5), count }; // format day as MM-DD
  });

  return (
    <View>
      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 8,
        }}
      >
        Weekly Progress
      </Text>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
        height={200}
        width={350}
      >
        <VictoryAxis
          tickFormat={(t) => t.replace("-", "/")} // nicer MM/DD
          style={{ tickLabels: { fill: "white" } }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(x) => (Number.isInteger(x) ? x : null)}
          style={{ tickLabels: { fill: "white" } }}
        />
        <VictoryBar
          data={data}
          x="day"
          y="count"
          style={{ data: { fill: "#4caf50" } }}
          barRatio={0.8}
          cornerRadius={{ top: 4 }}
        />
      </VictoryChart>
    </View>
  );
}
