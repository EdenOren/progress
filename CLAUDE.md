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
User Action → Component → Hook → API Function → Supabase
                                      ↓
                              Zod Validation
                                      ↓
                              Result<T> Return
                                      ↓
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
└── docs/
    ├── product.md                 # Product requirements
    └── db.md                      # Database documentation
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

- **Small components**: Screen → Sections → Components
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

### Modifying Database Schema

1. Create new migration file in `supabase/migrations/`
2. Update RLS policies if needed
3. Update TypeScript types in `packages/shared/src/types/`
4. Update Zod schemas in `packages/shared/src/schemas/`
5. Update `docs/db.md`
