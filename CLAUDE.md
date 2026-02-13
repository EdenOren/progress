# Progress - Claude Operating Guide

## Project Summary

Progress is a mobile app (iOS + Android) for tracking personal progress, currently focused on workout tracking with daily health logging and KPI dashboards.

Users create **subjects** (workout routines like "Monday Practice"), configure exercise templates, start **entries** (sessions), log **sets** (weight/reps/duration), provide **feedback** (done/up ratings), and track **goals**. A separate **daily log** tracks weight, sleep, water intake, and waist measurements. A **KPI dashboard** computes health metrics from daily logs and user-set health goals.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces |
| Mobile | Expo 54 + React Native 0.81 + TypeScript (strict) |
| UI | Tamagui |
| Navigation | Expo Router 6 (file-based, 3-tab layout) |
| Data Fetching | TanStack React Query v5 |
| Forms | react-hook-form + Zod |
| Backend | Supabase (Postgres, Auth, RLS) |
| Testing | Vitest (shared package) |

---

## Architecture Rules

### Data Flow

```
User Action -> Component -> Hook -> API Function -> Supabase
                                      |
                              Zod Validation
                                      |
                              Result<T> Return
                                      |
                          Hook handles success/error
```

1. User triggers action in component
2. Component calls a hook (`useSubjects`, `useEntries`, etc.)
3. Hook calls an API function from `@progress/shared`
4. API function queries Supabase, validates response with Zod, returns `Result<T>`
5. Hook handles the result:
   - Success: Updates React Query cache
   - Error: Shows toast via central error handler

### API Layer (CRITICAL)

- **NEVER** import `@supabase/supabase-js` directly in `apps/mobile/src/` (except through the shared package)
- **ALL** Supabase calls go through `packages/shared/src/api/*`
- **ALL** API functions return `Result<T, AppError>`
- **VALIDATE** all external data with Zod schemas

```typescript
// CORRECT - in apps/mobile
import { getSubjects } from '@progress/shared';

// WRONG - direct Supabase import in mobile
import { supabase } from '@supabase/supabase-js';
```

### Error Handling

- Use `AppError` subclasses: `AuthError`, `ValidationError`, `NotFoundError`, `NetworkError`, `ForbiddenError`, `DuplicateError`, `DatabaseError`, `InternalError`
- Map Supabase errors using `mapSupabaseError()` in the API layer
- Handle all errors through the central handler in `apps/mobile/src/utils/errorHandler.ts`
- Show user-friendly toasts based on error type

### Result Type Pattern

```typescript
type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helpers: ok(), err(), isOk(), isErr(), unwrap(), unwrapOr(), map(), mapErr()
```

---

## Domain Naming Conventions

| Term | Definition | Example |
|------|------------|---------|
| **Subject** | User's workout routine | "Monday Practice", "Friday Leg Day" |
| **Entry** | A performed session on a date | Entry for "Monday Practice" on Jan 15 |
| **Item** | Exercise within an entry | "Deadlift", "Squats" |
| **Set** | Weight/reps/duration record per item | 100kg x 8 reps |
| **Feedback** | Rating per item | "done", "up" |
| **Goal** | Target for next session per item | { weight_kg: 105, reps: 8 } |
| **Template** | Preconfigured exercises for a subject | Deadlift 3x8, Squats 3x10 |
| **Daily Log** | Daily health metrics entry | Sleep 7.5h, Weight 80kg |
| **Health Goal** | Target health metrics | Sleep 8h, Water 2.5L |

---

## Repository Structure

