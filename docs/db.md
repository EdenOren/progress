# Progress App - Database Documentation

This document describes the database schema for the Progress app.

## Overview

The database is hosted on **Supabase** (PostgreSQL) with Row Level Security (RLS) enabled on all tables. The schema is designed to be extensible for future tracking domains beyond workouts.

## Entity Relationship Diagram

```
auth.users (Supabase Auth)
    │
    ├── profiles (1:1)
    │
    ├── subjects (1:N)
    │       │
    │       ├── entries (1:N)
    │       │       │
    │       │       ├── items (1:N)
    │       │       │       │
    │       │       │       ├── item_sets (1:N)
    │       │       │       │
    │       │       │       └── item_feedback (1:1)
    │       │       │
    │       │
    │       └── goals (1:N per item_name)
    │
    └── domains (N:1, system table)
```

## Tables

### profiles

User profile data, extending Supabase's `auth.users`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users | User ID from Supabase Auth |
| `display_name` | TEXT | NOT NULL | User's display name |
| `avatar_url` | TEXT | - | Profile picture URL |
| `height_cm` | INTEGER | 50-300 | Height in centimeters |
| `weight_kg` | NUMERIC(5,2) | 20-500 | Weight in kilograms |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Auto-creation**: A profile is automatically created via trigger when a user signs up.

---

### domains

