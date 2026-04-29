-- Corriger le hours_goal de Victor
-- Il a un pack de 13h + 1h achetée = 14h total
-- Actuellement hours_goal = 21 (incorrect)

UPDATE users
SET hours_goal = 14
WHERE email = 'victorbouvet13@gmail.com';

-- Vérification
SELECT 
    email,
    prenom,
    nom,
    hours_goal,
    hours_completed_initial
FROM users
WHERE email = 'victorbouvet13@gmail.com';
