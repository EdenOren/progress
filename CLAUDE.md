# Progress - Claude Operating Guide

## Project Summary

Progress is a mobile app (iOS + Android) for tracking personal progress across multiple domains.

**MVP Domain**: Workout tracking - users create subjects (routines like "Monday Practice"), log entries (performed instances), add items (drills/exercises), record sets (weight/reps), and track feedback and goals.

**Future Domains**: Nutrition, sleep, study, and more (database designed for extensibility).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Mobile | Expo React Native + TypeScript (strict) |
| UI | Tamagui |
| Navigation | Expo Router (file-based) |
| Data Fetching | TanStack React Query |
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

- **NEVER** import `@supabase/supabase-js` in `apps/mobile/src/` (except through the shared package)
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

- Use `AppError` subclasses for typed errors (`AuthError`, `ValidationError`, `NotFoundError`, `NetworkError`)
- Map Supabase errors using `mapSupabaseError()` in the API layer
- Handle all errors through the central handler in `apps/mobile/src/utils/errorHandler.ts`
- Show user-friendly toasts based on error type

### Result Type Pattern

```typescript
type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const result = await getSubjects(userId);
if (result.success) {
  // result.data is typed as Subject[]
} else {
  // result.error is typed as AppError
}
```

---

## Domain Naming Conventions

| Term | Definition | Example |
|------|------------|---------|
| **Domain** | Category of tracking | `workout`, `nutrition` |
| **Subject** | User's custom routine/bucket | "Monday Practice", "Friday Leg Day" |
| **Entry** | Performed instance at a date | Entry for "Monday Practice" on Jan 15 |
| **Item** | Drill/exercise within an entry | "Deadlift", "Squats" |
| **Set** | Weight/reps record per item | 100kg x 8 reps |
| **Feedback** | Success/hard/fail rating per item | "hard" |
| **Goal** | Target for next session | { weight_kg: 105, reps: 8 } |

---

## Repository Structure

```
progress/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── app/                   # Expo Router (file-based routing)
│       │   ├── _layout.tsx        # Root layout with providers
│       │   ├── index.tsx          # Entry point (auth redirect)
│       │   ├── (auth)/            # Auth screens group
│       │   │   ├── login.tsx
│       │   │   └── signup.tsx
│       │   ├── (tabs)/            # Tab screens group
│       │   │   ├── index.tsx      # Subject list (home)
│       │   │   └── profile.tsx
│       │   ├── subject/[id].tsx   # Subject detail
│       │   └── entry/[id].tsx     # Entry detail
│       └── src/
│           ├── components/        # Reusable UI components
│           ├── providers/         # Context providers (Supabase, Query)
│           ├── hooks/             # React Query hooks
│           └── utils/             # Mobile utilities (error handler)
├── packages/
│   └── shared/                    # Shared code (types, API, errors)
│       └── src/
│           ├── types/             # TypeScript interfaces
│           ├── schemas/           # Zod validation schemas
│           ├── api/               # Supabase API functions
│           ├── errors/            # Error classes
│           ├── config/            # Environment validation
│           ├── supabase/          # Supabase client
│           └── utils/             # Utility functions
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── seed.sql                   # Seed data
├── docs/
│   ├── product.md                 # Product requirements
│   └── db.md                      # Database documentation
└── .claude/
    ├── agents/                    # Specialized AI agents
    └── skills/                    # Development pattern references
```

---

## Commands

