-- Script pour générer les factures des paiements passés
-- À exécuter une seule fois pour créer les factures historiques

-- Créer des factures pour tous les élèves qui ont un forfait
INSERT INTO invoices (
    invoice_number,
    user_email,
    student_name,
    amount,
    payment_method,
    description,
    forfait,
    hours_purchased,
    payment_date
)
SELECT 
    -- Générer un numéro de facture unique pour chaque élève
    'FACT-' || TO_CHAR(u.created_at, 'YYYYMM') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY u.created_at)::TEXT, 4, '0'),
    u.email,
    u.prenom || ' ' || u.nom,
    -- Montant selon le forfait
    CASE 
        WHEN u.forfait = 'boite-auto' THEN 599.00
        WHEN u.forfait = 'boite-manuelle' THEN 699.00
        WHEN u.forfait = 'heures-conduite' THEN (u.hours_goal * 50.00)  -- 50€ par heure
        WHEN u.forfait LIKE '%h' THEN (CAST(REPLACE(u.forfait, 'h', '') AS INTEGER) * 50.00)  -- Ex: 20h = 1000€
        WHEN u.forfait = 'aac' THEN 1299.00
        WHEN u.forfait = 'cs' THEN 1099.00
        ELSE (u.hours_goal * 50.00)  -- Par défaut: 50€ par heure
    END,
    CASE 
        WHEN u.forfait IN ('boite-auto', 'boite-manuelle', 'aac', 'cs') THEN 'Carte bancaire'
        ELSE 'Paiement initial'
    END,
    -- Description selon le forfait
    CASE 
        WHEN u.forfait = 'boite-auto' THEN 'Forfait Boîte Automatique'
        WHEN u.forfait = 'boite-manuelle' THEN 'Forfait Boîte Manuelle'
        WHEN u.forfait = 'heures-conduite' THEN u.hours_goal || ' heures de conduite'
        WHEN u.forfait LIKE '%h' THEN u.forfait || ' de conduite'
        WHEN u.forfait = 'aac' THEN 'Forfait Conduite Accompagnée'
        WHEN u.forfait = 'cs' THEN 'Forfait Conduite Supervisée'
        ELSE u.hours_goal || ' heures de conduite'
    END,
    u.forfait,
    u.hours_goal,
    -- Date de paiement = date de création du compte
    u.created_at
FROM users u
WHERE 
    u.is_admin = false 
    AND u.forfait IS NOT NULL
    AND u.forfait != ''
    -- Ne créer que si pas déjà de facture
    AND NOT EXISTS (
        SELECT 1 FROM invoices i 
        WHERE i.user_email = u.email 
        AND i.forfait = u.forfait
    )
ORDER BY u.created_at;

-- Afficher le résultat
SELECT 
    COUNT(*) as factures_creees,
    SUM(amount) as montant_total
FROM invoices
WHERE payment_date >= NOW() - INTERVAL '1 hour';
