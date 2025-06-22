import { DefaultTheme } from '@react-navigation/native';

export const COLORS = {
  // Primary colors
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  primaryLight: '#64B5F6',

  // Secondary colors
  secondary: '#FF4081',
  secondaryDark: '#F50057',
  secondaryLight: '#FF80AB',

  // Accent colors
  accent: '#FFC107',
  accentDark: '#FFA000',
  accentLight: '#FFD54F',

  // Neutral colors
  black: '#000000',
  white: '#FFFFFF',
  grey: '#9E9E9E',
  greyLight: '#E0E0E0',
  greyDark: '#616161',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Background colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E0E0E0',
};

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: 'Roboto-Regular',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    light: 'Roboto-Light',
  },

  // Font sizes
  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    h5: 16,
    body: 14,
    caption: 12,
    small: 10,
  },

  // Line heights
  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 28,
    h4: 24,
    h5: 22,
    body: 20,
    caption: 16,
    small: 14,
  },
};

export const SPACING = {
  // Base spacing unit
  base: 8,

  // Spacing multipliers
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,

  // Screen padding
  screenPadding: 16,
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 16,

  // Component spacing
  componentSpacing: 16,
  sectionSpacing: 24,
};

export const LAYOUT = {
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 999,
  },

  // Shadows
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

// Navigation theme
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.black,
    border: COLORS.border,
  },
}; 