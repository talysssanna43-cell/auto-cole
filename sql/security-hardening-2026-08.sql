-- Security and payment hardening for Auto-Ecole Breteuil.
-- Run once in the Supabase SQL editor before deploying the updated site.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_payment_intent_id TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    profile JSONB NOT NULL,
    pack TEXT,
    pack_label TEXT,
    hours_purchased INTEGER NOT NULL DEFAULT 0,
    transmission_type TEXT,
    amount NUMERIC(10,2) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DELETE FROM pending_registrations older
USING pending_registrations newer
WHERE LOWER(older.user_email) = LOWER(newer.user_email)
  AND (older.created_at, older.id) < (newer.created_at, newer.id);
CREATE UNIQUE INDEX IF NOT EXISTS pending_registrations_user_uidx
    ON pending_registrations(LOWER(user_email));
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_payment_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL,
    payment_reference TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    source TEXT NOT NULL,
    hours_credited INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initial_payment_intent_id TEXT NOT NULL UNIQUE,
    user_email TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_payment_method_id TEXT,
    pack_id TEXT NOT NULL,
    pack_label TEXT NOT NULL,
    transmission_type TEXT NOT NULL DEFAULT 'manual',
    hours_purchased INTEGER NOT NULL DEFAULT 0,
    total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents > 0),
    installment_count INTEGER NOT NULL CHECK (installment_count IN (2, 3)),
    installment_amounts_cents JSONB NOT NULL,
    paid_installments INTEGER NOT NULL DEFAULT 0,
    next_charge_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'past_due', 'cancelled')),
    last_error TEXT,
    consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS installment_plans_due_idx
    ON installment_plans(status, next_charge_at);
ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pending_registrations, password_reset_tokens, stripe_payment_ledger, installment_plans FROM anon, authenticated;

ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS pack_label TEXT;
ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS decision_email_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS decision_email_sent_at TIMESTAMPTZ;
ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS decision_email_claimed_at TIMESTAMPTZ;
ALTER TABLE inscription_notifications ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;
UPDATE users SET lesson_unit_minutes = 120 WHERE lesson_unit_minutes IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inscription_notifications_stripe_payment_uidx
    ON inscription_notifications(stripe_payment_intent_id);

CREATE OR REPLACE FUNCTION cancel_installments_on_registration_rejection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'rejected'
       AND OLD.status IS DISTINCT FROM NEW.status
       AND NEW.stripe_payment_intent_id IS NOT NULL THEN
        UPDATE installment_plans
        SET status = 'cancelled',
            next_charge_at = NULL,
            last_error = 'REGISTRATION_REJECTED',
            updated_at = NOW()
        WHERE initial_payment_intent_id = NEW.stripe_payment_intent_id
          AND status IN ('pending', 'active', 'past_due');
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION cancel_installments_on_registration_rejection() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS cancel_installments_on_registration_rejection_trigger ON inscription_notifications;
CREATE TRIGGER cancel_installments_on_registration_rejection_trigger
AFTER UPDATE OF status ON inscription_notifications
FOR EACH ROW
EXECUTE FUNCTION cancel_installments_on_registration_rejection();

