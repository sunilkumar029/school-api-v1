import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  cardBackground: string;
  modalOverlay: string;
  inputBackground: string;
  tabBar: string;
  card: string;
}

const lightColors: ThemeColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
  cardBackground: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#F2F2F7',
  tabBar: '#FFFFFF',
  card: '#FFFFFF',
};

const darkColors: ThemeColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#64D2FF',
  cardBackground: '#2C2C2E',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  inputBackground: '#1C1C1E',
  tabBar: '#1E1E1E',
  card: '#1E1E1E',
};

export const fontSizes = {
  small: 14,
  medium: 16,
  large: 18,
};

interface ThemeContextType {
  colors: ThemeColors;
  fontSize: FontSize;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  toggleTheme: () => void; // Add toggleTheme to the types
  resetSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      const savedFontSize = await AsyncStorage.getItem('font_size');

      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
      if (savedFontSize) {
        setFontSizeState(savedFontSize as FontSize);
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode); // Use setThemeMode to update the theme
  };

  const setFontSize = async (size: FontSize) => {
    try {
      await AsyncStorage.setItem('font_size', size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.multiRemove(['theme_mode', 'font_size']);
      setThemeModeState('system');
      setFontSizeState('medium');
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const value: ThemeContextType = {
    colors,
    fontSize,
    themeMode,
    isDark,
    setThemeMode,
    setFontSize,
    toggleTheme,
    resetSettings,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};