```bash
# Install all dependencies
npm install

# Build shared package
npm run build

# Run tests
npm run test

# Start Expo dev server (from apps/mobile)
cd apps/mobile && npx expo start

# Run tests with coverage
npm run test -- --coverage
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
- **Tamagui for styling**: Use theme tokens, avoid inline styles
- **React Query for server state**: Don't duplicate in local state

### General

- **Pure functions** where possible
- **Explicit returns** - avoid implicit returns in multi-line functions
- **Descriptive names** - `getSubjectsByUserId` not `getData`
- **No magic numbers** - use named constants

---

## Definition of Done

A task is complete when:

- [ ] TypeScript compiles without errors
- [ ] No `any` types introduced
- [ ] Tests pass for new logic (utilities, schemas)
- [ ] API functions return `Result<T>`
- [ ] Zod validation on all external data
- [ ] Error handling in place
- [ ] No console warnings in development

---

## Common Tasks

### Adding a New API Function

1. Add TypeScript interface in `packages/shared/src/types/`
2. Add Zod schema in `packages/shared/src/schemas/`
3. Add API function in `packages/shared/src/api/`
4. Export from `packages/shared/src/index.ts`
5. Create React Query hook in `apps/mobile/src/hooks/`

### Adding a New Screen

1. Create file in `apps/mobile/app/` following Expo Router conventions:
   - `app/screenname.tsx` for root-level screens
   - `app/(group)/screenname.tsx` for grouped screens
   - `app/folder/[param].tsx` for dynamic routes
2. Use hooks from `src/hooks/` for data fetching, not direct API calls
3. Handle loading and error states
4. Use `Stack.Screen` options for header customization

### Branching Convention

All work (features and bug fixes) gets its own branch off `develop`.

```
story/<number>-<short-description>   # Features
fix/<number>-<short-description>     # Bug fixes
```

Examples:
- `story/1-signup-feedback`
- `story/2-delete-workout`
- `fix/1-datetime-schema`
- `fix/2-route-path`

Workflow:
1. Create branch from `develop`: `git checkout -b story/<n>-<name> develop`
2. Implement with commits on that branch
3. Push and merge back to `develop` when complete
4. **Always** delete the branch after merge (local + remote)

### Modifying Database Schema

1. Create new migration file in `supabase/migrations/`
2. Update RLS policies if needed
3. Update TypeScript types in `packages/shared/src/types/`
4. Update Zod schemas in `packages/shared/src/schemas/`
5. Update `docs/db.md`

---

## Database Migration Rules (CRITICAL)

**ALL migrations MUST be backwards compatible with existing data. NO DATA LOSS is acceptable.**

### Mandatory Rules

1. **NEVER drop columns** that contain user data
2. **NEVER drop tables** that contain user data
3. **NEVER change column types** in ways that lose precision or data
4. **NEVER add NOT NULL constraints** to existing columns without a DEFAULT value
5. **NEVER rename columns** - add new column, migrate data, then deprecate old (in separate migration)

### Safe Migration Patterns

```sql
-- SAFE: Adding a new nullable column
ALTER TABLE entries ADD COLUMN new_field TEXT;

-- SAFE: Adding a new column with default
ALTER TABLE entries ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- SAFE: Adding a new table
CREATE TABLE new_feature (...);

-- SAFE: Adding an index
CREATE INDEX idx_entries_date ON entries(performed_at);

-- SAFE: Adding a CHECK constraint (validates future data only)
ALTER TABLE entries ADD CONSTRAINT check_positive CHECK (value >= 0);
```

### Unsafe Patterns (NEVER DO)

```sql
-- UNSAFE: Dropping a column
ALTER TABLE entries DROP COLUMN notes;  -- DATA LOSS!

-- UNSAFE: Dropping a table
DROP TABLE old_feature;  -- DATA LOSS!

-- UNSAFE: Changing type that loses data
ALTER TABLE entries ALTER COLUMN weight_kg TYPE INTEGER;  -- Loses decimals!

-- UNSAFE: Adding NOT NULL without default to existing table
ALTER TABLE entries ADD COLUMN required_field TEXT NOT NULL;  -- Fails on existing rows!

