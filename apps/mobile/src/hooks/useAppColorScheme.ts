import { useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';

type ColorScheme = 'dark' | 'light';

// Type for browser's matchMedia result
interface MediaQueryListLike {
  matches: boolean;
  addEventListener(type: 'change', listener: (e: { matches: boolean }) => void): void;
  removeEventListener(type: 'change', listener: (e: { matches: boolean }) => void): void;
}

/**
 * Get the browser's matchMedia function if available (web only)
 */
function getMatchMedia(query: string): MediaQueryListLike | null {
  if (Platform.OS !== 'web') return null;

  // Access window through globalThis for TypeScript compatibility
  const win = globalThis as unknown as { matchMedia?: (q: string) => MediaQueryListLike };
  if (typeof win.matchMedia === 'function') {
    return win.matchMedia(query);
  }
  return null;
}

/**
 * Cross-platform color scheme hook that properly detects system theme preference
 * on both mobile (iOS/Android) and web platforms.
 *
 * On mobile: Uses React Native's useColorScheme()
 * On web: Uses window.matchMedia('(prefers-color-scheme: dark)')
 *
 * Defaults to 'dark' if detection fails (per product guidelines: "Dark-first")
 */
export function useAppColorScheme(): ColorScheme {
  const rnColorScheme = useColorScheme();

  // For web, we need to use matchMedia since RN's useColorScheme may not work properly
  const [webColorScheme, setWebColorScheme] = useState<ColorScheme>(() => {
    const mediaQuery = getMatchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery) {
      return mediaQuery.matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark
  });

  useEffect(() => {
    const mediaQuery = getMatchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handleChange = (e: { matches: boolean }): void => {
      setWebColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // On web, prefer our custom detection
  if (Platform.OS === 'web') {
    return webColorScheme;
  }

  // On mobile, use RN's hook but default to dark if null
  return rnColorScheme === 'light' ? 'light' : 'dark';
}
