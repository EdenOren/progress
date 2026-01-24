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
Start Session → Exercises pre-loaded from template → Enter weights/reps
                                                      ↓
                                              See last session's numbers inline
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
exercises table:
  - id, name, icon, category, muscle_group
  - Examples:
    - Bench Press, icon: "bench", category: "strength", muscle_group: "chest"
    - Deadlift, icon: "deadlift", category: "strength", muscle_group: "back"
    - Squats, icon: "squat", category: "strength", muscle_group: "legs"
    - Pull-ups, icon: "pullup", category: "bodyweight", muscle_group: "back"
```

- Pre-seeded with ~30-50 common exercises
- User can search/filter with autocomplete
- If not found → create custom exercise (name + pick icon from icon set)
- Custom exercises saved to user's personal library

### 2. Workout Template (Subject → Items persist)

When a user creates a workout and adds exercises, those exercises become the **template** for that workout.

```
workout_template_items table (or extend subjects):
  - subject_id, exercise_id (or custom name), position, is_active
```

- Template items are the default exercises shown every session
- User can reorder template items
- User can remove items from template (soft delete / is_active)

### 3. Entry Flow (Start Session)

When user starts a new session:
1. **Pre-populate items** from the workout template
2. Each item shows **last session's performance** (weight, reps, sets) inline
3. User enters today's numbers for each exercise
4. User can:
   - **Add extra exercise** (one-time) — won't persist in template
   - **Add extra exercise (permanent)** — adds to template for future sessions
   - **Skip an exercise** — leave it empty, still part of template

### 4. Performance Input UX

For each exercise in a session:
```
┌─────────────────────────────────────────┐
│ 🏋️ Bench Press                          │
│                                         │
│ Last time: 80kg × 8, 85kg × 6, 85kg × 5│
│                                         │
│ Set 1: [___kg] × [___reps]              │
│ Set 2: [___kg] × [___reps]              │
│ + Add Set                               │
│                                         │
│ Feedback: [Easy] [Good] [Hard] [Failed] │
└─────────────────────────────────────────┘
```

- Last time's numbers shown above input fields (reference)
- Pre-fill set count from last session (user can add/remove)
- Optionally pre-fill weights from last session (user overrides)

### 5. Progress View

After completing sessions, the workout card on home screen shows:
- Last session date
- Summary: "3/5 exercises improved" or volume trend

---

## Acceptance Criteria

- [ ] Exercise library with autocomplete search when adding to workout
- [ ] Icons for each exercise (from predefined set)
- [ ] Custom exercise creation with icon picker
- [ ] Workout template persists exercise list across sessions
- [ ] Starting a session pre-loads template exercises
- [ ] Each exercise shows last session's performance inline
- [ ] User can add sets and enter weight/reps per set
- [ ] "Add exercise" option during session (one-time or permanent)
- [ ] Feedback per exercise (easy/good/hard/failed)
- [ ] Session comparison visible during input (not just after)

---

## Data Model Changes

### New: `exercise_library` table
```sql
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,          -- icon key from predefined set
  category TEXT,               -- strength, cardio, bodyweight, flexibility
  muscle_group TEXT,           -- chest, back, legs, shoulders, arms, core
  is_system BOOLEAN DEFAULT TRUE,  -- false for user-created
  created_by UUID REFERENCES auth.users(id),  -- null for system exercises
  UNIQUE(name, created_by)    -- unique per user (or globally for system)
);
```

### New: `workout_templates` table (or rename/extend items concept)
```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id),
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modified: `items` table
- Add `exercise_id UUID REFERENCES exercise_library(id)` (optional, for linking to library)
- Add `is_from_template BOOLEAN DEFAULT TRUE` (false = one-time addition)

### Modified: `entries` creation
- On create, auto-populate items from `workout_templates` where `subject_id` matches

---

## Implementation Phases

### Phase 1: Exercise Library + Autocomplete
- Create `exercise_library` table with seed data (~40 exercises)
- API: search/filter exercises, create custom
- UI: autocomplete input with icons in AddItemModal

### Phase 2: Workout Templates
- Create `workout_templates` table
- When adding exercises to a workout, save to template
- When starting session, pre-populate from template

### Phase 3: Inline Performance View
- Fetch last entry's sets for each exercise
- Display inline above input fields
- Pre-fill set count from last session

### Phase 4: Session Input Rework
- Redesign ItemCard for inline weight/reps input
- Add set management (add/remove sets)
- Feedback buttons per exercise
- "Add exercise" with one-time/permanent toggle

---

## Priority
**Critical** — this IS the app's core value proposition. Without this, the app is just a manual note-taking tool.
