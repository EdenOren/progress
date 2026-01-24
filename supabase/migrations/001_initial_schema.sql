-- ============================================================================
-- Progress App - Initial Schema Migration
-- ============================================================================
-- This migration creates all tables for the MVP with Row Level Security (RLS).
-- All user-owned tables include user_id for simple RLS policies.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES
-- ============================================================================
-- User profile data (extends auth.users)

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 300)),
  weight_kg NUMERIC(5,2) CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 500)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- DOMAINS
-- ============================================================================
-- Tracking domains (workout, nutrition, sleep, etc.)
-- This is a system table - users can read but not modify.

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL CHECK (key ~ '^[a-z_]+$'),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for domains (public read, no user writes)
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view domains"
  ON domains FOR SELECT
  USING (true);

-- ============================================================================
-- SUBJECTS
-- ============================================================================
-- User's custom routines/buckets (e.g., "Monday Practice", "Friday Leg Day")

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique name per user within a domain
  UNIQUE (user_id, domain_id, name)
);

-- Indexes for subjects
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_domain_id ON subjects(domain_id);
CREATE INDEX idx_subjects_user_active ON subjects(user_id, is_active);

-- RLS for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ENTRIES
-- ============================================================================
-- Performed instances of a subject (e.g., "Monday Practice on Jan 15")

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  performed_at DATE NOT NULL,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for entries
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_subject_id ON entries(subject_id);
CREATE INDEX idx_entries_performed_at ON entries(performed_at DESC);
CREATE INDEX idx_entries_user_subject ON entries(user_id, subject_id);

-- RLS for entries
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ITEMS
-- ============================================================================
-- Drills/exercises within an entry (e.g., "Deadlift", "Squats")

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for items
CREATE INDEX idx_items_entry_id ON items(entry_id);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_entry_position ON items(entry_id, position);

-- RLS for items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ITEM_SETS
-- ============================================================================
-- Individual set records (weight, reps, duration, distance)

CREATE TABLE item_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL CHECK (set_index >= 0),
  weight_kg NUMERIC(6,2) CHECK (weight_kg IS NULL OR (weight_kg >= 0 AND weight_kg <= 1000)),
  reps INTEGER CHECK (reps IS NULL OR (reps >= 0 AND reps <= 1000)),
  duration_sec INTEGER CHECK (duration_sec IS NULL OR (duration_sec >= 0 AND duration_sec <= 86400)),
  distance_m INTEGER CHECK (distance_m IS NULL OR (distance_m >= 0 AND distance_m <= 100000)),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for item_sets
CREATE INDEX idx_item_sets_item_id ON item_sets(item_id);
CREATE INDEX idx_item_sets_user_id ON item_sets(user_id);
CREATE INDEX idx_item_sets_item_index ON item_sets(item_id, set_index);

-- RLS for item_sets
ALTER TABLE item_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item_sets"
  ON item_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own item_sets"
  ON item_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own item_sets"
  ON item_sets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own item_sets"
  ON item_sets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ITEM_FEEDBACK
-- ============================================================================
-- Feedback per item (success/hard/fail)

CREATE TYPE feedback_rating AS ENUM ('success', 'hard', 'fail');

CREATE TABLE item_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating feedback_rating NOT NULL,
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One feedback per item
  UNIQUE (item_id)
);

-- Indexes for item_feedback
CREATE INDEX idx_item_feedback_item_id ON item_feedback(item_id);
CREATE INDEX idx_item_feedback_user_id ON item_feedback(user_id);

-- RLS for item_feedback
ALTER TABLE item_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item_feedback"
  ON item_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own item_feedback"
  ON item_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own item_feedback"
  ON item_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own item_feedback"
  ON item_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- GOALS
-- ============================================================================
-- Targets for future sessions (per item within a subject)

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL CHECK (char_length(item_name) >= 1 AND char_length(item_name) <= 100),
  target JSONB NOT NULL,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One goal per item name per subject
  UNIQUE (user_id, subject_id, item_name)
);

-- Indexes for goals
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_subject_id ON goals(subject_id);
CREATE INDEX idx_goals_user_subject ON goals(user_id, subject_id);

-- RLS for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profile data extending auth.users';
COMMENT ON TABLE domains IS 'Tracking domains (workout, nutrition, sleep, etc.)';
COMMENT ON TABLE subjects IS 'User-defined routines/buckets within a domain';
COMMENT ON TABLE entries IS 'Performed instances of a subject on a specific date';
COMMENT ON TABLE items IS 'Drills/exercises within an entry';
COMMENT ON TABLE item_sets IS 'Individual set records with metrics (weight, reps, etc.)';
COMMENT ON TABLE item_feedback IS 'User feedback per item (success/hard/fail)';
COMMENT ON TABLE goals IS 'Target goals for future sessions';
