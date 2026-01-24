# Backend Agent Opinion: Core Flow Rework

## Overall Assessment

The proposed data model is sound but needs refinement. Key concerns around migration strategy, query performance, and the template-to-entry copy mechanism.

---

## Data Model Feedback

### Exercise Library — Approved with changes

The proposed `exercise_library` table works. Suggested refinements:

```sql
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'bodyweight', 'cardio', 'flexibility')),
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body')),
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System exercises visible to all, custom only to creator
CREATE POLICY "View system or own exercises"
  ON exercise_library FOR SELECT
  USING (is_system = true OR auth.uid() = created_by);
```

**Note**: Don't use `UNIQUE(name, created_by)` — it breaks for system exercises where `created_by` is NULL. Instead:
```sql
CREATE UNIQUE INDEX idx_exercise_system_name ON exercise_library(name) WHERE is_system = true;
CREATE UNIQUE INDEX idx_exercise_user_name ON exercise_library(name, created_by) WHERE is_system = false;
```

### Workout Templates — Concerns

The proposed `workout_templates` table adds a layer between subjects and entries. Consider whether we actually need a separate table or can derive templates from the **last entry's items**:

**Option A: Explicit template table** (proposed)
- Pro: Clean separation, user can edit template without affecting history
- Con: Extra table, sync complexity (template vs what was actually done)

**Option B: Derive from last entry** (simpler)
- Pro: No extra table, template IS what you did last time
- Con: If user adds a one-time exercise, next session shows it. Needs `is_permanent` flag on items.

**Recommendation**: Go with **Option A** (explicit template) but keep it simple. The template is the "plan" and entries are the "execution". This separation is valuable for the use case.

### Items Table — Needs exercise_id

Current `items` table has `name TEXT`. We should:
- Add `exercise_id UUID REFERENCES exercise_library(id)` (nullable for backward compat)
- Keep `name` as denormalized display name (in case exercise is deleted)
- Add `is_from_template BOOLEAN DEFAULT TRUE`

### Entry Creation — Auto-populate concern

When creating an entry, we need to copy template items into the entry. Two approaches:

**Option A: Copy on create (server-side)**
- Supabase function/trigger copies template items on entry insert
- Pro: Atomic, guaranteed consistency
- Con: Requires DB function, less flexible

**Option B: Copy on create (client-side)**
- Frontend reads template, creates entry, then creates items in batch
- Pro: Simple, no DB function needed
- Con: Not atomic (network failure mid-batch leaves partial entry)

**Recommendation**: Option B for MVP (client-side batch insert). Add transaction safety later if needed. The `createSets` pattern already exists in the codebase.

---

## Query Performance

### "Last session for each exercise" query

This is the critical query for the inline reference UX. It needs to be fast:

```sql
-- For a given subject, get the most recent entry's items with sets
SELECT items.*, item_sets.*
FROM items
JOIN entries ON items.entry_id = entries.id
WHERE entries.subject_id = $1
  AND entries.user_id = $2
  AND entries.id != $3  -- exclude current entry
ORDER BY entries.performed_at DESC
LIMIT 1
```

This already exists as `getLastEntryForSubject` + `getEntryWithItems`. The current implementation is fine for MVP but should be optimized to a single query with a join if performance becomes an issue.

### Exercise search/autocomplete

For 40 system exercises + user customs, a simple `ILIKE '%query%'` query is fast enough. No need for full-text search at this scale.

```typescript
async function searchExercises(query: string, userId: string): Promise<Result<Exercise[]>> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${userId}`)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);
}
```

---

## Migration Strategy

Since the current `items` table has data (if any users exist), migration must be non-destructive:

1. Create `exercise_library` table + seed 40 exercises
2. Create `workout_templates` table
3. Add `exercise_id` column to `items` (nullable, no constraint initially)
4. Backfill: match existing item names to exercise_library entries
5. Frontend starts using new flow for new entries
6. Old entries remain readable as-is

---

## API Functions Needed

| Function | Returns | Purpose |
|----------|---------|---------|
| `searchExercises(query, userId)` | `Exercise[]` | Autocomplete |
| `getExerciseById(id)` | `Exercise` | Single lookup |
| `createCustomExercise(input)` | `Exercise` | User-created |
| `getWorkoutTemplate(subjectId)` | `TemplateItem[]` | Get template for a workout |
| `addToTemplate(subjectId, exerciseId, position)` | `TemplateItem` | Add exercise to template |
| `removeFromTemplate(templateItemId)` | `void` | Remove from template |
| `reorderTemplate(subjectId, items[])` | `void` | Reorder template |
| `createEntryFromTemplate(subjectId)` | `Entry` + `Item[]` | Start session (copies template) |

---

## Summary

- Exercise library: approved, minor schema tweaks needed
- Templates: explicit table is correct approach
- Entry creation: client-side batch copy for MVP
- Migration: non-destructive, additive only
- Performance: current query patterns sufficient at this scale
