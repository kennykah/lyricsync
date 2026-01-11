// Types principaux pour LyricSync

// Rôles utilisateur
export type UserRole = 'artist' | 'contributor' | 'validator' | 'admin';

// Statuts de chanson
export type SongStatus = 
  | 'draft' 
  | 'submitted' 
  | 'processing' 
  | 'pending_sync' 
  | 'syncing' 
  | 'pending_validation' 
  | 'approved' 
  | 'published' 
  | 'rejected';

// Profil utilisateur
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

// Artiste
export interface Artist {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  verified: boolean;
  bio: string | null;
  image_url: string | null;
  created_at: string;
}

// Chanson
export interface Song {
  id: string;
  title: string;
  slug: string;
  artist_id: string | null;
  artist_name: string;
  album: string | null;
  release_year: number | null;
  duration_seconds: number | null;
  audio_url: string;
  lyrics_text: string;
  status: SongStatus;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

// Ligne de parole synchronisée
export interface SyncedLyricLine {
  time: number; // en secondes
  text: string;
  confidence?: number; // 0-100, optionnel (score IA)
}

// Fichier LRC
export interface LrcFile {
  id: string;
  song_id: string;
  synced_lyrics: SyncedLyricLine[];
  lrc_raw: string | null;
  ai_confidence_score: number | null;
  source: 'ai' | 'manual' | 'hybrid';
  version: number;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Contribution
export interface Contribution {
  id: string;
  user_id: string;
  song_id: string;
  type: 'sync' | 'correction' | 'validation';
  points_earned: number;
  created_at: string;
}

// Badge
export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  condition_type: 'sync_count' | 'streak' | 'special';
  condition_value: number | null;
}

// Badge utilisateur
export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  user_id: string;
  permissions: string[];
  rate_limit: number;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
}

// Types pour l'éditeur de synchronisation
export interface SyncEditorState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  lyrics: SyncedLyricLine[];
  currentLineIndex: number;
  isRecording: boolean;
}

// Types pour les statistiques
export interface UserStats {
  total_syncs: number;
  total_corrections: number;
  total_validations: number;
  total_points: number;
  current_streak: number;
  best_streak: number;
  rank: number;
}

// Types pour le leaderboard
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
  rank: number;
}
