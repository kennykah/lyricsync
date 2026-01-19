-- Script pour donner le rôle admin à un utilisateur spécifique
-- Remplacez 'user@example.com' par l'email de l'utilisateur que vous voulez promouvoir

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'user@example.com'
);

-- Vérifier que la mise à jour a fonctionné
SELECT
  p.username,
  p.display_name,
  p.role,
  u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'user@example.com';
