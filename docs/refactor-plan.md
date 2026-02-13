# App Refactor Plan

> Written after full codebase analysis. This is the implementation roadmap.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Target State Summary](#2-target-state-summary)
3. [Phase 1: Database & Shared Layer Changes](#phase-1-database--shared-layer-changes)
4. [Phase 2: Remove Module System & Nutrition](#phase-2-remove-module-system--nutrition)
5. [Phase 3: Navigation Restructure (3 Tabs)](#phase-3-navigation-restructure-3-tabs)
6. [Phase 4: Daily Log Expansion](#phase-4-daily-log-expansion)
7. [Phase 5: Profile Page (DOB + Height)](#phase-5-profile-page-dob--height)
8. [Phase 6: Goals Page](#phase-6-goals-page)
9. [Phase 7: KPI Dashboard](#phase-7-kpi-dashboard)
10. [Phase 8: Settings Simplification](#phase-8-settings-simplification)
11. [Phase 9: Cleanup & Dead Code Removal](#phase-9-cleanup--dead-code-removal)
12. [File Change Inventory](#file-change-inventory)
13. [Migration Safety Checklist](#migration-safety-checklist)

---

## 1. Current State Summary

### Current Navigation
```
Bottom Tabs (2):
  ├── Home (icon switches: dumbbell/calendar-check based on active module)
  │   ├── WorkoutModule (subjects list, recent sessions)
  │   └── DailyLogModule (daily entries list)
  └── Menu
      ├── Profile → /profile
      ├── Settings → /settings
      │   ├── Module toggle checkboxes
      │   ├── Workout settings → /settings/workout
      │   └── Daily Log settings → /settings/daily-log
      └── Sign Out

Hidden in tabs (nested stack):
  └── subject/[id]/ → Subject detail
      └── entry/[entryId] → Entry detail
```

### Current Module System
- `ModuleProvider` context wraps the app
- `user_settings` table stores `enabled_modules` (array) and `active_module`
- `ModuleSelectorSheet` opens from header title press
- `ModuleSelector` component used in Settings to toggle modules on/off
- Nutrition exists as `ModuleKey` type but `isAvailable: false` ("Coming Soon")

### Current Daily Log Fields
- `sleep_hours` (numeric, nullable)
- `weight_kg` (numeric, nullable)
- `body_fat_percent` (numeric, nullable)
- `notes` (text, nullable)

### Current Profile
- Shows: avatar initial, display name, email, member since date
- No DOB, no height

---

## 2. Target State Summary

### Target Navigation
```
Bottom Tabs (3):
  ├── Progress (default on launch)
  │   ├── Top toggle: [Progress | Daily Log]
  │   ├── Progress view = workout history (existing WorkoutModule)
  │   └── Daily Log view = daily health metrics (expanded)
  ├── KPI (dashboard)
  │   └── 4 health snapshot cards
  └── Menu
      ├── Goals → /goals
      ├── Settings → /settings (single page)
      ├── Profile → /profile (with DOB + height)
      └── Sign Out
```

### What Gets Removed
- Module enabling/disabling system
- Module selection screen / sheet
- Nutrition references (type, constant, UI)
- `ModuleProvider` context
- `ModuleSelector` component
- `ModuleSelectorSheet` component
- Settings nested screens (workout, daily-log) → merged into single page

### What Gets Added
- KPI tab with 4 cards
- Goals page (health targets)
- Profile fields: date_of_birth, height_cm
- Daily Log fields: water_intake_liters, waist_cm
- Top toggle bar inside Progress tab (Progress ↔ Daily Log)

---

## Phase 1: Database & Shared Layer Changes

### 1.1 Migration: Expand `daily_log_entries` table

**File**: `supabase/migrations/012_expand_daily_log.sql`

```sql
-- Add new columns to daily_log_entries
ALTER TABLE daily_log_entries ADD COLUMN water_intake_liters NUMERIC(4,2);
ALTER TABLE daily_log_entries ADD COLUMN waist_cm NUMERIC(5,1);

-- Mark body_fat_percent as deprecated (keep column, stop using in app)
COMMENT ON COLUMN daily_log_entries.body_fat_percent IS 'DEPRECATED: No longer shown in UI. Column retained for historical data.';
```

**Why**: The spec adds water intake and waist circumference. Body fat percent is not in the spec's Daily Log fields, so we deprecate it (never delete per migration rules).

### 1.2 Migration: Expand `profiles` table

**File**: `supabase/migrations/013_expand_profiles.sql`

```sql
-- Add DOB and height to profiles
ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN height_cm NUMERIC(5,1);
```

**Why**: Profile page needs DOB (required for waist-to-height ratio in KPI) and height (required for waist-to-height ratio). Both nullable at DB level — app will prompt if empty.

### 1.3 Migration: Create `health_goals` table

**File**: `supabase/migrations/014_health_goals.sql`

```sql
CREATE TABLE health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sleep_target_hours NUMERIC(4,1),
  water_target_liters NUMERIC(4,2),
  weight_target_kg NUMERIC(5,1),
  waist_target_cm NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access own goals
CREATE POLICY "Users can manage own health goals"
  ON health_goals
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_health_goals_updated_at
  BEFORE UPDATE ON health_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Why**: Single-row-per-user table for health targets. Used by KPI page to compute goal percentages.

### 1.4 Migration: Simplify `user_settings` (remove module system)

**File**: `supabase/migrations/015_simplify_settings.sql`

```sql
-- Remove the active_module constraint (column stays, just unused)
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_active_module_check;

-- Mark deprecated columns
COMMENT ON COLUMN user_settings.enabled_modules IS 'DEPRECATED: Module system removed. Column retained for data safety.';
COMMENT ON COLUMN user_settings.active_module IS 'DEPRECATED: Module system removed. Column retained for data safety.';
```

**Why**: Module system is being removed. We don't delete columns, just stop using them and mark deprecated.

### 1.5 Update shared types

**File**: `packages/shared/src/types/dailyLog.ts`

Add `water_intake_liters` and `waist_cm` to:
- `DailyLogEntry` interface
- `DailyLogEntryInsert` interface
- `DailyLogEntryUpdate` interface

**File**: `packages/shared/src/types/domain.ts`

Add to `Profile` interface:
- `date_of_birth: string | null`
- `height_cm: number | null`

**File**: NEW `packages/shared/src/types/healthGoals.ts`

```typescript
export interface HealthGoals {
  id: UUID;
  user_id: UUID;
  sleep_target_hours: number | null;
  water_target_liters: number | null;
  weight_target_kg: number | null;
  waist_target_cm: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface HealthGoalsUpsert {
  sleep_target_hours?: number | null;
  water_target_liters?: number | null;
  weight_target_kg?: number | null;
  waist_target_cm?: number | null;
}
```

### 1.6 Update shared schemas

**File**: `packages/shared/src/schemas/dailyLog.ts`

Add `water_intake_liters` and `waist_cm` fields to all daily log schemas.

**File**: NEW `packages/shared/src/schemas/healthGoals.ts`

Zod schemas for `HealthGoals` and `HealthGoalsUpsert`.

**File**: `packages/shared/src/schemas/domain.ts`

Add `date_of_birth` and `height_cm` to profile schema.

### 1.7 Add shared API functions

**File**: NEW `packages/shared/src/api/healthGoals.ts`

```typescript
getHealthGoals(supabase, userId): Promise<Result<HealthGoals | null>>
upsertHealthGoals(supabase, userId, input): Promise<Result<HealthGoals>>
```

**File**: `packages/shared/src/api/profiles.ts`

Ensure `updateProfile` supports `date_of_birth` and `height_cm`.

**File**: `packages/shared/src/api/dailyLog.ts`

Update types to include new fields (no logic changes needed — Supabase handles new columns automatically if types are correct).

### 1.8 Export from shared index

**File**: `packages/shared/src/index.ts`

Export all new types, schemas, API functions, and constants.

---

## Phase 2: Remove Module System & Nutrition

### 2.1 Delete module-related components

**DELETE** these files:
- `apps/mobile/src/components/ModuleSelector.tsx`
- `apps/mobile/src/components/ModuleSelectorSheet.tsx`

### 2.2 Delete module provider

**DELETE**: `apps/mobile/src/providers/module.tsx`

### 2.3 Update provider barrel

**File**: `apps/mobile/src/providers/index.tsx`

- Remove `ModuleProvider` from `AppProviders` composition
- Remove `useModule` and `ModuleType` exports

### 2.4 Update root layout

**File**: `apps/mobile/app/_layout.tsx`

Remove `ModuleProvider` from the provider stack (it's composed in `AppProviders`).

### 2.5 Clean up shared types

**File**: `packages/shared/src/types/settings.ts`

- Remove `ModuleKey` type (or simplify to not include `nutrition`)
- Remove `MODULE_INFO` array
- Remove `ModuleInfo` interface
- Keep `WorkoutModuleSettings`, `DailyLogModuleSettings` (still needed for unit preferences)
- Simplify `UserSettings` — remove `enabled_modules` and `active_module` from the interface (still in DB, just not read)

**File**: `packages/shared/src/schemas/settings.ts`

Match type changes.

### 2.6 Clean up shared API

**File**: `packages/shared/src/api/settings.ts`

- Remove `toggleModule` function
- Remove `updateActiveModule` function
- Remove `isModuleEnabled` function
- Keep `getUserSettings`, `updateUserSettings`, `updateModuleSettings` (for unit preferences)

### 2.7 Clean up hooks

**File**: `apps/mobile/src/hooks/useSettings.ts`

- Remove `useToggleModule` hook
- Keep `useUserSettings`, `useUpdateSettings`, `useUpdateWorkoutSettings`, `useUpdateDailyLogSettings`

### 2.8 Remove nutrition constant

**File**: `packages/shared/src/constants/domains.ts`

- Remove or deprecate `NUTRITION_DOMAIN_ID`

### 2.9 Update component barrel export

**File**: `apps/mobile/src/components/index.ts`

- Remove `ModuleSelector` and `ModuleSelectorSheet` exports

---

## Phase 3: Navigation Restructure (3 Tabs)

### 3.1 Restructure tabs layout

**File**: `apps/mobile/app/(tabs)/_layout.tsx`

Replace current 2-tab layout with 3 tabs:

```
Tab 1: "Progress" (icon: chart-timeline-variant / trending-up)
  - Default tab on launch
  - Header shows: "Progress" with top toggle [Progress | Daily Log]

Tab 2: "KPI" (icon: view-dashboard-outline)
  - Opens KPI dashboard

Tab 3: "Menu" (icon: menu)
  - Same as current
```

Remove:
- `HeaderTitle` component (module selector header)
- Dynamic icon/label switching based on `currentModule`
- `ModuleSelectorSheet` import and usage
- `useModule()` hook call

Add:
- Static tab icons and labels
- Header for Progress tab with inline toggle component

### 3.2 Add top toggle to Progress tab

**File**: `apps/mobile/app/(tabs)/index.tsx`

Replace module-switching logic (`useModule()`) with local state:

```typescript
const [activeView, setActiveView] = useState<'progress' | 'daily_log'>('progress');
```

Add a `SegmentedToggle` component at the top of the screen:

```
┌─────────────────────────────┐
│  [ Progress | Daily Log ]   │   ← segmented control in header or top of content
├─────────────────────────────┤
│  (content switches below)   │
```

The toggle should be:
- Part of the header (rendered via `headerTitle` option) OR
- A sticky bar at the top of the scroll content

Recommendation: Render it as `headerTitle` in the tab screen options for consistency.

### 3.3 Create KPI tab screen

**File**: NEW `apps/mobile/app/(tabs)/kpi.tsx`

Placeholder screen initially — will be filled in Phase 7.

```typescript
export default function KPIScreen(): React.ReactElement {
  return (
    <SafeAreaView>
      <Text>KPI Dashboard - Coming Soon</Text>
    </SafeAreaView>
  );
}
```

### 3.4 Update tab layout to include KPI

**File**: `apps/mobile/app/(tabs)/_layout.tsx`

Add third tab:
```tsx
<Tabs.Screen
  name="kpi"
  options={{
    title: 'KPI',
    tabBarLabel: 'KPI',
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={color} />
    ),
  }}
/>
```

Tab order: index (Progress) → kpi → menu

### 3.5 Register subject detail screen

Keep the hidden tab screen for `subject/[id]` — it still works within the Progress tab.

---

## Phase 4: Daily Log Expansion

### 4.1 Update `LogDailyLogModal` component

**File**: `apps/mobile/src/components/LogDailyLogModal.tsx`

Current fields:
- Sleep (hours + minutes)
- Weight
- Body Fat %
- Notes
- Date picker

New fields:
- Sleep (hours + minutes) — **keep**
- Weight — **keep**
- Water intake (liters) — **add** (rename from old "water drank" concept)
- Waist circumference (cm) — **add**
- Notes — **keep**
- Date picker — **keep**

Remove:
- Body Fat % field (deprecated in DB, remove from UI)

Update the react-hook-form schema and Zod validation to include new fields.

### 4.2 Update `DailyLogEntryCard` component

**File**: `apps/mobile/src/components/DailyLogEntryCard.tsx`

Add display of:
- Water intake (show as "X L" or "X oz" based on unit system)
- Waist circumference (show as "X cm" or "X in" based on unit system)

Remove:
- Body fat % display

### 4.3 Update daily log hooks

**File**: `apps/mobile/src/hooks/useDailyLog.ts`

No structural changes needed — the hooks call API functions that already handle arbitrary fields. Just ensure the types flow through correctly after the type updates in Phase 1.

---

## Phase 5: Profile Page (DOB + Height)

### 5.1 Add profile hooks

**File**: NEW `apps/mobile/src/hooks/useProfile.ts`

```typescript
useProfile(): Query for current user's profile
useUpdateProfile(): Mutation to update profile fields
```

Uses `getProfile` and `updateProfile` from `@progress/shared`.

### 5.2 Redesign profile screen

**File**: `apps/mobile/app/profile.tsx`

Current: Read-only display of email and member since date.

New: Editable form with:
- Avatar + display name (existing)
- Email (read-only, existing)
- Date of birth (editable, date picker)
- Height (editable, numeric input with unit label)
- Member since (read-only, existing)

Use `react-hook-form` for the editable fields. Save button at bottom.

If DOB or height is empty, show a prompt/banner encouraging the user to fill them in (needed for KPI calculations).

### 5.3 Auto-fill defaults

On first load if profile is empty:
- DOB: no default (leave empty, prompt to fill)
- Height: no default (leave empty, prompt to fill)

The spec says "auto-fill safe default" but for DOB and height there's no universal safe default. Instead, show a gentle prompt: "Add your height and date of birth for accurate KPI calculations."

---

## Phase 6: Goals Page

### 6.1 Create goals hooks

**File**: NEW `apps/mobile/src/hooks/useHealthGoals.ts`

```typescript
useHealthGoals(): Query for current user's health goals
useUpsertHealthGoals(): Mutation to create/update health goals
```

### 6.2 Create goals screen

**File**: NEW `apps/mobile/app/goals.tsx`

Simple form page with editable values:
- Sleep target (hours) — numeric input
- Water target (liters) — numeric input
- Weight target (optional) — numeric input
- Waist target (optional) — numeric input

Behavior:
- Load current goals on mount
- Edit any field
- Save button persists to DB
- Used by KPI page for comparisons

UI: Simple card with form fields, no nested navigation.

### 6.3 Add Goals to menu

**File**: `apps/mobile/app/(tabs)/menu.tsx`

Add a new `MenuRow` for Goals between Profile and Settings:

```tsx
<MenuRow
  icon="target"
  label="Goals"
  onPress={() => router.push('/goals')}
/>
```

Menu order becomes:
1. Profile card (existing)
2. **Goals** (new)
3. Settings
4. Sign Out

---

## Phase 7: KPI Dashboard

### 7.1 Create KPI calculation utilities

**File**: NEW `packages/shared/src/utils/kpi.ts`

Pure functions:

```typescript
// Waist-to-height ratio
function waistToHeightRatio(waistCm: number, heightCm: number): number

// 7-day average
function sevenDayAverage(values: (number | null)[]): number | null

// Percentage of goal
function goalPercentage(current: number, target: number): number

// Status color determination
function getKpiStatus(current: number, target: number, higherIsBetter: boolean): 'good' | 'warning' | 'bad'
```

### 7.2 Create KPI hooks

**File**: NEW `apps/mobile/src/hooks/useKpi.ts`

```typescript
useKpiData(): {
  waistToHeightRatio: number | null;
  sevenDayAvgWeight: number | null;
  waterVsGoal: number | null;       // percentage
  sleepVsGoal: number | null;       // percentage
  isLoading: boolean;
}
```

This hook composes:
- `useDailyLogEntries(7)` — last 7 days of logs
- `useHealthGoals()` — user's targets
- `useProfile()` — for height (waist-to-height ratio)

And computes the 4 KPI values.

### 7.3 Create KPI card component

**File**: NEW `apps/mobile/src/components/KpiCard.tsx`

A card showing:
- Title (e.g., "Waist-to-Height Ratio")
- Value (e.g., "0.48")
- Status indicator (green/red based on goal comparison)
- Optional subtitle (e.g., "Target: < 0.50")

### 7.4 Implement KPI screen

**File**: `apps/mobile/app/(tabs)/kpi.tsx`

Layout: 2x2 grid of KPI cards.

```
┌─────────────┬─────────────┐
│ Waist:Height│ 7-Day Avg   │
│ Ratio       │ Weight      │
├─────────────┼─────────────┤
│ Water vs    │ Sleep vs    │
│ Goal        │ Goal        │
└─────────────┴─────────────┘
```

4 cards max (per spec). Each card:
- Big number (primary metric)
- Label
- Color coding: green = good, red = below target
- Tap to see detail? (spec says no extra stats, so probably not)

Handle missing data gracefully:
- If no height set → waist-to-height shows "Set height in Profile"
- If no goals set → percentage cards show "Set goals"
- If no recent logs → show "No data" with link to Daily Log

---

## Phase 8: Settings Simplification

### 8.1 Flatten settings into single page

**File**: `apps/mobile/app/settings/index.tsx`

Remove:
- Module selection section (ModuleSelector)
- "Your Modules" section with navigation to sub-pages

Replace with single-page layout:

```
Settings
─────────
WORKOUT
  Weight Unit    [ kg | lbs ]
  Distance Unit  [ km | miles ]

DAILY LOG
  Unit System    [ Metric | Imperial ]

  (Metric: kg, cm, L)
  (Imperial: lbs, in, oz)
```

### 8.2 Delete settings sub-pages

**DELETE** these files:
- `apps/mobile/app/settings/workout.tsx`
- `apps/mobile/app/settings/daily-log.tsx`

### 8.3 Update settings layout

**File**: `apps/mobile/app/settings/_layout.tsx`

Simplify — may only need a single Stack screen now since sub-pages are gone.

---

## Phase 9: Cleanup & Dead Code Removal

### 9.1 Remove unused components

- `ModuleSelector.tsx` (deleted in Phase 2)
- `ModuleSelectorSheet.tsx` (deleted in Phase 2)

### 9.2 Remove unused hooks

- `useToggleModule` (removed in Phase 2)

### 9.3 Remove unused shared exports

- `MODULE_INFO`, `ModuleInfo`, `ModuleKey` (if fully removed)
- `toggleModule`, `updateActiveModule`, `isModuleEnabled` from API
- `NUTRITION_DOMAIN_ID` constant

### 9.4 Update barrel exports

- `packages/shared/src/index.ts` — remove deleted exports, add new ones
- `apps/mobile/src/components/index.ts` — remove deleted, add new
- `apps/mobile/src/hooks/index.ts` — remove deleted, add new

### 9.5 Run cleanup verification

- TypeScript compile check (`npx tsc --noEmit`)
- Check for unused imports
- Verify no references to deleted items remain

---

## File Change Inventory

### New Files
| File | Phase | Description |
|------|-------|-------------|
| `supabase/migrations/012_expand_daily_log.sql` | 1 | Add water_intake + waist columns |
| `supabase/migrations/013_expand_profiles.sql` | 1 | Add DOB + height to profiles |
| `supabase/migrations/014_health_goals.sql` | 1 | Create health_goals table |
| `supabase/migrations/015_simplify_settings.sql` | 1 | Deprecate module columns |
| `packages/shared/src/types/healthGoals.ts` | 1 | Health goals types |
| `packages/shared/src/schemas/healthGoals.ts` | 1 | Health goals Zod schemas |
| `packages/shared/src/api/healthGoals.ts` | 1 | Health goals API functions |
| `packages/shared/src/utils/kpi.ts` | 7 | KPI calculation utilities |
| `apps/mobile/app/(tabs)/kpi.tsx` | 3/7 | KPI dashboard screen |
| `apps/mobile/app/goals.tsx` | 6 | Goals page |
| `apps/mobile/src/hooks/useProfile.ts` | 5 | Profile query/mutation hooks |
| `apps/mobile/src/hooks/useHealthGoals.ts` | 6 | Health goals hooks |
| `apps/mobile/src/hooks/useKpi.ts` | 7 | KPI computation hook |
| `apps/mobile/src/components/KpiCard.tsx` | 7 | KPI card component |

### Modified Files
| File | Phase | Changes |
|------|-------|---------|
| `packages/shared/src/types/dailyLog.ts` | 1 | Add water + waist fields |
| `packages/shared/src/types/domain.ts` | 1 | Add DOB + height to Profile |
| `packages/shared/src/types/settings.ts` | 2 | Remove module system types |
| `packages/shared/src/schemas/dailyLog.ts` | 1 | Add water + waist to schemas |
| `packages/shared/src/schemas/domain.ts` | 1 | Add profile fields to schema |
| `packages/shared/src/schemas/settings.ts` | 2 | Simplify settings schema |
| `packages/shared/src/api/settings.ts` | 2 | Remove module toggle functions |
| `packages/shared/src/api/dailyLog.ts` | 1 | Types flow through (minimal) |
| `packages/shared/src/api/profiles.ts` | 1 | Ensure new fields supported |
| `packages/shared/src/index.ts` | 1-9 | Update exports throughout |
| `apps/mobile/src/providers/index.tsx` | 2 | Remove ModuleProvider |
| `apps/mobile/src/hooks/useSettings.ts` | 2 | Remove useToggleModule |
| `apps/mobile/src/hooks/index.ts` | 2-7 | Update barrel exports |
| `apps/mobile/src/components/index.ts` | 2-7 | Update barrel exports |
| `apps/mobile/src/components/LogDailyLogModal.tsx` | 4 | Add water + waist fields, remove body fat |
| `apps/mobile/src/components/DailyLogEntryCard.tsx` | 4 | Add water + waist display |
| `apps/mobile/app/_layout.tsx` | 2 | Remove ModuleProvider |
| `apps/mobile/app/(tabs)/_layout.tsx` | 3 | 3 tabs, remove module header |
| `apps/mobile/app/(tabs)/index.tsx` | 3 | Local toggle state, remove useModule |
| `apps/mobile/app/(tabs)/menu.tsx` | 6 | Add Goals menu row |
| `apps/mobile/app/profile.tsx` | 5 | Editable DOB + height |
| `apps/mobile/app/settings/index.tsx` | 8 | Single-page flat settings |
| `apps/mobile/app/settings/_layout.tsx` | 8 | Simplify layout |

### Deleted Files
| File | Phase | Reason |
|------|-------|--------|
| `apps/mobile/src/components/ModuleSelector.tsx` | 2 | Module system removed |
| `apps/mobile/src/components/ModuleSelectorSheet.tsx` | 2 | Module system removed |
| `apps/mobile/src/providers/module.tsx` | 2 | Module system removed |
| `apps/mobile/app/settings/workout.tsx` | 8 | Merged into settings/index |
| `apps/mobile/app/settings/daily-log.tsx` | 8 | Merged into settings/index |

---

## Migration Safety Checklist

Per project rules — ALL migrations must be backwards compatible:

- [x] **012**: Only ADDS columns (water_intake_liters, waist_cm). Safe.
- [x] **013**: Only ADDS columns (date_of_birth, height_cm). Safe.
- [x] **014**: Only CREATES new table (health_goals). Safe.
- [x] **015**: Only DROPS a constraint and adds COMMENTS. No data changes. Safe.
- [x] No columns dropped
- [x] No tables dropped
- [x] No type changes
- [x] All new columns are nullable (no NOT NULL without default)
- [x] Deprecated columns marked with COMMENT, not deleted

---

## Implementation Order & Dependencies

```
Phase 1 (DB + Shared) ──────────────────────────┐
  Must complete first — all other phases          │
  depend on types and DB schema                   │
                                                  ▼
Phase 2 (Remove Module System) ─────────────► Phase 3 (Navigation)
  Can start after Phase 1                         │
  Phase 3 depends on module removal               │
                                                  ▼
Phase 4 (Daily Log) ◄──── Can start after Phase 1, independent of 2/3
Phase 5 (Profile)   ◄──── Can start after Phase 1, independent of 2/3
Phase 6 (Goals)     ◄──── Can start after Phase 1, independent of 2/3
                                                  │
Phase 7 (KPI) ◄──────── Depends on Phase 3 (tab exists),
                         Phase 5 (profile data), Phase 6 (goals data)
                                                  │
Phase 8 (Settings) ◄──── Depends on Phase 2 (module removal)
                                                  │
Phase 9 (Cleanup) ◄───── Final pass after all phases
```

**Parallelizable work** (after Phase 1):
- Phase 4 + Phase 5 + Phase 6 can run in parallel
- Phase 2 → Phase 3 → Phase 8 is a sequential chain

---

## Key Design Decisions

### 1. Top Toggle Implementation
Use a **segmented control** rendered in the header area (via `headerTitle` option), not a scrollable tab. This gives instant 1-tap switching with no dropdown and no extra navigation. Local `useState` in the home screen — no need for context since it's within a single screen.

### 2. KPI Data Freshness
KPI screen will use React Query with a reasonable stale time (5 minutes). Data is fetched from existing tables (daily_log_entries, health_goals, profiles) — no new denormalized tables needed.

### 3. Unit System for Daily Log
The spec mentions a "unit system (metric/imperial)" toggle for Daily Log settings. This will be a single toggle that controls:
- Weight: kg ↔ lbs
- Waist: cm ↔ inches
- Water: liters ↔ oz

Storage always in metric (kg, cm, L). Conversion only for display. This matches the existing pattern for workout settings.

### 4. Health Goals vs Workout Goals
The existing `goals` table is for workout-specific exercise goals (target weight/reps for next session). The new `health_goals` table is separate — it stores health metric targets (sleep, water, weight, waist). These are different concepts and should remain separate.

### 5. Body Fat Percent
The spec doesn't include body fat % in Daily Log fields. The column stays in the DB (migration rules) but is removed from the UI. Existing data is preserved.

### 6. Module System Removal Strategy
Rather than deleting DB columns (forbidden), we:
1. Stop reading `enabled_modules` and `active_module` from the app
2. Remove all module-related UI components and providers
3. Mark columns as deprecated via SQL COMMENT
4. The app now always shows both Progress and Daily Log (via toggle)

---

## Notes for Implementation

1. **Build shared package** after Phase 1 changes (`npm run build` in packages/shared)
2. **Test migrations** on a fresh Supabase instance before applying to dev/prod
3. **Update CLAUDE.md** repository structure section after refactor is complete
4. **No new dependencies needed** — all UI can be built with existing Tamagui + MaterialCommunityIcons
5. **Maintain ordinal routing** — subject/[id] and entry/[entryId] routes are unchanged
6. **Auth guards remain** — all protected screens still check session
