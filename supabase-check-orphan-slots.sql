-- Script pour identifier et corriger les slots "booked" sans réservation

-- 1. Trouver les slots "booked" sans réservation associée
SELECT 
    s.id,
    s.start_at,
    s.end_at,
    s.instructor,
    s.status,
    COUNT(r.id) as reservation_count
FROM slots s
LEFT JOIN reservations r ON s.id = r.slot_id
WHERE s.status = 'booked'
GROUP BY s.id, s.start_at, s.end_at, s.instructor, s.status
HAVING COUNT(r.id) = 0
ORDER BY s.start_at;

-- 2. Option A: Remettre ces slots en "available" (si aucune réservation n'existe vraiment)
-- DÉCOMMENTER CETTE LIGNE POUR EXÉCUTER:
-- UPDATE slots SET status = 'available' WHERE id IN (
--     SELECT s.id FROM slots s
--     LEFT JOIN reservations r ON s.id = r.slot_id
--     WHERE s.status = 'booked'
--     GROUP BY s.id
--     HAVING COUNT(r.id) = 0
-- );

-- 3. Vérifier les slots spécifiques mentionnés par l'utilisateur
SELECT 
    s.*,
    r.*
FROM slots s
LEFT JOIN reservations r ON s.id = r.slot_id
WHERE s.id IN (
    '09b34232-2039-47d4-a61d-769341ea8c49',
    '0e185bed-a92b-4af1-8fc1-59f6146deb70'
);
