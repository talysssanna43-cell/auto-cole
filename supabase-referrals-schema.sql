-- Table pour gérer le système de parrainage
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_email TEXT NOT NULL, -- Email du parrain (élève inscrit)
    referrer_name TEXT, -- Nom du parrain
    referral_code TEXT UNIQUE NOT NULL, -- Code unique de parrainage (pour QR code)
    referee_email TEXT, -- Email du filleul (nouveau client)
    referee_name TEXT, -- Nom du filleul
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
    payment_verified BOOLEAN DEFAULT FALSE, -- Le filleul a-t-il payé ?
    reward_credited BOOLEAN DEFAULT FALSE, -- L'heure gratuite a-t-elle été créditée ?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE, -- Date de validation du parrainage
    notes TEXT,
    CONSTRAINT referrals_status_check CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_email ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_email ON referrals(referee_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- RLS (Row Level Security) pour sécuriser l'accès
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leurs propres parrainages (en tant que parrain)
CREATE POLICY "Users can view their own referrals as referrer"
    ON referrals FOR SELECT
    USING (referrer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy : Les utilisateurs peuvent voir les parrainages où ils sont filleuls
CREATE POLICY "Users can view referrals where they are referee"
    ON referrals FOR SELECT
    USING (referee_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy : Les utilisateurs peuvent créer leur propre code de parrainage
CREATE POLICY "Users can create their own referral code"
    ON referrals FOR INSERT
    WITH CHECK (referrer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy : Permettre les mises à jour pour compléter le parrainage
CREATE POLICY "Allow updates for completing referrals"
    ON referrals FOR UPDATE
    USING (true);

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 8 caractères alphanumériques
        code := upper(substring(md5(random()::text || user_email || now()::text) from 1 for 8));
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists_check;
        
        -- Si le code n'existe pas, on sort de la boucle
        EXIT WHEN NOT exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créditer 1h de conduite au parrain
CREATE OR REPLACE FUNCTION credit_referral_reward(referral_id UUID)
RETURNS JSONB AS $$
DECLARE
    referral_record RECORD;
    user_record RECORD;
    current_hours INTEGER;
BEGIN
    -- Récupérer les infos du parrainage
    SELECT * INTO referral_record FROM referrals WHERE id = referral_id;
    
    -- Vérifier que le parrainage existe
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referral not found');
    END IF;
    
    -- Vérifier que le paiement est validé
    IF NOT referral_record.payment_verified THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment not verified');
    END IF;
    
    -- Vérifier que la récompense n'a pas déjà été créditée
    IF referral_record.reward_credited THEN
        RETURN jsonb_build_object('success', false, 'error', 'Reward already credited');
    END IF;
    
    -- Récupérer l'utilisateur parrain
    SELECT * INTO user_record FROM users WHERE email = referral_record.referrer_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referrer user not found');
    END IF;
    
    -- Récupérer les heures actuelles depuis hours_goal
    current_hours := COALESCE(user_record.hours_goal, 0);
    
    -- Ajouter 1 heure au hours_goal (qui sera comptabilisé dans les heures restantes)
    UPDATE users 
    SET hours_goal = current_hours + 1
    WHERE email = referral_record.referrer_email;
    
    -- Marquer la récompense comme créditée
    UPDATE referrals 
    SET reward_credited = TRUE,
        status = 'completed',
        completed_at = NOW()
    WHERE id = referral_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'referrer_email', referral_record.referrer_email,
        'new_hours', current_hours + 1,
        'message', '1 heure de conduite créditée avec succès'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE referrals IS 'Table de gestion du système de parrainage';
COMMENT ON COLUMN referrals.referral_code IS 'Code unique utilisé dans le QR code pour identifier le parrain';
COMMENT ON COLUMN referrals.payment_verified IS 'Indique si le filleul a bien payé son forfait';
COMMENT ON COLUMN referrals.reward_credited IS 'Indique si l''heure gratuite a été créditée au parrain';
