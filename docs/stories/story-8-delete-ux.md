# Story 8: Explicit Delete Actions (Trash Buttons)

## Problem Statement

Users unfamiliar with mobile conventions (long press, swipe gestures) cannot discover how to delete items. The app relies on hidden interaction patterns that are not accessible to all users, violating the product principle of being "Simple" and "Fast."

## Current State

| Item | Delete Method | Discoverability |
|------|--------------|-----------------|
| Subject (Workout) | Header "Delete" button | Poor - text button in header |
| Entry (Session) | Header button | Poor - text button in header |
| Template Exercise | Small X icon | Moderate - visible but subtle |
| Set | **None** | None - cannot delete sets! |

## User Stories

### 8.1 Delete Set
**As a** user logging a workout
**I want to** delete a set I added by mistake
**So that** my workout log is accurate

**Acceptance Criteria:**
- [ ] Each set row has a visible trash icon button
- [ ] Tapping trash shows confirmation: "Delete Set 3?"
- [ ] Deleting a set re-numbers remaining sets (Set 1, Set 2, etc.)
- [ ] Works offline with optimistic update

### 8.2 Improved Subject Delete UX
**As a** user managing my workouts
**I want to** see a clear delete option on the subject screen
**So that** I don't have to hunt for the delete action

**Acceptance Criteria:**
- [ ] Subject detail screen has a "Danger Zone" section at bottom
- [ ] Red "Delete Workout" button with warning text
- [ ] Explains: "This will permanently delete all sessions and data"
- [ ] Requires typing workout name to confirm (prevents accidents)

### 8.3 Improved Entry Delete UX
**As a** user reviewing my sessions
**I want to** easily delete an entry if I logged by mistake
**So that** my history stays clean

**Acceptance Criteria:**
- [ ] Entry screen has visible trash icon in header (not text)
- [ ] OR bottom "Delete Entry" button in muted style
- [ ] Confirmation shows date: "Delete session from Jan 15?"

### 8.4 Delete Exercise from Entry
**As a** user logging a workout
**I want to** remove an exercise I added to this session
**So that** I can correct mistakes

**Acceptance Criteria:**
- [ ] Each exercise card has a subtle trash/remove icon
- [ ] Tapping shows confirmation with exercise name
- [ ] Deleting removes exercise and all its sets from this entry

## Technical Implementation

### API Changes
- `deleteSet(userId, setId)` - already exists in shared package, needs to be exposed
- After delete, remaining sets need `set_index` updated for proper numbering

### Components to Modify
1. `ExerciseInputCard.tsx` - Add trash icon per set row
2. `ItemCard.tsx` - Add delete exercise option
3. `entry/[id].tsx` - Improve header delete button
4. `subject/[id].tsx` - Add danger zone section

## Design Notes

- Trash icons should be `$textMuted` color, not red (reduces visual noise)
- Only turn red on hover/press
- Confirmations should be clear about what's being deleted

## Priority
**High** - This is a usability blocker for non-technical users

## Estimated Effort
**Medium** - 3-4 hours for all delete UX improvements
