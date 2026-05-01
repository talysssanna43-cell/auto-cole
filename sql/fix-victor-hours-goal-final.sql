-- Corriger hours_goal de Victor à 14h (au lieu de 21h)
-- Il a un pack boite-auto de 13h + 1h achetée = 14h total

UPDATE users
SET hours_goal = 14
WHERE email = 'victorbouvet13@gmail.com';

-- Vérification
SELECT 
    email,
    prenom,
    nom,
    forfait,
    hours_goal,
    hours_completed_initial
FROM users
WHERE email = 'victorbouvet13@gmail.com';
