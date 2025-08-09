import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

export const themes = {
  light: {
    backgroundColor: '#F5F5F5',
    textColor: '#1E1E1E',
    accentColor: '#007AFF',
    tabBarColor: '#ffffff',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#e0e0e0',
    headerBackground: '#ffffff',
    headerText: '#1E1E1E',
    coinContainerBg: 'rgba(0, 0, 0, 0.05)',
    coinText: '#1E1E1E',
    statusCardBg: '#E0E0E0',
    statusCardBorder: 'rgba(0,0,0,0.1)',
    statusText: '#4A4A4A',
    fabBg: '#007AFF',
    unselectedTopBg: '#E0E0E0',
    unselectedBottomBg: '#C0C0C0',
    selectedTopBg: '#c9395a',
    selectedBottomBg: '#7e2237',
    selectedText: '#FFFFFF',
    unselectedDayNameText: '#666666',
    unselectedDayNumberText: '#1E1E1E',
    dividerShadowColor: 'rgba(0, 0, 0, 0.2)',
    timeBlockCardBg: '#FFFFFF',
    cardBorderColor: 'rgba(0,0,0,0.1)',
    timeBlockIcon: '#666666',
    timeBlockTitleText: '#1E1E1E',
    sessionItemBg: 'rgba(0, 0, 0, 0.05)',
    sessionItemBorder: 'rgba(0,0,0,0.1)',
    sessionItemCompletedBg: 'rgba(0, 122, 255, 0.1)',
    sessionItemCompletedBorder: 'rgba(0, 122, 255, 0.2)',
    sessionTimeText: '#888888',
    sessionTimeTextCompleted: '#888888',
    sessionText: '#1E1E1E',
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
    modalTitleText: '#1E1E1E',
    modalText: '#4A4A4A',
    modalBorder: 'rgba(0,0,0,0.1)',
    inputLabelText: '#888888',
    inputBg: 'rgba(0, 0, 0, 0.05)',
    inputIcon: '#888888',
    inputPlaceholder: '#888888',
    inputText: '#1E1E1E',
    modalDayButtonBg: '#E0E0E0',
    selectedDayText: '#FFFFFF',
    dayText: '#1E1E1E',
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
  },
  dark: {
    backgroundColor: '#121212',
    textColor: '#E5E5E5',
    accentColor: '#007AFF',
    tabBarColor: '#1E1E1E',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#222',
    headerBackground: '#1E1E1E',
    headerText: '#E5E5E5',
    coinContainerBg: 'rgba(255, 255, 255, 0.1)',
    coinText: '#FFFFFF',
    statusCardBg: '#2A2A3A',
    statusCardBorder: 'rgba(89, 80, 137, 0.45)',
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
    timeBlockCardBg: '#2a2a3a',
    cardBorderColor: 'rgba(89, 80, 137, 0.45)',
    timeBlockIcon: '#E5E5E5',
    timeBlockTitleText: '#FFFFFF',
    sessionItemBg: 'rgba(255, 255, 255, 0.05)',
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
    statusCardGradient: ['#2A2A3A', '#1A1A2A'],
  },
  classic: {
    backgroundColor: '#0e091fff',
    textColor: '#E5E5E5',
    accentColor: '#007AFF',
    tabBarColor: '#0b111d',
    tabBarInactiveTintColor: 'gray',
    tabBarBorderColor: '#222',
    headerBackground: '#0b111d',
    headerText: '#FFFFFF',
    coinContainerBg: 'rgba(255, 255, 255, 0.1)',
    coinText: '#FFFFFF',
    statusCardBg: '#2A2A3A',
    statusCardBorder: 'rgba(89, 80, 137, 0.45)',
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
    statusCardGradient: ['#2A2A3A', '#1A1A2A'], // 👈 New gradient for classic theme
    
    // Updated gradient colors for the classic theme
    timeBlockCardGradients: {
      Morning: {
        base: ['#181b27', '#181b27'],
        topLeft: '#ba4f25ff',
        topRight: '#2f2a67ff',
        icon: '#f1932b',
      },
      Midday: {
        base: ['#171a26', '#171a26'],
        topLeft: '#2f2470ff',
        topRight: '#1a1f31',
        icon: '#1e61ef',
      },
      Evening: {
        base: ['#171a26', '#171a26'],
        topLeft: '#3b0642ff',
        topRight: '#452737ff',
        icon: '#FD5E53',
      },
      Night: {
        base: ['#171a26', '#171a26'],
        topLeft: '#272465ff',
        topRight: '#5f4e92ff',
        icon: '#D8D8FF',
      },
    },
  },
};

export type ThemeName = keyof typeof themes;
export type Theme = typeof themes['light'];

type ThemeContextType = {
  themeName: ThemeName;
  colors: Theme;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeName: 'classic',
  colors: themes.classic,
  setThemeName: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('classic');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("userTheme");
      const systemTheme = Appearance.getColorScheme() || 'classic';
      setThemeName((storedTheme || systemTheme) as ThemeName);
    };

    loadTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeName((colorScheme || 'classic') as ThemeName);
    });

    return () => subscription.remove();
  }, []);

  const colors = themes[themeName];

  return (
    <ThemeContext.Provider value={{ themeName, colors, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);