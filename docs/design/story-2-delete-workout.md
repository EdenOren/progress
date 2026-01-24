# Story 2: Delete Workout (with Children)

**Branch**: `story/2-delete-workout`

## Problem

There is no way to delete a workout (subject) from the app. Users who create workouts by mistake or no longer need them are stuck with them forever.

## Product Requirements

### User Flow
1. User long-presses on a workout card in the list
2. A context menu appears with "Delete" option
3. User taps "Delete"
4. A confirmation dialog appears: "Delete [name]? This will permanently remove this workout and all its sessions. This cannot be undone."
5. User confirms → workout and all children are hard-deleted (cascades via DB foreign keys)
6. List refreshes immediately

### Acceptance Criteria
- [ ] Long-press on workout card shows context menu
- [ ] Confirmation dialog before delete (prevents accidental deletion)
- [ ] Hard delete (not soft delete) — removes subject and all entries/items/sets/feedback/goals
- [ ] List updates immediately after deletion (React Query cache invalidation)
- [ ] Error handling if delete fails (show error toast)
- [ ] Cannot delete while another operation is in progress

---

## UI/UX Design Spec

### Interaction: Long-press Context Menu

```
On long-press of a workout card:

  [Context menu / Action sheet]
    - "Delete Workout"  (color=$error, destructive)
    - "Cancel"          (color=$textSecondary)
```

- Use React Native's `ActionSheetIOS` on iOS / custom bottom sheet on Android
- Or: use a cross-platform Alert with destructive button styling

### Confirmation Dialog

```
Alert:
  Title: "Delete Workout?"
  Message: "This will permanently delete "{name}" and all its sessions,
            exercises, and sets. This cannot be undone."
  Buttons:
    - "Cancel"  (default, cancel style)
    - "Delete"  (destructive style, color=$error)
```

### States
- **Long-press active**: Card shows subtle scale-down (pressStyle scale: 0.97)
- **Deleting**: Show loading indicator briefly on the card being deleted
- **Error**: Toast/banner with error message

---

## Implementation Tasks

### Task 1: Add hard delete API function
- Add `hardDeleteSubject(userId: string, subjectId: string)` in `packages/shared/src/api/subjects.ts`
- Uses `supabase.from('subjects').delete().eq('id', subjectId).eq('user_id', userId)`
- DB cascades handle children (entries → items → sets/feedback, goals)
- Returns `Result<void>`
- Export from shared index

### Task 2: Add delete mutation hook
- Add `useHardDeleteSubject()` in `apps/mobile/src/hooks/useSubjects.ts`
- Invalidates subjects and subjectsWithStats queries on success
- Handles error via central error handler

### Task 3: Add delete interaction to workout list
- In `apps/mobile/app/(tabs)/index.tsx`:
  - Add `onLongPress` handler to workout card
  - Show platform-appropriate confirmation (Alert.alert with destructive button)
  - Call `hardDeleteSubject` mutation on confirm
  - Show loading state during deletion

### Task 4: Also allow delete from subject detail screen
- In `apps/mobile/app/subject/[id].tsx`:
  - Add a header-right button (trash icon or "..." menu)
  - Same confirmation flow as above
  - Navigate back to workouts list after successful deletion

---

## Priority
Medium — prevents clutter and supports basic CRUD completeness.
