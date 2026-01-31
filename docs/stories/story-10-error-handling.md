# Story 10: Robust Error Handling with Toast Notifications

## Status: COMPLETED

## Problem Statement

1. **Silent Failures**: When completing/updating a set, users see a cryptic error (`PGRST116: Cannot coerce the result to a single JSON object`) instead of a helpful message
2. **Intrusive Alerts**: Current errors use `Alert.alert()` which interrupts the user flow and requires dismissal
3. **Missing PGRST116 Handling**: Several API functions using `.single()` don't handle the "0 rows" case gracefully

## Root Cause: PGRST116 Error

The error `PGRST116` occurs when a Supabase query with `.single()` returns 0 rows. This happens in `updateSet()` when:
- The set was deleted by another session
- There's a user_id mismatch (RLS policy blocking)
- The set ID is invalid

**Current vulnerable functions** (use `.single()` without PGRST116 check):
- `updateSet()` - **Most likely culprit**
- `updateEntry()`
- `updateItem()`
- `updateFeedback()`
- `updateGoal()`

## User Stories

### 10.1 Toast Notifications Instead of Alerts
**As a** user logging a workout
**I want to** see non-intrusive error notifications
**So that** my flow isn't interrupted by modal dialogs

**Acceptance Criteria:**
- [x] Errors show as toast at bottom of screen
- [x] Toast auto-dismisses after 4 seconds
- [x] Toast can be swiped away
- [x] Toast has appropriate color (red for errors, green for success)
- [x] Multiple toasts stack or replace each other

### 10.2 User-Friendly Error Messages
**As a** user encountering an error
**I want to** see a clear, actionable message
**So that** I know what went wrong and what to do

**Error Message Mapping:**
| Technical Error | User Message |
|----------------|--------------|
| PGRST116 (0 rows) | "This item may have been deleted. Please refresh." |
| Network error | "No internet connection. Changes will sync when you're back online." |
| Auth error | "Session expired. Please sign in again." |
| Validation error | "Please check your input: [field errors]" |
| Rate limit | "Too many requests. Please wait a moment." |
| Server error (5xx) | "Something went wrong on our end. Please try again." |
| Unknown | "An unexpected error occurred. Please try again." |

### 10.3 Graceful PGRST116 Recovery
**As a** user whose set update fails
**I want to** have the app recover gracefully
**So that** I don't lose my workout data

**Acceptance Criteria:**
- [ ] If update fails with PGRST116, refetch the entry data
- [ ] Show toast: "Set was modified elsewhere. Refreshing..."
- [ ] Local state syncs with server state
- [ ] No data loss occurs

### 10.4 Offline-Aware Error Handling
**As a** user with spotty connection
**I want to** know when I'm offline vs when there's a real error
**So that** I'm not confused about why things aren't saving

**Acceptance Criteria:**
- [ ] Detect offline state
- [ ] Show subtle "Offline" indicator (not error toast)
- [ ] Queue changes for sync when back online
- [ ] Show "Back online - syncing..." when reconnected

### 10.5 Success Feedback
**As a** user completing an action
**I want to** see subtle confirmation that it worked
**So that** I have confidence my data was saved

**Acceptance Criteria:**
- [x] "Session completed!" toast when marking entry done
- [x] "Workout deleted" toast after deletion
- [x] Subtle checkmark animation on set save (not toast - too noisy)
- [x] Success toasts are green, shorter duration (2 seconds)

## Technical Implementation

### Toast Library
Use `react-native-toast-message` or `burnt` (native toasts):

```typescript
// packages/shared or apps/mobile/src/utils/toast.ts
import Toast from 'react-native-toast-message';

export function showErrorToast(message: string) {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
  });
}

export function showSuccessToast(message: string) {
  Toast.show({
    type: 'success',
    text1: message,
    position: 'bottom',
    visibilityTime: 2000,
  });
}
```

### Updated Error Handler
```typescript
// apps/mobile/src/utils/errorHandler.ts
export function handleError(error: unknown): void {
  const message = getErrorMessage(error);
  showErrorToast(message); // Instead of Alert.alert()
}

function getErrorMessage(error: unknown): string {
  // Handle PGRST116 specifically
  if (isSupabaseError(error) && error.code === 'PGRST116') {
    return 'This item may have been deleted. Please refresh.';
  }
  // ... existing error type checks
}
```

### Fix PGRST116 in API Layer
```typescript
// packages/shared/src/api/items.ts
export async function updateSet(...): Promise<Result<ItemSet>> {
  const { data, error } = await supabase
    .from('item_sets')
    .update(updates)
    .eq('id', setId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    // Handle "no rows" case gracefully
    if (error.code === 'PGRST116') {
      return err(new NotFoundError('Set'));
    }
    return err(mapSupabaseError(error));
  }
  // ...
}
```

### Files to Modify

1. **API Layer** (`packages/shared/src/api/`):
   - `items.ts` - Add PGRST116 handling to update functions
   - `entries.ts` - Add PGRST116 handling to updateEntry
   - `feedback.ts` - Add PGRST116 handling to updateFeedback

2. **Error Handler** (`apps/mobile/src/utils/errorHandler.ts`):
   - Replace `Alert.alert()` with toast
   - Add PGRST116 message mapping

3. **Root Layout** (`apps/mobile/app/_layout.tsx`):
   - Add `<Toast />` component at root

4. **New File** (`apps/mobile/src/utils/toast.ts`):
   - Toast helper functions

### Dependencies to Add
```bash
npm install react-native-toast-message --workspace=apps/mobile
```

## Design Notes

### Toast Appearance
- **Error**: Red background (#EF4444), white text, error icon
- **Success**: Green background (#22C55E), white text, checkmark icon
- **Warning**: Amber background (#F59E0B), dark text
- **Info**: Blue background (#3B82F6), white text

### Position
- Bottom of screen (doesn't cover header navigation)
- Above tab bar if present
- Slides in from bottom with subtle animation

### Accessibility
- Toasts announced by screen readers
- Not auto-dismissed for critical errors (require tap)
- High contrast colors

## Priority
**High** - Error handling is broken and users see cryptic messages

## Estimated Effort
**Medium** - 3-4 hours total:
- 1 hour: Install toast library, setup root component
- 1 hour: Update error handler and add message mapping
- 1 hour: Fix PGRST116 in all API functions
- 1 hour: Add success toasts for key actions
