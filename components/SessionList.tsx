import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Session } from "../types";

type Props = {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
};

export default function SessionList({
  sessions,
  onEdit,
  onDelete,
  onToggleComplete,
}: Props) {
  return (
    <FlatList
      data={sessions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <TouchableOpacity onPress={() => onToggleComplete(item.id)}>
            <Text style={{ fontSize: 20 }}>{item.completed ? "✅" : "☑️"}</Text>
          </TouchableOpacity>
          <View style={styles.details}>
            <Text style={[styles.title, item.completed && styles.done]}>
              {item.title}
            </Text>
            <Text style={styles.time}>
              {item.start} - {item.end}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onEdit(item)}>
            <Text style={styles.action}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Text style={styles.action}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    color: "#fff",
  },
  done: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  time: {
    fontSize: 14,
    color: "#aaa",
  },
  action: {
    fontSize: 18,
    marginLeft: 10,
  },
});
