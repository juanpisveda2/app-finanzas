import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const baseColors = {
  primary: '#1E3A5F',
  secondary: '#5B8C5A',
  tertiary: '#C97C5D',
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceVariant: '#E9E4DA',
  outline: '#B7B2A8',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...baseColors,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1D1B16',
    onSurface: '#1D1B16',
  },
  roundness: 14,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9BB7D4',
    secondary: '#8EC6A2',
    tertiary: '#F2B497',
    background: '#141414',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    outline: '#6C6C6C',
    onPrimary: '#0E1A2B',
    onSecondary: '#0E1A2B',
    onBackground: '#F2F2F2',
    onSurface: '#F2F2F2',
  },
  roundness: 14,
};

export type AppTheme = typeof lightTheme;

export function createAppTheme(isDark: boolean) {
  return isDark ? darkTheme : lightTheme;
}
