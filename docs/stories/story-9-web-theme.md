# Story 9: Web Theme Detection Fix

## Problem Statement

When running on GitHub Pages (web), the app displays with incorrect colors - appears darker with white text even when the user expects light mode. This creates a jarring experience for web users and may indicate the theme detection isn't working correctly on the web platform.

## Root Cause Analysis

The app uses React Native's `useColorScheme()` hook which:
- **On mobile**: Correctly reads iOS/Android system preferences
- **On web**: May not properly detect browser/OS dark mode preference, or may default to dark

Current implementation in `_layout.tsx` and `providers/index.tsx`:
```typescript
const colorScheme = useColorScheme(); // Returns 'dark' | 'light' | null
const isDark = colorScheme !== 'light'; // null → treated as dark
```

**Issue**: If `useColorScheme()` returns `null` on web, the app defaults to dark mode.

## User Stories

### 9.1 Respect System Theme on Web
**As a** user accessing the app via browser
**I want to** see the app match my browser/OS dark mode setting
**So that** the experience is consistent with my preferences

**Acceptance Criteria:**
- [ ] Web app detects `prefers-color-scheme` media query
- [ ] Light mode users see light theme
- [ ] Dark mode users see dark theme
- [ ] Theme updates if user changes system preference

### 9.2 Manual Theme Toggle
**As a** user
**I want to** manually switch between light and dark mode
**So that** I can override system settings if I prefer

**Acceptance Criteria:**
- [ ] Profile screen has theme toggle (System / Light / Dark)
- [ ] Selection persists across sessions (stored in AsyncStorage/localStorage)
- [ ] "System" option follows OS preference
- [ ] Change applies immediately without reload

### 9.3 Theme Consistency Across Platforms
**As a** user switching between mobile and web
**I want to** see consistent colors on both platforms
**So that** the app feels cohesive

**Acceptance Criteria:**
- [ ] Same color tokens used on all platforms
- [ ] Dark mode: Background #09090B, Text #FAFAFA
- [ ] Light mode: Background #FFFFFF, Text #09090B
- [ ] Accent colors consistent (purple primary)

## Technical Implementation

### Web-Specific Theme Detection
```typescript
// Use CSS media query on web
import { Platform } from 'react-native';

function useWebColorScheme(): 'dark' | 'light' {
  if (Platform.OS !== 'web') return 'light';

  const [scheme, setScheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return scheme;
}
```

### Files to Modify
1. `apps/mobile/src/providers/index.tsx` - Add web-specific detection
2. `apps/mobile/app/_layout.tsx` - Use improved hook
3. Create `apps/mobile/src/hooks/useTheme.ts` - Centralized theme logic

### Storage for Manual Preference
- Mobile: `expo-secure-store` or `AsyncStorage`
- Web: `localStorage`
- Key: `@progress/theme-preference`
- Values: `'system' | 'light' | 'dark'`

## Design Notes

Per product guidelines:
- "Dark-first: Dark theme as default, light theme available"
- If detection fails, default to dark mode (current behavior is intentional)
- But detection should work correctly first

## Debug Steps for Current Issue

1. Check what `useColorScheme()` returns on web (add console.log)
2. Check if Tamagui's Theme component receives correct value
3. Verify CSS variables are being applied correctly in browser

## Priority
**Medium** - Affects web users, but web is secondary to mobile

## Estimated Effort
**Small** - 1-2 hours for proper web detection
**Medium** - 3-4 hours if adding manual toggle
