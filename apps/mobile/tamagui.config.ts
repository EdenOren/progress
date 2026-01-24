import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

const colors = {
  // Primary - Violet
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Semantic
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',

  // Zinc neutral scale
  zinc50: '#FAFAFA',
  zinc100: '#F4F4F5',
  zinc200: '#E4E4E7',
  zinc400: '#A1A1AA',
  zinc500: '#71717A',
  zinc600: '#52525B',
  zinc800: '#27272A',
  zinc900: '#18181B',
  zinc950: '#09090B',
};

const lightTheme = {
  background: '#FFFFFF',
  backgroundHover: colors.zinc100,
  backgroundPress: colors.zinc200,
  backgroundFocus: colors.zinc100,
  backgroundStrong: colors.zinc100,
  backgroundTransparent: 'transparent',
  color: colors.zinc900,
  colorHover: colors.zinc950,
  colorPress: colors.zinc800,
  colorFocus: colors.zinc900,
  colorTransparent: 'transparent',
  borderColor: colors.zinc200,
  borderColorHover: colors.zinc400,
  borderColorFocus: colors.primary,
  borderColorPress: colors.zinc400,
  placeholderColor: colors.zinc400,
  // Semantic
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryDark: colors.primaryDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  // Surface tokens
  surface: colors.zinc100,
  surfaceHover: colors.zinc200,
  textSecondary: colors.zinc600,
  textMuted: colors.zinc400,
};

const darkTheme = {
  background: colors.zinc950,
  backgroundHover: colors.zinc800,
  backgroundPress: colors.zinc800,
  backgroundFocus: colors.zinc900,
  backgroundStrong: colors.zinc900,
  backgroundTransparent: 'transparent',
  color: colors.zinc50,
  colorHover: '#FFFFFF',
  colorPress: colors.zinc100,
  colorFocus: colors.zinc50,
  colorTransparent: 'transparent',
  borderColor: colors.zinc800,
  borderColorHover: colors.zinc500,
  borderColorFocus: colors.primary,
  borderColorPress: colors.zinc500,
  placeholderColor: colors.zinc500,
  // Semantic
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryDark: colors.primaryDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  // Surface tokens
  surface: colors.zinc900,
  surfaceHover: colors.zinc800,
  textSecondary: colors.zinc400,
  textMuted: colors.zinc500,
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
