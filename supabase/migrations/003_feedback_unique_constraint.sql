-- ============================================================================
-- Migration: Add unique constraint to item_feedback for upsert support
-- ============================================================================

-- Add unique constraint on item_id so that upsert with onConflict: 'item_id' works
-- Each item should only have one feedback record per user
ALTER TABLE item_feedback
  ADD CONSTRAINT item_feedback_item_id_key UNIQUE (item_id);

-- Note: If multiple feedback rows per item already exist, this migration will fail.
-- In that case, you may need to clean up duplicate rows first:
-- DELETE FROM item_feedback a USING item_feedback b
-- WHERE a.id > b.id AND a.item_id = b.item_id;
