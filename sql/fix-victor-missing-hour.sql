-- Ajouter l'heure manquante de Victor dans inscription_notifications
-- Paiement Stripe du 26/04/2026 : 50€ pour 1h boîte auto

INSERT INTO inscription_notifications (
    user_email,
    user_name,
    user_phone,
    pack,
    hours_purchased,
    amount,
    payment_method,
    status,
    created_at
)
VALUES (
    'victorbouvet13@gmail.com',
    'VICTOR BOUVET',
    '', -- Téléphone inconnu, à compléter si nécessaire
    'heures_auto',
    1,
    50.00,
    'Carte bancaire (Stripe)',
    'confirmed',
    '2026-04-26T00:00:00Z'
)
ON CONFLICT DO NOTHING;

-- Vérification : afficher toutes les inscriptions de Victor
SELECT 
    pack,
    hours_purchased,
    amount,
    payment_method,
    created_at
FROM inscription_notifications
WHERE user_email = 'victorbouvet13@gmail.com'
ORDER BY created_at DESC;
