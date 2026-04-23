-- Restaurer la séance de VICTOR BOUVET-MARECHAL-GIRARDEAU du 22 avril 2026, 11h-13h avec Sammy

-- Étape 1 : Créer le créneau dans la table slots
INSERT INTO slots (start_at, end_at, instructor, status)
VALUES (
  '2026-04-22T11:00:00+00:00',
  '2026-04-22T13:00:00+00:00',
  'Sammy',
  'booked'
)
RETURNING id;

-- Étape 2 : Récupérer l'email de VICTOR depuis la table users
-- (Copie l'ID du slot retourné ci-dessus et remplace SLOT_ID_ICI dans la requête suivante)

-- Trouver l'email de VICTOR
SELECT email, prenom, nom 
FROM users 
WHERE LOWER(nom) LIKE '%bouvet%' 
  AND LOWER(nom) LIKE '%marechal%'
  AND LOWER(nom) LIKE '%girardeau%';

-- Étape 3 : Créer la réservation (remplace SLOT_ID_ICI par l'ID du slot créé à l'étape 1)
-- et VICTOR_EMAIL_ICI par l'email trouvé à l'étape 2
/*
INSERT INTO reservations (slot_id, email, first_name, last_name, phone, status, created_at)
VALUES (
  'SLOT_ID_ICI',  -- Remplace par l'ID du slot
  'VICTOR_EMAIL_ICI',  -- Remplace par l'email de Victor
  'VICTOR',
  'BOUVET-MARECHAL-GIRARDEAU',
  '',  -- Numéro de téléphone si disponible
  'done',  -- Statut "done" car la séance est passée
  '2026-04-22T09:00:00+00:00'  -- Date de création de la réservation
);
*/
