
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  card: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  primary: '#3D5AFE',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E5E7EB',
  tabBar: '#FFFFFF',
  card: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#3D5AFE',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#374151',
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
    resetSettings,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
