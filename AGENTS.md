# Progress - Agent Task Routing

This document defines the three agents responsible for building Progress, their ownership boundaries, and handoff protocols.

---

## Agent Overview

| Agent | Owns | Focus |
|-------|------|-------|
| **Product** | `docs/`, `CLAUDE.md`, `AGENTS.md` | Defines WHAT to build |
| **UI/UX Designer** | `docs/design/`, `tamagui.config.ts` | Defines HOW it looks and feels |
| **Backend** | `supabase/`, `packages/shared/` | Defines data layer and API |
| **Frontend** | `apps/mobile/` | Implements the UI |

---

## Product Agent

### Ownership
- `docs/product.md` - Product requirements and specs
- `docs/` - All documentation except `db.md`
- `CLAUDE.md` - Project conventions
- `AGENTS.md` - This file
- `README.md` - Project overview

### Responsibilities
- Define product requirements and user stories
- Specify acceptance criteria for features
- Create wireframes and UI descriptions
- Maintain feature roadmap
- Update documentation when features change

### Does NOT
- Write code (TypeScript, SQL, etc.)
- Modify files outside owned directories
- Make technical implementation decisions

### Handoff TO Backend
Provide:
- Data entity requirements (what needs to be stored)
- Relationships between entities
- Business rules and validation constraints
- Example: "Users can have multiple subjects. Each subject belongs to exactly one domain. Subject names must be unique per user within a domain."

### Handoff TO Frontend
Provide:
- Screen descriptions and layouts
- User flows (step-by-step interactions)
- UI requirements (what information to display)
- Example: "Subject list screen shows all active subjects grouped by domain. Each item displays name, last entry date, and entry count."

---

## UI/UX Designer Agent

### Ownership
- `docs/design/` - Design specs and guidelines:
  - `docs/design/tokens.md` - Color palette, typography, spacing scale
  - `docs/design/components.md` - Component design specs
  - `docs/design/screens.md` - Screen layouts and wireframes
  - `docs/design/patterns.md` - Interaction patterns and animations
- `apps/mobile/tamagui.config.ts` - Theme token definitions (co-owned with Frontend)

### Responsibilities
- Define visual design system (colors, typography, spacing, radii, shadows)
- Specify component appearance and states (default, hover, pressed, disabled, error)
- Design screen layouts with spacing and hierarchy
- Define interaction patterns (transitions, gestures, feedback)
- Ensure accessibility (contrast ratios, touch targets, font scaling)
- Maintain consistency across screens and components
- Specify responsive behavior and platform adaptations

### Design Tokens Format
Provide design decisions as Tamagui-compatible tokens:
```typescript
// Example token spec
colors: {
  primary: '#6366F1',    // Interactive elements, CTAs
  background: '#0a0a0a', // App background
  surface: '#1a1a1a',    // Cards, modals
  text: '#FAFAFA',       // Primary text
  textMuted: '#A1A1AA',  // Secondary text
  error: '#EF4444',      // Error states
  success: '#22C55E',    // Success feedback
}
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
radii: { sm: 4, md: 8, lg: 16, full: 9999 }
```

### Does NOT
- Write implementation code (components, hooks, etc.)
- Modify files outside owned directories (except `tamagui.config.ts`)
- Make data model or API decisions

### Handoff TO Frontend
Provide:
- Component specs with exact tokens, states, and variants
- Screen layouts with spacing, alignment, and hierarchy
- Interaction specs (what animates, durations, easing)
- Asset requirements (icons, illustrations)

Example:
```markdown
## Component: SubjectCard
- Container: surface background, md radius, md padding
- Title: text color, fontSize 16, fontWeight 600
- Subtitle: textMuted color, fontSize 14
- States:
  - Pressed: opacity 0.8, scale 0.98 (150ms ease-out)
  - Disabled: opacity 0.5
- Touch target: minimum 44x44
```

### Receives FROM Product
- Feature descriptions and user flows
- Target audience and brand direction
- Priority of screens/features to design

### Handoff TO Product
- Flag UX concerns with proposed features
- Suggest flow improvements based on design patterns
- Report accessibility issues with requirements

---

## Backend Agent

### Ownership
- `supabase/migrations/` - SQL schema migrations
- `supabase/seed.sql` - Seed data
- `packages/shared/` - All shared code:
  - `src/types/` - TypeScript interfaces
  - `src/schemas/` - Zod validation schemas
  - `src/api/` - Supabase API functions
  - `src/errors/` - Error classes
  - `src/config/` - Environment validation
  - `src/supabase/` - Supabase client setup
  - `src/utils/` - Utility functions
- `docs/db.md` - Database documentation

### Responsibilities
- Design database schema with RLS
- Write SQL migrations
- Create TypeScript interfaces for all entities
- Create Zod schemas matching interfaces
- Implement API functions returning `Result<T>`
- Map Supabase errors to `AppError` types
- Write tests for schemas and utilities
- Document schema in `docs/db.md`