```
progress/
├── apps/
│   └── mobile/                          # Expo React Native app
│       ├── app/                         # Expo Router (file-based routing)
│       │   ├── _layout.tsx              # Root layout (providers, auth guard)
│       │   ├── index.tsx                # Entry point (redirects to tabs or auth)
│       │   ├── +not-found.tsx           # 404 screen
│       │   ├── profile.tsx              # Profile screen (DOB, height)
│       │   ├── goals.tsx                # Health goals screen
│       │   ├── (auth)/                  # Auth screens
│       │   │   ├── login.tsx
│       │   │   └── signup.tsx
│       │   ├── (tabs)/                  # 3-tab navigation
│       │   │   ├── _layout.tsx          # Tab bar config (Progress | KPI | Menu)
│       │   │   ├── index.tsx            # Home: segmented toggle (Progress / Daily Log)
│       │   │   ├── kpi.tsx              # KPI dashboard (2x2 grid)
│       │   │   ├── menu.tsx             # Menu screen (Profile, Goals, Settings)
│       │   │   └── subject/             # Nested workout routes
│       │   │       └── [id]/            # Subject by ordinal
│       │   │           ├── _layout.tsx
│       │   │           ├── index.tsx     # Subject detail (sessions list)
│       │   │           └── entry/
│       │   │               └── [entryId].tsx  # Entry detail (exercise logging)
│       │   └── settings/
│       │       └── index.tsx            # Settings (unit preferences)
│       └── src/
│           ├── components/              # Reusable UI components
│           │   ├── AddExerciseSheet.tsx  # Bottom sheet for adding exercises
│           │   ├── AddItemModal.tsx      # Modal for adding items
│           │   ├── Button.tsx           # Styled button
│           │   ├── Card.tsx             # Base card component
│           │   ├── CreateSubjectModal.tsx # Create workout modal
│           │   ├── DailyLogEntryCard.tsx # Daily log entry display
│           │   ├── DatePickerField.tsx  # Cross-platform date picker
│           │   ├── EmptyState.tsx       # Empty state placeholder
│           │   ├── ExerciseInputCard.tsx # Exercise set logging UI
│           │   ├── IconSelectSheet.tsx  # Icon picker
│           │   ├── Input.tsx            # Styled text input
│           │   ├── ItemCard.tsx         # Exercise item display
│           │   ├── KpiCard.tsx          # KPI metric card
│           │   ├── LoadingScreen.tsx    # Loading spinner
│           │   ├── LogDailyLogModal.tsx # Daily log entry form
│           │   ├── SetDefaultsSheet.tsx # Default sets configuration
│           │   ├── TemplateSection.tsx  # Workout template management
│           │   ├── UnitToggle.tsx       # Unit preference toggle
│           │   └── index.ts            # Barrel export
│           ├── hooks/                   # React Query hooks
│           │   ├── useAppColorScheme.ts # Dark/light mode
│           │   ├── useAuth.ts           # Authentication
│           │   ├── useDailyLog.ts       # Daily log CRUD
│           │   ├── useEntries.ts        # Entry CRUD + completion
│           │   ├── useExercises.ts      # Exercise library
│           │   ├── useHealthGoals.ts    # Health goals CRUD
│           │   ├── useItems.ts          # Item CRUD
│           │   ├── useKpi.ts            # KPI calculations
│           │   ├── useProfile.ts        # User profile
│           │   ├── useSets.ts           # Set CRUD
│           │   ├── useSettings.ts       # User settings
│           │   ├── useSubjects.ts       # Subject CRUD + stats
│           │   ├── useTemplates.ts      # Workout templates
│           │   └── index.ts            # Barrel export
│           ├── providers/               # Context providers
│           │   └── SupabaseProvider.tsx  # Supabase client + auth context
│           └── utils/                   # Mobile utilities
│               ├── alert.ts             # Cross-platform alert (native + web)
│               ├── errorHandler.ts      # Central error handler
│               ├── toast.ts             # Toast notifications
│               └── index.ts            # Barrel export
├── packages/
│   └── shared/                          # @progress/shared package
│       └── src/
│           ├── api/                     # Supabase API functions
│           │   ├── dailyLog.ts          # Daily log entries
│           │   ├── domains.ts           # Tracking domains
│           │   ├── entries.ts           # Session entries
│           │   ├── exercises.ts         # Exercise library
│           │   ├── goals.ts             # Per-item goals
│           │   ├── healthGoals.ts       # Health metric goals
│           │   ├── items.ts             # Entry items
│           │   ├── profiles.ts          # User profiles
│           │   ├── settings.ts          # User settings
│           │   ├── subjects.ts          # Workout subjects
│           │   ├── templates.ts         # Workout templates
│           │   └── index.ts
│           ├── config/                  # Environment validation
│           ├── constants/               # Domain IDs, magic values
│           ├── errors/                  # AppError subclasses
│           ├── schemas/                 # Zod validation schemas
│           │   ├── domain.ts            # Core domain schemas
│           │   ├── domain.test.ts       # Schema tests
│           │   └── index.ts
│           ├── supabase/                # Supabase client + Database types
│           ├── types/                   # TypeScript interfaces
│           │   ├── domain.ts            # Core domain types
│           │   ├── dailyLog.ts          # Daily log types
│           │   ├── healthGoals.ts       # Health goals types
│           │   ├── result.ts            # Result<T> type
│           │   ├── settings.ts          # Settings types
│           │   └── index.ts
│           ├── utils/                   # Pure utility functions
│           │   ├── calculations.ts      # Volume, stats, goals, formatting
│           │   ├── calculations.test.ts # Calculation tests
│           │   ├── dates.ts             # Date formatting, streaks
│           │   ├── dates.test.ts        # Date tests
│           │   ├── kpi.ts               # KPI computations
│           │   ├── logger.ts            # Structured logging
│           │   └── index.ts
│           └── index.ts                 # Main barrel export
├── supabase/
│   ├── migrations/                      # 16 SQL migration files (001-015 + one timestamp)
│   └── seed.sql
├── docs/
│   ├── product.md
│   └── db.md
└── .claude/
    ├── agents/                          # Specialized AI agents
    └── skills/                          # Dev pattern references
```

