# Progress - Agent Task Routing

This document defines the three agents responsible for building Progress, their ownership boundaries, and handoff protocols.

---

## Agent Overview

| Agent | Owns | Focus |
|-------|------|-------|
| **Product** | `docs/`, `CLAUDE.md`, `AGENTS.md` | Defines WHAT to build |
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

### 3. Frontend → Product
**When UI implementation reveals issues:**
- Report UX problems discovered during implementation
- Request clarification on edge cases
- Propose alternatives if spec is technically difficult

### 4. All Agents
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
   - Hands off to Backend

2. **Backend** implements:
   - SQL migration for `entries` table
   - TypeScript `Entry` interface
   - Zod `entrySchema`
   - API functions: `getEntries`, `createEntry`, `updateEntry`
   - Exports in `index.ts`
   - Hands off to Frontend

3. **Frontend** implements:
   - `useEntries` hook using `getEntries`
   - `app/entry/[id].tsx` screen using Expo Router
   - Error handling for failed operations
