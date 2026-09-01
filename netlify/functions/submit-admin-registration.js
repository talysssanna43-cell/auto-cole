const { assertSessionActive, getBearerToken, getSupabaseAdmin, hashPassword, verifySession } = require('./_lib/auth');
const { getAllowedAmounts, normalizeTransmission } = require('./_lib/catalog');
const { sanitizeDocuments } = require('./_lib/documents');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, maxLength = 200) {
    return String(value || '').trim().slice(0, maxLength);
}

function normalizeEmail(value) {
    const email = clean(value, 254).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);
        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const email = normalizeEmail(body.email);
        const password = String(body.password || '').trim();
        const packId = clean(body.pack, 80) || null;
        const hours = Math.max(0, Math.min(60, Number.parseInt(body.hours || 0, 10) || 0));
        const transmission = packId === 'code' ? null : normalizeTransmission(body.transmission);
        if (!email || password.length < 8 || password.length > 128 || !clean(body.prenom, 100) || !clean(body.nom, 100)) {
            return response(400, { ok: false, error: 'INVALID_REGISTRATION' });
        }
        if (packId && getAllowedAmounts({ hours, transmission }, packId).length === 0) {
            return response(400, { ok: false, error: 'INVALID_PACK' });
        }

        const data = {
            prenom: clean(body.prenom, 100),
            nom: clean(body.nom, 100),
            email,
            telephone: clean(body.telephone, 30),
            date_nais: clean(body.dateNaissance, 10) || null,
            adresse: clean(body.adresse, 300),
            code_postal: clean(body.codePostal, 20),
            ville: clean(body.ville, 100),
            numero_neph: clean(body.numeroNeph, 30) || null,
            password_hash: hashPassword(password),
            pack: packId,
            pack_label: clean(body.packLabel, 180) || packId,
            hours_purchased: hours,
            transmission_type: transmission,
            hours_completed_initial: Math.max(0, Math.min(hours, Number.parseInt(body.hoursCompleted || 0, 10) || 0)),
            documents: sanitizeDocuments(body.documents),
            parent_prenom: clean(body.parentPrenom, 100) || null,
            parent_nom: clean(body.parentNom, 100) || null,
            is_heberge: ['oui', 'non'].includes(body.heberge) ? body.heberge : null,
            permis_invalide: ['oui', 'non'].includes(body.permisInvalide) ? body.permisInvalide : null,
            notes_admin: clean(body.notesAdmin, 2000) || null,
            reviewed_by: session.email,
            payment_method: 'admin'
        };

        const { data: result, error } = await supabase.rpc('create_registration_account', {
            p_data: data,
            p_password_hash: data.password_hash,
            p_allow_existing: body.allowExisting === true
        });
        if (error) throw error;
        return response(201, { ok: true, result });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const conflict = /REGISTRATION_ALREADY_PENDING|ACCOUNT_EXISTS/.test(String(error.message || ''));
        const status = authErrors.includes(error.message) ? 401 : conflict ? 409 : 500;
        console.error('submit-admin-registration:', error.message);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : conflict ? 'REGISTRATION_ALREADY_PENDING' : 'REGISTRATION_FAILED'
        });
    }
};
