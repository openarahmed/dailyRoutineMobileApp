import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- Type Definition for a Note ---
type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
};

// --- Pre-defined colors for notes ---
const noteColors = [
  "#282A36", // Dracula Orchid
  "#44475A", // Slate
  "#6272A4", // Water
  "#504F6D", // Dark Purple
  "#21222C", // Almost Black
  "#3B3A54", // Deep Indigo
];

const getRandomColor = () =>
  noteColors[Math.floor(Math.random() * noteColors.length)];

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // --- Load notes from storage when the screen is focused ---
  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("userNotes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (e) {
      console.error("Failed to load notes.", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  // --- Handlers for opening modals ---
  const handleAddNewNote = () => {
    setCurrentNote(null);
    setNoteTitle("");
    setNoteContent("");
    setModalVisible(true);
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  // --- Handler for saving a note (new or existing) ---
  const handleSaveNote = async () => {
    if (!noteTitle && !noteContent) {
      // Don't save empty notes, just close the modal
      setModalVisible(false);
      return;
    }

    let updatedNotes: Note[];

    if (currentNote) {
      // Update existing note
      updatedNotes = notes.map((note) =>
        note.id === currentNote.id
          ? { ...note, title: noteTitle, content: noteContent }
          : note
      );
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
        color: getRandomColor(),
        createdAt: new Date().toISOString(),
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes));
    setModalVisible(false);
  };

  // --- Handler for deleting a note ---
  const handleDeleteNote = () => {
    if (!currentNote) return;

    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedNotes = notes.filter(
            (note) => note.id !== currentNote.id
          );
          setNotes(updatedNotes);
          await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes));
          setModalVisible(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Notes</Text>
      <ScrollView contentContainerStyle={styles.notesGrid}>
        {notes.length === 0 ? (
          <Text style={styles.emptyText}>
            No notes yet. Tap the &apos;+&apos; to add one!
          </Text>
        ) : (
          notes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[styles.noteCard, { backgroundColor: note.color }]}
              onPress={() => handleEditNote(note)}
            >
              {note.title ? (
                <Text style={styles.noteTitle}>{note.title}</Text>
              ) : null}
              <Text style={styles.noteContent} numberOfLines={8}>
                {note.content}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddNewNote}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* ✅ FIX: Modal is now full screen with a slide animation */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={28} color="#007bff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {currentNote && (
              <TouchableOpacity
                onPress={handleDeleteNote}
                style={styles.headerButton}
              >
                <Ionicons name="trash-outline" size={28} color="#ff6b6b" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSaveNote}
              style={styles.headerButton}
            >
              <Ionicons name="checkmark-done" size={28} color="#007bff" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <TextInput
              placeholder="Title"
              placeholderTextColor="#999"
              style={styles.modalInputTitle}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <TextInput
              placeholder="Take a note..."
              placeholderTextColor="#888"
              style={styles.modalInputContent}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              autoFocus={true}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b111d",
    paddingHorizontal: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 35,
    marginBottom: 20,
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 80,
  },
  noteCard: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 20,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    width: "100%",
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    right: 20,
    bottom: 20,
    backgroundColor: "#007bff",
    borderRadius: 30,
    elevation: 8,
  },
  // ✅ FIX: Updated modal styles for full-screen experience
  modalContainer: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerButton: {
    padding: 5,
    marginLeft: 20,
  },
  modalInputTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalInputContent: {
    fontSize: 18,
    color: "#ddd",
    flex: 1,
    textAlignVertical: "top",
    paddingHorizontal: 20,
    paddingTop: 15,
    lineHeight: 26,
  },
});
