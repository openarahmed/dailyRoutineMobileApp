import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type Session = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
};

export type Template = {
  id: string;
  title: string;
  description: string;
  sessions: Session[];
};

const templates: Template[] = [
  {
    id: "1",
    title: "Morning Routine",
    description: "Start your day fresh with prayer, study, and breaks.",
    sessions: [
      {
        id: "s1",
        startTime: "7:00 AM",
        endTime: "7:30 AM",
        title: "Wake up & Fajr Prayer",
        description: "",
      },
      {
        id: "s2",
        startTime: "7:30 AM",
        endTime: "10:30 AM",
        title: "Study session ①",
        description: "",
      },
      {
        id: "s3",
        startTime: "10:30 AM",
        endTime: "11:00 AM",
        title: "Breakfast and short break",
        description: "",
      },
      {
        id: "s4",
        startTime: "11:00 AM",
        endTime: "3:00 PM",
        title: "Rest, lunch, conversation, shower",
        description: "",
      },
      {
        id: "s5",
        startTime: "3:30 PM",
        endTime: "5:30 PM",
        title: "Study session ②",
        description: "",
      },
      {
        id: "s6",
        startTime: "5:30 PM",
        endTime: "7:30 PM",
        title: "Light walk or relaxing",
        description: "",
      },
      {
        id: "s7",
        startTime: "8:30 PM",
        endTime: "10:30 PM",
        title: "Study session ③",
        description: "",
      },
      {
        id: "s8",
        startTime: "10:30 PM",
        endTime: "11:00 PM",
        title: "Dinner",
        description: "",
      },
      {
        id: "s9",
        startTime: "11:00 PM",
        endTime: "12:00 AM",
        title: "Talk or spend time with loved ones",
        description: "",
      },
      {
        id: "s10",
        startTime: "12:00 AM",
        endTime: "7:00 AM",
        title: "Sleep",
        description: "",
      },
    ],
  },
  {
    id: "2",
    title: "Exam Prep",
    description: "Focused study sessions with planned breaks.",
    sessions: [
      {
        id: "s1",
        startTime: "8:00 AM",
        endTime: "10:00 AM",
        title: "Review Notes",
        description: "",
      },
      {
        id: "s2",
        startTime: "10:00 AM",
        endTime: "10:30 AM",
        title: "Short Break",
        description: "",
      },
      {
        id: "s3",
        startTime: "10:30 AM",
        endTime: "1:30 PM",
        title: "Practice Problems",
        description: "",
      },
      // Add more sessions as you want
    ],
  },
];

type Props = {
  onSelect: (template: Template) => void;
};

export default function TemplatesScreen({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a Routine Template</Text>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  description: { fontSize: 14, color: "#555", marginTop: 6 },
  separator: { height: 12 },
});
