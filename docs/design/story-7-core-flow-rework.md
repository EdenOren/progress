# Story 7: Core Workout Flow Rework

**Branch**: `story/7-core-flow-rework`

## Problem

The current flow requires users to manually add exercises from scratch every session. There's no exercise library, no templates, no autocomplete, and no side-by-side last-performance view during input. The app doesn't deliver on its core promise: **see your last performance and plan today's workout accordingly.**

---

## Current vs. Intended Flow

### Current (broken)
```
Create Workout → Start Session → Manually add each exercise → Add sets → Complete
                                  (no memory of last time)
```

### Intended
```
Create Workout → Pick exercises from library (autocomplete + icons) → Save as template
                                    ↓
                         Set default rep scheme per exercise (12/10/8)
                                    ↓
Start Session → Exercises pre-loaded from template → Enter weights/reps
                                                      ↓
                                              See last session's numbers inline
                                              [⟳] Copy button per set
                                              Plan progressive overload
                                                      ↓
                                              Optionally add extra exercise
                                              (one-time or permanent)
```

---

## Product Requirements

### 1. Exercise Library

A system-level catalog of common exercises with icons.

```
exercise_library table:
  - id, name, icon, category, muscle_group, tracking_type
  - tracking_type: 'weight_reps' | 'duration' | 'distance'
  - Examples:
    - Bench Press, icon: "dumbbell", category: "strength", muscle_group: "chest", tracking_type: "weight_reps"
    - Treadmill Run, icon: "run", category: "cardio", muscle_group: "cardio", tracking_type: "duration"
```

- Pre-seeded with ~40 common exercises (see exercise-library-seed.md)
- User can search/filter with autocomplete (ILIKE, debounced 300ms)
- If not found → create custom exercise (name + pick icon from 10 available icons)
- Custom exercises saved to user's personal library
- **Icons**: MaterialCommunityIcons (dumbbell, weight-lifter, arm-flex, human-handsup, human, run, bike, rowing, yoga, stairs-up)

### 2. Exercise Tracking Types

Different exercises track different metrics:

| Type | Fields | Example |
|------|--------|---------|
| `weight_reps` | weight_kg, reps | Bench Press: 80kg × 8 |
| `duration` | duration_seconds | Running: 15 min |
| `distance` | distance_meters, duration_seconds | Rowing: 2000m in 8:30 |

- Default is `weight_reps` (most exercises)
- Cardio exercises use `duration` or `distance`
- UI adapts input fields based on tracking type

### 3. Workout Template with Default Sets

When a user creates a workout and adds exercises, those exercises become the **template** with default rep schemes.

```
workout_templates table:
  - subject_id, exercise_id, position, default_sets, is_active
  - default_sets: JSONB array of set templates
```

**Default sets example** (Bench Press with pyramid scheme):
```json
[
  { "target_reps": 12 },
  { "target_reps": 10 },
  { "target_reps": 8 }
]
```

**Duration exercise example** (Running):
```json
[
  { "target_duration_seconds": 900 }  // 15 minutes
]
```

- Template items are the default exercises shown every session
- Each template item has preset sets (user defines rep targets when adding)
- User can reorder template items
- User can edit/remove items from template

### 4. Entry Flow (Start Session)

When user starts a new session:
1. **Create entry** + **copy template items** (client-side batch insert, per BE recommendation)
2. Each item shows **last session's performance** as reference (not pre-filled)
3. **Set count** from template's default_sets (or last session if exists)
4. User enters today's numbers for each exercise
5. User can:
   - **[⟳] Copy** from last session per set
   - **Add extra exercise** (one-time or permanent)
   - **Skip an exercise** — leave it empty, still part of template

### 5. Performance Input UX (Reference + Copy Pattern)

Per UI agent recommendation — show reference, don't pre-fill:

```
┌─────────────────────────────────────────┐
│ 🏋️ Bench Press                          │
│                                         │
│ Last: 80kg×8 · 85kg×6 · 85kg×5         │  ← muted reference line
│                                         │
│ Set 1: [____] kg × [____] reps   [⟳]   │  ← empty inputs + copy button
│ Set 2: [____] kg × [____] reps   [⟳]   │
│ Set 3: [____] kg × [____] reps   [⟳]   │
│                                         │
│ [+ Add Set]                             │
│                                         │
│ [😊 Easy] [👍 Good] [💪 Hard] [❌ Failed]│
└─────────────────────────────────────────┘
```

