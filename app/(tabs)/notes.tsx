import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// --- RESPONSIVE SCALING UTILITIES ---
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// --- Type Definitions ---
type ChecklistItem = { id: string; text: string; completed: boolean; };
type Note = {
  id: string;
  title: string;
  content: string;
  items?: ChecklistItem[];
  type: 'note' | 'checklist';
  color: string;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
};

// --- Pre-defined colors for notes ---
const noteColors = ["#282A36", "#44475A", "#6272A4", "#504F6D", "#21222C", "#3B3A54", "#f1fa8c", "#50fa7b", "#ffb86c", "#ff79c6", "#bd93f9", "#8be9fd"];
const getRandomColor = () => noteColors[Math.floor(Math.random() * 6)]; // Keep default random to darker shades

// =================================================================
// --- MAIN COMPONENT ---
// =================================================================
export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isSortMenuVisible, setSortMenuVisible] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  // Modal State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<'note' | 'checklist'>('note');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [noteColor, setNoteColor] = useState(noteColors[0]);
  
  // Feature-specific Modals/State
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [noteToUnlock, setNoteToUnlock] = useState<Note | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);
  
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const sortMenuAnimation = useRef(new Animated.Value(0)).current;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const isSelectionMode = selectedNotes.length > 0;

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem("userNotes");
      if (storedNotes) setNotes(JSON.parse(storedNotes));
    } catch (e) { console.error("Failed to load notes.", e); }
  };

  useFocusEffect(useCallback(() => { loadNotes(); }, []));

  useEffect(() => {
    Animated.spring(fabAnimation, { toValue: isFabMenuOpen ? 1 : 0, friction: 5, useNativeDriver: true }).start();
  }, [isFabMenuOpen]);

  useEffect(() => {
    Animated.timing(sortMenuAnimation, { toValue: isSortMenuVisible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [isSortMenuVisible]);

  const handleCreateNewNote = (type: 'note' | 'checklist') => {
    const newColor = getRandomColor();
    setCurrentNote(null); setNoteTitle(""); setNoteContent(""); setChecklistItems([]);
    setIsLocked(false); setIsPinned(false); setNoteColor(newColor);
    setNoteType(type); setModalVisible(true); setFabMenuOpen(false);
  };

  const handleEditNote = async (note: Note) => {
    if (note.isLocked) {
        setNoteToUnlock(note);
        setPinModalVisible(true);
        return;
    }
    setCurrentNote(note); setNoteTitle(note.title); setNoteType(note.type);
    setNoteContent(note.content); setChecklistItems(note.items || []);
    setIsLocked(note.isLocked || false); setIsPinned(note.isPinned || false);
    setNoteColor(note.color);
    setModalVisible(true);
  };

  const saveNote = useCallback(async () => {
    const isChecklistEmpty = noteType === 'checklist' && checklistItems.every(item => !item.text.trim());
    const isNoteEmpty = !noteTitle.trim() && !noteContent.trim() && isChecklistEmpty;

    if (isNoteEmpty && !currentNote) return;

    let updatedNotes: Note[];
    let noteToSave: Note;

    if (currentNote) {
      noteToSave = { ...currentNote, title: noteTitle, content: noteContent, items: checklistItems, type: noteType, isLocked, isPinned, color: noteColor };
      updatedNotes = notes.map((n) => n.id === currentNote.id ? noteToSave : n);
    } else {
      const newId = Date.now().toString();
      noteToSave = { id: newId, title: noteTitle, type: noteType, content: noteContent, items: checklistItems, color: noteColor, createdAt: new Date().toISOString(), isLocked, isPinned };
      updatedNotes = [noteToSave, ...notes];
      setCurrentNote(noteToSave);
    }

    setNotes(updatedNotes);
    await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes));
  }, [currentNote, noteTitle, noteContent, checklistItems, noteType, notes, isLocked, isPinned, noteColor]);

  useEffect(() => {
    if (!modalVisible) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => { saveNote(); }, 1500);
    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [noteTitle, noteContent, checklistItems, modalVisible, saveNote, isLocked, isPinned, noteColor]);

  const handleCloseModal = () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); saveNote(); setModalVisible(false); };

  const handleDeleteNote = () => {
    if (!currentNote) return;
    Alert.alert("Delete Note", "Are you sure?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
        const updatedNotes = notes.filter((n) => n.id !== currentNote.id);
        setNotes(updatedNotes); await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes)); setModalVisible(false);
    }}]);
  };

  const handleToggleLock = async () => {
      const savedPin = await AsyncStorage.getItem("user_pin");
      if (!savedPin) {
          setIsSettingPin(true);
          setPinModalVisible(true);
      } else {
          setIsLocked(prev => !prev);
      }
  };
  
  const handlePinSubmit = async () => {
      if (pin.length !== 4) { Alert.alert("Error", "PIN must be 4 digits."); return; }
      if (isSettingPin) {
          await AsyncStorage.setItem("user_pin", pin);
          setIsLocked(true);
          setIsSettingPin(false);
          setPinModalVisible(false);
          setPin("");
      } else if (noteToUnlock) {
          const savedPin = await AsyncStorage.getItem("user_pin");
          if (pin === savedPin) {
              setPinModalVisible(false);
              setPin("");
              handleEditNote({ ...noteToUnlock, isLocked: false });
              setNoteToUnlock(null);
          } else {
              Alert.alert("Error", "Incorrect PIN.");
              setPin("");
          }
      }
  };

  const handleUpdateChecklistItem = (id: string, newText: string) => setChecklistItems(items => items.map(item => item.id === id ? { ...item, text: newText } : item));
  const handleToggleChecklistItem = (id: string) => setChecklistItems(items => items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  const handleAddChecklistItem = () => setChecklistItems(items => [...items, { id: Date.now().toString(), text: "", completed: false }]);
  const handleDeleteChecklistItem = (id: string) => setChecklistItems(items => items.filter(item => item.id !== id));
  
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
        const query = searchQuery.toLowerCase();
        return note.title.toLowerCase().includes(query) || (note.type === 'note' && note.content.toLowerCase().includes(query)) || (note.type === 'checklist' && note.items?.some(item => item.text.toLowerCase().includes(query)));
    });
    
    const pinned = filtered.filter(n => n.isPinned);
    const unpinned = filtered.filter(n => !n.isPinned);

    switch (sortBy) {
        case 'oldest': unpinned.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
        case 'title': unpinned.sort((a, b) => a.title.localeCompare(b.title)); break;
        default: unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return [...pinned, ...unpinned];
  }, [notes, searchQuery, sortBy]);

  const handleNotePress = (note: Note) => isSelectionMode ? toggleSelection(note.id) : handleEditNote(note);
  const handleNoteLongPress = (noteId: string) => !isSelectionMode && setSelectedNotes([noteId]);
  const toggleSelection = (noteId: string) => setSelectedNotes(prev => prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]);
  
  const updateSelectedNotes = (update: Partial<Note>) => {
      const updatedNotes = notes.map(note => selectedNotes.includes(note.id) ? { ...note, ...update } : note);
      setNotes(updatedNotes);
      AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes));
      setSelectedNotes([]);
  };

  const handleTogglePinSelected = () => {
      const areAllPinned = notes.filter(n => selectedNotes.includes(n.id)).every(n => n.isPinned);
      updateSelectedNotes({ isPinned: !areAllPinned });
  };
  
  const handleToggleLockSelected = async () => {
      const savedPin = await AsyncStorage.getItem("user_pin");
      if (!savedPin) {
          Alert.alert("Set PIN First", "Please lock a single note first to set a PIN.");
          return;
      }
      const areAllLocked = notes.filter(n => selectedNotes.includes(n.id)).every(n => n.isLocked);
      updateSelectedNotes({ isLocked: !areAllLocked });
  };
  
  const handleChangeColorForSelected = (color: string) => {
      updateSelectedNotes({ color });
      setColorPickerVisible(false);
  };
  
  const handleDeleteSelected = () => {
    Alert.alert(`Delete ${selectedNotes.length} notes?`, "This is permanent.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
        const updatedNotes = notes.filter(note => !selectedNotes.includes(note.id));
        setNotes(updatedNotes); await AsyncStorage.setItem("userNotes", JSON.stringify(updatedNotes)); setSelectedNotes([]);
    }}]);
  };

  const textFabStyle = { transform: [{ scale: fabAnimation }, { translateY: fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, -moderateScale(70)], }), },], opacity: fabAnimation };
  const checklistFabStyle = { transform: [{ scale: fabAnimation }, { translateY: fabAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, -moderateScale(130)], }), },], opacity: fabAnimation };
  const sortDropdownStyle = { opacity: sortMenuAnimation, transform: [{ translateY: sortMenuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-10, 0], }), },] };
  
  const leftColumnNotes = useMemo(() => filteredAndSortedNotes.filter((_, index) => index % 2 === 0), [filteredAndSortedNotes]);
  const rightColumnNotes = useMemo(() => filteredAndSortedNotes.filter((_, index) => index % 2 !== 0), [filteredAndSortedNotes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isSelectionMode ? (
            <View style={styles.selectionHeaderContainer}>
                <TouchableOpacity onPress={() => setSelectedNotes([])} style={styles.headerButton}><Ionicons name="close" size={moderateScale(28)} color="#AEAEB2" /></TouchableOpacity>
                <Text style={styles.selectionHeaderText}>{selectedNotes.length} selected</Text>
                {/* --- UPDATED ICON --- */}
                <TouchableOpacity onPress={handleTogglePinSelected} style={styles.headerButton}><Ionicons name="pricetag-outline" size={moderateScale(24)} color="#AEAEB2" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setColorPickerVisible(true)} style={styles.headerButton}><Ionicons name="color-palette-outline" size={moderateScale(24)} color="#AEAEB2" /></TouchableOpacity>
                <TouchableOpacity onPress={handleToggleLockSelected} style={styles.headerButton}><Ionicons name="lock-closed-outline" size={moderateScale(24)} color="#AEAEB2" /></TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteSelected} style={styles.headerButton}><Ionicons name="trash-outline" size={moderateScale(24)} color="#ff6b6b" /></TouchableOpacity>
            </View>
        ) : (
            <View style={styles.headerContainer}><Text style={styles.heading}>My Notes</Text></View>
        )}

        <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={moderateScale(20)} color="#8A8A8E" style={styles.searchIcon} />
                <TextInput style={styles.searchInput} placeholder="Search your notes..." placeholderTextColor="#8A8A8E" value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setSortMenuVisible(false)} />
                <TouchableOpacity onPress={() => setLayout(prev => prev === 'grid' ? 'list' : 'grid')} style={styles.toolbarIconTouchable}><Ionicons name={layout === 'grid' ? "grid-outline" : "list-outline"} size={moderateScale(22)} color="#AEAEB2" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setSortMenuVisible(v => !v)} style={styles.toolbarIconTouchable}><Ionicons name="swap-vertical" size={moderateScale(22)} color="#AEAEB2" /></TouchableOpacity>
            </View>

            {isSortMenuVisible && (
                <Animated.View style={[styles.sortDropdown, sortDropdownStyle]}>
                    <TouchableOpacity style={styles.sortOption} onPress={() => { setSortBy('newest'); setSortMenuVisible(false); }}><Text style={[styles.sortOptionText, sortBy === 'newest' && styles.sortOptionTextActive]}>Newest</Text>{sortBy === 'newest' && <Ionicons name="checkmark" size={moderateScale(18)} color="#007AFF" />}</TouchableOpacity>
                    <TouchableOpacity style={styles.sortOption} onPress={() => { setSortBy('oldest'); setSortMenuVisible(false); }}><Text style={[styles.sortOptionText, sortBy === 'oldest' && styles.sortOptionTextActive]}>Oldest</Text>{sortBy === 'oldest' && <Ionicons name="checkmark" size={moderateScale(18)} color="#007AFF" />}</TouchableOpacity>
                    <TouchableOpacity style={styles.sortOption} onPress={() => { setSortBy('title'); setSortMenuVisible(false); }}><Text style={[styles.sortOptionText, sortBy === 'title' && styles.sortOptionTextActive]}>Title (A-Z)</Text>{sortBy === 'title' && <Ionicons name="checkmark" size={moderateScale(18)} color="#007AFF" />}</TouchableOpacity>
                </Animated.View>
            )}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 80 }} onScrollBeginDrag={() => setSortMenuVisible(false)} keyboardShouldPersistTaps="handled">
          {filteredAndSortedNotes.length === 0 ? (<View style={styles.emptyContainer}><Text style={styles.emptyText}>{searchQuery ? "No notes found." : "No notes yet. Tap the '+' to add one!"}</Text></View>) : 
            layout === 'grid' ? (
                <View style={styles.notesGridContainer}>
                    <View style={styles.column}>{leftColumnNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} />)}</View>
                    <View style={styles.column}>{rightColumnNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} />)}</View>
                </View>
            ) : (<View>{filteredAndSortedNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} />)}</View>)
          }
        </ScrollView>
        
        {!isSelectionMode && (
            <>
                {isFabMenuOpen && (<TouchableOpacity style={styles.fabBackdrop} activeOpacity={1} onPress={() => setFabMenuOpen(false)} />)}
                <Animated.View style={[styles.secondaryFabContainer, textFabStyle]}><Text style={styles.fabLabel}>Text</Text><TouchableOpacity style={styles.secondaryFab} onPress={() => handleCreateNewNote('note')}><Ionicons name="document-text-outline" size={moderateScale(24)} color="#0b111d" /></TouchableOpacity></Animated.View>
                <Animated.View style={[styles.secondaryFabContainer, checklistFabStyle]}><Text style={styles.fabLabel}>List</Text><TouchableOpacity style={styles.secondaryFab} onPress={() => handleCreateNewNote('checklist')}><Ionicons name="list-outline" size={moderateScale(24)} color="#0b111d" /></TouchableOpacity></Animated.View>
                <TouchableOpacity style={styles.fab} onPress={() => setFabMenuOpen(!isFabMenuOpen)}><Ionicons name={isFabMenuOpen ? "close" : "add"} size={moderateScale(32)} color="white" /></TouchableOpacity>
            </>
        )}

        <Modal visible={modalVisible} animationType="slide" onRequestClose={handleCloseModal}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.headerButton}><Ionicons name="arrow-back" size={moderateScale(28)} color="#007AFF" /></TouchableOpacity>
              <View style={{ flex: 1 }} />
              {currentNote && (<TouchableOpacity onPress={handleDeleteNote} style={styles.headerButton}><Ionicons name="trash-outline" size={moderateScale(28)} color="#ff6b6b" /></TouchableOpacity>)}
            </View>

            <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
              <TextInput placeholder="Title" placeholderTextColor="#999" style={[styles.modalInputTitle, {backgroundColor: noteColor}]} value={noteTitle} onChangeText={setNoteTitle} />
              {noteType === 'note' ? (<TextInput placeholder="Take a note..." placeholderTextColor="#888" style={styles.modalInputContent} value={noteContent} onChangeText={setNoteContent} multiline autoFocus={currentNote === null} />) : 
                (<View style={styles.checklistContainer}>
                    {checklistItems.map((item, index) => (<View key={item.id} style={styles.checklistItem}><TouchableOpacity onPress={() => handleToggleChecklistItem(item.id)}><Ionicons name={item.completed ? "checkbox" : "square-outline"} size={moderateScale(24)} color={item.completed ? "#8be9fd" : "#f1fa8c"} /></TouchableOpacity><TextInput placeholder="List item" placeholderTextColor="#666" style={[styles.checklistItemInput, item.completed && styles.checklistItemCompleted]} value={item.text} onChangeText={(text) => handleUpdateChecklistItem(item.id, text)} autoFocus={index === checklistItems.length - 1 && !item.text} /><TouchableOpacity onPress={() => handleDeleteChecklistItem(item.id)}><Ionicons name="close-circle-outline" size={moderateScale(22)} color="#555" /></TouchableOpacity></View>))}
                    <TouchableOpacity style={styles.addChecklistItemButton} onPress={handleAddChecklistItem}><Ionicons name="add" size={moderateScale(20)} color="#007AFF" /><Text style={styles.addChecklistItemText}>Add Item</Text></TouchableOpacity>
                </View>)
              }
            </ScrollView>
            <View style={styles.modalFooter}>
                {/* --- UPDATED ICON --- */}
                <TouchableOpacity onPress={() => setIsPinned(p => !p)} style={styles.footerButton}><Ionicons name={isPinned ? "pricetag" : "pricetag-outline"} size={moderateScale(24)} color={isPinned ? "#007AFF" : "#AEAEB2"} /></TouchableOpacity>
                <TouchableOpacity onPress={handleToggleLock} style={styles.footerButton}><Ionicons name={isLocked ? "lock-closed" : "lock-open-outline"} size={moderateScale(24)} color={isLocked ? "#ff6b6b" : "#AEAEB2"} /></TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{alignItems: 'center'}}>{noteColors.map(color => <TouchableOpacity key={color} style={[styles.colorOption, {backgroundColor: color}, noteColor === color && styles.colorOptionSelected]} onPress={() => setNoteColor(color)} />)}</ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
        
        <Modal visible={isPinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
            <View style={styles.pinModalBackdrop}>
                <View style={styles.pinModalContainer}>
                    <Text style={styles.pinModalTitle}>{isSettingPin ? "Set a 4-Digit PIN" : "Enter PIN"}</Text>
                    <TextInput style={styles.pinInput} value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={4} secureTextEntry autoFocus />
                    <TouchableOpacity style={styles.pinSubmitButton} onPress={handlePinSubmit}><Text style={styles.pinSubmitButtonText}>Submit</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>

        <Modal visible={isColorPickerVisible} transparent animationType="fade" onRequestClose={() => setColorPickerVisible(false)}>
            <TouchableOpacity style={styles.pinModalBackdrop} activeOpacity={1} onPress={() => setColorPickerVisible(false)}>
                <View style={styles.colorPickerContainer}>
                    {noteColors.map(color => <TouchableOpacity key={color} style={[styles.colorOption, {backgroundColor: color, margin: 8, width: 40, height: 40, borderRadius: 20}]} onPress={() => handleChangeColorForSelected(color)} />)}
                </View>
            </TouchableOpacity>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const NoteCard = ({ note, layout, selectedNotes, handleNotePress, handleNoteLongPress }: { note: Note; layout: 'grid' | 'list'; selectedNotes: string[]; handleNotePress: (note: Note) => void; handleNoteLongPress: (noteId: string) => void; }) => {
    const isSelected = selectedNotes.includes(note.id);
    return (
        <TouchableOpacity style={[styles.noteCard, { backgroundColor: note.color }, layout === 'list' && styles.noteCardList, isSelected && styles.noteCardSelected]} onPress={() => handleNotePress(note)} onLongPress={() => handleNoteLongPress(note.id)}>
            {isSelected && (<View style={styles.selectionOverlay}><Ionicons name="checkmark-circle" size={moderateScale(24)} color="#fff" /></View>)}
            {note.isLocked ? <View style={styles.lockedNoteOverlay}><Ionicons name="lock-closed" size={moderateScale(40)} color="rgba(255,255,255,0.7)" /></View> :
            <>
                {note.title ? (<Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>) : null}
                {note.type === 'note' ? (<Text style={styles.noteContent} numberOfLines={layout === 'grid' ? 10 : 3}>{note.content}</Text>) : 
                (<View>{note.items?.slice(0, 5).map(item => (<View key={item.id} style={styles.checklistItemPreview}><Ionicons name={item.completed ? "checkbox" : "square-outline"} size={moderateScale(16)} color={item.completed ? "#8be9fd" : "#f1fa8c"} /><Text style={[styles.checklistItemPreviewText, item.completed && styles.checklistItemCompleted]}>{item.text}</Text></View>))}
                {(note.items?.length || 0) > 5 && <Text style={styles.moreItemsText}>...and more</Text>}</View>)}
                <View style={styles.noteCardFooter}>
                    {/* --- UPDATED ICON --- */}
                    {note.isPinned && <Ionicons name="pricetag" size={moderateScale(14)} color="#E5E5EA" />}
                </View>
            </>
            }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b111d" },
  container: { flex: 1, paddingHorizontal: scale(15) },
  headerContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === "android" ? 40 : 20, marginBottom: 15, height: 56 },
  selectionHeaderContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: Platform.OS === "android" ? 40 : 20, marginBottom: 15, height: 56, paddingHorizontal: 5 },
  selectionHeaderText: { fontSize: moderateScale(18), fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginLeft: 15 },
  heading: { fontSize: moderateScale(32, 0.4), fontWeight: "bold", color: "#FFFFFF", textAlign: 'left' },
  searchWrapper: { position: 'relative', zIndex: 10, marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 10 },
  searchIcon: { paddingLeft: 12 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: moderateScale(16), paddingVertical: 12, paddingHorizontal: 10 },
  toolbarIconTouchable: { padding: 12 },
  sortDropdown: { position: 'absolute', top: 55, right: 0, backgroundColor: '#2C2C2E', borderRadius: 8, width: 150, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' },
  sortOptionText: { color: '#E5E5EA', fontSize: moderateScale(14) },
  sortOptionTextActive: { color: '#007AFF', fontWeight: 'bold' },
  notesGridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { width: '48.5%' },
  noteCard: { width: "100%", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 2, borderColor: "transparent", maxHeight: 280 },
  noteCardList: { width: '100%', marginBottom: 15, maxHeight: 180 },
  noteCardSelected: { borderColor: '#007AFF' },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 122, 255, 0.2)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  lockedNoteOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  noteTitle: { fontSize: moderateScale(16), fontWeight: "bold", color: "#fff", marginBottom: 8 },
  noteContent: { fontSize: moderateScale(14), color: "#ddd", lineHeight: 20 },
  noteCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, gap: 8 },
  emptyContainer: { width: '100%', marginTop: 50, alignItems: 'center' },
  emptyText: { color: "#888", fontSize: moderateScale(16), textAlign: "center" },
  fab: { position: "absolute", width: 60, height: 60, alignItems: "center", justifyContent: "center", right: 20, bottom: 30, backgroundColor: "#007AFF", borderRadius: 30, elevation: 8, zIndex: 10 },
  modalContainer: { flex: 1, backgroundColor: "#080d15ff" },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#333" },
  headerButton: { padding: 8 },
  modalInputTitle: { fontSize: moderateScale(24), fontWeight: "bold", color: "#fff", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  modalInputContent: { fontSize: moderateScale(18), color: "#ddd", flex: 1, textAlignVertical: "top", paddingHorizontal: 20, paddingTop: 15, lineHeight: 26 },
  checklistContainer: { paddingHorizontal: 20 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checklistItemInput: { flex: 1, color: '#fff', fontSize: moderateScale(16), marginLeft: 12, marginRight: 8 },
  checklistItemCompleted: { textDecorationLine: 'line-through', color: '#666' },
  addChecklistItemButton: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 10 },
  addChecklistItemText: { color: '#007AFF', fontSize: moderateScale(16), marginLeft: 10 },
  checklistItemPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  checklistItemPreviewText: { color: '#f8f8f2', fontSize: moderateScale(13), marginLeft: 8 },
  moreItemsText: { color: '#bd93f9', fontSize: moderateScale(12), fontStyle: 'italic', marginTop: 4 },
  fabBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  secondaryFabContainer: { position: 'absolute', right: 20, bottom: 30, alignItems: 'center', flexDirection: 'row' },
  secondaryFab: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f8f8f2', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  fabLabel: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 10, fontSize: 12 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#1C1C1E' },
  footerButton: { padding: 10 },
  colorOption: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 5, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#fff' },
  pinModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  pinModalContainer: { width: '80%', backgroundColor: '#2C2C2E', borderRadius: 14, padding: 20, alignItems: 'center' },
  pinModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  pinInput: { backgroundColor: '#3A3A3C', color: '#fff', fontSize: 22, textAlign: 'center', borderRadius: 8, padding: 10, width: '80%', marginBottom: 20, letterSpacing: 10 },
  pinSubmitButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, width: '80%', alignItems: 'center' },
  pinSubmitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  colorPickerContainer: { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
