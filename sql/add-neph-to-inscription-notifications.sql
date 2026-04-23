-- Ajouter la colonne numero_neph à la table inscription_notifications

ALTER TABLE inscription_notifications
ADD COLUMN IF NOT EXISTS numero_neph VARCHAR(12);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN inscription_notifications.numero_neph IS 'Numéro d''Enregistrement Préfectoral Harmonisé (12 chiffres)';