**For duration exercises (cardio)**:
```
┌─────────────────────────────────────────┐
│ 🏃 Treadmill Run                        │
│                                         │
│ Last: 15:00                             │
│                                         │
│ Duration: [____] min [____] sec   [⟳]  │
│                                         │
│ [😊 Easy] [👍 Good] [💪 Hard] [❌ Failed]│
└─────────────────────────────────────────┘
```

**Behavior**:
- Set count pre-matches template's default_sets (or last session)
- Input fields start **empty** — user actively enters values
- **[⟳] copy button** per set — taps to fill from last session
- **"Last:"** line always visible as context
- Auto-save on blur (per-set) for data safety

### 6. Progress View

After completing sessions, the workout card on home screen shows:
- Last session date
- Summary: "3/5 exercises improved" or volume trend

---

## Acceptance Criteria

- [ ] Exercise library with autocomplete search (bottom sheet modal)
- [ ] Icons for each exercise (MaterialCommunityIcons)
- [ ] Custom exercise creation with icon picker
- [ ] Exercise tracking types: weight_reps, duration, distance
- [ ] Workout template with default rep schemes per exercise
- [ ] Starting a session pre-loads template exercises with preset sets
- [ ] Each exercise shows last session's performance as reference
- [ ] Per-set [⟳] copy button to fill from last session
- [ ] User can add sets and enter weight/reps (or duration) per set
- [ ] "Add exercise" option during session (one-time or permanent)
- [ ] Feedback per exercise (easy/good/hard/failed)
- [ ] Auto-save on input blur for data safety

---

## Data Model (Incorporating BE Feedback)

### New: `exercise_library` table
```sql
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'bodyweight', 'cardio', 'flexibility')),
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body')),
  tracking_type TEXT NOT NULL DEFAULT 'weight_reps' CHECK (tracking_type IN ('weight_reps', 'duration', 'distance')),
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique indexes (per BE recommendation - handles NULL created_by)
CREATE UNIQUE INDEX idx_exercise_system_name ON exercise_library(name) WHERE is_system = true;
CREATE UNIQUE INDEX idx_exercise_user_name ON exercise_library(name, created_by) WHERE is_system = false;

-- RLS: System exercises visible to all, custom only to creator
CREATE POLICY "View system or own exercises"
  ON exercise_library FOR SELECT
  USING (is_system = true OR auth.uid() = created_by);

CREATE POLICY "Create own exercises"
  ON exercise_library FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_system = false);
```

### New: `workout_templates` table
```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id),
  position INTEGER NOT NULL,
  default_sets JSONB NOT NULL DEFAULT '[{"target_reps": 10}]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(subject_id, exercise_id)
);

-- RLS: Access through subject ownership
CREATE POLICY "Manage own workout templates"
  ON workout_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  );
```

### Modified: `items` table
```sql
-- Add columns (nullable for backward compat)
ALTER TABLE items ADD COLUMN exercise_id UUID REFERENCES exercise_library(id);
ALTER TABLE items ADD COLUMN is_from_template BOOLEAN DEFAULT TRUE;
ALTER TABLE items ADD COLUMN tracking_type TEXT DEFAULT 'weight_reps' CHECK (tracking_type IN ('weight_reps', 'duration', 'distance'));
```

### Modified: `item_sets` table
```sql
-- Add columns for duration/distance tracking
ALTER TABLE item_sets ADD COLUMN duration_seconds INTEGER;
ALTER TABLE item_sets ADD COLUMN distance_meters NUMERIC(10,2);
ALTER TABLE item_sets ADD COLUMN target_reps INTEGER;
ALTER TABLE item_sets ADD COLUMN target_duration_seconds INTEGER;
```

---

## API Functions (per BE recommendation)

