-- Ajoute le genre de l'eleve pour adapter les emails importants.
-- A executer une seule fois dans l'editeur SQL Supabase.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS genre TEXT;

ALTER TABLE inscription_notifications
ADD COLUMN IF NOT EXISTS genre TEXT;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_genre_check;

ALTER TABLE users
ADD CONSTRAINT users_genre_check
CHECK (genre IS NULL OR genre IN ('homme', 'femme', 'autre'));

ALTER TABLE inscription_notifications
DROP CONSTRAINT IF EXISTS inscription_notifications_genre_check;

ALTER TABLE inscription_notifications
ADD CONSTRAINT inscription_notifications_genre_check
CHECK (genre IS NULL OR genre IN ('homme', 'femme', 'autre'));

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
    v_genre TEXT := CASE
        WHEN p_data ->> 'genre' IN ('homme', 'femme', 'autre') THEN p_data ->> 'genre'
        ELSE NULL
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
            prenom, nom, email, telephone, date_nais, genre, adresse, code_postal, ville,
            numero_neph, password_hash, forfait, hours_goal, hours_completed_initial,
            lesson_unit_minutes, transmission_type, documents, notes_admin
        ) VALUES (
            p_data ->> 'prenom', p_data ->> 'nom', v_email, p_data ->> 'telephone',
            NULLIF(p_data ->> 'date_nais', '')::DATE, v_genre, p_data ->> 'adresse',
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
            genre = COALESCE(v_genre, genre),
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
        user_date_naissance, genre, user_adresse, user_code_postal, user_ville,
        numero_neph, pack, pack_label, hours_purchased, amount_paid,
        lesson_unit_minutes, transmission_type, payment_method, status, documents, documents_count,
        parent_prenom, parent_nom, is_heberge, permis_invalide, notes_admin
    ) VALUES (
        v_email,
        TRIM(COALESCE(p_data ->> 'prenom', '') || ' ' || COALESCE(p_data ->> 'nom', '')),
        p_data ->> 'prenom', p_data ->> 'nom', p_data ->> 'telephone',
        NULLIF(p_data ->> 'date_nais', '')::DATE, v_genre, p_data ->> 'adresse',
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