CREATE OR REPLACE FUNCTION decide_registration(
    p_notification_id TEXT,
    p_decision TEXT,
    p_rejection_message TEXT,
    p_reviewed_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification inscription_notifications%ROWTYPE;
    v_user_id users.id%TYPE;
    v_referral_id referrals.id%TYPE;
    v_referrer_email TEXT;
BEGIN
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'INVALID_DECISION';
    END IF;
    IF p_decision = 'rejected' AND LENGTH(TRIM(COALESCE(p_rejection_message, ''))) < 3 THEN
        RAISE EXCEPTION 'REJECTION_REASON_REQUIRED';
    END IF;

    SELECT * INTO v_notification
    FROM inscription_notifications
    WHERE id::TEXT = p_notification_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
    IF v_notification.status <> 'pending' THEN
        IF v_notification.status = p_decision THEN
            RETURN jsonb_build_object('ok', TRUE, 'duplicate', TRUE, 'status', v_notification.status);
        END IF;
        RAISE EXCEPTION 'REGISTRATION_ALREADY_REVIEWED';
    END IF;

    IF p_decision = 'approved' THEN
        SELECT id INTO v_user_id
        FROM users
        WHERE LOWER(email) = LOWER(v_notification.user_email)
        LIMIT 1
        FOR UPDATE;
        IF v_user_id IS NULL THEN RAISE EXCEPTION 'ACCOUNT_NOT_READY'; END IF;

        UPDATE users
        SET prenom = COALESCE(NULLIF(v_notification.user_prenom, ''), prenom),
            nom = COALESCE(NULLIF(v_notification.user_nom, ''), nom),
            telephone = COALESCE(NULLIF(v_notification.user_telephone, ''), telephone),
            date_nais = COALESCE(v_notification.user_date_naissance, date_nais),
            adresse = COALESCE(NULLIF(v_notification.user_adresse, ''), adresse),
            code_postal = COALESCE(NULLIF(v_notification.user_code_postal, ''), code_postal),
            ville = COALESCE(NULLIF(v_notification.user_ville, ''), ville),
            numero_neph = COALESCE(NULLIF(v_notification.numero_neph, ''), numero_neph),
            forfait = COALESCE(NULLIF(v_notification.pack, ''), forfait),
            hours_goal = GREATEST(COALESCE(hours_goal, 0), COALESCE(v_notification.hours_purchased, 0)),
            transmission_type = COALESCE(NULLIF(v_notification.transmission_type, ''), transmission_type),
            documents = COALESCE(v_notification.documents, documents),
            notes_admin = COALESCE(NULLIF(v_notification.notes_admin, ''), notes_admin)
        WHERE id = v_user_id;

        IF v_notification.referral_code IS NOT NULL THEN
            SELECT id, referrer_email INTO v_referral_id, v_referrer_email
            FROM referrals
            WHERE referral_code = v_notification.referral_code
              AND LOWER(referee_email) = LOWER(v_notification.user_email)
              AND payment_verified = TRUE
              AND reward_credited = FALSE
            LIMIT 1
            FOR UPDATE;
            IF v_referral_id IS NOT NULL THEN
                UPDATE referrals
                SET reward_credited = TRUE, status = 'completed', completed_at = NOW()
                WHERE id = v_referral_id;
                UPDATE users
                SET hours_goal = COALESCE(hours_goal, 0) + 1
                WHERE LOWER(email) = LOWER(v_referrer_email);
            END IF;
        END IF;
    END IF;

    UPDATE inscription_notifications
    SET status = p_decision,
        reviewed_at = NOW(),
        reviewed_by = NULLIF(p_reviewed_by, ''),
        rejection_message = CASE WHEN p_decision = 'rejected' THEN TRIM(p_rejection_message) ELSE NULL END,
        decision_email_sent = FALSE,
        decision_email_sent_at = NULL,
        decision_email_claimed_at = NULL
    WHERE id::TEXT = p_notification_id;

    RETURN jsonb_build_object('ok', TRUE, 'duplicate', FALSE, 'status', p_decision, 'user_email', v_notification.user_email);
END;
$$;
REVOKE ALL ON FUNCTION decide_registration(TEXT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decide_registration(TEXT,TEXT,TEXT,TEXT) TO service_role;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS confirmation_email_claimed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_payment_uidx
    ON invoices(stripe_payment_intent_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_eur NUMERIC(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'eur';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pack_label TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments_count INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS hours_purchased INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS lesson_unit_minutes INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transmission_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_uidx
    ON payments(COALESCE(payment_id, stripe_payment_intent_id));

CREATE OR REPLACE FUNCTION current_app_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'app_role', '');
$$;

CREATE OR REPLACE FUNCTION current_app_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
    SELECT LOWER(COALESCE(current_setting('request.jwt.claims', true)::jsonb ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION current_app_instructor()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'profile' ->> 'instructor_name', '');
$$;

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

-- Remove legacy permissive policies before installing the explicit rules below.
DO $$
DECLARE
    policy_row RECORD;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'users', 'inscription_notifications', 'payments', 'invoices',
              'instructors', 'slots', 'reservations', 'contact_requests'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    END LOOP;
END $$;

-- Core private tables. Server-side service_role requests bypass RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_secure ON users;
DROP POLICY IF EXISTS users_admin_write ON users;
CREATE POLICY users_select_secure ON users FOR SELECT
    USING (
        current_app_role() = 'admin'
        OR LOWER(email) = current_app_email()
        OR (
            current_app_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM reservations r
                JOIN slots s ON s.id = r.slot_id
                WHERE LOWER(r.email) = LOWER(users.email)
                  AND LOWER(s.instructor) = LOWER(current_app_instructor())
            )
        )
    );
CREATE POLICY users_admin_write ON users FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE inscription_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inscription_notifications_select_secure ON inscription_notifications;
DROP POLICY IF EXISTS inscription_notifications_admin_write ON inscription_notifications;
CREATE POLICY inscription_notifications_select_secure ON inscription_notifications FOR SELECT
    USING (
        current_app_role() = 'admin'
        OR LOWER(user_email) = current_app_email()
        OR (
            current_app_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM reservations r
                JOIN slots s ON s.id = r.slot_id
                WHERE LOWER(r.email) = LOWER(inscription_notifications.user_email)
                  AND LOWER(s.instructor) = LOWER(current_app_instructor())
            )
        )
    );
CREATE POLICY inscription_notifications_admin_write ON inscription_notifications FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_select_secure ON payments;
DROP POLICY IF EXISTS payments_admin_write ON payments;
CREATE POLICY payments_select_secure ON payments FOR SELECT
    USING (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email());
CREATE POLICY payments_admin_write ON payments FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_select_secure ON invoices;
DROP POLICY IF EXISTS invoices_admin_write ON invoices;
CREATE POLICY invoices_select_secure ON invoices FOR SELECT
    USING (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email());
CREATE POLICY invoices_admin_write ON invoices FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Instructors are viewable by everyone" ON instructors;
DROP POLICY IF EXISTS "Instructors can be created by everyone" ON instructors;
DROP POLICY IF EXISTS "Instructors can be updated by everyone" ON instructors;
DROP POLICY IF EXISTS "Instructors can be deleted by everyone" ON instructors;
DROP POLICY IF EXISTS instructors_public_read ON instructors;
DROP POLICY IF EXISTS instructors_authenticated_read ON instructors;
DROP POLICY IF EXISTS instructors_admin_write ON instructors;
CREATE POLICY instructors_authenticated_read ON instructors FOR SELECT
    USING (current_app_role() IN ('student', 'instructor', 'admin'));
CREATE POLICY instructors_admin_write ON instructors FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all updates on slots" ON slots;
DROP POLICY IF EXISTS "Anyone can view slots" ON slots;
DROP POLICY IF EXISTS "Anyone can insert slots" ON slots;
DROP POLICY IF EXISTS "Anyone can delete slots" ON slots;
DROP POLICY IF EXISTS slots_public_read ON slots;
DROP POLICY IF EXISTS slots_admin_write ON slots;
CREATE POLICY slots_public_read ON slots FOR SELECT USING (TRUE);
CREATE POLICY slots_admin_write ON slots FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reservations_select_secure ON reservations;
DROP POLICY IF EXISTS reservations_admin_write ON reservations;
DROP POLICY IF EXISTS reservations_instructor_delete ON reservations;
CREATE POLICY reservations_select_secure ON reservations FOR SELECT
    USING (
        current_app_role() = 'admin'
        OR LOWER(email) = current_app_email()
        OR (
            current_app_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM slots
                WHERE slots.id = reservations.slot_id
                  AND LOWER(slots.instructor) = LOWER(current_app_instructor())
            )
        )
    );
CREATE POLICY reservations_admin_write ON reservations FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');
CREATE POLICY reservations_instructor_delete ON reservations FOR DELETE
    USING (
        current_app_role() = 'instructor'
        AND EXISTS (
            SELECT 1 FROM slots
            WHERE slots.id = reservations.slot_id
              AND LOWER(slots.instructor) = LOWER(current_app_instructor())
        )
    );

DROP POLICY IF EXISTS slots_instructor_update ON slots;
CREATE POLICY slots_instructor_update ON slots FOR UPDATE
    USING (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor()))
    WITH CHECK (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor()));

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_public_insert ON contact_requests;
DROP POLICY IF EXISTS contact_admin_manage ON contact_requests;
CREATE POLICY contact_admin_manage ON contact_requests FOR ALL
    USING (current_app_role() = 'admin')
    WITH CHECK (current_app_role() = 'admin');

