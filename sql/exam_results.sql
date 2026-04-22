-- Table pour stocker les résultats d'examen des élèves
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
    exam_date DATE NOT NULL,
    instructor TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    appreciation TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par moniteur
CREATE INDEX IF NOT EXISTS idx_exam_results_instructor ON exam_results(instructor);

-- Index pour recherche par élève
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_email);

-- Index pour recherche par date
CREATE INDEX IF NOT EXISTS idx_exam_results_date ON exam_results(exam_date);

-- Table pour suivre les primes des moniteurs
CREATE TABLE IF NOT EXISTS instructor_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor TEXT NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE,
    total_students INTEGER DEFAULT 0,
    passed_students INTEGER DEFAULT 0,
    failed_students INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    final_score DECIMAL(5,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche par moniteur
CREATE INDEX IF NOT EXISTS idx_instructor_bonuses_instructor ON instructor_bonuses(instructor);

-- Index pour recherche par statut
CREATE INDEX IF NOT EXISTS idx_instructor_bonuses_status ON instructor_bonuses(status);

-- Vue pour calculer les statistiques en temps réel
CREATE OR REPLACE VIEW instructor_stats AS
SELECT 
    instructor,
    COUNT(*) as total_exams,
    SUM(CASE WHEN result = 'passed' THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN result = 'failed' THEN 1 ELSE 0 END) as failed_count,
    ROUND(
        (SUM(CASE WHEN result = 'passed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as success_rate,
    ROUND(AVG(rating), 2) as average_rating,
    -- Calcul du score final : 80% résultat + 20% appréciation
    ROUND(
        (
            (SUM(CASE WHEN result = 'passed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 80
        ) + 
        (
            (AVG(rating) / 5) * 20
        ),
        2
    ) as final_score
FROM exam_results
GROUP BY instructor;

-- Fonction pour calculer la prime basée sur le taux de réussite
CREATE OR REPLACE FUNCTION calculate_bonus(success_rate DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF success_rate >= 100 THEN
        RETURN 300;
    ELSIF success_rate >= 90 THEN
        RETURN 200;
    ELSIF success_rate >= 80 THEN
        RETURN 120;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour mettre à jour les statistiques des primes
CREATE OR REPLACE FUNCTION update_instructor_bonus_stats()
RETURNS TRIGGER AS $$
DECLARE
    current_bonus RECORD;
    stats RECORD;
BEGIN
    -- Trouver ou créer la période active pour ce moniteur
    SELECT * INTO current_bonus
    FROM instructor_bonuses
    WHERE instructor = NEW.instructor
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Si pas de période active, en créer une
    IF current_bonus IS NULL THEN
        INSERT INTO instructor_bonuses (instructor, period_start)
        VALUES (NEW.instructor, NOW())
        RETURNING * INTO current_bonus;
    END IF;
    
    -- Récupérer les stats depuis la vue
    SELECT * INTO stats
    FROM instructor_stats
    WHERE instructor = NEW.instructor;
    
    -- Mettre à jour les statistiques
    UPDATE instructor_bonuses
    SET 
        total_students = stats.total_exams,
        passed_students = stats.passed_count,
        failed_students = stats.failed_count,
        success_rate = stats.success_rate,
        average_rating = stats.average_rating,
        final_score = stats.final_score,
        bonus_amount = calculate_bonus(stats.success_rate),
        updated_at = NOW()
    WHERE id = current_bonus.id;
    
    -- Si on atteint 20 élèves, clôturer la période
    IF stats.total_exams >= 20 THEN
        UPDATE instructor_bonuses
        SET 
            status = 'completed',
            period_end = NOW()
        WHERE id = current_bonus.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_bonus ON exam_results;
CREATE TRIGGER trigger_update_bonus
AFTER INSERT ON exam_results
FOR EACH ROW
EXECUTE FUNCTION update_instructor_bonus_stats();

-- Politique RLS pour exam_results (les élèves peuvent insérer leurs propres résultats)
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own exam results"
ON exam_results FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view exam results"
ON exam_results FOR SELECT
USING (true);

-- Politique RLS pour instructor_bonuses
-- IMPORTANT: Désactiver RLS pour permettre les insertions/mises à jour automatiques via triggers
ALTER TABLE instructor_bonuses DISABLE ROW LEVEL SECURITY;

-- Alternative si vous voulez garder RLS activé :
-- ALTER TABLE instructor_bonuses ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow automatic updates from triggers"
-- ON instructor_bonuses FOR ALL
-- USING (true)
-- WITH CHECK (true);
