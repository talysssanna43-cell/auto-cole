-- Script pour transférer les élèves de Mylène vers Nail à partir du 1er mai 2026
-- À exécuter dans Supabase SQL Editor

-- 1. Transférer tous les créneaux (slots) de Mylène vers Nail à partir du 1er mai 2026
UPDATE slots
SET instructor = 'Nail'
WHERE instructor = 'Mylène'
  AND start_at >= '2026-05-01T00:00:00'::timestamp;

-- 2. Vérifier les créneaux transférés
SELECT 
    instructor,
    COUNT(*) as nombre_creneaux,
    MIN(start_at) as premier_creneau,
    MAX(start_at) as dernier_creneau
FROM slots
WHERE start_at >= '2026-05-01T00:00:00'::timestamp
GROUP BY instructor
ORDER BY instructor;

-- 3. Afficher les réservations concernées
SELECT 
    s.instructor,
    s.start_at,
    s.end_at,
    s.status,
    r.first_name,
    r.last_name,
    r.email
FROM slots s
LEFT JOIN reservations r ON r.slot_id = s.id
WHERE s.start_at >= '2026-05-01T00:00:00'::timestamp
  AND s.instructor = 'Nail'
  AND r.id IS NOT NULL
ORDER BY s.start_at;
