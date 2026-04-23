-- Supprimer les créneaux indisponibles du 22 avril 2026

-- Afficher d'abord les créneaux à supprimer
SELECT id, start_at, end_at, instructor, status, notes
FROM slots
WHERE status = 'indisponible'
  AND start_at >= '2026-04-22T00:00:00'
  AND start_at < '2026-04-23T00:00:00';

-- Supprimer les créneaux indisponibles du 22 avril 2026
DELETE FROM slots
WHERE status = 'indisponible'
  AND start_at >= '2026-04-22T00:00:00'
  AND start_at < '2026-04-23T00:00:00';
