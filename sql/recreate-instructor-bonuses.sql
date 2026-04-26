-- Recréer les entrées des moniteurs dans instructor_bonuses avec stats à 0
-- À utiliser si les curseurs ont disparu de l'admin

-- Supprimer les anciennes entrées (si elles existent)
DELETE FROM instructor_bonuses;

-- Créer les entrées pour chaque moniteur avec stats à 0
INSERT INTO instructor_bonuses (
    instructor,
    period_start,
    period_end,
    total_students,
    passed_students,
    failed_students,
    success_rate,
    average_rating,
    final_score,
    bonus_amount,
    status
) VALUES
    ('Mylène', NOW(), NULL, 0, 0, 0, 0, 0, 0, 0, 'active'),
    ('Sammy', NOW(), NULL, 0, 0, 0, 0, 0, 0, 0, 'active'),
    ('Nail', NOW(), NULL, 0, 0, 0, 0, 0, 0, 0, 'active');

-- Vérifier les résultats
SELECT instructor, success_rate, total_students, final_score, status
FROM instructor_bonuses 
ORDER BY instructor;
