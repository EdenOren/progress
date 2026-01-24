import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

// Custom color palette
const customColors = {
  // Primary - Blue
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',

  // Success - Green
  success: '#22c55e',
  successLight: '#4ade80',
  successDark: '#16a34a',

  // Warning - Yellow/Orange
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',

  // Error - Red
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',

  // Neutral grays
  gray1: '#f9fafb',
  gray2: '#f3f4f6',
  gray3: '#e5e7eb',
  gray4: '#d1d5db',
  gray5: '#9ca3af',
  gray6: '#6b7280',
  gray7: '#4b5563',
  gray8: '#374151',
  gray9: '#1f2937',
  gray10: '#111827',
  gray11: '#0a0a0a',
};

// Custom themes
const lightTheme = {
  background: '#ffffff',
  backgroundHover: customColors.gray2,
  backgroundPress: customColors.gray3,
  backgroundFocus: customColors.gray2,
  backgroundStrong: customColors.gray1,
  backgroundTransparent: 'transparent',
  color: customColors.gray10,
  colorHover: customColors.gray11,
  colorPress: customColors.gray9,
  colorFocus: customColors.gray10,
  colorTransparent: 'transparent',
  borderColor: customColors.gray3,
  borderColorHover: customColors.gray4,
  borderColorFocus: customColors.primary,
  borderColorPress: customColors.gray4,
  placeholderColor: customColors.gray5,
  // Semantic colors
  primary: customColors.primary,
  primaryHover: customColors.primaryDark,
  success: customColors.success,
  warning: customColors.warning,
  error: customColors.error,
};

const darkTheme = {
  background: customColors.gray11,
  backgroundHover: customColors.gray9,
  backgroundPress: customColors.gray8,
  backgroundFocus: customColors.gray9,
  backgroundStrong: customColors.gray10,
  backgroundTransparent: 'transparent',
  color: customColors.gray1,
  colorHover: '#ffffff',
  colorPress: customColors.gray2,
  colorFocus: customColors.gray1,
  colorTransparent: 'transparent',
  borderColor: customColors.gray8,
  borderColorHover: customColors.gray7,
  borderColorFocus: customColors.primaryLight,
  borderColorPress: customColors.gray7,
  placeholderColor: customColors.gray6,
  // Semantic colors
  primary: customColors.primaryLight,
  primaryHover: customColors.primary,
  success: customColors.successLight,
  warning: customColors.warningLight,
  error: customColors.errorLight,
};

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: { ...config.themes.light, ...lightTheme },
    dark: { ...config.themes.dark, ...darkTheme },
  },
  defaultTheme: 'dark',
});

export type AppConfig = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
