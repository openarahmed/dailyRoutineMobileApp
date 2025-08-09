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
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

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

const NoteCard = ({ note, layout, selectedNotes, handleNotePress, handleNoteLongPress, colors }: { note: Note; layout: 'grid' | 'list'; selectedNotes: string[]; handleNotePress: (note: Note) => void; handleNoteLongPress: (noteId: string) => void; colors: any; }) => {
    const isSelected = selectedNotes.includes(note.id);
    return (
        <TouchableOpacity 
            style={[
                styles.noteCard, 
                { backgroundColor: note.color }, 
                layout === 'list' && styles.noteCardList, 
                isSelected && { borderColor: colors.notesCardSelectedBorder }
            ]} 
            onPress={() => handleNotePress(note)} 
            onLongPress={() => handleNoteLongPress(note.id)}
        >
            {isSelected && (<View style={[styles.selectionOverlay, { backgroundColor: colors.notesSelectionOverlay }]}><Ionicons name="checkmark-circle" size={moderateScale(24)} color={colors.notesFabIcon} /></View>)}
            {note.isLocked ? <View style={[styles.lockedNoteOverlay, { backgroundColor: colors.notesLockedOverlayBg }]}><Ionicons name="lock-closed" size={moderateScale(40)} color={colors.notesFabIcon} /></View> :
            <>
                {note.title ? (<Text style={[styles.noteTitle, { color: colors.notesModalInputTitle }]} numberOfLines={2}>{note.title}</Text>) : null}
                {note.type === 'note' ? (<Text style={[styles.noteContent, { color: colors.notesModalInputContent }]} numberOfLines={layout === 'grid' ? 10 : 3}>{note.content}</Text>) : 
                (<View>
                    {note.items?.slice(0, 5).map(item => (<View key={item.id} style={styles.checklistItemPreview}>
                        <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={moderateScale(16)} color={item.completed ? colors.notesChecklistItemCompleted : colors.notesChecklistItemText} />
                        <Text style={[styles.checklistItemPreviewText, { color: colors.notesChecklistItemText }, item.completed && { textDecorationLine: 'line-through', color: colors.notesChecklistItemCompleted }]}>{item.text}</Text>
                    </View>))}
                    {(note.items?.length || 0) > 5 && <Text style={[styles.moreItemsText, { color: colors.notesMoreItemsText }]}>...and more</Text>}
                </View>)}
                <View style={styles.noteCardFooter}>
                    {note.isPinned && <Ionicons name="pricetag" size={moderateScale(14)} color={colors.notesFooterIcon} />}
                </View>
            </>
            }
        </TouchableOpacity>
    );
};

