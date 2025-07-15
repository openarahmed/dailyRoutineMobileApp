import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { routineTemplates } from "../../lib/templateData"; // path to templates

export default function TemplateTab() {
  const router = useRouter();

  const onSelectTemplate = async (sessions: any[]) => {
    try {
      await AsyncStorage.setItem("selectedSessions", JSON.stringify(sessions));
      router.push("/"); // redirect to Home tab
    } catch (e) {
      console.error("Error saving sessions", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick a Template</Text>
      <FlatList
        data={routineTemplates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectTemplate(item.sessions)}
            activeOpacity={0.9}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.details}>
              {item.sessions.length} tasks inside
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e10",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#1c1c1f",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2e2e3e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  description: {
    fontSize: 12,
    color: "#bbb",
    marginTop: 4,
    fontStyle: "italic",
  },
  details: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 8,
  },
});
