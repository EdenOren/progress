# Story 11: Critical Bug Fixes

## Issues Reported

### 11.1 Template Section Not Visible
**Description**: The template section (where users add exercises to their workout routine) is not appearing on the Subject Detail page.

**Expected Behavior**:
- Subject detail page should show "Exercises (X)" header with "+ Add" button
- Users can add exercises to create a reusable template
- When starting a session, template exercises are pre-filled

**Current Behavior**:
- Template section not visible at all

**Investigation Needed**:
- Check if TemplateSection component is rendering
- Check if useWorkoutTemplate hook is returning data
- Check for CSS/layout issues hiding the section
- Check if there are console errors

**Files to Check**:
- `apps/mobile/app/subject/[id].tsx` - TemplateSection usage
- `apps/mobile/src/components/TemplateSection.tsx` - Component implementation
- `apps/mobile/src/hooks/useTemplates.ts` - Data fetching

---

### 11.2 Long Press Delete Not Working
**Description**: Long press gesture to delete items is not triggering the delete action.

**Expected Behavior**:
- Long press on cards/items should show delete confirmation
- Works on both mobile and web

**Current Behavior**:
- Long press does nothing

**Investigation Needed**:
- Check if onLongPress prop is being passed to Card components
- Check if web supports long press (may need different approach for web)
- Review where long press delete was supposed to be implemented

**Files to Check**:
- `apps/mobile/src/components/Card.tsx` - onLongPress prop
- Components using Card with delete functionality

---

### 11.3 Trash Icons Not Visible
**Description**: The trash icons added in Story 8 are not appearing in the UI.

**Expected Behavior**:
- Each set row should have a trash icon button
- Header delete buttons should show trash icon instead of text
- Icons should be visible and clickable

**Current Behavior**:
- Trash icons not rendering

**Investigation Needed**:
- Check if MaterialCommunityIcons is properly imported
- Check icon color vs background contrast
- Check if icons are being hidden by layout/overflow
- Verify the trash icon name is correct ("trash-can-outline")

**Files to Check**:
- `apps/mobile/src/components/ExerciseInputCard.tsx` - Set delete button
- `apps/mobile/app/entry/[id].tsx` - Header trash icon
- `apps/mobile/app/subject/[id].tsx` - Header trash icon

---

### 11.4 Feedback Buttons Not Working (Complete Exercise)
**Description**: The success/hard/fail feedback buttons don't respond to clicks.

**Expected Behavior**:
- Clicking feedback button saves the rating
- Button shows selected state
- Toast notification confirms save

**Current Behavior**:
- Buttons don't respond or nothing happens

**Root Cause Candidates**:
1. Text selection interfering with clicks (partially fixed)
2. setFeedback API not working (RLS issue?)
3. Button onPress not firing
4. Mutation error being swallowed

**Investigation Needed**:
- Add console.log to feedbackMutation to trace execution
- Check Supabase RLS policies on item_feedback table
- Verify the mutation is being called on press
- Check if error toast is being suppressed

---

## Priority
**Critical** - These are core functionality bugs blocking basic usage

## Estimated Effort
**Medium** - 2-4 hours for investigation and fixes

## Acceptance Criteria
- [ ] Template section visible on subject detail page
- [ ] Can add exercises to template
- [ ] Trash icons visible on set rows
- [ ] Trash icons visible in headers
- [ ] Delete functionality works (either via icon or long press)
- [ ] Feedback buttons respond to clicks and save rating
