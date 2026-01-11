-- LyricSync Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'contributor' CHECK (role IN ('artist', 'contributor', 'validator', 'admin')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ARTISTS
-- ============================================
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists are viewable by everyone" ON artists
  FOR SELECT USING (true);

CREATE POLICY "Verified users can create artists" ON artists
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Artists can update their own profile" ON artists
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SONGS
-- ============================================
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  artist_name TEXT NOT NULL,
  album TEXT,
  release_year INTEGER,
  duration_seconds INTEGER,
  audio_url TEXT NOT NULL,
  lyrics_text TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'processing', 'pending_sync', 
    'syncing', 'pending_validation', 'approved', 'published', 'rejected'
  )),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published songs are viewable by everyone" ON songs
  FOR SELECT USING (status = 'published' OR auth.uid() = submitted_by);

CREATE POLICY "Authenticated users can create songs" ON songs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own songs" ON songs
  FOR UPDATE USING (auth.uid() = submitted_by);

-- ============================================
-- LRC FILES (Synchronized Lyrics)
-- ============================================
CREATE TABLE lrc_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE UNIQUE,
  synced_lyrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  lrc_raw TEXT,
  ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
  source TEXT DEFAULT 'manual' CHECK (source IN ('ai', 'manual', 'hybrid')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lrc_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LRC files are viewable for published songs" ON lrc_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM songs WHERE songs.id = lrc_files.song_id AND songs.status = 'published')
    OR auth.uid() = created_by
  );

CREATE POLICY "Authenticated users can create LRC files" ON lrc_files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their LRC files" ON lrc_files
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================
-- LRC VERSIONS (History)
-- ============================================
CREATE TABLE lrc_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lrc_file_id UUID REFERENCES lrc_files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  synced_lyrics JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lrc_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LRC versions are viewable by file creators" ON lrc_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lrc_files WHERE lrc_files.id = lrc_versions.lrc_file_id AND lrc_files.created_by = auth.uid())
  );

-- ============================================
-- CONTRIBUTIONS
-- ============================================
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sync', 'correction', 'validation')),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contributions" ON contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create contributions" ON contributions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT CHECK (condition_type IN ('sync_count', 'streak', 'special')),
  condition_value INTEGER
);

-- Insert default badges
INSERT INTO badges (name, description, icon, condition_type, condition_value) VALUES
  ('Première Sync', 'A synchronisé sa première chanson', '🎵', 'sync_count', 1),
  ('10 Syncs', 'A synchronisé 10 chansons', '🔥', 'sync_count', 10),
  ('50 Syncs', 'A synchronisé 50 chansons', '⭐', 'sync_count', 50),
  ('100 Syncs', 'A synchronisé 100 chansons', '🏆', 'sync_count', 100),
  ('Streak 7 jours', 'A contribué 7 jours de suite', '📅', 'streak', 7),
  ('Streak 30 jours', 'A contribué 30 jours de suite', '🗓️', 'streak', 30);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone" ON user_badges
  FOR SELECT USING (true);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- API KEYS
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_songs_slug ON songs(slug);
CREATE INDEX idx_lrc_files_song_id ON lrc_files(song_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_contributions_created_at ON contributions(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    points = points + NEW.points_earned,
    level = CASE 
      WHEN points + NEW.points_earned < 50 THEN 1
      WHEN points + NEW.points_earned < 200 THEN 2
      WHEN points + NEW.points_earned < 500 THEN 3
      ELSE 4
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_contribution_created
  AFTER INSERT ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lrc_files_updated_at
  BEFORE UPDATE ON lrc_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
