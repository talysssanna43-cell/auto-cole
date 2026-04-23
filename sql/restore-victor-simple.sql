-- Restaurer la séance de VICTOR du 22 avril 2026, 11h-13h avec Sammy
-- VERSION SIMPLE EN UNE SEULE REQUÊTE

-- D'abord, trouve l'email de VICTOR
-- Exécute cette requête et note son email :
SELECT email, prenom, nom, telephone 
FROM users 
WHERE LOWER(nom) LIKE '%bouvet%' 
  OR LOWER(nom) LIKE '%victor%';

-- Ensuite, remplace 'EMAIL_DE_VICTOR_ICI' par l'email trouvé ci-dessus
-- et exécute cette requête pour recréer le créneau + réservation :

WITH new_slot AS (
  INSERT INTO slots (start_at, end_at, instructor, status)
  VALUES (
    '2026-04-22T11:00:00+00:00',
    '2026-04-22T13:00:00+00:00',
    'Sammy',
    'booked'
  )
  RETURNING id
)
INSERT INTO reservations (slot_id, email, first_name, last_name, phone, status, created_at)
SELECT 
  new_slot.id,
  'EMAIL_DE_VICTOR_ICI',  -- REMPLACE PAR L'EMAIL DE VICTOR
  'VICTOR',
  'BOUVET-MARECHAL-GIRARDEAU',
  '',
  'done',
  '2026-04-22T09:00:00+00:00'
FROM new_slot;
