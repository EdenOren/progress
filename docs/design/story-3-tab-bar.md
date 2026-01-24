# Story 3: Improve Tab Bar

**Branch**: `story/3-tab-bar`

## Problem

The bottom tab bar currently has no icons — only text labels. It looks bare, is harder to scan at a glance, and doesn't meet standard mobile UX expectations. The active/inactive states have minimal visual distinction.

## Product Requirements

### Acceptance Criteria
- [ ] Each tab has a recognizable icon above its label
- [ ] Active tab icon is filled/solid, inactive is outline style
- [ ] Active tab has clear visual weight (color + fill change)
- [ ] Tab bar matches the app's dark athletic theme
- [ ] Icons are vector-based (crisp at all resolutions)
- [ ] No heavy icon library — use `@expo/vector-icons` (already bundled with Expo)

---

## UI/UX Design Spec

### Tab Configuration

| Tab | Label | Icon (active) | Icon (inactive) | Icon family |
|-----|-------|---------------|-----------------|-------------|
| Workouts | Workouts | `dumbbell` (solid) | `dumbbell` (outline) | MaterialCommunityIcons |
| Profile | Profile | `account-circle` (solid) | `account-circle-outline` | MaterialCommunityIcons |

### Tab Bar Styling

```
Tab bar container:
  - backgroundColor: $surface (dark: #18181B, light: #FFFFFF)
  - borderTopWidth: 1
  - borderTopColor: $borderColor (dark: #27272A, light: #E4E4E7)
  - height: 60 (provides breathing room for icon + label)
  - paddingBottom: safe area inset

Active tab:
  - Icon: filled variant, color=$primary (#8B5CF6)
  - Label: fontSize=11, fontWeight=600, color=$primary
  - Icon size: 24

Inactive tab:
  - Icon: outline variant, color=$textMuted (dark: #71717A, light: #A1A1AA)
  - Label: fontSize=11, fontWeight=400, color=$textMuted
  - Icon size: 24
```

### Tokens Used
- Active color: `$primary` (#8B5CF6)
- Inactive color: `$textMuted`
- Background: `$surface`
- Border: `$borderColor`

---

## Implementation Tasks

### Task 1: Add icons to tab screens
- In `apps/mobile/app/(tabs)/_layout.tsx`:
  - Import `MaterialCommunityIcons` from `@expo/vector-icons`
  - Add `tabBarIcon` to each `Tabs.Screen` options
  - Use `focused` parameter to toggle filled/outline variants
  - Set icon size to 24

### Task 2: Refine tab bar styling
- Update `screenOptions.tabBarStyle`:
  - Height: 60
  - Remove any hard shadows, keep subtle top border
- Add `tabBarLabelStyle` with fontSize 11
- Ensure safe area padding (already handled by Expo Tabs)

---

## Priority
High — tab bar is visible on every authenticated screen and currently looks unfinished.
