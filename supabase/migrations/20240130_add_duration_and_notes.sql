-- Story 2: Add duration tracking to entries and notes to items

-- Add duration and timestamp columns to entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add note column to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS note TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN entries.duration_seconds IS 'Workout duration in seconds, calculated from started_at to completed_at or manually edited';
COMMENT ON COLUMN entries.started_at IS 'Timestamp when user started the workout session';
COMMENT ON COLUMN entries.completed_at IS 'Timestamp when user completed the workout session';
COMMENT ON COLUMN items.note IS 'User note for this exercise, visible in next session';
