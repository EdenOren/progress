# Workout Flow Redesign - Cross-Functional Plan

## Team Perspectives

---

## 1. PRODUCT REQUIREMENTS

### Current Problems
- Exercise input screen is broken (unicode rendering, input overflow)
- Flow is confusing - mixing template creation with workout execution
- No clear separation between "planning workouts" and "doing workouts"

### Core User Stories
1. **As a user**, I want to create workout templates with exercises and default sets
2. **As a user**, I want to start a workout from my templates
3. **As a user**, I want to log actual values during my workout
4. **As a user**, I want to see my previous performance for comparison
5. **As a user**, I want to rate how each exercise went
6. **As a user**, I want to see workout duration automatically tracked

### Two-Phase Flow

#### Phase A: Template Building (Planning)
```
Home → Create Workout → Name it → Add Exercises → Set Defaults → Save Template
```

#### Phase B: Workout Execution (Doing)
```
Home → Start Workout → Select Template → Log Sets → Rate Exercises → Complete → Save to History
```

---

## 2. UX FLOW DESIGN

### Home Screen
```
┌─────────────────────────────┐
│  Progress                   │
├─────────────────────────────┤
│                             │
│  [+ Create Workout]         │  ← Creates new template
│                             │
│  ── Your Workouts ──        │
│  ┌─────────────────────┐    │
│  │ Push Day            │    │
│  │ 5 exercises         │    │
│  │ [Start] [Edit] [🗑] │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Pull Day            │    │
│  │ 4 exercises         │    │
│  └─────────────────────┘    │
│                             │
│  ── Recent Sessions ──      │
│  • Push Day - Jan 28 (45m)  │
│  • Pull Day - Jan 27 (38m)  │
└─────────────────────────────┘
```

### Template Editor (Create/Edit Workout)
```
┌─────────────────────────────┐
│ ← Back    Edit Workout  Save│
├─────────────────────────────┤
│                             │
│  Name: [Push Day________]   │
│                             │
│  ── Exercises ──            │
│  ┌─────────────────────┐    │
│  │ 1. Bench Press      │    │
│  │    Default: 3×10    │    │
│  │    [Edit Sets] [🗑]  │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 2. Incline DB Press │    │
│  │    Default: 3×12    │    │
│  │    [Edit Sets] [🗑]  │    │
│  └─────────────────────┘    │
│                             │
│  [+ Add Exercise]           │
│                             │
└─────────────────────────────┘
```

### Default Sets Editor (per exercise)
```
┌─────────────────────────────┐
│ ← Back   Set Defaults   Done│
├─────────────────────────────┤
│                             │
│  Bench Press                │
│                             │
│  Quick Presets:             │
│  [3×10] [3×12] [5×5] [4×8]  │
│                             │
│  Or customize:              │
│  Set 1: [10] reps           │
│  Set 2: [10] reps           │
│  Set 3: [10] reps           │
│  [+ Add Set]                │
│                             │
│  Descending example:        │
│  [12] [10] [8]              │
│                             │
└─────────────────────────────┘
```

### Active Workout Session
```
┌─────────────────────────────┐
│ ✕ Cancel    Push Day   Done │
│          ⏱ 23:45            │  ← Live timer
├─────────────────────────────┤
│                             │
│  ── Bench Press ──          │
│  Last: 80kg×10, 80kg×10...  │  ← Previous session
│                             │
│  Set 1: [80]kg × [10]reps ✓ │
│  Set 2: [80]kg × [9_]reps   │  ← Current input
│  Set 3: [  ]kg × [  ]reps   │
│                             │
│  How was it?                │
│  [Done ✓] [Almost] [Hard]   │
│                             │
│  ── Incline Press ──        │
│  Last: 24kg×12, 24kg×12...  │
│  ...                        │
│                             │
└─────────────────────────────┘
```

### Workout Complete Screen
```
┌─────────────────────────────┐
│       Workout Complete!     │
├─────────────────────────────┤
│                             │
│         ✓                   │
│    Push Day                 │
│                             │
│  Duration: [45:30]  ✏️      │  ← Editable
│  Exercises: 5               │
│  Total Sets: 15             │
│                             │
│  [Save to History]          │
│                             │
└─────────────────────────────┘
```

---

## 3. UI/UX DESIGN DECISIONS

### Color Usage (Purple + Blue + Emerald Palette)
- **Purple (Primary)**: Action buttons, selected states, brand elements
- **Blue (Secondary)**: Previous session data, informational, timers
- **Emerald (Accent)**: Success states, "Done" feedback, completed sets

### Input Design Fix
- Use proper × symbol (not unicode escape)
- Fixed-width inputs with proper constraints
- Clear visual hierarchy: weight | × | reps

### Feedback Buttons
| Button | Color | Icon |
|--------|-------|------|
| Done | Emerald | checkmark |
| Almost | Warning/Yellow | minus |
| Hard | Error/Red | alert |

