import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

// তোমার আগের themes অবজেক্ট এখানে অপরিবর্তিত রেখেছি
// Paste this entire object into your ThemeContext.js

export const themes = {
  // =================================================================
  // 🎨 LIGHT THEME (Clean, Soft & Approachable)
  // =================================================================
  light: {
    // --- Existing Non-Notes Keys (Untouched) ---
    backgroundColor: '#f7f9fb',
    routineTitleColor: '#007AFF',
    textColor: '#000000',
    accentColor: '#007AFF',
    tabBarColor: '#ffffff',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#ffffffff',
    headerBackground: '#ffffff',
    headerText: '#000000',
    coinContainerBg: 'rgba(0, 0, 0, 0.05)',
       weekDayButtonBorder: '#FADADD', // ✨ নিশ্চিত করুন এই কী-টির নাম ঠিক আছে

    coinText: '#000000',
       statusInfoText: '#333333',          // সাধারণ টেক্সটের জন্য (Next:, No current task)
    statusIconBg: '#DEF7EC',            // আইকনের পেছনের হালকা সবুজ রঙ
    statusIconColor: '#10B981',  
    statusCardBg: '#f1f0f0ff',
    statusCardBorder: 'rgba(0,0,0,0.1)',
    statusCardGradient: ['#ffffffff', '#ffffffff'],
    statusText: '#4A4A4A',
    fabBg: '#007AFF',
    unselectedTopBg: '#ffffffff',
    unselectedBottomBg: '#ffffffff',
    selectedTopBg: '#066cdaff',
    selectedBottomBg: '#066cdaff',
    selectedText: '#FFFFFF',
    unselectedDayNameText: '#666666',
    unselectedDayNumberText: '#000000',
    dividerShadowColor: 'rgba(0, 0, 0, 0.2)',
    timeBlockCardBg: '#f7f9fb',
    cardBorderColor: 'rgba(0,0,0,0.1)',
    timeBlockIcon: '#666666',
    timeBlockTitleText: '#000000',
    sessionItemBg: '#ffffffb9',
    sessionItemBorder: 'rgba(0,0,0,0.1)',
    sessionItemCompletedBg: 'rgba(0, 122, 255, 0.1)',
    sessionItemCompletedBorder: 'rgba(0, 122, 255, 0.2)',
    sessionTimeText: '#888888',
    sessionTimeTextCompleted: '#888888',
    sessionText: '#000000',
    sessionTextCompleted: '#888888',
    taskIconContainerBg: 'rgba(0, 0, 0, 0.05)',
    taskIconContainerBorder: 'rgba(0, 0, 0, 0.1)',
    checkboxBorder: '#888888',
    checkboxCheckedBg: '#007AFF',
    checkboxCheckedBorder: '#007AFF',
    checkboxCheckmark: '#FFFFFF',
    deleteIconColor: '#FF3B30',
    editIconColor: '#FF9500',
    modalBg: '#FFFFFF',
    modalTitleText: '#000000',
    modalText: '#4A4A4A',
    modalBorder: 'rgba(0,0,0,0.1)',
    inputLabelText: '#888888',
    inputBg: 'rgba(0, 0, 0, 0.05)',
    inputIcon: '#888888',
    inputPlaceholder: '#888888',
    inputText: '#000000',
    modalDayButtonBg: '#E0E0E0',
    selectedDayText: '#FFFFFF',
    dayText: '#000000',
    disabledBtnBg: 'rgba(0, 0, 0, 0.1)',
    modalMainActionBtnText: '#FFFFFF',
    dividerLine: '#E0E0E0',
    dividerText: '#888888',
    settingRowBg: '#E0E0E0',
    iconColor: '#666666',
    switchTrackOn: '#34C759',
    switchTrackOff: '#C0C0C0',
    switchThumbOff: '#F5F5F5',
    testButtonBg: '#C0C0C0',
    noSessionsText: '#4A4A4A',
    noSessionsSubText: '#666666',
    focusBackground: '#F5F5F5',
    focusHeading: '#000000',
    focusSwitcherBg: '#E0E0E0',
    focusSwitcherText: '#666666',
    focusSwitcherActiveBg: '#C0C0C0',
    focusSwitcherActiveText: '#000000',
    focusTimeDisplay: '#007AFF',
    focusInputBg: '#E0E0E0',
    focusInputText: '#000000',
    focusInputPlaceholder: '#888888',
    focusInputLabel: '#666666',
    focusButtonText: '#FFFFFF',
    focusResetBg: '#C0C0C0',
    focusResetIcon: '#000000',
    focusCardBg: '#E0E0E0',
    focusCardText: '#000000',
    focusCardValueText: '#666666',
    focusTipText: '#888888',
    focusStartButtonGradient: ['#4188ff', '#345cef'],

    // --- ✨ Refined Notes Screen Keys ✨ ---
    notesBackground: '#F7F8FC',
    notesHeader: '#1C1C1E',
    notesSearchBg: '#E9E9EB',
    notesSearchText: '#1C1C1E',
    notesSearchIcon: '#8A8A8E',
    notesPlaceholder: '#8A8A8E',
    notesGridColumnBg: 'transparent',
    notesCardSelectedBorder: '#007AFF',
    notesFabBg: '#007AFF',
    notesFabIcon: '#FFFFFF',
    notesFabLabelBg: 'rgba(0,0,0,0.7)',
    notesFabLabelText: '#FFFFFF',
    notesModalBg: '#FFFFFF',
    notesModalInputTitle: '#1C1C1E',
    notesModalInputContent: '#333333',
    notesModalInputPlaceholder: '#C7C7CD',
    notesChecklistItemText: '#333333',
    notesChecklistItemCompleted: '#8A8A8E',
    notesAddChecklistItemText: '#007AFF',
    notesFooterBg: '#F7F8FC',
    notesFooterIcon: '#8A8A8E',
    notesFooterIconActive: '#007AFF',
    notesEmptyText: '#8A8A8E',
    notesMoreItemsText: '#8A8A8E',
    notesSelectionOverlay: 'rgba(0, 122, 255, 0.2)',
    notesSortDropdownBg: '#FFFFFF',
    notesSortDropdownText: '#1C1C1E',
    notesSortDropdownActiveText: '#007AFF',
    notesSortDropdownBorder: '#E0E0E0',
    notesLockedOverlayBg: 'rgba(247, 248, 252, 0.8)',
    notesModalInput: '#1C1C1E',
    notesColorOptionSelected: '#007AFF',
      noteColors: [
      '#FFFFFF', // White (will have border)
      '#F2F2F2', // Light Grey (will have border)
      '#FFD6A5', // Pastel Orange
      '#FDFFB6', // Pastel Yellow
      '#CAFFBF', // Pastel Green
      '#9BF6FF', // Pastel Cyan
      '#A0C4FF', // Pastel Blue
      '#BDB2FF', // Pastel Purple
      '#FFC6FF', // Pastel Magenta
      '#FFADAD', // Pastel Red
      '#EAE0DA', // Beige
      '#D4E2D4', // Sage
    ],
  },

  // =================================================================
  // 🌑 DARK THEME (Modern, Focused & High Contrast)
  // =================================================================
  dark: {
    // --- Existing Non-Notes Keys (Untouched) ---
    backgroundColor: '#121212',
    routineTitleColor:"#ffffff",
    textColor: '#E5E5E5',
        weekDayButtonBorder: '#8E6B7E', // ডার্ক থিমের জন্য মানানসই গোলাপী

    accentColor: '#007AFF',
    tabBarColor: '#1E1E1E',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#222',
    headerBackground: '#1E1E1E',
    headerText: '#E5E5E5',
    coinContainerBg: 'rgba(255, 255, 255, 0.1)',
     statusInfoText: '#AEAEB2',          // সাধারণ টেক্সটের জন্য
    statusIconBg: '#2C3A35',            // আইকনের পেছনের রঙ
    statusIconColor: '#34D399',  
    coinText: '#FFFFFF',
    statusCardBg: '#2A2A3A',
    statusCardBorder: 'rgba(89, 80, 137, 0.45)',
    statusCardGradient: ['#262729', '#262729'],
    statusText: '#E0E0E0',
    fabBg: '#007AFF',
    unselectedTopBg: '#1c1c1e',
    unselectedBottomBg: '#2c2c2e',
    selectedTopBg: '#3a3a3aff',
    selectedBottomBg: '#8e8e8eff',
    selectedText: '#FFFFFF',
    unselectedDayNameText: '#AEAEB2',
    unselectedDayNumberText: '#FFFFFF',
    dividerShadowColor: 'rgba(50, 48, 48, 0.3)',
    timeBlockCardBg: '#262729',
    cardBorderColor: 'rgba(89, 80, 137, 0.45)',
    timeBlockIcon: '#E5E5E5',
    timeBlockTitleText: '#FFFFFF',
    sessionItemBg: '#262729',
    sessionItemBorder: 'rgba(255, 255, 255, 0.1)',
    sessionItemCompletedBg: 'rgba(0, 122, 255, 0.2)',
    sessionItemCompletedBorder: 'rgba(0, 122, 255, 0.3)',
    sessionTimeText: '#AEAEB2',
    sessionTimeTextCompleted: '#8E8E93',
    sessionText: '#FFFFFF',
    sessionTextCompleted: '#8E8E93',
    taskIconContainerBg: 'rgba(255, 255, 255, 0.05)',
    taskIconContainerBorder: 'rgba(255, 255, 255, 0.1)',
    checkboxBorder: '#4A4466',
    checkboxCheckedBg: '#007AFF',
    checkboxCheckedBorder: '#007AFF',
    checkboxCheckmark: '#FFFFFF',
    deleteIconColor: '#FF3B30',
    editIconColor: '#FF9500',
    modalBg: '#1C1C1E',
    modalTitleText: '#fff',
    modalText: '#E5E5EA',
    modalBorder: 'rgba(255,255,255,0.1)',
    inputLabelText: '#8A8A8E',
    inputBg: '#31313643',
    inputIcon: '#888',
    inputPlaceholder: '#888',
    inputText: '#fff',
    modalDayButtonBg: '#3A3A3C',
    selectedDayText: '#fff',
    dayText: '#fff',
    disabledBtnBg: '#31313643',
    modalMainActionBtnText: '#fff',
    dividerLine: '#3A3A3C',
    dividerText: '#8A8A8E',
    settingRowBg: 'rgba(44, 44, 46, 0.7)',
    iconColor: '#8A8A8E',
    switchTrackOn: '#81b0ff',
    switchTrackOff: '#767577',
    switchThumbOff: '#f4f3f4',
    testButtonBg: '#1C1C1E',
    noSessionsText: '#A0A0A0',
    noSessionsSubText: '#777',
    focusBackground: '#121212',
    focusHeading: '#E5E5E5',
    focusSwitcherBg: '#1E1E1E',
    focusSwitcherText: '#666666',
    focusSwitcherActiveBg: '#333942',
    focusSwitcherActiveText: '#FFFFFF',
    focusTimeDisplay: '#7ceffd',
    focusInputBg: '#1E1E1E',
    focusInputText: '#FFFFFF',
    focusInputPlaceholder: '#888888',
    focusInputLabel: '#888888',
    focusButtonText: '#FFFFFF',
    focusResetBg: '#1E1E1E',
    focusResetIcon: '#FFFFFF',
    focusCardBg: '#1E1E1E',
    focusCardText: '#FFFFFF',
    focusCardValueText: '#A0A0A0',
    focusTipText: '#666666',
    focusStartButtonGradient: ['#1E1E1E', '#1E1E1E'],

    // --- ✨ Refined Notes Screen Keys ✨ ---
    notesBackground: '#121212',
    notesHeader: '#EAEAEA',
    notesSearchBg: '#2C2C2E',
    notesSearchText: '#EAEAEA',
    notesSearchIcon: '#8A8A8E',
    notesPlaceholder: '#8A8A8E',
    notesGridColumnBg: 'transparent',
    notesCardSelectedBorder: '#0A84FF',
    notesFabBg: '#0A84FF',
    notesFabIcon: '#FFFFFF',
    notesFabLabelBg: '#3A3A3C',
    notesFabLabelText: '#EAEAEA',
    notesModalBg: '#1E1E1E',
    notesModalInputTitle: '#EAEAEA',
    notesModalInputContent: '#D1D1D1',
    notesModalInputPlaceholder: '#5A5A5E',
    notesChecklistItemText: '#D1D1D1',
    notesChecklistItemCompleted: '#8A8A8E',
    notesAddChecklistItemText: '#0A84FF',
    notesFooterBg: '#2C2C2E',
    notesFooterIcon: '#8A8A8E',
    notesFooterIconActive: '#0A84FF',
    notesEmptyText: '#8A8A8E',
    notesMoreItemsText: '#8A8A8E',
    notesSelectionOverlay: 'rgba(10, 132, 255, 0.3)',
    notesSortDropdownBg: '#2C2C2E',
    notesSortDropdownText: '#EAEAEA',
    notesSortDropdownActiveText: '#0A84FF',
    notesSortDropdownBorder: '#3A3A3C',
    notesLockedOverlayBg: 'rgba(30, 30, 30, 0.85)',
    notesModalInput: '#EAEAEA',
    notesColorOptionSelected: '#0A84FF',
   noteColors: [
      '#2C2C2E', // Charcoal (will have border)
      '#332D2D', // Dark Brown
      '#5E4C1A', // Dark Mustard
      '#274234', // Forest Green
      '#1E3A57', // Navy Blue
      '#3A364B', // Deep Purple
      '#5C2B29', // Maroon
      '#5C3D1E', // Burnt Orange
      '#4A2A3D', // Muted Plum
      '#4A4139', // Taupe
      '#2E424D', // Dark Teal
      '#1D3557', // Midnight Blue
    ],
  },

  // =================================================================
  // 🚀 CLASSIC THEME (Vibrant, Unique & Tech-Inspired)
  // =================================================================
  classic: {
    // --- Existing Non-Notes Keys (Untouched) ---
    backgroundColor: '#0e091fff',
    routineTitleColor:"#ffffff",
    textColor: '#E5E5E5',
    accentColor: '#007AFF',
        weekDayButtonBorder: '#8E6B7E', // ক্লাসিক থিমের জন্য মানানসই গোলাপী

    tabBarColor: '#0b111d',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#222',
    headerBackground: '#0b111d',
    headerText: '#FFFFFF',
    coinContainerBg: 'rgba(255, 255, 255, 0.1)',
    coinText: '#FFFFFF',
      statusInfoText: '#AEAEB2',          // সাধারণ টেক্সটের জন্য
    statusIconBg: '#203240',            // আইকনের পেছনের রঙ
    statusIconColor: '#7CEFFD', 
    statusCardBg: '#2A2A3A',
    statusCardBorder: 'rgba(89, 80, 137, 0.45)',
    statusCardGradient: ['#2A2A3A', '#1A1A2A'],
    statusText: '#E0E0E0',
    fabBg: '#007AFF',
    unselectedTopBg: '#1c1c1e',
    unselectedBottomBg: '#2c2c2e',
    selectedTopBg: '#c9395a',
    selectedBottomBg: '#7e2237',
    selectedText: '#FFFFFF',
    unselectedDayNameText: '#AEAEB2',
    unselectedDayNumberText: '#FFFFFF',
    dividerShadowColor: 'rgba(50, 48, 48, 0.3)',
    timeBlockCardBg: 'transparent',
    cardBorderColor: 'rgba(89, 80, 137, 0.45)',
    timeBlockIcon: '#FFFFFF',
    timeBlockTitleText: '#FFFFFF',
    sessionItemBg: 'rgba(0, 0, 0, 0.18)',
    sessionItemBorder: 'rgba(113, 113, 113, 0.04)',
    sessionItemCompletedBg: 'rgba(0, 122, 255, 0.2)',
    sessionItemCompletedBorder: 'rgba(0, 122, 255, 0.3)',
    sessionTimeText: '#AEAEB2',
    sessionTimeTextCompleted: '#8E8E93',
    sessionText: '#FFFFFF',
    sessionTextCompleted: '#8E8E93',
    taskIconContainerBg: '#272b3e70',
    taskIconContainerBorder: 'rgba(113, 113, 113, 0.1)',
    checkboxBorder: '#4A4466',
    checkboxCheckedBg: '#007AFF',
    checkboxCheckedBorder: '#007AFF',
    checkboxCheckmark: '#FFFFFF',
    deleteIconColor: '#FF3B30',
    editIconColor: '#FF9500',
    modalBg: '#1C1C1E',
    modalTitleText: '#fff',
    modalText: '#E5E5EA',
    modalBorder: 'rgba(255,255,255,0.1)',
    inputLabelText: '#8A8A8E',
    inputBg: '#31313643',
    inputIcon: '#888',
    inputPlaceholder: '#888',
    inputText: '#fff',
    modalDayButtonBg: '#3A3A3C',
    selectedDayText: '#fff',
    dayText: '#fff',
    disabledBtnBg: '#31313643',
    modalMainActionBtnText: '#fff',
    dividerLine: '#3A3A3C',
    dividerText: '#8A8A8E',
    settingRowBg: 'rgba(44, 44, 46, 0.7)',
    iconColor: '#8A8A8E',
    switchTrackOn: '#81b0ff',
    switchTrackOff: '#767577',
    switchThumbOff: '#f4f3f4',
    testButtonBg: '#1C1C1E',
    noSessionsText: '#A0A0A0',
    noSessionsSubText: '#777',
    focusBackground: '#0e091fff',
    focusHeading: '#E5E5E5',
    focusSwitcherBg: '#18202e',
    focusSwitcherText: '#9e9e9e86',
    focusSwitcherActiveBg: '#3339426c',
    focusSwitcherActiveText: '#FFFFFF',
    focusTimeDisplay: '#7ceffd',
    focusInputBg: '#18202e',
    focusInputText: '#FFFFFF',
    focusInputPlaceholder: '#888888',
    focusInputLabel: '#888888',
    focusButtonText: '#FFFFFF',
    focusResetBg: '#18202e',
    focusResetIcon: '#FFFFFF',
    focusCardBg: '#18202e',
    focusCardText: '#FFFFFF',
    focusCardValueText: '#A0A0A0',
    focusTipText: '#666',
    focusStartButtonGradient: ['#007AFF', '#0047b3'],
    timeBlockCardGradients: {
      Morning: { base: ['#181b27', '#181b27'], topLeft: '#ba4f25ff', topRight: '#2f2a67ff', icon: '#f1932b' },
      Midday: { base: ['#171a26', '#171a26'], topLeft: '#2f2470ff', topRight: '#1a1f31', icon: '#1e61ef' },
      Evening: { base: ['#171a26', '#171a26'], topLeft: '#3b0642ff', topRight: '#452737ff', icon: '#FD5E53' },
      Night: { base: ['#171a26', '#171a26'], topLeft: '#272465ff', topRight: '#5f4e92ff', icon: '#D8D8FF' },
    },
    
    // --- ✨ Refined Notes Screen Keys ✨ ---
    notesBackground: '#0B111D',
    notesHeader: '#F0F0F0',
    notesSearchBg: '#18202E',
    notesSearchText: '#F0F0F0',
    notesSearchIcon: '#8A92A8',
    notesPlaceholder: '#8A92A8',
    notesGridColumnBg: 'transparent',
    notesCardSelectedBorder: '#40C4FF',
    notesFabBg: '#40C4FF',
    notesFabIcon: '#0B111D',
    notesFabLabelBg: '#18202E',
    notesFabLabelText: '#F0F0F0',
    notesModalBg: '#080D15',
    notesModalInputTitle: '#F0F0F0',
    notesModalInputContent: '#D1D1D6',
    notesModalInputPlaceholder: '#5A6173',
    notesChecklistItemText: '#D1D1D6',
    notesChecklistItemCompleted: '#8A92A8',
    notesAddChecklistItemText: '#40C4FF',
    notesFooterBg: '#18202E',
    notesFooterIcon: '#8A92A8',
    notesFooterIconActive: '#40C4FF',
    notesEmptyText: '#8A92A8',
    notesMoreItemsText: '#8A92A8',
    notesSelectionOverlay: 'rgba(64, 196, 255, 0.25)',
    notesSortDropdownBg: '#18202E',
    notesSortDropdownText: '#F0F0F0',
    notesSortDropdownActiveText: '#40C4FF',
    notesSortDropdownBorder: '#3A3A3C',
    notesLockedOverlayBg: 'rgba(11, 17, 29, 0.85)',
    notesModalInput: '#F0F0F0',
    notesColorOptionSelected: '#40C4FF',
    noteColors: [
      '#18202E', // Dark Slate (will have border)
      '#4A2A3D', // Muted Plum
      '#0D3B4A', // Deep Ocean
      '#3E3456', // Twilight Purple
      '#5C2B29', // Faded Crimson
      '#274234', // Hunter Green
      '#5E4C1A', // Muted Gold
      '#571E3A', // Deep Berry
      '#6A040F', // Ruby Red
      '#003E1F', // Dark Emerald
      '#240046', // Royal Purple
      '#03045E', // Deep Sapphire
    ],
  },
};
export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes.light) & {
  routineTitleColor?: string;
  statusInfoText?: string;
};