-- UNSAFE: Renaming (use add + migrate + deprecate instead)
ALTER TABLE entries RENAME COLUMN old_name TO new_name;  -- Breaks existing code!
```

### Column Deprecation Process

When you need to "rename" or remove a column:

1. **Migration 1**: Add new column, copy data
   ```sql
   ALTER TABLE entries ADD COLUMN new_name TEXT;
   UPDATE entries SET new_name = old_name;
   ```

2. **Code Update**: Update all code to use new column

3. **Migration 2** (after verification): Add comment marking old column deprecated
   ```sql
   COMMENT ON COLUMN entries.old_name IS 'DEPRECATED: Use new_name instead. Do not delete - contains historical data.';
   ```

4. **NEVER delete the old column** - it stays forever as historical record

### Pre-Migration Checklist

- [ ] Does this migration work on a database with existing data?
- [ ] Have I tested the migration on a copy of production data?
- [ ] Are all new NOT NULL columns given DEFAULT values?
- [ ] Am I adding columns, not removing or modifying existing ones?
- [ ] Will this migration succeed if run multiple times (idempotent)?

---

## Agent & Skill Workflow

Follow this workflow for feature development:

### 1. Plan First (architect + planner)
```
User Request -> architect (if architectural) -> planner (always for complex tasks)
```
- Use **architect** when adding new domains, changing data models, or making structural decisions
- Use **planner** to break down the work into specific implementation steps

### 2. Write Tests (tdd-guide)
```
Plan -> tdd-guide -> Write failing tests first
```
- Write unit tests for API functions and schemas before implementation
- Define expected behavior upfront

### 3. Implement
```
Tests -> Implement code -> Run tests until green
```
- Follow the plan's step-by-step guidance
- Reference **backend-patterns** for API functions
- Reference **frontend-patterns** for components/hooks

### 4. Review (code-reviewer + database-reviewer + security-reviewer)
```
Implementation -> code-reviewer -> database-reviewer (if SQL) -> security-reviewer (if auth/input)
```
- **code-reviewer**: Quality, patterns, error handling
- **database-reviewer**: Migrations, RLS policies, query optimization
- **security-reviewer**: Auth code, user input, sensitive data

### 5. Cleanup (refactor-cleaner)
```
After feature complete -> refactor-cleaner -> Remove dead code
```
- Run after merging to clean up unused code
- Document deletions

### 6. E2E Testing (e2e-runner)
```
Feature complete -> e2e-runner -> Test critical user journeys
```
- Test complete flows: auth, CRUD operations
- Ensure no regressions

### Example Workflow

**Task**: "Add ability to delete a subject"

1. **planner**: Break down into steps (API function, hook, UI, confirmation dialog)
2. **tdd-guide**: Write test for `deleteSubject` API function
3. **Implement**: Create API function, hook, and UI
4. **code-reviewer**: Check error handling, Result type usage
5. **database-reviewer**: Verify cascade delete, RLS policy
6. **security-reviewer**: Confirm user can only delete own subjects

---

## Agents

Specialized agents in `.claude/agents/` handle complex tasks. Use them proactively.

### Quick Reference

| Agent | When to Use |
|-------|-------------|
| `architect` | Planning features, system design, architectural decisions |
| `planner` | Breaking down complex tasks into implementation steps |
| `code-reviewer` | After writing code - reviews quality, security, patterns |
| `database-reviewer` | SQL, migrations, RLS policies, query optimization |
| `security-reviewer` | Auth code, user input handling, sensitive data |
| `tdd-guide` | New features or bugs - enforces test-first development |
| `refactor-cleaner` | Dead code removal, duplicate consolidation |
| `e2e-runner` | End-to-end test creation and maintenance |

### Agent Details

**architect** - Use when planning new features or making architectural decisions:
- Adding new tracking domains (nutrition, sleep)
- Designing data models and relationships
- Evaluating trade-offs between approaches
- Ensuring consistency with existing architecture

**planner** - Use when breaking down complex work:
- Creating step-by-step implementation plans
- Identifying dependencies between tasks
- Specifying file paths and changes needed
- Prioritizing implementation order

**code-reviewer** - Use after writing or modifying code:
- Reviews for simplicity and readability
- Checks error handling patterns
- Validates Result type usage
- Ensures Zod validation is present
- Flags security issues (hardcoded values, missing validation)

**database-reviewer** - Use for database work:
- Designing new tables and relationships
- Writing migration files
- Creating and reviewing RLS policies
- Optimizing Supabase queries
- Adding appropriate indexes

**security-reviewer** - Use when touching sensitive areas:
- Authentication/authorization code
- User input handling
- API endpoints
- Environment variable usage
- Supabase RLS policy verification

**tdd-guide** - Use when writing new functionality:
- Guides test-first development
- Writes unit tests for API functions
- Tests Zod schemas with edge cases
- Ensures 80%+ test coverage

**refactor-cleaner** - Use for cleanup tasks:
- Removing unused exports and files
- Consolidating duplicate code
- Running `knip` and `depcheck`
- Documenting deletions

**e2e-runner** - Use for integration testing:
- Testing complete user flows
- Auth flow testing
- CRUD operation testing
- Managing test stability

### How to Invoke Agents

Ask Claude to use specific agents by name:

```
"Use the planner agent to break down this feature"
"Run code-reviewer on the changes I just made"
"Use database-reviewer to check my migration"
"Use security-reviewer on the auth code"
```

Or Claude will proactively suggest agents when appropriate based on the task.

---

## Skills

Pattern references in `.claude/skills/` for development guidance.

### Available Skills

| Skill | Content |
|-------|---------|
| `backend-patterns` | API design, repository pattern, caching, error handling |
| `frontend-patterns` | React components, hooks, state management, performance |

### When to Reference

**backend-patterns** - Reference when working on:
- API functions in `packages/shared/src/api/`
- Service layer logic
- Error handling patterns
- Query optimization

**frontend-patterns** - Reference when working on:
- React Native components in `apps/mobile/src/components/`
- Custom hooks in `apps/mobile/src/hooks/`
- State management with Context
- Performance optimization (memoization)

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

  const validated = SubjectArraySchema.safeParse(data);
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
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  });
}
```

### RLS Policy Pattern

