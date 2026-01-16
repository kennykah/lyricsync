-- Storage Policies pour le bucket "audio"
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- POLITIQUES DE STOCKAGE POUR LE BUCKET "AUDIO"
-- ============================================

-- Note: Ces politiques doivent être créées via le Dashboard Supabase
-- car la gestion des politiques de stockage via SQL est limitée.

-- INSTRUCTIONS MANUELLES :
-- 1. Allez sur Supabase Dashboard > Storage > audio
-- 2. Cliquez sur "Policies" 
-- 3. Créez les politiques suivantes :

-- ============================================
-- POLITIQUE 1 : Permettre l'upload aux utilisateurs authentifiés
-- ============================================
-- Policy name: allow_authenticated_uploads
-- Target roles: authenticated
-- Operations: INSERT
-- Policy definition (USING): true
-- Policy definition (WITH CHECK): (bucket_id = 'audio'::text)

-- ============================================
-- POLITIQUE 2 : Permettre la lecture publique
-- ============================================
-- Policy name: allow_public_read
-- Target roles: anon, authenticated
-- Operations: SELECT
-- Policy definition (USING): (bucket_id = 'audio'::text)

-- ============================================
-- POLITIQUE 3 : Permettre aux utilisateurs de supprimer leurs propres fichiers
-- ============================================
-- Policy name: allow_owner_delete
-- Target roles: authenticated
-- Operations: DELETE
-- Policy definition (USING): (auth.uid()::text = (storage.foldername(name))[1])

-- ============================================
-- POLITIQUE 4 : Permettre aux utilisateurs de mettre à jour leurs propres fichiers
-- ============================================
-- Policy name: allow_owner_update
-- Target roles: authenticated
-- Operations: UPDATE
-- Policy definition (USING): (auth.uid()::text = (storage.foldername(name))[1])

-- ============================================
-- ALTERNATIVE : Script SQL (si supporté par votre version)
-- ============================================

-- Créer les politiques via SQL (peut nécessiter des ajustements)
/*
-- Politique INSERT pour utilisateurs authentifiés
CREATE POLICY "allow_authenticated_uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio');

-- Politique SELECT pour lecture publique
CREATE POLICY "allow_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'audio');

-- Politique DELETE pour propriétaires
CREATE POLICY "allow_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique UPDATE pour propriétaires
CREATE POLICY "allow_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);
*/
