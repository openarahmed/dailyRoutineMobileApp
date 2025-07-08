import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CreateRoutineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>➕ Create your study routine here!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, color: "#333" },
});
