-- =================================================================
-- SCRIPT DE CORRECTION COMPLET - COPIER-COLLER DANS SUPABASE SQL EDITOR
-- Corrige : infos élève admin + persistance des heures élève
-- =================================================================

-- 1. PERMISSIONS : Autoriser toutes les opérations sur reservations
GRANT ALL ON reservations TO anon;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON reservations TO service_role;

-- 2. REMPLACER LA FONCTION book_slot
DROP FUNCTION IF EXISTS book_slot(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION book_slot(
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_instructor TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot_id UUID;
    v_reservation_id UUID;
BEGIN
    -- Chercher un slot disponible existant
    SELECT id INTO v_slot_id
    FROM slots
    WHERE start_at = p_start_at
      AND instructor = p_instructor
      AND status = 'available'
    LIMIT 1;

    IF v_slot_id IS NOT NULL THEN
        -- Slot disponible trouvé, le marquer comme réservé
        UPDATE slots
        SET status = 'booked', end_at = p_end_at
        WHERE id = v_slot_id;
    ELSE
        -- Vérifier si déjà réservé
        SELECT id INTO v_slot_id
        FROM slots
        WHERE start_at = p_start_at
          AND instructor = p_instructor
          AND status = 'booked'
        LIMIT 1;

        IF v_slot_id IS NOT NULL THEN
            -- Déjà réservé par quelqu'un d'autre
            RETURN json_build_object('ok', false, 'error', 'SLOT_NOT_AVAILABLE');
        END IF;

        -- Créer un nouveau slot
        INSERT INTO slots (start_at, end_at, instructor, status)
        VALUES (p_start_at, p_end_at, p_instructor, 'booked')
        RETURNING id INTO v_slot_id;
    END IF;

    -- CRÉER LA RÉSERVATION
    INSERT INTO reservations (slot_id, email, first_name, last_name, phone, status)
    VALUES (v_slot_id, p_email, p_first_name, p_last_name, p_phone, 'upcoming')
    RETURNING id INTO v_reservation_id;

    RETURN json_build_object(
        'ok', true,
        'slot_id', v_slot_id,
        'reservation_id', v_reservation_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- 3. CORRIGER LES SLOTS ORPHELINS (réservés sans réservation)
INSERT INTO reservations (slot_id, email, first_name, last_name, phone, status)
SELECT s.id, 'inconnu@temp.com', 'Élève', 'Inconnu', NULL, 'upcoming'
FROM slots s
LEFT JOIN reservations r ON r.slot_id = s.id
WHERE s.status = 'booked' AND r.id IS NULL;

-- 4. VÉRIFICATION : Afficher le résultat
SELECT 'Slots réservés' AS type, COUNT(*) AS total FROM slots WHERE status = 'booked'
UNION ALL
SELECT 'Réservations' AS type, COUNT(*) AS total FROM reservations;