```sql
-- Standard user-owned resource policy
CREATE POLICY "Users can access own data"
  ON table_name
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

### Database Security Checklist

- [ ] RLS enabled on all tables with user data
- [ ] Policies use `(SELECT auth.uid())` pattern (not `auth.uid()` directly)
- [ ] Foreign key columns indexed
- [ ] No direct database access from mobile app
- [ ] All queries through `@progress/shared` API

### Critical Code - Never Remove

- Supabase client configuration
- API functions in `packages/shared/src/api/`
- Error classes and `mapSupabaseError()`
- React Query hooks
- Zod validation schemas
- Auth flow components

---

## Anti-Patterns to Avoid

These are common mistakes identified during code reviews. Follow these guidelines to maintain code quality.

### 1. Missing Auth Guards

**Problem**: Protected routes can be bypassed via deep links.

```typescript
// WRONG - No auth check
export default function ProtectedScreen() {
  return <Content />;
}

// CORRECT - Always guard protected routes
export default function ProtectedScreen() {
  const { session, isLoading } = useSupabaseContext();

  if (isLoading) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return <Content />;
}
```

### 2. Using `as any` for Missing Database Types

**Problem**: When a table isn't in the Database interface, using `as any` bypasses type safety.

```typescript
// WRONG - Using `as any` to bypass missing types
const { data } = await (supabase as any).from('new_table').select('*');

// CORRECT - Add table to Database interface first
// In packages/shared/src/supabase/client.ts:
interface Database {
  public: {
    Tables: {
      new_table: {
        Row: { /* columns */ };
        Insert: { /* columns */ };
        Update: { /* columns */ };
      };
    };
  };
}
```

### 3. Utility Functions Inside Components

**Problem**: Functions recreated on every render, harder to test.

```typescript
// WRONG - Function inside component
function MyComponent() {
  const formatTimer = (seconds: number) => { /* ... */ };
  return <Text>{formatTimer(elapsed)}</Text>;
}

// CORRECT - Function outside component
function formatTimer(seconds: number): string { /* ... */ }

function MyComponent() {
  return <Text>{formatTimer(elapsed)}</Text>;
}
```

### 4. Hardcoded UUIDs

**Problem**: Scattered magic values, hard to maintain.

```typescript
// WRONG - Hardcoded UUID in component
const WORKOUT_DOMAIN_ID = 'd0000000-0000-0000-0000-000000000001';

// CORRECT - Import from shared constants
import { WORKOUT_DOMAIN_ID } from '@progress/shared';
```

### 5. Using console.log/warn/error

**Problem**: No structured logging, can't filter or aggregate.

```typescript
// WRONG - Direct console usage
console.warn('Failed to create sets:', error);

// CORRECT - Use logger utility
import { logWarn } from '@progress/shared';
logWarn('Failed to create sets', { error });
```

### 6. Stale State in Async Operations

**Problem**: Using state that may be outdated when async operation completes.

```typescript
// WRONG - Reading state after async, may be stale
const handleComplete = () => {
  completeEntry.mutate(entryId, {
    onSuccess: () => {
      // items may have changed since mutation started
      const count = entry.items.filter(i => i.feedback).length;
    },
  });
};

// CORRECT - Capture values before mutation
const handleComplete = () => {
  // Capture current state before async operation
  const stats = calculateStats(entry.items, localMarkedItems);

  completeEntry.mutate(entryId, {
    onSuccess: () => {
      showSummary(stats); // Use captured values
    },
  });
};
```

### 7. Not Tracking Local State for Optimistic Updates

**Problem**: React Query cache may be stale, causing UI glitches.

```typescript
// WRONG - Relying only on server state
const isMarked = item.feedback !== null;

// CORRECT - Track local state for items marked this session
const [markedItems, setMarkedItems] = useState<Map<string, 'done' | 'up'>>(new Map());

const handleFeedback = (itemId: string, rating: 'done' | 'up') => {
  setMarkedItems(prev => new Map(prev).set(itemId, rating));
};

const isMarked = item.feedback !== null || markedItems.has(item.id);
```

### 8. Using Sequential IDs Instead of UUIDs

**Problem**: Sequential IDs leak information and are predictable.

```sql
-- WRONG - Sequential IDs
CREATE TABLE entries (
  id SERIAL PRIMARY KEY
);

-- CORRECT - UUIDs
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
```

### 9. Oversized Components

**Problem**: Hard to maintain, test, and understand.

- Screen components should be < 300 lines
- Extract sections into subcomponents
- Move logic to custom hooks
- Keep UI components presentation-focused

### 10. Missing Index Signature Access

**Problem**: TypeScript strict mode requires bracket notation for index signatures.

```typescript
// WRONG - Dot notation on index signature
if (process.env.NODE_ENV !== 'production') { }

// CORRECT - Bracket notation
if (process.env['NODE_ENV'] !== 'production') { }
```
