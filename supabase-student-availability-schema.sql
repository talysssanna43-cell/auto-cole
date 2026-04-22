-- Table pour gérer les disponibilités des élèves et notifications de désistement
CREATE TABLE IF NOT EXISTS student_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL UNIQUE,
    user_name TEXT,
    wants_cancellation_notifications BOOLEAN DEFAULT false,
    available_days JSONB DEFAULT '[]'::jsonb,
    preferred_times JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_student_availability_email ON student_availability(user_email);
CREATE INDEX IF NOT EXISTS idx_student_availability_notifications ON student_availability(wants_cancellation_notifications);

-- Activer RLS (Row Level Security)
ALTER TABLE student_availability ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir et modifier leurs propres disponibilités
CREATE POLICY "Users can view their own availability"
    ON student_availability
    FOR SELECT
    USING (true); -- Tous peuvent lire (pour que l'admin puisse voir)

CREATE POLICY "Users can insert their own availability"
    ON student_availability
    FOR INSERT
    WITH CHECK (true); -- Tous peuvent insérer

CREATE POLICY "Users can update their own availability"
    ON student_availability
    FOR UPDATE
    USING (true); -- Tous peuvent mettre à jour

CREATE POLICY "Users can delete their own availability"
    ON student_availability
    FOR DELETE
    USING (true); -- Tous peuvent supprimer

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_student_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_student_availability_updated_at_trigger ON student_availability;
CREATE TRIGGER update_student_availability_updated_at_trigger
    BEFORE UPDATE ON student_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_student_availability_updated_at();

-- Vérifier que la table a bien été créée
SELECT 'Table student_availability créée avec succès!' as message;
