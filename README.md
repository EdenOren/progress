# Progress

A mobile app for tracking personal progress across multiple domains, starting with workout tracking.

## Overview

Progress helps users build consistency and see measurable improvement in their personal development through simple, focused tracking. Users can create workout routines (subjects), log sessions (entries), record exercises with sets and reps, and compare performance over time.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Mobile | Expo React Native + TypeScript |
| UI | Tamagui |
| Navigation | Expo Router |
| Data Fetching | TanStack React Query |
| Forms | react-hook-form + Zod |
| Backend | Supabase (Postgres, Auth, RLS) |
| Testing | Vitest |

## Project Structure

```
progress/
├── apps/mobile/          # Expo React Native app
├── packages/shared/      # Shared types, API, schemas, utilities
├── supabase/             # Database migrations and seed data
└── docs/                 # Product and database documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Supabase project (for backend)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd progress
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. Set up database:
   - Run migrations in `supabase/migrations/` on your Supabase project
   - Run seed data from `supabase/seed.sql`

5. Start development:
   ```bash
   cd apps/mobile
   npx expo start
   ```

## Available Scripts

From the root directory:

```bash
npm install          # Install all workspace dependencies
npm run build        # Build shared package
npm run test         # Run tests in shared package
```

From `apps/mobile`:

```bash
npx expo start       # Start Expo development server
npx expo start --ios # Start with iOS simulator
npx expo start --android # Start with Android emulator
```

## Documentation

- [Product Requirements](docs/product.md) - Features, user flows, acceptance criteria
- [Database Schema](docs/db.md) - Tables, relationships, RLS policies
- [Claude Guide](CLAUDE.md) - Architecture rules and coding conventions
- [Agent Routing](AGENTS.md) - Agent responsibilities and handoffs

## Architecture

### Data Flow

```
User Action → Component → Hook → API Function → Supabase
                                      ↓
                              Zod Validation
                                      ↓
                              Result<T> Return
```

### Key Principles

- **API Abstraction**: All Supabase calls go through `@progress/shared` API functions
- **Type Safety**: Strict TypeScript, Zod validation at boundaries
- **Error Handling**: Typed errors with central handler
- **Result Pattern**: All API functions return `Result<T, AppError>`

## MVP Features

- **Authentication**: Email/password signup, Google OAuth
- **Workout Subjects**: Create and manage workout routines
- **Entries**: Log workout sessions by date
- **Exercises**: Add exercises with sets (weight/reps)
- **Feedback**: Rate exercise difficulty (success/hard/fail)
- **Comparison**: View progress vs. previous session

## License

Private - All rights reserved
