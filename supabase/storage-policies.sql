-- ============================================
-- POLITIQUES DE STOCKAGE POUR LE BUCKET "AUDIO"
-- ============================================
-- Copiez ce script et exécutez-le dans Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/dhpdmdxhmnambfatqkft/sql/new

-- 1. Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "allow_authenticated_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

-- 2. Politique pour permettre la lecture publique (tout le monde peut lire)
CREATE POLICY "allow_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio');

-- 3. Politique pour permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "allow_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio');

-- 4. Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "allow_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio');

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après l'exécution, vous pouvez vérifier les politiques avec:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
