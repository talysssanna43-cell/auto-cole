const {
    assertSessionActive,
    getBearerToken,
    getSupabaseAdmin,
    hashPassword,
    verifySession
} = require('./_lib/auth');
const { getHourlyPriceCents, getPackDefinition, normalizeTransmission } = require('./_lib/catalog');
const { sendDecisionEmail } = require('./_lib/decision-email');
const { sanitizeDocuments } = require('./_lib/documents');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, maxLength = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function email(value) {
    return text(value, 254).toLowerCase();
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeGenre(value) {
    return ['homme', 'femme', 'autre'].includes(value) ? value : null;
}

function packDetails(packId, submittedHours, submittedTransmission) {
    const id = text(packId, 80);
    const transmission = normalizeTransmission(submittedTransmission);
    if (id === 'heures-conduite') {
        const hours = Number(submittedHours);
        if (!Number.isInteger(hours) || hours < 1 || hours > 40) throw new Error('INVALID_HOURS');
        return { id, hours, transmission };
    }

    const pack = getPackDefinition(id);
    if (!pack) throw new Error('INVALID_PACK');
    if (pack.transmissions && !pack.transmissions.includes(transmission)) throw new Error('INVALID_TRANSMISSION');
    return { id, hours: pack.hours, transmission };
}

function packAmountEuros(packId, hours, transmission) {
    if (packId === 'heures-conduite') {
        return (hours * getHourlyPriceCents(transmission)) / 100;
    }
    const pack = getPackDefinition(packId);
    return Number(pack?.amounts?.[0] || 0) / 100;
}

async function createAdminInvoice(supabase, profile, details) {
    const amount = packAmountEuros(details.id, details.hours, details.transmission);
    if (!amount || amount <= 0) return null;

    let invoiceNumber = null;
    const { data: generatedNumber, error: numberError } = await supabase.rpc('generate_invoice_number');
    if (!numberError && generatedNumber) {
        invoiceNumber = generatedNumber;
    } else {
        invoiceNumber = `FACT-ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    const invoice = {
        invoice_number: invoiceNumber,
        user_email: profile.email,
        student_name: `${profile.prenom} ${profile.nom}`.trim(),
        amount,
        payment_method: 'admin',
        description: `Forfait ${profile.pack_label || details.id}`,
        forfait: details.id,
        hours_purchased: details.hours,
        payment_date: new Date().toISOString(),
        lesson_unit_minutes: profile.lesson_unit_minutes
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

    if (!error) return data;
    if (!/lesson_unit_minutes/i.test(error.message || '')) throw error;

    const retryInvoice = { ...invoice };
    delete retryInvoice.lesson_unit_minutes;
    const retry = await supabase
        .from('invoices')
        .insert(retryInvoice)
        .select()
        .single();
    if (retry.error) throw retry.error;
    return retry.data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        await assertSessionActive(session, getSupabaseAdmin());

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const studentEmail = email(body.email);
        const password = String(body.password || '');
        if (!isValidEmail(studentEmail) || !text(body.prenom, 100) || !text(body.nom, 100) || !text(body.telephone, 30)) {
            return response(400, { ok: false, error: 'INVALID_STUDENT_DATA' });
        }
        if (password.length < 8 || password.length > 128) {
            return response(400, { ok: false, error: 'INVALID_PASSWORD' });
        }

        const details = packDetails(body.pack, body.hours_purchased, body.transmission_type);
        const completed = Math.max(0, Math.min(details.hours, Number(body.hours_completed_initial) || 0));
        const profile = {
            prenom: text(body.prenom, 100),
            nom: text(body.nom, 100),
            email: studentEmail,
            telephone: text(body.telephone, 30),
            date_nais: text(body.dateNaissance, 20) || null,
            genre: normalizeGenre(body.genre),
            adresse: text(body.adresse, 300),
            code_postal: text(body.codePostal, 20),
            ville: text(body.ville, 100),
            numero_neph: text(body.numeroNeph, 30) || null,
            pack: details.id,
            pack_label: text(body.pack_label, 200) || details.id,
            hours_purchased: details.hours,
            hours_completed_initial: completed,
            lesson_unit_minutes: 45,
            transmission_type: details.transmission,
            payment_method: 'admin',
            parent_prenom: text(body.parentPrenom, 100) || null,
            parent_nom: text(body.parentNom, 100) || null,
            is_heberge: ['oui', 'non'].includes(body.heberge) ? body.heberge : null,
            permis_invalide: ['oui', 'non'].includes(body.permisInvalide) ? body.permisInvalide : null,
            notes_admin: text(body.commentaireInscription, 2000) || null,
            documents: sanitizeDocuments(body.documents)
        };

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.rpc('create_registration_account', {
            p_data: profile,
            p_password_hash: hashPassword(password),
            p_allow_existing: true
        });
        if (error) throw error;

        const notificationId = data?.notification_id || data?.[0]?.notification_id;
        if (notificationId) {
            const { error: approveError } = await supabase
                .from('inscription_notifications')
                .update({
                    status: 'approved',
                    decision_at: new Date().toISOString(),
                    decision_by: session.email,
                    rejection_message: null
                })
                .eq('id', notificationId);
            if (approveError && !/decision_/i.test(approveError.message || '')) {
                throw approveError;
            }
            if (approveError) {
                await supabase
                    .from('inscription_notifications')
                    .update({
                        status: 'approved',
                        rejection_message: null
                    })
                    .eq('id', notificationId);
            }
        }

        let invoice = null;
        try {
            invoice = await createAdminInvoice(supabase, profile, details);
        } catch (invoiceError) {
            console.error('admin-create-registration invoice:', invoiceError.message);
        }

        let decisionEmailSent = false;
        if (notificationId) {
            decisionEmailSent = await sendDecisionEmail(supabase, notificationId).catch((emailError) => {
                console.error('admin-create-registration decision email:', emailError.message);
                return false;
            });
        }

        return response(200, { ok: true, result: data, invoice, decisionEmailSent });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 400;
        console.error('admin-create-registration:', error.message);
        return response(status, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : error.message === 'INVALID_PACK' ? 'INVALID_PACK' : 'REGISTRATION_FAILED'
        });
    }
};
