# Story 5: Dev & Production Environments

**Branch**: `story/5-environments`

## Problem

The app currently uses a single `.env` file with no separation between development and production. This means:
- Development uses the same Supabase project as production (risky)
- No way to test against a staging database without manual .env swaps
- No EAS Build profiles for building dev/preview/production binaries
- Dev and prod builds can't coexist on the same device (same bundle ID)

## Product Requirements

### Acceptance Criteria
- [ ] Separate environment files: `.env.development` and `.env.production`
- [ ] EAS Build profiles: `development`, `preview`, `production`
- [ ] Dev builds use a distinct bundle ID suffix (`.dev`) so they can coexist with prod on device
- [ ] Dev builds show a visual "DEV" indicator (small badge on the tab bar or header)
- [ ] `npx expo start` defaults to development environment
- [ ] `eas build --profile production` uses production environment
- [ ] Environment files are gitignored (only `.env.example` is committed)

---

## Architecture

### Environment Files

```
apps/mobile/
  .env.development    # Local dev Supabase (gitignored)
  .env.production     # Prod Supabase (gitignored)
  .env.example        # Template (committed)
```

Both files use the same schema:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_APP_ENV=development|production
```

### EAS Build Profiles (`eas.json`)

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" },
      "ios": { "bundleIdentifier": "com.progress.app.dev" },
      "android": { "package": "com.progress.app.dev" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_ENV": "development" },
      "ios": { "bundleIdentifier": "com.progress.app.dev" },
      "android": { "package": "com.progress.app.dev" }
    },
    "production": {
      "env": { "APP_ENV": "production" },
      "ios": { "bundleIdentifier": "com.progress.app" },
      "android": { "package": "com.progress.app" }
    }
  }
}
```

### App Config (Dynamic)

Convert `app.json` → `app.config.ts` to dynamically set:
- Bundle ID based on `APP_ENV`
- App name suffix for dev ("Progress (Dev)")
- Icon tinting or badge for dev builds

---

## UI/UX Design Spec

### Dev Indicator

```
When EXPO_PUBLIC_APP_ENV === 'development':

  [Header bar - right side]
    - Small pill badge: "DEV"
    - backgroundColor: rgba(245, 158, 11, 0.2) (amber at 20%)
    - textColor: $warning (#F59E0B)
    - fontSize: 10, fontWeight: 700
    - paddingHorizontal: 6, paddingVertical: 2
    - borderRadius: 4
```

This makes it immediately obvious which environment you're running without affecting app functionality.

---

## Implementation Tasks

### Task 1: Create environment files
- Rename `apps/mobile/.env` → `apps/mobile/.env.development`
- Create `apps/mobile/.env.production` (placeholder values)
- Update `.env.example` to include `EXPO_PUBLIC_APP_ENV` variable
- Update `.gitignore` to ignore `.env.development` and `.env.production`

### Task 2: Convert to dynamic app config
- Create `apps/mobile/app.config.ts` (replaces `app.json`)
- Read `APP_ENV` or `EXPO_PUBLIC_APP_ENV` to determine environment
- Dynamically set:
  - `name`: "Progress" (prod) or "Progress (Dev)" (dev)
  - `ios.bundleIdentifier`: `com.progress.app` or `com.progress.app.dev`
  - `android.package`: `com.progress.app` or `com.progress.app.dev`
  - `scheme`: `progress` or `progress-dev`
- Keep all other config identical

### Task 3: Create EAS configuration
- Create `apps/mobile/eas.json` with development/preview/production profiles
- Development profile: dev client, internal distribution
- Preview profile: internal distribution, dev Supabase
- Production profile: store distribution, prod Supabase

### Task 4: Add dev environment indicator
- Create `apps/mobile/src/components/DevBadge.tsx`
- Shows "DEV" pill when `EXPO_PUBLIC_APP_ENV === 'development'`
- Add to the tab bar layout (header right area)
- Renders nothing in production

### Task 5: Update env validation
- Add `APP_ENV` to the env schema in `packages/shared/src/config/env.ts`
  - `APP_ENV: z.enum(['development', 'production']).optional().default('development')`
- Export a helper: `getAppEnv()` that returns the current environment

---

## Local Development Workflow

```bash
# Start with dev environment (default)
cd apps/mobile && npx expo start

# Expo automatically loads .env.development when NODE_ENV !== 'production'

# Build dev client for device testing
eas build --profile development --platform ios

# Build production
eas build --profile production --platform ios
```

---

## Priority
High — required before any production deployment to prevent data pollution.