### Timer Design
- Prominent at top of active workout
- Blue color (secondary/informational)
- Pause/resume capability
- Editable at completion

---

## 4. DATABASE / BACKEND

### Current Schema (keep)
- `subjects` → Workout templates
- `entries` → Workout sessions (instances)
- `items` → Exercises in a session
- `item_sets` → Individual set records
- `item_feedback` → Exercise ratings

### Schema Updates Needed

#### A. Add duration tracking to entries
```sql
ALTER TABLE entries ADD COLUMN
  duration_seconds INTEGER DEFAULT NULL;

ALTER TABLE entries ADD COLUMN
  started_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE entries ADD COLUMN
  completed_at TIMESTAMPTZ DEFAULT NULL;
```

#### B. Add notes to items
```sql
ALTER TABLE items ADD COLUMN
  note TEXT DEFAULT NULL;
```

#### C. Workout templates already exist
- `workout_templates` table with `default_sets` JSONB
- Already supports `[{target_reps: 10}, {target_reps: 10}, {target_reps: 10}]`

### API Updates
1. Add `started_at` when starting a session
2. Add `completed_at` and calculate `duration_seconds` on completion
3. Allow editing `duration_seconds` before final save

---

## 5. FRONTEND ARCHITECTURE

### Screen Structure
```
app/
├── (tabs)/
│   └── index.tsx          # Home - workouts list + recent sessions
├── workout/
│   ├── [id].tsx           # Template editor (create/edit workout)
│   └── sets/[exerciseId].tsx  # Default sets editor
├── session/
│   ├── [id].tsx           # Active workout session
│   └── complete.tsx       # Completion summary
```

### Key Components
```
components/
├── WorkoutCard.tsx        # Template card on home
├── SessionCard.tsx        # History item
├── ExerciseEditor.tsx     # Exercise in template editor
├── SetDefaultsSheet.tsx   # Quick set defaults picker
├── ActiveExercise.tsx     # Exercise during workout
├── SetInput.tsx           # Weight × Reps input (FIXED)
├── FeedbackButtons.tsx    # Done/Almost/Hard
├── WorkoutTimer.tsx       # Session timer
├── CompletionSummary.tsx  # End of workout
├── PreviousNote.tsx       # Blue info box showing last note
├── NoteInput.tsx          # Collapsible note input field
```

### State Management
- **React Query**: Server state (templates, sessions, history)
- **Local State**: Timer, current inputs, unsaved changes
- **Context**: Active session state (if navigating between screens)

---

## 6. IMMEDIATE BUG FIXES

Before redesign, fix current issues:

### Bug 1: Unicode escape showing as literal
```tsx
// WRONG
<Text>{'\u00D7'}</Text>

// CORRECT
<Text>×</Text>
```

### Bug 2: Input overflow
- Add `maxWidth` constraints
- Use `flex: 1` with proper container
- Test on narrow screens

---

## 7. STORIES (In Order)

### Story 1: Fix Current Bugs
**Priority:** Critical
**Scope:** Bug fixes only

- [ ] Fix `\u00D7` unicode escape → render actual `×` symbol
- [ ] Fix input overflow on narrow screens (add maxWidth, proper flex)
- [ ] Test on multiple screen sizes

**Acceptance Criteria:**
- × symbol renders correctly
- Inputs don't overflow container
- Current functionality still works

---

### Story 2: Database Schema Updates
**Priority:** High
**Scope:** Backend only

- [ ] Add `duration_seconds` column to `entries`
- [ ] Add `started_at` column to `entries`
- [ ] Add `completed_at` column to `entries`
- [ ] Add `note` column to `items`
- [ ] Create and run migration
- [ ] Update TypeScript types in shared package
- [ ] Update Zod schemas

**Acceptance Criteria:**
- Migration runs successfully
- Types are updated
- Existing data unaffected

---

### Story 3: Default Sets Editor
**Priority:** High
**Scope:** Template editing

- [ ] Create SetDefaultsSheet component with presets (3×10, 3×12, 5×5, 4×8)
- [ ] Add custom sets editor (add/remove sets, edit reps per set)
- [ ] Support descending patterns (12/10/8)
- [ ] Connect to workout_templates table
- [ ] Update TemplateSection to show "Edit Sets" button per exercise

**Acceptance Criteria:**
- User can select preset or customize
- Default sets saved to template
- Visible on exercise card in template

---

### Story 4: Refactor Home Screen
**Priority:** High
**Scope:** Navigation & layout

- [ ] Separate "Your Workouts" (templates) section
- [ ] Add "Recent Sessions" (history) section
- [ ] Each workout card shows: name, exercise count, [Start] [Edit] [Delete]
- [ ] Recent sessions show: workout name, date, duration

**Acceptance Criteria:**
- Clear visual separation between templates and history
- Can start workout from card
- Can edit template from card

---

### Story 5: Workout Timer
**Priority:** Medium
**Scope:** Session tracking

