-- Ajouter une colonne notes_admin à la table users
-- Cette colonne permet à l'admin d'ajouter des commentaires/notes sur un élève
-- Ces notes sont visibles dans la fiche élève mais ne sont pas incluses dans le PDF ou l'email

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notes_admin TEXT;

-- Ajouter un commentaire sur la colonne pour documentation
COMMENT ON COLUMN users.notes_admin IS 'Notes et commentaires de l''admin sur l''élève. Non inclus dans le PDF et l''email.';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'notes_admin';