---

## Navigation Structure

The app uses a 3-tab layout:

```
(tabs)/
├── index.tsx      → "Progress" tab (segmented toggle: Progress | Daily Log)
├── kpi.tsx        → "KPI" tab (health metrics dashboard)
└── menu.tsx       → "Menu" tab (Profile, Goals, Settings links)
```

The Progress tab contains a segmented toggle in the header:
- **Progress view**: Subject list with workout cards, FAB to create subjects
- **Daily Log view**: 7-day log entries, FAB to log new entry

Subject routes use ordinal-based URLs: `/subject/1`, `/subject/1/entry/2`

---

## Commands

```bash
# Install all dependencies
pnpm install

# Build shared package (required after changes to @progress/shared)
pnpm run build

# Run tests (shared package)
pnpm run test

# Type-check mobile app
cd apps/mobile && pnpm run typecheck

# Start Expo dev server
cd apps/mobile && npx expo start
```

---

## Coding Standards

### TypeScript

- **Strict mode enabled** - no exceptions
- **No `any` type** - use `unknown` and narrow types
- **No type assertions** (`as`) unless absolutely necessary with comment explaining why
- **Prefer interfaces** over type aliases for object shapes
- **All external data validated** with Zod at boundaries

### React Native

- **Small components**: Screen -> Sections -> Components
- **Hooks for logic**: Keep components presentation-focused
- **Tamagui for styling**: Use theme tokens (`$color`, `$primary`, `$textMuted`, etc.)
- **React Query for server state**: Don't duplicate in local state

### General

- **Pure functions** where possible
- **Explicit returns** - avoid implicit returns in multi-line functions
- **Descriptive names** - `getSubjectsByUserId` not `getData`
- **No magic numbers** - use named constants from `@progress/shared`
- **Use structured logger** - `logWarn()`, `logError()` from `@progress/shared`, not `console.*`

---

## Definition of Done

- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] No `any` types introduced
- [ ] Tests pass (`pnpm run test`)
- [ ] API functions return `Result<T>`
- [ ] Zod validation on all external data
- [ ] Error handling in place
- [ ] Shared package rebuilt if modified (`pnpm run build`)

