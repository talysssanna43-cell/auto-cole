-- Ajouter la colonne transmission_type à la table users
-- Cette colonne permet de stocker le type de transmission (manual ou auto)

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS transmission_type TEXT DEFAULT 'manual';

-- Créer un commentaire pour la colonne
COMMENT ON COLUMN users.transmission_type IS 'Type de transmission: manual (BM) ou auto (BA)';

-- Mettre à jour les utilisateurs existants en fonction de leur forfait
UPDATE users 
SET transmission_type = 'auto' 
WHERE forfait IN ('boite-auto', 'am');

UPDATE users 
SET transmission_type = 'manual' 
WHERE forfait = '20h';

-- Pour les autres forfaits, garder 'manual' par défaut