export default function NotesScreen() {
    const { colors, themeName } = useTheme();
    const [notes, setNotes] = useState<Note[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [isFabMenuOpen, setFabMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [isSortMenuVisible, setSortMenuVisible] = useState(false);
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteType, setNoteType] = useState<'note' | 'checklist'>('note');
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [isLocked, setIsLocked] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [noteColor, setNoteColor] = useState(colors.noteColors[0]);
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
        const newColor = colors.noteColors && colors.noteColors[Math.floor(Math.random() * colors.noteColors.length)];
        setCurrentNote(null); setNoteTitle(""); setNoteContent(""); setChecklistItems([]);
        setIsLocked(false); setIsPinned(false); setNoteColor(newColor || '#FFFFFF');
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.notesBackground }]}>
            <View style={styles.container}>
                {isSelectionMode ? (
                    <View style={[styles.selectionHeaderContainer, { backgroundColor: colors.notesBackground }]}>
                        <TouchableOpacity onPress={() => setSelectedNotes([])} style={styles.headerButton}>
                            <Ionicons name="close" size={moderateScale(28)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                        <Text style={[styles.selectionHeaderText, { color: colors.notesHeader, marginLeft: scale(15) }]}>{selectedNotes.length} selected</Text>
                        <TouchableOpacity onPress={handleTogglePinSelected} style={styles.headerButton}>
                            <Ionicons name="pricetag-outline" size={moderateScale(24)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setColorPickerVisible(true)} style={styles.headerButton}>
                            <Ionicons name="color-palette-outline" size={moderateScale(24)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleToggleLockSelected} style={styles.headerButton}>
                            <Ionicons name="lock-closed-outline" size={moderateScale(24)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteSelected} style={styles.headerButton}>
                            <Ionicons name="trash-outline" size={moderateScale(24)} color={colors.deleteIconColor} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.headerContainer, { backgroundColor: colors.notesBackground }]}>
                        <Text style={[styles.heading, { color: colors.notesHeader }]}>My Notes</Text>
                    </View>
                )}

                <View style={[styles.searchWrapper, { backgroundColor: colors.notesBackground }]}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.notesSearchBg }]}>
                        <Ionicons name="search" size={moderateScale(20)} color={colors.notesSearchIcon} style={styles.searchIcon} />
                        <TextInput style={[styles.searchInput, { color: colors.notesSearchText, borderColor: colors.notesSearchBg }]} placeholder="Search your notes..." placeholderTextColor={colors.notesPlaceholder} value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setSortMenuVisible(false)} />
                        <TouchableOpacity onPress={() => setLayout(prev => prev === 'grid' ? 'list' : 'grid')} style={styles.toolbarIconTouchable}>
                            <Ionicons name={layout === 'grid' ? "grid-outline" : "list-outline"} size={moderateScale(22)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSortMenuVisible(v => !v)} style={styles.toolbarIconTouchable}>
                            <Ionicons name="swap-vertical" size={moderateScale(22)} color={colors.notesSearchIcon} />
                        </TouchableOpacity>
                    </View>

                    {isSortMenuVisible && (
                        <Animated.View style={[styles.sortDropdown, { backgroundColor: colors.notesSortDropdownBg, borderColor: colors.notesSortDropdownBorder }, sortDropdownStyle]}>
                            <TouchableOpacity style={[styles.sortOption, { borderBottomColor: colors.notesSortDropdownBorder }]} onPress={() => { setSortBy('newest'); setSortMenuVisible(false); }}>
                                <Text style={[styles.sortOptionText, { color: sortBy === 'newest' ? colors.notesSortDropdownActiveText : colors.notesSortDropdownText }, sortBy === 'newest' && styles.sortOptionTextActive]}>Newest</Text>
                                {sortBy === 'newest' && <Ionicons name="checkmark" size={moderateScale(18)} color={colors.notesSortDropdownActiveText} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.sortOption, { borderBottomColor: colors.notesSortDropdownBorder }]} onPress={() => { setSortBy('oldest'); setSortMenuVisible(false); }}>
                                <Text style={[styles.sortOptionText, { color: sortBy === 'oldest' ? colors.notesSortDropdownActiveText : colors.notesSortDropdownText }, sortBy === 'oldest' && styles.sortOptionTextActive]}>Oldest</Text>
                                {sortBy === 'oldest' && <Ionicons name="checkmark" size={moderateScale(18)} color={colors.notesSortDropdownActiveText} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sortOption} onPress={() => { setSortBy('title'); setSortMenuVisible(false); }}>
                                <Text style={[styles.sortOptionText, { color: sortBy === 'title' ? colors.notesSortDropdownActiveText : colors.notesSortDropdownText }, sortBy === 'title' && styles.sortOptionTextActive]}>Title (A-Z)</Text>
                                {sortBy === 'title' && <Ionicons name="checkmark" size={moderateScale(18)} color={colors.notesSortDropdownActiveText} />}
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>

                <ScrollView contentContainerStyle={[styles.notesScroll, { paddingBottom: verticalScale(80), backgroundColor: colors.notesBackground }]} onScrollBeginDrag={() => setSortMenuVisible(false)} keyboardShouldPersistTaps="handled">
                    {filteredAndSortedNotes.length === 0 ? (<View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: colors.notesEmptyText }]}>{searchQuery ? "No notes found." : "No notes yet. Tap the '+' to add one!"}</Text></View>) : 
                        layout === 'grid' ? (
                            <View style={[styles.notesGridContainer, { backgroundColor: colors.notesGridColumnBg }]}>
                                <View style={styles.column}>{leftColumnNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} colors={colors} />)}</View>
                                <View style={styles.column}>{rightColumnNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} colors={colors} />)}</View>
                            </View>
                        ) : (<View>{filteredAndSortedNotes.map(note => <NoteCard key={note.id} note={note} layout={layout} selectedNotes={selectedNotes} handleNotePress={handleNotePress} handleNoteLongPress={handleNoteLongPress} colors={colors} />)}</View>)
                    }
                </ScrollView>
                
                {!isSelectionMode && (
                    <>
                        {isFabMenuOpen && (<TouchableOpacity style={styles.fabBackdrop} activeOpacity={1} onPress={() => setFabMenuOpen(false)} />)}
                        <Animated.View style={[styles.secondaryFabContainer, textFabStyle]}>
                            <Text style={[styles.fabLabel, { backgroundColor: colors.notesFabLabelBg, color: colors.notesFabLabelText }]}>Text</Text>
                            <TouchableOpacity style={[styles.secondaryFab, { backgroundColor: colors.notesFabIcon }]} onPress={() => handleCreateNewNote('note')}>
                                <Ionicons name="document-text-outline" size={moderateScale(24)} color={colors.notesBackground} />
                            </TouchableOpacity>
                        </Animated.View>
                        <Animated.View style={[styles.secondaryFabContainer, checklistFabStyle]}>
                            <Text style={[styles.fabLabel, { backgroundColor: colors.notesFabLabelBg, color: colors.notesFabLabelText }]}>List</Text>
                            <TouchableOpacity style={[styles.secondaryFab, { backgroundColor: colors.notesFabIcon }]} onPress={() => handleCreateNewNote('checklist')}>
                                <Ionicons name="list-outline" size={moderateScale(24)} color={colors.notesBackground} />
                            </TouchableOpacity>
                        </Animated.View>
                        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.notesFabBg }]} onPress={() => setFabMenuOpen(!isFabMenuOpen)}>
                            <Ionicons name={isFabMenuOpen ? "close" : "add"} size={moderateScale(32)} color={colors.notesFabIcon} />
                        </TouchableOpacity>
                    </>
                )}

                <Modal visible={modalVisible} animationType="slide" onRequestClose={handleCloseModal}>
                    <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.notesModalBg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.notesSortDropdownBorder }]}>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.headerButton}>
                                <Ionicons name="arrow-back" size={moderateScale(28)} color={colors.notesFooterIconActive} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }} />
                            {currentNote && (<TouchableOpacity onPress={handleDeleteNote} style={styles.headerButton}>
                                <Ionicons name="trash-outline" size={moderateScale(28)} color={colors.deleteIconColor} />
                            </TouchableOpacity>)}
                        </View>
                        <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
                            <TextInput placeholder="Title" placeholderTextColor={colors.notesModalInputPlaceholder} style={[styles.modalInputTitle, { backgroundColor: colors.notesModalInputTitleBg, color: colors.notesModalInputTitle }]} value={noteTitle} onChangeText={setNoteTitle} />
                            {noteType === 'note' ? (<TextInput placeholder="Take a note..." placeholderTextColor={colors.notesModalInputPlaceholder} style={[styles.modalInputContent, { color: colors.notesModalInputContent }]} value={noteContent} onChangeText={setNoteContent} multiline autoFocus={currentNote === null} />) : 
                                (<View style={styles.checklistContainer}>
                                    {checklistItems.map((item, index) => (<View key={item.id} style={styles.checklistItem}>
                                        <TouchableOpacity onPress={() => handleToggleChecklistItem(item.id)}>
                                            <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={moderateScale(24)} color={item.completed ? colors.notesChecklistItemCompleted : colors.notesChecklistItemText} />
                                        </TouchableOpacity>
                                        <TextInput placeholder="List item" placeholderTextColor={colors.notesModalInputPlaceholder} style={[styles.checklistItemInput, { color: colors.notesChecklistItemText }, item.completed && { textDecorationLine: 'line-through', color: colors.notesChecklistItemCompleted }]} value={item.text} onChangeText={(text) => handleUpdateChecklistItem(item.id, text)} autoFocus={index === checklistItems.length - 1 && !item.text} />
                                        <TouchableOpacity onPress={() => handleDeleteChecklistItem(item.id)}>
                                            <Ionicons name="close-circle-outline" size={moderateScale(22)} color={colors.notesFooterIcon} />
                                        </TouchableOpacity>
                                    </View>))}
                                    <TouchableOpacity style={styles.addChecklistItemButton} onPress={handleAddChecklistItem}>
                                        <Ionicons name="add" size={moderateScale(20)} color={colors.notesAddChecklistItemText} />
                                        <Text style={[styles.addChecklistItemText, { color: colors.notesAddChecklistItemText }]}>Add Item</Text>
                                    </TouchableOpacity>
                                </View>)
                            }
                        </ScrollView>
                        <View style={[styles.modalFooter, { backgroundColor: colors.notesFooterBg, borderTopColor: colors.notesSortDropdownBorder }]}>
                            <TouchableOpacity onPress={() => setIsPinned(p => !p)} style={styles.footerButton}>
                                <Ionicons name={isPinned ? "pricetag" : "pricetag-outline"} size={moderateScale(24)} color={isPinned ? colors.notesFooterIconActive : colors.notesFooterIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleToggleLock} style={styles.footerButton}>
                                <Ionicons name={isLocked ? "lock-closed" : "lock-open-outline"} size={moderateScale(24)} color={isLocked ? colors.deleteIconColor : colors.notesFooterIcon} />
                            </TouchableOpacity>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{alignItems: 'center'}}>
                                {colors.noteColors && colors.noteColors.map(color => <TouchableOpacity key={color} style={[styles.colorOption, {backgroundColor: color}, noteColor === color && { borderColor: colors.notesColorOptionSelected }]} onPress={() => setNoteColor(color)} />)}
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </Modal>
                <Modal visible={isPinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
                    <View style={[styles.pinModalBackdrop, { backgroundColor: colors.notesLockedOverlayBg }]}>
                        <View style={[styles.pinModalContainer, { backgroundColor: colors.notesSortDropdownBg }]}>
                            <Text style={[styles.pinModalTitle, { color: colors.notesHeader }]}>{isSettingPin ? "Set a 4-Digit PIN" : "Enter PIN"}</Text>
                            <TextInput style={[styles.pinInput, { backgroundColor: colors.notesSearchBg, color: colors.notesModalInput }]} value={pin} onChangeText={setPin} keyboardType="number-pad" maxLength={4} secureTextEntry autoFocus />
                            <TouchableOpacity style={[styles.pinSubmitButton, { backgroundColor: colors.notesFooterIconActive }]} onPress={handlePinSubmit}>
                                <Text style={[styles.pinSubmitButtonText, { color: colors.notesFabIcon }]}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                <Modal visible={isColorPickerVisible} transparent animationType="fade" onRequestClose={() => setColorPickerVisible(false)}>
                    <TouchableOpacity style={[styles.pinModalBackdrop, { backgroundColor: colors.notesLockedOverlayBg }]} activeOpacity={1} onPress={() => setColorPickerVisible(false)}>
                        <View style={[styles.colorPickerContainer, { backgroundColor: colors.notesSortDropdownBg }]}>
                            {colors.noteColors && colors.noteColors.map(color => <TouchableOpacity key={color} style={[styles.colorOption, {backgroundColor: color, margin: 8, width: 40, height: 40, borderRadius: 20}, noteColor === color && { borderColor: colors.notesColorOptionSelected }]} onPress={() => handleChangeColorForSelected(color)} />)}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, paddingHorizontal: scale(15) },
    headerContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20), marginBottom: verticalScale(15), height: verticalScale(56) },
    selectionHeaderContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(20), marginBottom: verticalScale(15), height: verticalScale(56), paddingHorizontal: scale(5) },
    selectionHeaderText: { fontSize: moderateScale(18), fontWeight: 'bold', flex: 1, marginLeft: scale(15) },
    heading: { fontSize: moderateScale(32, 0.4), fontWeight: "bold", textAlign: 'left' },
    searchWrapper: { position: 'relative', zIndex: 10, marginBottom: verticalScale(20) },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: moderateScale(10) },
    searchIcon: { paddingLeft: scale(12) },
    searchInput: { flex: 1, fontSize: moderateScale(16), paddingVertical: verticalScale(12), paddingHorizontal: scale(10), borderWidth: 2, borderColor: 'transparent' },
    toolbarIconTouchable: { padding: moderateScale(12) },
    sortDropdown: { position: 'absolute', top: verticalScale(55), right: 0, borderRadius: moderateScale(8), width: scale(150), elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, borderWidth: 1 },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(12), paddingHorizontal: scale(15), borderBottomWidth: 1 },
    sortOptionText: { fontSize: moderateScale(14) },
    sortOptionTextActive: { fontWeight: 'bold' },
    notesGridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    column: { width: '48.5%' },
    noteCard: { width: "100%", padding: moderateScale(15), borderRadius: moderateScale(12), marginBottom: verticalScale(15), borderWidth: 2, borderColor: "transparent", maxHeight: verticalScale(280) },
    noteCardList: { width: '100%', marginBottom: verticalScale(15), maxHeight: verticalScale(180) },
    noteCardSelected: { borderColor: '#007AFF' },
    selectionOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: moderateScale(10), justifyContent: 'center', alignItems: 'center' },
    lockedNoteOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: moderateScale(10), justifyContent: 'center', alignItems: 'center' },
    noteTitle: { fontSize: moderateScale(16), fontWeight: "bold", marginBottom: verticalScale(8) },
    noteContent: { fontSize: moderateScale(14), lineHeight: moderateScale(20) },
    noteCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: verticalScale(8), gap: scale(8) },
    emptyContainer: { width: '100%', marginTop: verticalScale(50), alignItems: 'center' },
    emptyText: { fontSize: moderateScale(16), textAlign: "center" },
    fab: { position: "absolute", width: moderateScale(60), height: moderateScale(60), alignItems: "center", justifyContent: "center", right: scale(20), bottom: verticalScale(30), borderRadius: moderateScale(30), elevation: 8, zIndex: 10 },
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: scale(10), paddingVertical: verticalScale(10), borderBottomWidth: 1 },
    headerButton: { padding: moderateScale(8) },
    modalInputTitle: { fontSize: moderateScale(24), fontWeight: "bold", paddingHorizontal: scale(20), paddingTop: verticalScale(20), paddingBottom: verticalScale(10) },
    modalInputContent: { fontSize: moderateScale(18), flex: 1, textAlignVertical: "top", paddingHorizontal: scale(20), paddingTop: verticalScale(15), lineHeight: moderateScale(26) },
    checklistContainer: { paddingHorizontal: scale(20) },
    checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(8) },
    checklistItemInput: { flex: 1, fontSize: moderateScale(16), marginLeft: scale(12), marginRight: scale(8), borderWidth: 0, paddingVertical: 0 },
    checklistItemPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(4) },
    checklistItemPreviewText: { fontSize: moderateScale(13), marginLeft: scale(8) },
    moreItemsText: { fontSize: moderateScale(12), fontStyle: 'italic', marginTop: verticalScale(4) },
    fabBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    secondaryFabContainer: { position: 'absolute', right: scale(20), bottom: verticalScale(30), alignItems: 'center', flexDirection: 'row' },
    secondaryFab: { width: moderateScale(48), height: moderateScale(48), borderRadius: moderateScale(24), justifyContent: 'center', alignItems: 'center', marginLeft: scale(10) },
    fabLabel: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: scale(8), paddingVertical: verticalScale(4), borderRadius: moderateScale(4), marginRight: scale(10), fontSize: moderateScale(12) },
    modalFooter: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(10), borderTopWidth: 1 },
    footerButton: { padding: moderateScale(10) },
    colorOption: { width: moderateScale(28), height: moderateScale(28), borderRadius: moderateScale(14), marginHorizontal: scale(5), borderWidth: 2, borderColor: 'transparent' },
    colorOptionSelected: { borderColor: '#fff' },
    pinModalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pinModalContainer: { width: '80%', borderRadius: moderateScale(14), padding: moderateScale(20), alignItems: 'center', borderWidth: 1 },
    pinModalTitle: { fontSize: moderateScale(18), fontWeight: 'bold', marginBottom: verticalScale(15) },
    pinInput: { fontSize: moderateScale(22), textAlign: 'center', borderRadius: moderateScale(8), padding: moderateScale(10), width: '80%', marginBottom: verticalScale(20), letterSpacing: 10, borderWidth: 1 },
    pinSubmitButton: { paddingVertical: verticalScale(12), borderRadius: moderateScale(8), width: '80%', alignItems: 'center' },
    pinSubmitButtonText: { fontWeight: 'bold', fontSize: moderateScale(16) },
    colorPickerContainer: { backgroundColor: '#2C2C2E', borderRadius: moderateScale(14), padding: moderateScale(10), flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});