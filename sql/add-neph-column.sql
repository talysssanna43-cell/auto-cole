-- Ajouter la colonne numero_neph à la table users

ALTER TABLE users
ADD COLUMN IF NOT EXISTS numero_neph VARCHAR(12);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN users.numero_neph IS 'Numéro d''Enregistrement Préfectoral Harmonisé (12 chiffres)';
