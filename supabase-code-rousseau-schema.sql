-- Table pour gérer les paiements Code Rousseau
CREATE TABLE IF NOT EXISTS code_rousseau_paiements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT,
    montant DECIMAL(10, 2) DEFAULT 20.00,
    vu BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_code_rousseau_paiements_vu ON code_rousseau_paiements(vu);
CREATE INDEX IF NOT EXISTS idx_code_rousseau_paiements_email ON code_rousseau_paiements(email);
CREATE INDEX IF NOT EXISTS idx_code_rousseau_paiements_created_at ON code_rousseau_paiements(created_at);

-- Activer RLS (Row Level Security)
ALTER TABLE code_rousseau_paiements ENABLE ROW LEVEL SECURITY;

-- Politique : Tous peuvent insérer (pour les paiements publics)
CREATE POLICY "Anyone can insert code rousseau payments"
    ON code_rousseau_paiements
    FOR INSERT
    WITH CHECK (true);

-- Politique : Tous peuvent lire (pour que l'admin puisse voir)
CREATE POLICY "Anyone can view code rousseau payments"
    ON code_rousseau_paiements
    FOR SELECT
    USING (true);

-- Politique : Tous peuvent mettre à jour
CREATE POLICY "Anyone can update code rousseau payments"
    ON code_rousseau_paiements
    FOR UPDATE
    USING (true);

-- Vérifier que la table a bien été créée
SELECT 'Table code_rousseau_paiements créée avec succès!' as message;
