-- Ajouter le statut 'indisponible' à la contrainte slots_status_check

-- Supprimer l'ancienne contrainte
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_status_check;

-- Recréer la contrainte avec le nouveau statut 'indisponible'
ALTER TABLE slots ADD CONSTRAINT slots_status_check 
CHECK (status IN ('available', 'booked', 'cancelled', 'permis', 'indisponible'));
