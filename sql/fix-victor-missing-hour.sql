-- Ajouter l'heure manquante de Victor dans inscription_notifications
-- Paiement Stripe du 26/04/2026 : 50€ pour 1h boîte auto

INSERT INTO inscription_notifications (
    user_email,
    user_name,
    pack,
    hours_purchased,
    amount_paid,
    payment_method,
    status,
    created_at
)
VALUES (
    'victorbouvet13@gmail.com',
    'VICTOR BOUVET',
    'heures_auto',
    1,
    50.00,
    'Carte bancaire (Stripe)',
    'confirmed',
    '2026-04-26T00:00:00Z'
);

-- Vérification : afficher toutes les inscriptions de Victor
SELECT 
    pack,
    hours_purchased,
    amount_paid,
    payment_method,
    transmission_type,
    created_at
FROM inscription_notifications
WHERE user_email = 'victorbouvet13@gmail.com'
ORDER BY created_at DESC;
