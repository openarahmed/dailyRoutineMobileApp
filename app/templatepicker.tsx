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
import { routineTemplates, Session } from "../templates";

export default function TemplatePicker() {
  const router = useRouter();

  const onSelectTemplate = async (sessions: Session[]) => {
    try {
      await AsyncStorage.setItem("selectedSessions", JSON.stringify(sessions));
      router.back(); // go back to Create screen
    } catch (e) {
      console.error("Error saving sessions", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Routine Template</Text>
      <FlatList
        data={routineTemplates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => onSelectTemplate(item.sessions)}
          >
            <Text style={styles.templateText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#121212" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, color: "#fff" },
  templateButton: {
    padding: 15,
    backgroundColor: "#4e90ff",
    marginBottom: 12,
    borderRadius: 8,
  },
  templateText: { color: "#fff", fontSize: 18 },
});
