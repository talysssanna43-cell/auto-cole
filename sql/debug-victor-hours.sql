-- Vérifier toutes les inscriptions de Victor
SELECT 
    id,
    pack,
    hours_purchased,
    amount_paid,
    payment_method,
    status,
    created_at
FROM inscription_notifications
WHERE user_email = 'victorbouvet13@gmail.com'
ORDER BY created_at DESC;

-- Vérifier le hours_goal dans users
SELECT 
    email,
    prenom,
    nom,
    hours_goal,
    hours_completed_initial
FROM users
WHERE email = 'victorbouvet13@gmail.com';