---

## Common Tasks

### Adding a New API Function

1. Add TypeScript interface in `packages/shared/src/types/`
2. Add Zod schema in `packages/shared/src/schemas/`
3. Add API function in `packages/shared/src/api/`
4. Export from `packages/shared/src/index.ts`
5. Run `pnpm run build` to rebuild shared package
6. Create React Query hook in `apps/mobile/src/hooks/`

### Adding a New Screen

1. Create file in `apps/mobile/app/` following Expo Router conventions
2. For tab screens: add to `(tabs)/_layout.tsx`
3. For stack screens: add route file directly
4. Use hooks from `src/hooks/` for data, not direct API calls
5. Handle loading/error states
6. Use `Stack.Screen` options for header customization

### Branching Convention

```
story/<number>-<short-description>   # Features
fix/<number>-<short-description>     # Bug fixes
```

Branches off `main`. Push and merge via PR when complete.

### Modifying Database Schema

1. Create new migration in `supabase/migrations/` (numbered sequentially)
2. Update RLS policies if needed
3. Update TypeScript types in `packages/shared/src/types/`
4. Update Zod schemas in `packages/shared/src/schemas/`
5. Update Database interface in `packages/shared/src/supabase/client.ts`
6. Rebuild shared package

---

## Database Migration Rules (CRITICAL)

**ALL migrations MUST be backwards compatible. NO DATA LOSS.**

### Mandatory Rules

1. **NEVER drop columns** that contain user data
2. **NEVER drop tables** that contain user data
3. **NEVER change column types** in ways that lose precision
4. **NEVER add NOT NULL** to existing columns without a DEFAULT value
5. **NEVER rename columns** - add new, migrate data, deprecate old

### Safe Patterns

```sql
ALTER TABLE entries ADD COLUMN new_field TEXT;                    -- nullable column
ALTER TABLE entries ADD COLUMN status TEXT NOT NULL DEFAULT 'active'; -- with default
CREATE TABLE new_feature (...);                                  -- new table
CREATE INDEX idx_entries_date ON entries(performed_at);           -- index
```

### Pre-Migration Checklist

- [ ] Works on database with existing data?
- [ ] All new NOT NULL columns have DEFAULT values?
- [ ] Only adding, not removing or modifying columns?
- [ ] Idempotent (can run multiple times safely)?

---

## Project-Specific Patterns

### API Function Pattern

```typescript
export async function getSubjects(
  supabase: SupabaseClient,
  userId: string
): Promise<Result<Subject[]>> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: mapSupabaseError(error) };
  }

  const validated = subjectArraySchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: new ValidationError('Invalid data') };
  }

  return { success: true, data: validated.data };
}
```

### React Query Hook Pattern

```typescript
export function useSubjects(userId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['subjects', userId],
    queryFn: async () => {
      const result = await getSubjects(supabase, userId);
      if (!result.success) throw result.error;
      return result.data;
    },
  });
}
```

### RLS Policy Pattern

```sql
CREATE POLICY "Users can access own data"
  ON table_name FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### Cross-Platform Alert Pattern

Use `showAlert()` from `src/utils/alert.ts` instead of `Alert.alert` for web compatibility:

```typescript
import { showAlert } from '../utils/alert';

showAlert('Delete', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
]);
```

---

## Anti-Patterns to Avoid

1. **Missing Auth Guards** - Always check session in protected routes
2. **`as any` for missing DB types** - Add to Database interface first
3. **Utility functions inside components** - Extract to separate functions
4. **Hardcoded UUIDs** - Import from `@progress/shared` constants
5. **`console.log/warn/error`** - Use `logWarn`, `logError` from shared
6. **Stale state in async** - Capture values before mutations
7. **Missing local state for optimistic updates** - Track local + server state
8. **Sequential IDs** - Always use UUIDs with `gen_random_uuid()`
9. **Oversized components** - Keep screens < 300 lines, extract sections
10. **Direct `window` access** - Use `globalThis` cast for web compatibility
