-- Corriger l'entrée du pack initial de Victor (boite-auto)
-- Actuellement hours_purchased = NULL, devrait être 13

UPDATE inscription_notifications
SET hours_purchased = 13
WHERE id = 'd4-446b-bc84-6725cba79955'
  AND user_email = 'victorbouvet13@gmail.com';

-- Vérification : Victor devrait maintenant avoir 14h au total (13 + 1)
SELECT 
    pack,
    hours_purchased,
    amount_paid,
    payment_method,
    status,
    created_at,
    SUM(hours_purchased) OVER () as total_hours
FROM inscription_notifications
WHERE user_email = 'victorbouvet13@gmail.com'
ORDER BY created_at DESC;