type ThemeContextType = {
    themeName: ThemeName;
    colors: Theme;
    setThemeName: (name: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
    themeName: 'classic',
    colors: themes.classic,
    setThemeName: async () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeName, setThemeNameState] = useState<ThemeName>('classic');
    const [userSelected, setUserSelected] = useState(false); // ইউজার কি ম্যানুয়ালি থিম সিলেক্ট করেছে কিনা

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('userTheme');
                if (storedTheme) {
                    setThemeNameState(storedTheme as ThemeName);
                    setUserSelected(true);
                } else {
                    const systemTheme = Appearance.getColorScheme() || 'classic';
                    setThemeNameState(systemTheme as ThemeName);
                }
            } catch (e) {
                console.log('Error loading theme:', e);
            }
        };
        loadTheme();

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (!userSelected) {
                setThemeNameState((colorScheme || 'classic') as ThemeName);
            }
        });

        return () => subscription.remove();
    }, [userSelected]);

    const setThemeName = async (name: ThemeName) => {
        try {
            setThemeNameState(name);
            setUserSelected(true);
            await AsyncStorage.setItem('userTheme', name);
        } catch (e) {
            console.log('Error saving theme:', e);
        }
    };

    const colors = themes[themeName];

    return (
        <ThemeContext.Provider value={{ themeName, colors, setThemeName }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
