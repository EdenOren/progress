-- Migration: Add ordinal numbers to subjects and entries
-- Purpose: Enable user-friendly URLs like /subject/1/entry/3 instead of UUIDs

-- Step 1: Create trigger functions first (before adding columns)
-- so any inserts during the migration get auto-assigned ordinals.
-- Uses advisory locks to prevent race conditions on concurrent inserts.

CREATE OR REPLACE FUNCTION assign_subject_ordinal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ordinal IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('subject_ordinal_' || NEW.user_id::text));
    SELECT COALESCE(MAX(ordinal), 0) + 1
    INTO NEW.ordinal
    FROM subjects
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_entry_ordinal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ordinal IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('entry_ordinal_' || NEW.subject_id::text));
    SELECT COALESCE(MAX(ordinal), 0) + 1
    INTO NEW.ordinal
    FROM entries
    WHERE subject_id = NEW.subject_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add ordinal columns with DEFAULT 0 (safe for NOT NULL rule)
ALTER TABLE subjects ADD COLUMN ordinal INTEGER NOT NULL DEFAULT 0;
ALTER TABLE entries ADD COLUMN ordinal INTEGER NOT NULL DEFAULT 0;

-- Step 3: Attach triggers (will auto-assign on future inserts)
CREATE TRIGGER trg_assign_subject_ordinal
  BEFORE INSERT ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION assign_subject_ordinal();

CREATE TRIGGER trg_assign_entry_ordinal
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION assign_entry_ordinal();

-- Step 4: Backfill existing rows with correct ordinals
-- Subjects: ordinal per user, ordered by created_at
UPDATE subjects SET ordinal = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM subjects
) sub
WHERE subjects.id = sub.id;

-- Entries: ordinal per subject, ordered by created_at
UPDATE entries SET ordinal = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY created_at) AS rn
  FROM entries
) sub
WHERE entries.id = sub.id;

-- Step 5: Remove the DEFAULT now that the trigger handles assignment
ALTER TABLE subjects ALTER COLUMN ordinal DROP DEFAULT;
ALTER TABLE entries ALTER COLUMN ordinal DROP DEFAULT;

-- Step 6: Add unique constraints (also creates indexes automatically)
ALTER TABLE subjects ADD CONSTRAINT uq_subjects_user_ordinal UNIQUE (user_id, ordinal);
ALTER TABLE entries ADD CONSTRAINT uq_entries_subject_ordinal UNIQUE (subject_id, ordinal);
