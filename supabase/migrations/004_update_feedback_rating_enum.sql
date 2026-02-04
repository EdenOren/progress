-- Migration: Update feedback_rating enum from success/hard/fail to done/up
-- This simplifies the feedback system to two options

-- Step 1: Update existing feedback values to new format
-- Map success -> done, hard -> up, fail -> up (consolidating to simpler options)
UPDATE item_feedback
SET rating = CASE
  WHEN rating = 'success' THEN 'done'
  WHEN rating = 'hard' THEN 'up'
  WHEN rating = 'fail' THEN 'up'
  ELSE rating
END::feedback_rating
WHERE rating IN ('success', 'hard', 'fail');

-- Step 2: Create new enum type
CREATE TYPE feedback_rating_new AS ENUM ('done', 'up');

-- Step 3: Alter the column to use the new enum
ALTER TABLE item_feedback
  ALTER COLUMN rating TYPE feedback_rating_new
  USING rating::text::feedback_rating_new;

-- Step 4: Drop old enum and rename new one
DROP TYPE feedback_rating;
ALTER TYPE feedback_rating_new RENAME TO feedback_rating;
