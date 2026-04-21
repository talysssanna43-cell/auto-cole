-- Ajouter la colonne notes à la table slots pour stocker les informations des examens de permis
-- Cette colonne permet de stocker le lieu de l'examen (Aubagne, Saint-Henri, Aix-en-Provence)
-- Format: "PERMIS - [Lieu]" pour les créneaux bloqués pour les examens

ALTER TABLE slots
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Créer un index pour améliorer les performances de recherche sur les notes
CREATE INDEX IF NOT EXISTS idx_slots_notes ON slots(notes);

-- Commentaire sur la colonne
COMMENT ON COLUMN slots.notes IS 'Notes additionnelles pour le créneau. Format pour permis: "PERMIS - [Lieu]" (ex: "PERMIS - Aubagne")';

-- Modifier la contrainte de status pour autoriser 'permis'
-- D'abord, supprimer l'ancienne contrainte
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_status_check;

-- Ajouter la nouvelle contrainte avec 'permis' inclus
ALTER TABLE slots 
ADD CONSTRAINT slots_status_check 
CHECK (status IN ('available', 'booked', 'cancelled', 'completed', 'permis'));
