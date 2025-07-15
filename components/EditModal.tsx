// components/EditModal.tsx

import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Session } from "../types";
import { formatTime, timeStringToDate } from "../utils/timeHelpers";

type Props = {
  visible: boolean;
  session: Session | null;
  onClose: () => void;
  onSave: (updatedSession: Session) => void;
};

export default function EditModal({
  visible,
  session,
  onClose,
  onSave,
}: Props) {
  const [localSession, setLocalSession] = useState<Session | null>(session);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  React.useEffect(() => {
    setLocalSession(session);
  }, [session]);

  if (!localSession) return null;

  const handleChange = (key: keyof Session, value: string) => {
    setLocalSession((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleSave = () => {
    if (!localSession?.title || !localSession.start || !localSession.end) {
      alert("Please fill in all fields");
      return;
    }
    onSave(localSession);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Session</Text>

          <TextInput
            placeholder="Session Title"
            placeholderTextColor="gray"
            style={[styles.input, { color: "#fff" }]}
            value={localSession.title}
            onChangeText={(text) => handleChange("title", text)}
          />

          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.input}
          >
            <Text style={{ color: "#fff" }}>
              {localSession.start || "Select Start Time"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.input}
          >
            <Text style={{ color: "#fff" }}>
              {localSession.end || "Select End Time"}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              mode="time"
              value={timeStringToDate(localSession.start)}
              display="spinner"
              is24Hour={false}
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  handleChange("start", formatTime(selectedDate));
                }
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              mode="time"
              value={timeStringToDate(localSession.end)}
              display="spinner"
              is24Hour={false}
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  handleChange("end", formatTime(selectedDate));
                }
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalBtn, { backgroundColor: "#666" }]}
            >
              <Text style={{ color: "#fff" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.modalBtn}>
              <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
});
