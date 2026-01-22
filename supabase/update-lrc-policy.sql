-- Update LRC files RLS policy to allow admins/validators to view pending songs
-- Run this in your Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "LRC files are viewable for published songs" ON lrc_files;

-- Create the new policy
CREATE POLICY "LRC files are viewable for published songs or creators/admins" ON lrc_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM songs WHERE songs.id = lrc_files.song_id AND songs.status = 'published')
    OR auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM songs s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = lrc_files.song_id
      AND (p.role IN ('admin', 'validator') OR s.submitted_by = auth.uid())
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'lrc_files';
