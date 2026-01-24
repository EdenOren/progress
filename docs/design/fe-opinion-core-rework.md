# Frontend Agent Opinion: Core Flow Rework

## Overall Assessment

The proposed UX is the right direction. Main concerns are around component complexity for the session input screen, performance with many simultaneous inputs, and keyboard management on mobile.

---

## Component Architecture

### Current structure (simple)
```
EntryScreen → ItemCard (display only) → AddItemModal (name input)
```

### Proposed structure (complex)
```
EntryScreen
  → ExerciseInputCard (per exercise)
    → LastPerformanceRef (muted "Last: ..." line)
    → SetRow[] (weight + reps inputs + copy button)
    → AddSetButton
    → FeedbackButtons (easy/good/hard/failed)
  → AddExerciseSheet (autocomplete + icon picker)
```

The `ExerciseInputCard` is the most complex component in the app. It needs:
- Multiple controlled inputs (weight × reps × N sets)
- Local state for sets (add/remove dynamically)
- Copy-from-last-session logic per set
- Feedback selection state
- Mutation to save (debounced or on blur/complete)

**Recommendation**: Build `ExerciseInputCard` as a self-contained component with its own local state. Save to server on blur (per-set) or on session complete (batch). Don't use react-hook-form here — too many dynamic fields. Use `useState` with a sets array.

---

## State Management Concern

A session with 6 exercises × 4 sets = 24 input pairs (weight + reps) = 48 text inputs on one screen.

**Performance strategy:**
- Use `FlatList` (not ScrollView) for exercise cards — only renders visible
- Each `ExerciseInputCard` manages its own state (not lifted to parent)
- Mutations fire per-exercise (not all-at-once) to avoid large payloads
- Use `useMutation` with `onSettled` to mark individual exercises as saved

**Keyboard handling:**
- Use `KeyboardAwareScrollView` or Expo's `KeyboardAvoidingView`
- Tab/next should move between inputs within a set row (weight → reps → next set)
- Numeric keyboard for weight/reps inputs (`keyboardType="decimal-pad"`)

---

## Autocomplete UX

For the exercise search when adding to a workout template:

```
┌──────────────────────────────┐
│ 🔍 Search exercises...       │  ← Input with debounced search
├──────────────────────────────┤
│ 🏋️ Bench Press         chest │  ← Results with icon + muscle group
│ 🏋️ Incline Bench Press chest │
│ 💪 Barbell Curl        arms  │
│ ...                          │
├──────────────────────────────┤
│ + Create "..." as custom     │  ← Shown when no exact match
└──────────────────────────────┘
```

Implementation:
- Use a bottom sheet (Modal with `presentationStyle="pageSheet"`)
- `TextInput` with 300ms debounce → calls `searchExercises`
- FlatList of results with icons
- "Create custom" row appears when query doesn't exactly match any result
- On select → navigate to icon picker (if custom) or add directly

**Icon rendering**: Use `MaterialCommunityIcons` with the icon key from the exercise record. Simple `<MaterialCommunityIcons name={exercise.icon} size={20} color={theme.primary} />`.

---

## Session Input Flow

### Starting a session (revised)

```
User taps "+ Start Session" on subject detail
  → Frontend calls getWorkoutTemplate(subjectId)
  → Frontend calls createEntry(subjectId, today)
  → Frontend creates items from template (batch insert)
  → Frontend fetches last entry's items+sets for reference
  → Navigate to entry detail (now shows ExerciseInputCards)
```

This is ~4 API calls on session start. Should feel fast because:
- Template fetch is small (5-8 items)
- Entry creation is single insert
- Item batch insert is one request
- Last entry fetch already exists

Can parallelize: create entry + fetch last entry simultaneously.

---

## Copy Button UX Detail

The [⟳] button per set row:

```tsx
<Stack
  width={32}
  height={32}
  borderRadius={16}
  backgroundColor="rgba(139, 92, 246, 0.1)"
  alignItems="center"
  justifyContent="center"
  pressStyle={{ scale: 0.9, backgroundColor: "rgba(139, 92, 246, 0.2)" }}
  onPress={() => copyFromLast(setIndex)}
>
  <MaterialCommunityIcons name="content-copy" size={16} color={theme.primary} />
</Stack>
```

After tap: briefly flash green (`$success` at 20% opacity) to confirm copy, then return to normal.

---

## Concerns & Risks

| # | Concern | Mitigation |
|---|---------|------------|
| 1 | 48 inputs on one screen → keyboard jump chaos | Use `KeyboardAwareScrollView`, auto-scroll to focused input |
| 2 | Saving mid-session if user kills app | Auto-save sets on input blur (each set saved independently) |
| 3 | Template vs entry items out of sync | Template is "plan", entry items are "execution" — different tables, no sync needed |
| 4 | Offline/slow network during session | Optimistic UI: show inputs immediately, queue saves. Show sync status |
| 5 | Exercise icon not found | Fallback to `dumbbell` icon if icon key not recognized |
| 6 | Large exercise list scroll performance | FlatList with `getItemLayout` for fixed-height exercise cards |

---

## Phase Recommendation

Agree with the 4-phase approach. Frontend priority order:

1. **Exercise autocomplete + icon rendering** (most visible change, enables template building)
2. **Template management** (add/remove/reorder exercises in a workout)
3. **Session input cards** (the big component — ExerciseInputCard with set rows)
4. **Copy-from-last + feedback** (polish on top of working input)

Don't try to ship all 4 phases at once. Phase 1+2 can ship as an improvement even without the inline input rework.

---

## Summary

- ExerciseInputCard is the hardest component — build it isolated, test on device early
- FlatList for exercise list (not ScrollView) to handle 6+ exercises with sets
- Auto-save on blur per set for data safety
- Autocomplete in a bottom sheet with debounced search
- Copy button: small, per-set, with visual feedback
- Phase 1+2 shippable independently from 3+4
