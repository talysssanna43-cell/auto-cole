-- Initialiser les données de bonus pour tous les moniteurs
-- Cela permet d'afficher les curseurs même sans évaluations

-- Insérer les données pour Sammy
INSERT INTO instructor_bonuses (
    instructor,
    period_start,
    total_students,
    passed_students,
    failed_students,
    success_rate,
    average_rating,
    final_score,
    bonus_amount,
    status
)
VALUES (
    'Sammy',
    NOW(),
    0,
    0,
    0,
    0.00,
    0.00,
    0.00,
    0.00,
    'active'
);

-- Insérer les données pour Nail
INSERT INTO instructor_bonuses (
    instructor,
    period_start,
    total_students,
    passed_students,
    failed_students,
    success_rate,
    average_rating,
    final_score,
    bonus_amount,
    status
)
VALUES (
    'Nail',
    NOW(),
    0,
    0,
    0,
    0.00,
    0.00,
    0.00,
    0.00,
    'active'
);
