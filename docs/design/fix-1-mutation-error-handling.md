# Fix 1: Mutation Error Handling & Loading States

**Branch**: `fix/1-mutation-error-handling`

## Problem (from QA Report)

Multiple screens call `mutateAsync()` or `mutate()` without:
- Checking `isPending` state (allows spam-clicking)
- Showing loading indicators during async operations
- Handling errors in Alert callback onPress handlers

This causes silent failures, duplicate mutations, and confused users.

## Affected Locations

1. **`apps/mobile/app/entry/[id].tsx`**
   - `completeEntry.mutateAsync()` in Alert onPress — no try-catch, no loading
   - `deleteEntry.mutateAsync()` in Alert onPress — same issue
   - No error state shown if entry fetch fails (infinite LoadingScreen)

2. **`apps/mobile/app/subject/[id].tsx`**
   - `hardDelete.mutate()` — no isPending check, no loading state on button
   - `createEntry.mutateAsync()` — catch block swallows error silently

3. **`apps/mobile/app/(tabs)/index.tsx`**
   - `hardDelete.mutate()` — no isPending check, user can spam long-press delete

## Acceptance Criteria

- [ ] All mutation-triggered buttons disable while `isPending === true`
- [ ] Alert-based mutations wrapped in try-catch with error display
- [ ] Delete buttons in subject detail header shows loading state
- [ ] Entry detail shows error state (not infinite loading) if fetch fails
- [ ] FAB buttons disable during pending mutations
- [ ] Complete Session button shows spinner while completing

---

## Implementation Tasks

### Task 1: Fix entry detail mutations
In `apps/mobile/app/entry/[id].tsx`:
- Wrap `completeEntry.mutateAsync()` and `deleteEntry.mutateAsync()` in try-catch
- Add `isPending` checks before showing Alert
- Show loading state on Complete Session FAB (`completeEntry.isPending`)
- Add error state check: if `!isLoading && !entry`, show EmptyState with error message

### Task 2: Fix subject detail mutations
In `apps/mobile/app/subject/[id].tsx`:
- Check `hardDelete.isPending` before allowing delete (disable button or show spinner)
- Header right "Delete" button: show ActivityIndicator when deleting
- Fix createEntry catch block: show error to user via `getErrorMessage()`

### Task 3: Fix workouts list mutations
In `apps/mobile/app/(tabs)/index.tsx`:
- Check `hardDelete.isPending` in `handleSubjectLongPress` — return early if pending
- Optionally: show which card is being deleted (opacity change)

---

## Priority
Critical — silent failures erode user trust and cause data confusion.