### Technical Rules
- ALL API functions return `Result<T, AppError>`
- ALL external data validated with Zod
- RLS policies on every table
- `user_id` column on all user-owned tables
- Timestamps (`created_at`, `updated_at`) on all tables

### Handoff TO Frontend
Provide:
- Exported API functions with TypeScript signatures
- Exported types and schemas
- Documentation of function behavior
- **Breaking change protocol**: Notify before removing/changing exports

Example export:
```typescript
// packages/shared/src/index.ts
export { getSubjects, createSubject, updateSubject, deleteSubject } from './api/subjects';
export type { Subject, SubjectInsert, SubjectUpdate } from './types/domain';
export { subjectSchema, subjectInsertSchema } from './schemas/subject';
```

### Receives FROM Product
- Entity requirements
- Business rules
- Validation constraints

---

## Frontend Agent

### Ownership
- `apps/mobile/` - Entire Expo app:
  - `app/` - Expo Router screens (file-based routing)
  - `src/components/` - Reusable UI components
  - `src/providers/` - Context providers (Supabase, React Query)
  - `src/hooks/` - React Query hooks
  - `src/utils/` - Mobile-specific utilities (error handler)
  - `tamagui.config.ts` - Tamagui theme
  - `app.json` - Expo config

### Responsibilities
- Build React Native screens and components
- Configure Tamagui theming
- Set up Expo Router navigation (file-based routing)
- Create React Query hooks that use shared API functions
- Implement auth flow (login, signup, Google OAuth)
- Handle errors through central handler
- Manage loading and empty states

### Technical Rules
- **NEVER** import `@supabase/supabase-js` directly
- Use API functions from `@progress/shared`
- Use types from `@progress/shared`
- Use Tamagui components and theme tokens
- Handle all `Result<T>` returns properly

### Receives FROM Backend
- API functions to call
- Types and schemas to use
- Schema change notifications

### Receives FROM Product
- Screen descriptions
- User flows
- UI requirements

---

## Handoff Rules

### 1. Product → Backend
**Before Backend starts a data feature:**
- Product creates task/issue with:
  - Entity requirements
  - Relationships
  - Business rules
  - Validation constraints

**Example:**
```markdown
## Feature: Subject Management

### Entities
- Subject: user's custom routine bucket

### Fields
- id (UUID)
- user_id (FK to auth.users)
- domain_id (FK to domains)
- name (text, required)
- description (text, optional)
- is_active (boolean, default true)

### Rules
- Name must be unique per user within a domain
- Name length: 1-100 characters
- Soft delete via is_active flag
```

### 2. Backend → Frontend
**Before Frontend uses new API:**
- Backend exports function in `packages/shared/src/index.ts`
- Backend documents function signature and behavior
- Backend notifies of any breaking changes BEFORE removing exports

**Breaking Change Protocol:**
1. Add new function/type alongside old one
2. Notify Frontend agent
3. Wait for Frontend to migrate
4. Remove old function/type

### 3. Product → UI/UX Designer
**Before design work begins:**
- Product provides feature description and user flow
- Product specifies target audience context
- Product identifies priority screens

### 4. UI/UX Designer → Frontend
**Before Frontend builds a screen/component:**
- Designer provides component specs with tokens and states
- Designer provides screen layout with spacing
- Designer provides interaction/animation specs
- Designer updates `tamagui.config.ts` if new tokens are needed

### 5. Frontend → UI/UX Designer
**When implementation reveals design issues:**
- Report platform limitations affecting design
- Request clarification on edge case states
- Propose alternatives if design is technically difficult

### 6. Frontend → Product
**When UI implementation reveals issues:**
- Report UX problems discovered during implementation
- Request clarification on edge cases
- Propose alternatives if spec is technically difficult

### 7. All Agents
- Update `CLAUDE.md` if conventions change
- Follow TypeScript strict mode
- No `any` types
- Write tests for new logic

---

## Communication Format

When handing off to another agent, use this format:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Context
[Brief description of what was done]

### Deliverables
- [List of new/changed files]
- [List of new exports if Backend → Frontend]

### Required Actions
- [Specific tasks for target agent]

### Notes
- [Any edge cases or considerations]
```

---

## Example Workflow: Adding Entry Feature

1. **Product** creates spec:
   - Entry entity requirements
   - UI flow for creating an entry
   - Hands off to Backend and UI/UX Designer

2. **UI/UX Designer** designs:
   - Entry list and detail screen layouts
   - Component specs (EntryCard, CreateEntryModal)
   - Interaction patterns (swipe to delete, pull to refresh)
   - Hands off to Frontend

3. **Backend** implements:
   - SQL migration for `entries` table
   - TypeScript `Entry` interface
   - Zod `entrySchema`
   - API functions: `getEntries`, `createEntry`, `updateEntry`
   - Exports in `index.ts`
   - Hands off to Frontend

4. **Frontend** implements:
   - `useEntries` hook using `getEntries`
   - `app/entry/[id].tsx` screen following Designer specs
   - Components matching design tokens and states
   - Error handling for failed operations
