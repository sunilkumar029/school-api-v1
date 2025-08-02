/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4A90E2';
const tintColorDark = '#50E3C2';

export const Colors = {
  light: {
    text: '#333333',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#4A90E2',
    secondary: '#50E3C2',
    surface: '#F7F8FA',
    border: '#E0E0E0',
    textPrimary: '#333333',
    textSecondary: '#666666',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#50E3C2',
    secondary: '#4A90E2',
    surface: '#1E1E1E',
    border: '#333333',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
  },
};