| Function | Returns | Purpose |
|----------|---------|---------|
| `searchExercises(query, userId)` | `Exercise[]` | Autocomplete (ILIKE, limit 20) |
| `getExerciseById(id)` | `Exercise` | Single lookup |
| `createCustomExercise(input)` | `Exercise` | User-created exercise |
| `getWorkoutTemplate(subjectId)` | `TemplateItem[]` | Get template for a workout |
| `addToTemplate(subjectId, exerciseId, defaultSets, position)` | `TemplateItem` | Add exercise to template |
| `updateTemplateItem(templateItemId, defaultSets)` | `TemplateItem` | Update default sets |
| `removeFromTemplate(templateItemId)` | `void` | Remove from template |
| `reorderTemplate(subjectId, items[])` | `void` | Reorder template |
| `createEntryWithItems(subjectId, templateItems)` | `Entry + Item[]` | Start session (batch insert) |

---

## Component Architecture (per FE recommendation)

```
EntryScreen (session input)
  → FlatList (not ScrollView — handles 6+ exercises)
    → ExerciseInputCard (self-contained, per exercise)
      → LastPerformanceRef (muted "Last: ..." line)
      → SetRow[] (inputs + copy button)
        → WeightRepsInput | DurationInput | DistanceInput (based on tracking_type)
        → CopyButton [⟳]
      → AddSetButton
      → FeedbackButtons (easy/good/hard/failed)
  → AddExerciseSheet (bottom sheet with autocomplete)
```

**ExerciseInputCard** is self-contained:
- Manages its own local state (not lifted to parent)
- Uses useState with sets array (not react-hook-form)
- Auto-saves on blur (per-set mutation)
- Handles copy-from-last logic internally

**Performance strategy**:
- FlatList with `getItemLayout` for fixed-height cards
- Each card manages own state (isolated re-renders)
- Mutations fire per-exercise (not all-at-once)
- Use `KeyboardAwareScrollView` for keyboard handling

---

## Implementation Phases

### Phase 1: Exercise Library + Autocomplete ✅ DONE
- Create `exercise_library` table with seed data (40 exercises)
- Migration: add columns to items/item_sets
- API: searchExercises, getExerciseById, createCustomExercise
- UI: AddExerciseSheet with autocomplete + icons + icon picker for custom
- TypeScript types + Zod schemas

### Phase 2: Workout Templates ✅ DONE
- Create `workout_templates` table
- API: getWorkoutTemplate, addToTemplate, updateTemplateItem, removeFromTemplate, reorderTemplate
- UI: Template editor on subject detail (add/remove/reorder exercises, set default reps)
- When starting session, copy template to entry items

### Phase 3: Inline Performance View ✅ DONE
- Fetch last entry's items+sets when loading session
- Display LastPerformanceRef component ("Last: 80kg×8 · 85kg×6")
- Show target_reps hints when actual values not filled
- "Copy all" button in last reference line

### Phase 4: Session Input Rework ✅ DONE
- Build ExerciseInputCard component with inline inputs
- SetRow with inputs based on tracking_type (weight_reps, duration)
- Per-set CopyButton [⟳] with visual feedback
- Auto-save on blur (no submit button needed)
- FeedbackButtons per exercise
- AddItemModal with info about one-time vs permanent exercises

---

## Migration Strategy (per BE recommendation)

Non-destructive, additive only:

1. Create `exercise_library` table + seed 40 exercises
2. Create `workout_templates` table
3. Add columns to `items` (exercise_id, is_from_template, tracking_type) — nullable
4. Add columns to `item_sets` (duration_seconds, distance_meters, target_reps, target_duration_seconds)
5. Backfill: match existing item names to exercise_library entries (optional)
6. Frontend starts using new flow for new entries
7. Old entries remain readable as-is

---

## Priority

**Critical** — this IS the app's core value proposition. Without this, the app is just a manual note-taking tool.

---

## Agent Opinions Summary

- **UI Agent**: Hybrid reference + copy button (not pre-fill). Empty inputs, [⟳] per set, "Last:" always visible.
- **BE Agent**: Explicit template table (not derived), client-side batch copy for MVP, unique indexes for exercise names, non-destructive migration.
- **FE Agent**: ExerciseInputCard self-contained with local state, FlatList not ScrollView, auto-save on blur, phases 1+2 shippable independently.
