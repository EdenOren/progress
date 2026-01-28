# Story 11: Critical Bug Fixes

## Status: COMPLETED

## Issues Reported

### 11.1 Template Section Not Visible ✅
**Description**: The template section (where users add exercises to their workout routine) is not appearing on the Subject Detail page.

**Root Cause**: The components were using `$text` as a Tamagui theme token, but this token was not defined in the custom theme config. The correct token is `$color`.

**Fix Applied**:
- Changed `color="$text"` to `color="$color"` in TemplateSection.tsx
- Changed `'$text'` to `'$color'` in AddExerciseSheet.tsx

---

### 11.2 Long Press Delete Not Working ✅
**Description**: Long press gesture to delete items is not triggering the delete action.

**Root Cause**: The entry cards in subject/[id].tsx were not passing an `onLongPress` handler to the Card component.

**Fix Applied**:
- Added `useDeleteEntry` hook import
- Added `handleDeleteEntry` function with Alert confirmation
- Added `onLongPress` prop to entry Card components

---

### 11.3 Trash Icons Not Visible ✅
**Description**: The trash icons added in Story 8 are not appearing in the UI.

**Root Cause**: The trash icons had low opacity (0.6) and a muted gray color that blended with the background.

**Fix Applied**:
- Increased icon size from 16px to 18px
- Changed color from muted gray to error red
- Added red-tinted background for better visibility
- Set opacity to 1 (was 0.6)

---

### 11.4 Feedback Buttons Not Working ✅
**Description**: The success/hard/fail feedback buttons don't respond to clicks.

**Root Cause**:
1. The `item_feedback` table lacked a UNIQUE constraint on `item_id`, which is required for the upsert with `onConflict: 'item_id'` to work properly
2. No success toast was shown after saving feedback

**Fix Applied**:
- Created migration `003_feedback_unique_constraint.sql` to add UNIQUE constraint on item_id
- Added success toast notification when feedback is saved

---

## Priority
**Critical** - These are core functionality bugs blocking basic usage

## Estimated Effort
**Medium** - 2-4 hours for investigation and fixes

## Acceptance Criteria
- [x] Template section visible on subject detail page
- [x] Can add exercises to template
- [x] Trash icons visible on set rows
- [x] Trash icons visible in headers
- [x] Delete functionality works (either via icon or long press)
- [x] Feedback buttons respond to clicks and save rating

## Files Modified
- `apps/mobile/app/subject/[id].tsx` - Added long press delete for entries
- `apps/mobile/src/components/TemplateSection.tsx` - Fixed theme token
- `apps/mobile/src/components/AddExerciseSheet.tsx` - Fixed theme tokens
- `apps/mobile/src/components/ExerciseInputCard.tsx` - Improved trash icon visibility, added feedback toast
- `supabase/migrations/003_feedback_unique_constraint.sql` - New migration

## Note
After deploying, the database migration needs to be applied:
```bash
npx supabase db push
```