System-managed tracking domains (workout, nutrition, sleep, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Domain ID |
| `key` | TEXT | UNIQUE, NOT NULL, lowercase | Domain key (e.g., 'workout') |
| `name` | TEXT | NOT NULL | Display name |
| `icon` | TEXT | - | Icon identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |

**MVP Domains**:
- `workout` - Workout tracking

**Future Domains** (not yet seeded):
- `nutrition` - Nutrition tracking
- `sleep` - Sleep tracking
- `study` - Study/learning tracking

**RLS**: Public read, no user writes (system-managed).

---

### subjects

User-defined routines or training buckets within a domain.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Subject ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner |
| `domain_id` | UUID | FK → domains, NOT NULL | Parent domain |
| `name` | TEXT | NOT NULL, 1-100 chars | Subject name |
| `description` | TEXT | max 500 chars | Optional description |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Unique constraint**: `(user_id, domain_id, name)` - Name must be unique per user within a domain.

**Examples**:
- "Monday Practice"
- "Friday Leg Day"
- "Upper Body A"

---

### entries

Performed instances of a subject on a specific date.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Entry ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner |
| `subject_id` | UUID | FK → subjects, NOT NULL | Parent subject |
| `performed_at` | DATE | NOT NULL | Date performed |
| `notes` | TEXT | max 1000 chars | Session notes |
| `is_completed` | BOOLEAN | NOT NULL, default FALSE | Completion status |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Indexes**:
- `idx_entries_user_subject` - For filtering by user and subject
- `idx_entries_performed_at` - For date-based queries

---

### items

Drills or exercises within an entry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Item ID |
| `entry_id` | UUID | FK → entries (CASCADE), NOT NULL | Parent entry |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner (for RLS) |
| `name` | TEXT | NOT NULL, 1-100 chars | Exercise name |
| `position` | INTEGER | NOT NULL, >= 0 | Order in entry |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |

**Examples**:
- "Deadlift"
- "Squats"
- "Bench Press"

---

### item_sets

Individual set records for an item.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Set ID |
| `item_id` | UUID | FK → items (CASCADE), NOT NULL | Parent item |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner (for RLS) |
| `set_index` | INTEGER | NOT NULL, >= 0 | Set number (0-based) |
| `weight_kg` | NUMERIC(6,2) | 0-1000 | Weight in kg |
| `reps` | INTEGER | 0-1000 | Repetitions |
| `duration_sec` | INTEGER | 0-86400 | Duration in seconds |
| `distance_m` | INTEGER | 0-100000 | Distance in meters |
| `notes` | TEXT | max 500 chars | Set notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |

**Flexible metrics**: Different exercise types use different fields:
- Strength: `weight_kg`, `reps`
- Cardio: `duration_sec`, `distance_m`
- Timed: `duration_sec`

---

### item_feedback

User feedback per item (one per item).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Feedback ID |
| `item_id` | UUID | FK → items (CASCADE), UNIQUE, NOT NULL | Parent item |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner (for RLS) |
| `rating` | ENUM | 'success', 'hard', 'fail' | Performance rating |
| `comment` | TEXT | max 500 chars | Optional comment |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |

**Rating meanings**:
- `success` - Completed as expected or better
- `hard` - Completed but challenging
- `fail` - Could not complete as planned

---

### goals

Targets for future sessions, per item within a subject.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Goal ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | Owner |
| `subject_id` | UUID | FK → subjects (CASCADE), NOT NULL | Parent subject |
| `item_name` | TEXT | NOT NULL, 1-100 chars | Target exercise name |
| `target` | JSONB | NOT NULL | Goal metrics |
| `achieved_at` | TIMESTAMPTZ | - | When goal was achieved |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Last update timestamp |

**Unique constraint**: `(user_id, subject_id, item_name)` - One active goal per item per subject.

**Target JSONB structure**:
```json
{
  "weight_kg": 120,
  "reps": 8,
  "sets": 3,
  "duration_sec": 300,
  "distance_m": 5000,
  "notes": "End of quarter goal"
}
```

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policy pattern:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own [table]"
  ON [table] FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own [table]"
  ON [table] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own [table]"
  ON [table] FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own [table]"
  ON [table] FOR DELETE
  USING (auth.uid() = user_id);
```

**Exception**: `domains` table is public read, no user writes.

---

## Triggers

### `update_updated_at_column()`
Automatically updates `updated_at` on UPDATE for:
- `profiles`
- `subjects`
- `entries`
- `goals`

### `handle_new_user()`
Automatically creates a profile when a user signs up via Supabase Auth.

---

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| subjects | idx_subjects_user_id | user_id | Filter by user |
| subjects | idx_subjects_domain_id | domain_id | Filter by domain |
| subjects | idx_subjects_user_active | user_id, is_active | Active subjects |
| entries | idx_entries_user_id | user_id | Filter by user |
| entries | idx_entries_subject_id | subject_id | Filter by subject |
| entries | idx_entries_performed_at | performed_at DESC | Date ordering |
| entries | idx_entries_user_subject | user_id, subject_id | Combined filter |
| items | idx_items_entry_id | entry_id | Items per entry |
| items | idx_items_entry_position | entry_id, position | Ordered items |
| item_sets | idx_item_sets_item_id | item_id | Sets per item |
| item_sets | idx_item_sets_item_index | item_id, set_index | Ordered sets |
| item_feedback | idx_item_feedback_item_id | item_id | Feedback lookup |
| goals | idx_goals_user_subject | user_id, subject_id | Goals per subject |

---

## Common Queries

### Get active subjects for a user
```sql
SELECT * FROM subjects
WHERE user_id = $1 AND is_active = true
ORDER BY created_at DESC;
```

### Get entries for a subject with items
```sql
SELECT
  e.*,
  json_agg(
    json_build_object(
      'item', i.*,
      'sets', (SELECT json_agg(s.*) FROM item_sets s WHERE s.item_id = i.id),
      'feedback', (SELECT row_to_json(f.*) FROM item_feedback f WHERE f.item_id = i.id)
    )
  ) as items
FROM entries e
LEFT JOIN items i ON i.entry_id = e.id
WHERE e.subject_id = $1 AND e.user_id = $2
GROUP BY e.id
ORDER BY e.performed_at DESC;
```

### Get last entry for comparison
```sql
SELECT * FROM entries
WHERE subject_id = $1 AND user_id = $2 AND performed_at < $3
ORDER BY performed_at DESC
LIMIT 1;
```

---

## Migration Files

- `001_initial_schema.sql` - Creates all tables, RLS policies, triggers, indexes

## Seed Files

- `seed.sql` - Inserts initial domain ('workout')
