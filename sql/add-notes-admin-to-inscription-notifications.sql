-- Ajouter une colonne notes_admin à la table inscription_notifications
-- Cette colonne permet de stocker les commentaires laissés par l'élève lors de l'inscription

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE inscription_notifications 
ADD COLUMN IF NOT EXISTS notes_admin TEXT;

-- Ajouter un commentaire sur la colonne pour documentation
COMMENT ON COLUMN inscription_notifications.notes_admin IS 'Commentaire laissé par l''élève lors de l''inscription. Visible par l''admin.';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inscription_notifications' AND column_name = 'notes_admin';
