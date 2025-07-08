// screens/TemplatePicker.tsx
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { routineTemplates, Session } from "../templates";

type TemplatePickerProps = {
  navigation: any; // you can improve this later with react-navigation types
  route: {
    params?: {
      onSelect?: (sessions: Session[]) => void;
    };
  };
};

export default function TemplatePicker({
  navigation,
  route,
}: TemplatePickerProps) {
  const onSelectTemplate = (sessions: Session[]) => {
    route.params?.onSelect && route.params.onSelect(sessions);
    navigation.goBack();
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
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  templateButton: {
    padding: 15,
    backgroundColor: "#4e90ff",
    marginBottom: 12,
    borderRadius: 8,
  },
  templateText: { color: "#fff", fontSize: 18 },
});
