# Story: UI Overhaul — Theme-Aware Component Redesign

## Handoff: UI/UX Designer → Frontend

### Summary
Rebuild all UI components using Tamagui `styled()` primitives, replace hard-coded dark colors with theme tokens, and apply the new "Dark Athletic" visual identity with violet primary accent.

---

## Context
The current app hard-codes dark-mode colors in React Native `StyleSheet.create()`, breaking light-mode support and creating visual inconsistency. Components mix Tamagui and raw RN styling. This story unifies everything under Tamagui tokens.

---

## Tasks

### Task 1: Update Theme Config (`tamagui.config.ts`)

Replace current color tokens with:

```typescript
const tokens = createTokens({
  color: {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    // Zinc scale for neutrals
    zinc50: '#FAFAFA',
    zinc100: '#F4F4F5',
    zinc400: '#A1A1AA',
    zinc500: '#71717A',
    zinc800: '#27272A',
    zinc900: '#18181B',
    zinc950: '#09090B',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  // ... keep existing size tokens
})
```

Update dark theme:
```typescript
background: '$zinc950',    // #09090B
surface: '$zinc900',       // #18181B
surfaceHover: '$zinc800',  // #27272A
border: '$zinc800',        // #27272A
text: '$zinc50',           // #FAFAFA
textSecondary: '$zinc400', // #A1A1AA
textMuted: '$zinc500',     // #71717A
```

Update light theme:
```typescript
background: '#FFFFFF',
surface: '$zinc100',       // #F4F4F5
surfaceHover: '#E4E4E7',
border: '#E4E4E7',
text: '#18181B',
textSecondary: '#52525B',
textMuted: '#A1A1AA',
```

---

### Task 2: Rebuild Button Component

Convert from `StyleSheet.create()` to Tamagui `styled()`.

```
Variants:
  primary:   bg=$primary, color=white, pressStyle: bg=$primaryDark, scale=0.96
  secondary: bg=transparent, borderColor=$primary, color=$primary, pressStyle: bg=$primary/10
  ghost:     bg=transparent, color=$primaryLight, pressStyle: bg=$primary/10
  danger:    bg=$error, color=white, pressStyle: bg=#dc2626, scale=0.96

Sizes:
  sm: height=36, paddingHorizontal=$md, fontSize=13, fontWeight=600
  md: height=44, paddingHorizontal=$lg, fontSize=15, fontWeight=600
  lg: height=52, paddingHorizontal=$xl, fontSize=16, fontWeight=600

All:
  borderRadius=$sm (8px)
  minWidth=44 (touch target)
  disabled: opacity=0.5
  loading: show spinner, disable press
```

---

### Task 3: Rebuild Input Component

Convert from `StyleSheet.create()` to Tamagui `styled()`. Must be theme-aware.

```
Default:
  height: 48
  backgroundColor: $background
  color: $text
  borderWidth: 1
  borderColor: $border
  borderRadius: $sm (8px)
  paddingHorizontal: $md
  placeholderColor: $textMuted
  fontSize: 16

Focus:
  borderWidth: 2
  borderColor: $primary

Error:
  borderColor: $error

Label:
  fontSize: 13
  fontWeight: 500
  color: $textSecondary
  marginBottom: $xs

Error text:
  fontSize: 12
  color: $error
  marginTop: $xs
```

---

### Task 4: Rebuild Card Component

Convert from `StyleSheet.create()` to Tamagui `styled()`.

```
Default:
  backgroundColor: $surface
  borderWidth: 1
  borderColor: $border
  borderRadius: $md (12px)
  padding: $md

Pressable variant:
  pressStyle:
    backgroundColor: $surfaceHover
    scale: 0.98
  animation: fast (150ms)
```

---

### Task 5: Enhance SubjectCard

Built on top of new Card component.

