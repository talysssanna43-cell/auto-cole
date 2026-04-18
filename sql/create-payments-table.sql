-- Table pour stocker les paiements (Stripe, Oney, etc.)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'stripe', 'oney', 'alma', 'manual'
    payment_status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_id TEXT, -- ID du paiement chez le prestataire
    pack_id TEXT,
    installments_count INTEGER, -- Nombre de mensualités (NULL si paiement en 1x)
    metadata JSONB, -- Données supplémentaires (détails du pack, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);

-- Index pour recherche par payment_id
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);

-- Index pour recherche par statut
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE payments IS 'Stocke tous les paiements effectués par les élèves (Stripe, Oney, etc.)';
COMMENT ON COLUMN payments.user_email IS 'Email de l''élève qui a effectué le paiement';
COMMENT ON COLUMN payments.amount IS 'Montant total du paiement en euros';
COMMENT ON COLUMN payments.payment_method IS 'Méthode de paiement utilisée (stripe, oney, alma, manual)';
COMMENT ON COLUMN payments.payment_status IS 'Statut du paiement (pending, completed, failed, refunded)';
COMMENT ON COLUMN payments.payment_id IS 'Identifiant du paiement chez le prestataire';
COMMENT ON COLUMN payments.installments_count IS 'Nombre de mensualités (2, 3, 4) ou NULL si paiement en 1x';
COMMENT ON COLUMN payments.metadata IS 'Données JSON supplémentaires (pack_label, détails échéances, etc.)';
