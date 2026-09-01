-- Nouveau fonctionnement conduite:
-- - anciens eleves: le solde reste exprime en heures, comme avant
-- - nouveaux eleves: le solde est exprime en cours de 45 minutes
--
-- A executer dans Supabase avant publication du nouveau fonctionnement.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

ALTER TABLE IF EXISTS pending_registrations
ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

ALTER TABLE IF EXISTS inscription_notifications
ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

ALTER TABLE IF EXISTS payments
ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

ALTER TABLE IF EXISTS invoices
ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

UPDATE users
SET lesson_unit_minutes = 120
WHERE lesson_unit_minutes IS NULL;

COMMENT ON COLUMN users.lesson_unit_minutes IS
'120 = ancien fonctionnement en heures de conduite. 45 = nouveau fonctionnement en cours de 45 minutes.';

-- Mise a jour de la fonction d'inscription pour renseigner lesson_unit_minutes.
CREATE OR REPLACE FUNCTION create_registration_account(
    p_data JSONB,
    p_password_hash TEXT,
    p_allow_existing BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT := LOWER(TRIM(COALESCE(p_data ->> 'email', '')));
    v_user_id users.id%TYPE;
    v_notification_id inscription_notifications.id%TYPE;
    v_existing_pending inscription_notifications.id%TYPE;
    v_documents JSONB := CASE
        WHEN jsonb_typeof(p_data -> 'documents') = 'object' THEN p_data -> 'documents'
        ELSE NULL
    END;
    v_hours INTEGER := GREATEST(COALESCE((p_data ->> 'hours_purchased')::INTEGER, 0), 0);
    v_completed INTEGER := GREATEST(COALESCE((p_data ->> 'hours_completed_initial')::INTEGER, 0), 0);
    v_lesson_unit_minutes INTEGER := CASE
        WHEN COALESCE((p_data ->> 'lesson_unit_minutes')::INTEGER, 0) = 45 THEN 45
        ELSE 120
    END;
BEGIN
    IF v_email = '' OR p_password_hash IS NULL OR LENGTH(p_password_hash) < 20 THEN
        RAISE EXCEPTION 'INVALID_REGISTRATION';
    END IF;

    SELECT id INTO v_existing_pending
    FROM inscription_notifications
    WHERE LOWER(user_email) = v_email AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
    IF v_existing_pending IS NOT NULL THEN
        RAISE EXCEPTION 'REGISTRATION_ALREADY_PENDING';
    END IF;

    SELECT id INTO v_user_id
    FROM users
    WHERE LOWER(email) = v_email
    LIMIT 1
    FOR UPDATE;

    IF v_user_id IS NOT NULL AND NOT p_allow_existing THEN
        RAISE EXCEPTION 'ACCOUNT_EXISTS';
    END IF;

    IF v_user_id IS NULL THEN
        INSERT INTO users(
            prenom, nom, email, telephone, date_nais, adresse, code_postal, ville,
            numero_neph, password_hash, forfait, hours_goal, hours_completed_initial,
            lesson_unit_minutes, transmission_type, documents, notes_admin
        ) VALUES (
            p_data ->> 'prenom', p_data ->> 'nom', v_email, p_data ->> 'telephone',
            NULLIF(p_data ->> 'date_nais', '')::DATE, p_data ->> 'adresse',
            p_data ->> 'code_postal', p_data ->> 'ville', NULLIF(p_data ->> 'numero_neph', ''),
            p_password_hash, NULLIF(p_data ->> 'pack', ''), v_hours, LEAST(v_completed, v_hours),
            v_lesson_unit_minutes, NULLIF(p_data ->> 'transmission_type', ''), v_documents, NULLIF(p_data ->> 'notes_admin', '')
        )
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE users
        SET prenom = p_data ->> 'prenom',
            nom = p_data ->> 'nom',
            email = v_email,
            telephone = p_data ->> 'telephone',
            date_nais = NULLIF(p_data ->> 'date_nais', '')::DATE,
            adresse = p_data ->> 'adresse',
            code_postal = p_data ->> 'code_postal',
            ville = p_data ->> 'ville',
            numero_neph = NULLIF(p_data ->> 'numero_neph', ''),
            password_hash = p_password_hash,
            forfait = NULLIF(p_data ->> 'pack', ''),
            hours_goal = v_hours,
            hours_completed_initial = LEAST(v_completed, v_hours),
            lesson_unit_minutes = v_lesson_unit_minutes,
            transmission_type = NULLIF(p_data ->> 'transmission_type', ''),
            documents = COALESCE(v_documents, documents),
            notes_admin = COALESCE(NULLIF(p_data ->> 'notes_admin', ''), notes_admin)
        WHERE id = v_user_id;
    END IF;

    INSERT INTO inscription_notifications(
        user_email, user_name, user_prenom, user_nom, user_telephone,
        user_date_naissance, user_adresse, user_code_postal, user_ville,
        numero_neph, pack, pack_label, hours_purchased, amount_paid,
        lesson_unit_minutes, transmission_type, payment_method, status, documents, documents_count,
        parent_prenom, parent_nom, is_heberge, permis_invalide, notes_admin
    ) VALUES (
        v_email,
        TRIM(COALESCE(p_data ->> 'prenom', '') || ' ' || COALESCE(p_data ->> 'nom', '')),
        p_data ->> 'prenom', p_data ->> 'nom', p_data ->> 'telephone',
        NULLIF(p_data ->> 'date_nais', '')::DATE, p_data ->> 'adresse',
        p_data ->> 'code_postal', p_data ->> 'ville', NULLIF(p_data ->> 'numero_neph', ''),
        NULLIF(p_data ->> 'pack', ''), NULLIF(p_data ->> 'pack_label', ''),
        v_hours, 0, v_lesson_unit_minutes, NULLIF(p_data ->> 'transmission_type', ''),
        COALESCE(NULLIF(p_data ->> 'payment_method', ''), 'none'), 'pending',
        v_documents, COALESCE((SELECT COUNT(*) FROM jsonb_object_keys(v_documents)), 0),
        NULLIF(p_data ->> 'parent_prenom', ''), NULLIF(p_data ->> 'parent_nom', ''),
        NULLIF(p_data ->> 'is_heberge', ''), NULLIF(p_data ->> 'permis_invalide', ''),
        NULLIF(p_data ->> 'notes_admin', '')
    )
    RETURNING id INTO v_notification_id;

    RETURN jsonb_build_object('ok', TRUE, 'user_id', v_user_id, 'notification_id', v_notification_id);
END;
$$;
REVOKE ALL ON FUNCTION create_registration_account(JSONB,TEXT,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_registration_account(JSONB,TEXT,BOOLEAN) TO service_role;

