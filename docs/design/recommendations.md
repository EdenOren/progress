# UI/UX Design Recommendations

## Current Issues

### 1. Broken Theme System
Components hard-code dark colors (`#0a0a0a`, `#f9fafb`, `#374151`) instead of using Tamagui theme tokens. The app has a light/dark theme config but only dark mode actually works. This is the biggest technical debt.

### 2. Mixed Styling Approaches
- `Button.tsx`, `Input.tsx`, `Card.tsx`, `LoadingScreen.tsx` use React Native `StyleSheet.create()`
- `EmptyState.tsx`, `ItemCard.tsx`, modals use Tamagui components
- This creates visual inconsistency and makes theming impossible

### 3. Flat Visual Hierarchy
- Cards all look the same (same background, same border, same radius)
- No visual weight difference between primary content and secondary info
- Screens feel like flat lists of identical boxes

### 4. Weak Typography Scale
- Mix of Tamagui tokens (`$5`, `$9`) and hardcoded pixels (`13px`, `15px`)
- No clear typographic hierarchy (headings vs body vs captions)
- Font weights not consistently applied

### 5. Poor Interactive Feedback
- Buttons only change opacity on press (no depth/scale change)
- Cards scale to 0.98 which is barely perceptible
- No micro-animations or transitions between states

### 6. Inconsistent Spacing
- Some areas use Tamagui gaps (`$2`, `$3`)
- Others use inline pixel values (`16px`, `24px`)
- No rhythm to vertical spacing between sections

### 7. Generic Appearance
- Default blue (#3b82f6) used everywhere — feels like a template
- No brand personality or distinguishing visual identity
- Could be any app

---

## Design Direction

### Visual Identity: "Dark Athletic"
A confident, high-contrast dark interface that feels energetic and focused — like a gym timer or performance dashboard.

### Proposed Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#8B5CF6` (Violet) | CTAs, active states, primary accent |
| `primaryLight` | `#A78BFA` | Hover/focus rings, secondary accent |
| `primaryDark` | `#7C3AED` | Pressed states |
| `background` | `#09090B` | App background (zinc-950) |
| `surface` | `#18181B` | Cards, elevated surfaces (zinc-900) |
| `surfaceHover` | `#27272A` | Pressed cards (zinc-800) |
| `border` | `#27272A` | Default borders (zinc-800) |
| `borderFocus` | `#8B5CF6` | Focus rings |
| `text` | `#FAFAFA` | Primary text (zinc-50) |
| `textSecondary` | `#A1A1AA` | Secondary text (zinc-400) |
| `textMuted` | `#71717A` | Muted/disabled text (zinc-500) |
| `success` | `#10B981` | Completed, positive feedback |
| `warning` | `#F59E0B` | In-progress, caution |
| `error` | `#EF4444` | Failed, destructive |

### Typography Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| `heading1` | 28px | 700 | Screen titles |
| `heading2` | 22px | 600 | Section titles |
| `heading3` | 18px | 600 | Card titles |
| `body` | 16px | 400 | Default text |
| `bodyBold` | 16px | 600 | Emphasis text |
| `caption` | 14px | 400 | Secondary info |
| `small` | 12px | 500 | Labels, badges |

### Spacing Scale (4px base)

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |

### Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Buttons, inputs, badges |
| `md` | 12px | Cards |
| `lg` | 16px | Modals, sheets |
| `full` | 9999px | Avatars, pills |

---

## Component Redesign Specs

### Button
- All variants use Tamagui `styled()` — no StyleSheet
- Press state: `scale(0.96)` + darker shade (not just opacity)
- Minimum touch target: 44px height
- Border radius: `sm` (8px)
- Font weight: 600 across all variants
- Primary: violet background, white text
- Secondary: transparent, violet border, violet text
- Ghost: transparent, no border, violet text
- Danger: red background, white text

### Input
- Use Tamagui `Input` or custom `styled()` — no StyleSheet
- Theme-aware colors (use `$background`, `$color`, `$borderColor` tokens)
- Focus: violet border ring (2px)
- Error: red border + error text below
- Height: 48px
- Border radius: `sm` (8px)

### Card
- Use Tamagui `styled()` — no StyleSheet
- Background: `$surface`
- Border: 1px `$border`
- Radius: `md` (12px)
- Padding: `$md` (16px)
- Press state (if interactive): background → `$surfaceHover`, scale 0.98

### SubjectCard (enhanced)
- Left accent bar (3px, `$primary`) on the left edge
- Title: `heading3` (18px, 600)
- Description: `caption` (14px, 400, `$textSecondary`)
- Bottom row: entry count pill + last entry date
- Entry count pill: `$surface` background, small text

### EntryCard (enhanced)
- Date: `bodyBold` (16px, 600)
- Relative time: `caption`, `$textMuted`
- Status badge: pill shape (`$full` radius), colored background at 20% opacity + colored text
- Notes preview: `caption`, `$textSecondary`, italic

### ItemCard (enhanced)
- Exercise name: `heading3`
- Sets displayed in a compact grid (not stacked list)
- Each set: small pill showing `weight x reps`
- Volume change: arrow icon + percentage, colored
- Feedback buttons: pill-shaped, icon + text

### EmptyState
- Large icon/illustration (64px) above text
- Title: `heading2`
- Message: `body`, `$textSecondary`
- CTA button: primary variant, full width

### Floating Action Button
- Circular (56px) or pill-shaped with icon + text
- Violet background
- Shadow/elevation for depth
- Position: bottom-right, 24px inset

---

## Screen Layout Improvements

### Subject List (Home)
- Header: "Workouts" as `heading1`, with subtitle showing total count
- Cards separated by `$md` (16px) gap
- FAB at bottom-right (not full-width button)
- Group subjects by domain when multiple domains exist

### Subject Detail
- Large header area: subject name (`heading1`) + description
- Section title "Sessions" as `heading2`
- Entry cards with clearer visual hierarchy
- FAB: "Start Session" pill-shaped

### Entry Detail
- Top status card with icon + status text
- Clear sections: "Exercises", "Notes"
- Section dividers (subtle line or heading)
- Inline set addition feels lighter (no heavy modal for quick add)

### Auth Screens
- Larger top spacing to feel premium
- App logo/icon above form
- Subtle gradient or pattern in background for personality
- Social auth buttons with provider icons

### Profile
- Larger avatar (100px)
- Stats row below avatar (total sessions, streak, etc.)
- Settings grouped in sections with headers

---

## Accessibility Requirements
- All interactive elements: minimum 44x44 touch target
- Color contrast: minimum 4.5:1 for text, 3:1 for large text
- Focus indicators: visible violet ring on focused elements
- Support Dynamic Type / font scaling
- Status communicated via more than just color (icons + text)
