-- Add default_sets column to subjects table
-- This stores the default set configuration to use when adding exercises to a subject

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS default_sets JSONB
  DEFAULT '[{"target_reps": 10}, {"target_reps": 10}, {"target_reps": 10}]';

-- Add a comment to document the column
COMMENT ON COLUMN subjects.default_sets IS 'Default set configuration (array of TemplateSetConfig) used when adding exercises to this subject';
