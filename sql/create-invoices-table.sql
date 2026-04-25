-- Table pour stocker les factures des élèves
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    description TEXT NOT NULL,
    forfait VARCHAR(100),
    hours_purchased INTEGER,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Index pour recherche rapide par email
CREATE INDEX IF NOT EXISTS idx_invoices_user_email ON invoices(user_email);

-- Index pour recherche par numéro de facture
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Fonction pour générer un numéro de facture unique
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    -- Format: FACT-YYYYMM-XXXX
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Compter les factures du mois en cours
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'FACT-' || year_month || '-%';
    
    -- Générer le numéro avec padding
    invoice_num := 'FACT-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;