-- Remove legacy permissive policies from optional application tables.
DO $$
DECLARE
    policy_row RECORD;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'student_availability', 'referrals', 'cancellation_requests',
              'driving_log', 'exam_results', 'instructor_bonuses',
              'support_tickets', 'candidatures', 'reviews',
              'code_rousseau_paiements', 'messages', 'cancellations'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    END LOOP;
END $$;

DO $$
BEGIN
    IF to_regclass('public.student_availability') IS NOT NULL THEN
        ALTER TABLE student_availability ENABLE ROW LEVEL SECURITY;
        CREATE POLICY student_availability_own ON student_availability FOR ALL
            USING (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email())
            WITH CHECK (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email());
    END IF;

    IF to_regclass('public.referrals') IS NOT NULL THEN
        ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
        CREATE POLICY referrals_select_secure ON referrals FOR SELECT
            USING (current_app_role() = 'admin' OR LOWER(referrer_email) = current_app_email() OR LOWER(referee_email) = current_app_email());
        CREATE POLICY referrals_student_insert ON referrals FOR INSERT
            WITH CHECK (current_app_role() = 'student' AND LOWER(referrer_email) = current_app_email() AND referee_email IS NULL);
        CREATE POLICY referrals_admin_write ON referrals FOR UPDATE
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
        CREATE POLICY referrals_admin_delete ON referrals FOR DELETE
            USING (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.cancellation_requests') IS NOT NULL THEN
        ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;
        CREATE POLICY cancellation_requests_select_secure ON cancellation_requests FOR SELECT
            USING (
                current_app_role() = 'admin'
                OR LOWER(user_email) = current_app_email()
                OR (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor()))
            );
        CREATE POLICY cancellation_requests_student_insert ON cancellation_requests FOR INSERT
            WITH CHECK (current_app_role() = 'student' AND LOWER(user_email) = current_app_email() AND status = 'pending');
        CREATE POLICY cancellation_requests_admin_write ON cancellation_requests FOR UPDATE
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
        CREATE POLICY cancellation_requests_admin_delete ON cancellation_requests FOR DELETE
            USING (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.driving_log') IS NOT NULL THEN
        ALTER TABLE driving_log ENABLE ROW LEVEL SECURITY;
        CREATE POLICY driving_log_own ON driving_log FOR ALL
            USING (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email())
            WITH CHECK (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email());
    END IF;

    IF to_regclass('public.exam_results') IS NOT NULL THEN
        ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
        CREATE POLICY exam_results_select_secure ON exam_results FOR SELECT
            USING (
                current_app_role() = 'admin'
                OR LOWER(student_email) = current_app_email()
                OR (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor()))
            );
        CREATE POLICY exam_results_admin_insert_secure ON exam_results FOR INSERT
            WITH CHECK (current_app_role() = 'admin');
        CREATE POLICY exam_results_admin_write ON exam_results FOR UPDATE
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
        CREATE POLICY exam_results_admin_delete ON exam_results FOR DELETE
            USING (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.instructor_bonuses') IS NOT NULL THEN
        ALTER TABLE instructor_bonuses ENABLE ROW LEVEL SECURITY;
        CREATE POLICY instructor_bonuses_select_secure ON instructor_bonuses FOR SELECT
            USING (current_app_role() = 'admin' OR (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor())));
        CREATE POLICY instructor_bonuses_admin_write ON instructor_bonuses FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.support_tickets') IS NOT NULL THEN
        ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
        CREATE POLICY support_tickets_select_secure ON support_tickets FOR SELECT
            USING (current_app_role() = 'admin' OR LOWER(user_email) = current_app_email());
        CREATE POLICY support_tickets_student_insert ON support_tickets FOR INSERT
            WITH CHECK (current_app_role() = 'student' AND LOWER(user_email) = current_app_email() AND status = 'pending');
        CREATE POLICY support_tickets_admin_write ON support_tickets FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.candidatures') IS NOT NULL THEN
        ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
        CREATE POLICY candidatures_admin_manage ON candidatures FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.reviews') IS NOT NULL THEN
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
        CREATE POLICY reviews_admin_manage ON reviews FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.code_rousseau_paiements') IS NOT NULL THEN
        ALTER TABLE code_rousseau_paiements ENABLE ROW LEVEL SECURITY;
        CREATE POLICY code_rousseau_admin_manage ON code_rousseau_paiements FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.messages') IS NOT NULL THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY messages_select_secure ON messages FOR SELECT
            USING (current_app_role() = 'admin' OR (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor())));
        CREATE POLICY messages_admin_manage ON messages FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;

    IF to_regclass('public.cancellations') IS NOT NULL THEN
        ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY cancellations_select_secure ON cancellations FOR SELECT
            USING (current_app_role() = 'admin' OR (current_app_role() = 'instructor' AND LOWER(instructor) = LOWER(current_app_instructor())));
        CREATE POLICY cancellations_admin_manage ON cancellations FOR ALL
            USING (current_app_role() = 'admin') WITH CHECK (current_app_role() = 'admin');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION credit_referral_reward(referral_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_email TEXT;
    v_hours INTEGER;
BEGIN
    IF current_app_role() <> 'admin' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN');
    END IF;

    UPDATE referrals r
    SET reward_credited = TRUE,
        status = 'completed',
        completed_at = NOW()
    WHERE r.id = $1
      AND r.payment_verified = TRUE
      AND r.reward_credited = FALSE
    RETURNING r.referrer_email INTO v_referrer_email;

    IF v_referrer_email IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_ELIGIBLE_OR_ALREADY_CREDITED');
    END IF;

    UPDATE users
    SET hours_goal = COALESCE(hours_goal, 0) + 1
    WHERE LOWER(email) = LOWER(v_referrer_email)
    RETURNING hours_goal INTO v_hours;

    IF v_hours IS NULL THEN
        RAISE EXCEPTION 'REFERRER_NOT_FOUND';
    END IF;
    RETURN jsonb_build_object('success', TRUE, 'referrer_email', v_referrer_email, 'new_hours', v_hours);
END;
$$;
REVOKE ALL ON FUNCTION credit_referral_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION credit_referral_reward(UUID) TO authenticated;

DO $$
BEGIN
    IF to_regprocedure('public.generate_referral_code(text)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION generate_referral_code(TEXT) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION generate_referral_code(TEXT) TO authenticated;
    END IF;
END $$;

-- Booking is the only student-authorized mutation of slots/reservations.
DROP FUNCTION IF EXISTS book_slot(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION book_slot(
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_instructor TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot_id UUID;
    v_reservation_id UUID;
    v_email TEXT := LOWER(p_email);
BEGIN
    IF current_app_role() NOT IN ('student', 'admin') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'AUTH_REQUIRED');
    END IF;
    IF current_app_role() <> 'admin' AND v_email <> current_app_email() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'FORBIDDEN');
    END IF;
    IF current_app_role() = 'student' AND EXISTS (
        SELECT 1
        FROM inscription_notifications n
        WHERE LOWER(n.user_email) = v_email
          AND n.status IN ('pending', 'rejected')
          AND n.created_at = (
              SELECT MAX(n2.created_at)
              FROM inscription_notifications n2
              WHERE LOWER(n2.user_email) = v_email
          )
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'ACCOUNT_NOT_APPROVED');
    END IF;
    IF p_start_at <= NOW() OR p_end_at <= p_start_at OR p_end_at - p_start_at > INTERVAL '2 hours 15 minutes' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'INVALID_TIME');
    END IF;
    IF EXTRACT(ISODOW FROM p_start_at AT TIME ZONE 'Europe/Paris') = 7 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'SUNDAY_NOT_ALLOWED');
    END IF;
    IF EXISTS (
        SELECT 1 FROM reservations r
        JOIN slots s ON s.id = r.slot_id
        WHERE LOWER(r.email) = v_email
          AND r.status IN ('upcoming', 'booked')
          AND tstzrange(s.start_at, s.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'STUDENT_TIME_CONFLICT');
    END IF;

    -- Serialize creation of the same instructor/start pair, including when no slot exists yet.
    PERFORM pg_advisory_xact_lock(hashtext(LOWER(p_instructor)), hashtext(p_start_at::TEXT));

    SELECT id INTO v_slot_id
    FROM slots
    WHERE start_at = p_start_at AND instructor = p_instructor AND status = 'available'
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_slot_id IS NULL THEN
        IF EXISTS (SELECT 1 FROM slots WHERE start_at = p_start_at AND instructor = p_instructor AND status <> 'available') THEN
            RETURN jsonb_build_object('ok', FALSE, 'error', 'SLOT_NOT_AVAILABLE');
        END IF;
        INSERT INTO slots(start_at, end_at, instructor, status)
        VALUES (p_start_at, p_end_at, p_instructor, 'booked')
        RETURNING id INTO v_slot_id;
    ELSE
        UPDATE slots SET status = 'booked', end_at = p_end_at WHERE id = v_slot_id;
    END IF;

    INSERT INTO reservations(slot_id, email, first_name, last_name, phone, status)
    VALUES (v_slot_id, v_email, p_first_name, p_last_name, p_phone, 'upcoming')
    RETURNING id INTO v_reservation_id;

    RETURN jsonb_build_object('ok', TRUE, 'slot_id', v_slot_id, 'reservation_id', v_reservation_id);
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'SLOT_NOT_AVAILABLE');
END;
$$;
REVOKE ALL ON FUNCTION book_slot(TIMESTAMPTZ,TIMESTAMPTZ,TEXT,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_slot(TIMESTAMPTZ,TIMESTAMPTZ,TEXT,TEXT,TEXT,TEXT,TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION cancel_own_reservation(p_reservation_id UUID DEFAULT NULL, p_slot_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation reservations%ROWTYPE;
    v_start_at TIMESTAMPTZ;
BEGIN
    IF current_app_role() NOT IN ('student', 'admin') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'AUTH_REQUIRED');
    END IF;

    SELECT r.* INTO v_reservation
    FROM reservations r
    WHERE (p_reservation_id IS NOT NULL AND r.id = p_reservation_id)
       OR (p_reservation_id IS NULL AND p_slot_id IS NOT NULL AND r.slot_id = p_slot_id)
    ORDER BY r.created_at DESC
    LIMIT 1
    FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'RESERVATION_NOT_FOUND'); END IF;
    IF current_app_role() <> 'admin' AND LOWER(v_reservation.email) <> current_app_email() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'FORBIDDEN');
    END IF;

    SELECT start_at INTO v_start_at FROM slots WHERE id = v_reservation.slot_id FOR UPDATE;
    IF current_app_role() <> 'admin'
       AND v_reservation.created_at < NOW() - INTERVAL '15 minutes'
       AND v_start_at < NOW() + INTERVAL '48 hours' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'JUSTIFICATION_REQUIRED');
    END IF;

    DELETE FROM reservations WHERE id = v_reservation.id;
    IF NOT EXISTS (SELECT 1 FROM reservations WHERE slot_id = v_reservation.slot_id) THEN
        UPDATE slots SET status = 'available' WHERE id = v_reservation.slot_id;
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'slot_id', v_reservation.slot_id);
END;
$$;
REVOKE ALL ON FUNCTION cancel_own_reservation(UUID,UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION cancel_own_reservation(UUID,UUID) TO authenticated, service_role;

-- Atomic, idempotent recording of successful Stripe payments.
CREATE OR REPLACE FUNCTION record_successful_payment(
    p_event_id TEXT,
    p_payment_reference TEXT,
    p_user_email TEXT,
    p_student_name TEXT,
    p_amount NUMERIC,
    p_source TEXT,
    p_pack_id TEXT,
    p_pack_label TEXT,
    p_hours INTEGER,
    p_transmission TEXT,
    p_payment_method TEXT,
    p_installments_count INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inserted UUID;
    v_hours_available INTEGER := 0;
    v_invoice_number TEXT;
BEGIN
    INSERT INTO stripe_payment_ledger(event_id, payment_reference, user_email, amount, source, hours_credited)
    VALUES (p_event_id, p_payment_reference, LOWER(p_user_email), p_amount, p_source,
        CASE WHEN p_source IN ('student_pack', 'additional_hours') THEN GREATEST(COALESCE(p_hours, 0), 0) ELSE 0 END)
    ON CONFLICT (payment_reference) DO NOTHING
    RETURNING id INTO v_inserted;

    IF v_inserted IS NULL THEN
        SELECT COALESCE(hours_goal, 0) INTO v_hours_available FROM users WHERE LOWER(email) = LOWER(p_user_email);
        RETURN jsonb_build_object('ok', TRUE, 'duplicate', TRUE, 'hours_available', COALESCE(v_hours_available, 0));
    END IF;

    IF p_source IN ('student_pack', 'additional_hours') AND COALESCE(p_hours, 0) > 0 THEN
        UPDATE users
        SET hours_goal = COALESCE(hours_goal, 0) + p_hours
        WHERE LOWER(email) = LOWER(p_user_email)
        RETURNING hours_goal INTO v_hours_available;
        IF NOT FOUND THEN RAISE EXCEPTION 'USER_NOT_FOUND'; END IF;
    ELSE
        SELECT COALESCE(hours_goal, p_hours, 0) INTO v_hours_available
        FROM users WHERE LOWER(email) = LOWER(p_user_email);
    END IF;

    INSERT INTO payments(
        user_email, customer_email, user_name, amount, amount_eur, currency,
        payment_method, payment_status, payment_id, stripe_payment_intent_id,
        pack_id, pack_label, installments_count, hours_purchased, transmission_type, metadata
    ) VALUES (
        LOWER(p_user_email), LOWER(p_user_email), p_student_name, p_amount, p_amount, 'eur',
        p_payment_method, 'completed', p_payment_reference, p_payment_reference,
        p_pack_id, p_pack_label, p_installments_count, COALESCE(p_hours, 0), p_transmission,
        jsonb_build_object('source', p_source, 'stripe_event_id', p_event_id)
    ) ON CONFLICT DO NOTHING;

    IF p_source = 'installment_payment' THEN
        UPDATE inscription_notifications
        SET amount_paid = COALESCE(amount_paid, 0) + p_amount
        WHERE id = (
            SELECT id
            FROM inscription_notifications
            WHERE LOWER(user_email) = LOWER(p_user_email)
              AND status <> 'rejected'
              AND pack = p_pack_id
            ORDER BY created_at DESC
            LIMIT 1
        );
    END IF;

    v_invoice_number := 'FACT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(RIGHT(REPLACE(p_payment_reference, '_', ''), 10));
    INSERT INTO invoices(
        invoice_number, user_email, student_name, amount, payment_method,
        description, forfait, hours_purchased, payment_date, stripe_payment_intent_id
    ) VALUES (
        v_invoice_number, LOWER(p_user_email), COALESCE(NULLIF(p_student_name, ''), p_user_email),
        p_amount, p_payment_method, COALESCE(NULLIF(p_pack_label, ''), 'Paiement Auto-Ecole Breteuil'),
        p_pack_id, COALESCE(p_hours, 0), NOW(), p_payment_reference
    ) ON CONFLICT (stripe_payment_intent_id) DO NOTHING;

    RETURN jsonb_build_object('ok', TRUE, 'duplicate', FALSE, 'hours_available', COALESCE(v_hours_available, 0));
END;
$$;

REVOKE ALL ON FUNCTION record_successful_payment(TEXT,TEXT,TEXT,TEXT,NUMERIC,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_successful_payment(TEXT,TEXT,TEXT,TEXT,NUMERIC,TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT,INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION consume_password_reset(p_token_hash TEXT, p_password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email TEXT;
BEGIN
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE token_hash = p_token_hash
      AND used_at IS NULL
      AND expires_at > NOW()
    RETURNING user_email INTO v_email;

    IF v_email IS NULL THEN RETURN FALSE; END IF;

    UPDATE users SET password_hash = p_password_hash WHERE LOWER(email) = LOWER(v_email);
    IF NOT FOUND THEN
        UPDATE instructors SET password_hash = p_password_hash WHERE LOWER(email) = LOWER(v_email);
        IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_NOT_FOUND'; END IF;
    END IF;
    RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION consume_password_reset(TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_password_reset(TEXT,TEXT) TO service_role;

-- Remove expired technical records regularly from the SQL editor or a scheduled job.
DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '1 day';
DELETE FROM pending_registrations WHERE expires_at < NOW() - INTERVAL '7 days';