```
Layout:
  XStack (horizontal):
    Left accent bar: width=3, bg=$primary, borderRadius=$full, marginRight=$md
    YStack (content):
      Title: fontSize=18, fontWeight=600, color=$text
      Description: fontSize=14, color=$textSecondary, numberOfLines=2
      XStack (bottom row, marginTop=$sm):
        Entry count pill: bg=$surfaceHover, borderRadius=$full, paddingH=$sm, fontSize=12
        Spacer
        Last entry: fontSize=12, color=$textMuted
```

---

### Task 6: Enhance Entry Status Badges

Replace solid-color badges with translucent pills.

```
Completed:
  bg: success at 15% opacity (rgba(16, 185, 129, 0.15))
  color: $success
  borderRadius: $full
  paddingHorizontal: $sm
  paddingVertical: $xs
  fontSize: 12, fontWeight: 600

In Progress:
  bg: warning at 15% opacity (rgba(245, 158, 11, 0.15))
  color: $warning
  (same sizing as above)
```

---

### Task 7: Update LoadingScreen

Remove hard-coded colors. Use theme tokens.

```
backgroundColor: $background
ActivityIndicator color: $primary
Message: color=$textSecondary, fontSize=14
```

---

### Task 8: Update EmptyState

```
Icon area: 64px, color=$textMuted (placeholder for future icons)
Title: fontSize=22, fontWeight=600, color=$text
Message: fontSize=16, color=$textSecondary, textAlign=center
CTA: primary Button variant, full width, marginTop=$lg
```

---

### Task 9: Update Auth Screens

- Replace hard-coded colors with theme tokens
- Header title: fontSize=28, fontWeight=700
- Add top spacing (`$2xl`) for premium feel
- Separator line: use `$border` token
- Social button: secondary variant
- Link text: color=$primaryLight
- Error banner: bg=$error/15, color=$error, borderRadius=$sm

---

### Task 10: Update Profile Screen

- Avatar: 100px circle, bg=$primary
- Letter: fontSize=36, color=white, fontWeight=700
- Info labels: color=$textSecondary, fontSize=14
- Info values: color=$text, fontSize=16
- Separator: borderColor=$border
- Sign out: danger Button variant

---

### Task 11: Update Tab Bar & Navigation

```
Tab bar:
  backgroundColor: $surface
  borderTopColor: $border
  activeTintColor: $primary
  inactiveTintColor: $textMuted

Stack headers:
  headerStyle.backgroundColor: $background
  headerTintColor: $text
```

---

### Task 12: Floating Action Button

Replace full-width bottom button with pill-shaped FAB.

```
Position: absolute, bottom=$lg, right=$lg
Style:
  bg: $primary
  borderRadius: $full
  paddingHorizontal: $lg
  height: 52
  shadowColor: $primary
  shadowOpacity: 0.3
  shadowRadius: 12
  elevation: 8

Press:
  scale: 0.94
  bg: $primaryDark

Content: icon (plus) + text, white, fontWeight=600
```

---

## Acceptance Criteria

- [ ] No hard-coded color values in any component (`#` hex values only in `tamagui.config.ts`)
- [ ] All components use Tamagui `styled()` or Tamagui primitives (YStack, XStack, Text, etc.)
- [ ] Light theme works correctly on all screens
- [ ] Dark theme matches specs above
- [ ] All interactive elements have minimum 44px touch target
- [ ] Press states are visible (scale + color shift, not just opacity)
- [ ] No `StyleSheet.create()` usage in component files
- [ ] TypeScript compiles without errors
- [ ] No visual regressions (app still functions correctly)

---

## Priority Order

1. Theme config (everything depends on this)
2. Button, Input, Card (base components)
3. Auth screens (first impression)
4. Tab bar & navigation (always visible)
5. SubjectCard, EntryCard, ItemCard (main content)
6. EmptyState, LoadingScreen, Profile (secondary)
7. FAB (enhancement)

---

## Notes

- Do NOT change any logic, hooks, or API calls — this is purely visual
- Keep all existing functionality (forms, validation, navigation)
- Test both themes by toggling `userInterfaceStyle` in `app.json`
- The violet primary (`#8B5CF6`) replaces blue (`#3b82f6`) everywhere
