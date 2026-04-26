-- Réinitialiser les statistiques de tous les moniteurs à 0
-- À utiliser après avoir supprimé les résultats d'examen de test

-- Option 1: Supprimer toutes les entrées de bonus (elles seront recréées automatiquement)
DELETE FROM instructor_bonuses;

-- Option 2: Réinitialiser les stats à 0 pour tous les moniteurs
UPDATE instructor_bonuses 
SET 
    total_students = 0,
    passed_students = 0,
    success_rate = 0,
    total_rating = 0,
    rating_count = 0,
    average_rating = 0,
    final_score = 0,
    bonus_amount = 0;

-- Vérifier les résultats
SELECT instructor, success_rate, total_students, final_score 
FROM instructor_bonuses 
ORDER BY instructor;