- [ ] Create WorkoutTimer component (displays elapsed time)
- [ ] Start timer when session begins (save `started_at`)
- [ ] Display timer at top of active workout screen
- [ ] No pause/reset - continuous only
- [ ] Timer persists if navigating within app

**Acceptance Criteria:**
- Timer starts automatically on workout start
- Timer visible throughout session
- Time continues even if switching screens

---

### Story 6: Active Workout Session Redesign
**Priority:** High
**Scope:** Core workout experience

- [ ] Redesign session screen layout
- [ ] Show timer at top
- [ ] Create SetInput component (weight × reps, fixed layout)
- [ ] Show previous session values per exercise (blue info box)
- [ ] Checkmark on completed sets
- [ ] Keep feedback buttons (Done/Almost/Hard)

**Acceptance Criteria:**
- Clean, non-overflowing layout
- Previous values visible
- Can input all sets
- Can rate each exercise

---

### Story 7: Exercise Notes
**Priority:** Medium
**Scope:** Notes feature

- [ ] Create PreviousNote component (blue box, only shows if note exists)
- [ ] Create NoteInput component (collapsed by default, expands on tap)
- [ ] Display previous note at top of exercise (if exists)
- [ ] Add note input after feedback buttons
- [ ] Save note to items table
- [ ] Query previous session's notes when loading workout

**Acceptance Criteria:**
- Previous note shows only if exists
- Can add new note
- Notes persist and show next session

---

### Story 8: Workout Completion Screen
**Priority:** Medium
**Scope:** End of workout flow

- [ ] Create CompletionSummary screen
- [ ] Show success state with workout name
- [ ] Display duration (editable before save)
- [ ] Show stats: exercise count, total sets
- [ ] Save `completed_at` and `duration_seconds` on confirm
- [ ] Navigate to home after save

**Acceptance Criteria:**
- Duration auto-calculated from timer
- User can edit duration if needed
- Data saved correctly to database

---

### Story 9: History View
**Priority:** Low
**Scope:** Polish

- [ ] Recent sessions list on home screen
- [ ] Tap session to view details (read-only)
- [ ] Show all exercises, sets, feedback, notes, duration
- [ ] Delete session option

**Acceptance Criteria:**
- Can view past workouts
- All data visible
- Can delete if needed

---

## STORY DEPENDENCY GRAPH

```
Story 1 (Bug Fixes)
    ↓
Story 2 (DB Schema)
    ↓
    ├── Story 3 (Default Sets Editor)
    │       ↓
    └── Story 4 (Home Screen Refactor)
            ↓
        Story 5 (Timer)
            ↓
        Story 6 (Active Session Redesign)
            ↓
        Story 7 (Exercise Notes)
            ↓
        Story 8 (Completion Screen)
            ↓
        Story 9 (History View)
```

---

## 8. DECISIONS MADE

1. **Timer**: Simple continuous timer. No pause, no reset. Runs from start to finish.
2. **Rest timer**: Not in MVP
3. **Progressive overload**: No auto-suggestions for now
4. **Exercise notes**: Yes - see UX below

### Notes UX Design

**Where to show previous notes:**
- At TOP of exercise card, in a subtle blue info box
- Immediately visible when user reaches that exercise
- Shows note from last session of same workout
- **Only shown if previous note exists** (hide completely if no note)

**Where to input new notes:**
- At BOTTOM of exercise card, after feedback buttons
- Collapsed by default with "Add note..." placeholder
- Expands on tap to full text input

```
┌─────────────────────────────────┐
│ ── Bench Press ──               │
│ ┌─────────────────────────────┐ │
│ │ 💬 Last time: "Left shoulder │ │  ← Previous note (blue bg)
│ │    felt tight, went lighter" │ │
│ └─────────────────────────────┘ │
│                                 │
│ Last: 80kg×10, 80kg×10...       │
│                                 │
│ Set 1: [80]kg × [10]reps ✓      │
│ Set 2: [80]kg × [10]reps ✓      │
│ Set 3: [75]kg × [8_]reps        │
│                                 │
│ How was it?                     │
│ [Done ✓] [Almost] [Hard]        │
│                                 │
│ [+ Add note...]                 │  ← New note input (collapsed)
└─────────────────────────────────┘
```

**Expanded note input:**
```
│ How was it?                     │
│ [Done ✓] [Almost] [Hard]        │
│                                 │
│ Note:                           │
│ ┌─────────────────────────────┐ │
│ │ Shoulder felt better today, │ │
│ │ back to normal weight next  │ │
│ │ time_                       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Notes Data Model
- Store in `items` table: `note TEXT`
- Query last session's item notes when loading workout
- Save note with item on completion

---

## 9. SUCCESS METRICS

- User can create a workout template in < 2 minutes
- User can start and complete a workout with minimal friction
- Previous session data visible for all exercises
- Duration tracking automatic and accurate
- Zero layout/rendering bugs

---

## NEXT STEPS

After approval:
1. Create detailed stories for each phase
2. Prioritize Phase 1 bug fixes
3. Begin Phase 2 template editor refactor
