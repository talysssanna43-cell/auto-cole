const { getSupabaseAdmin, hashPassword } = require('./_lib/auth');
const { sanitizeDocuments } = require('./_lib/documents');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

function text(value, maxLength = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizeEmail(value) {
    return text(value, 254).toLowerCase();
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeGenre(value) {
    return ['homme', 'femme', 'autre'].includes(value) ? value : null;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

    const email = normalizeEmail(body.email);
    const limit = consumeRateLimit(event, {
        scope: 'registration-request',
        identifier: email,
        limit: 5,
        windowMs: 60 * 60 * 1000
    });
    if (!limit.allowed) {
        return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: limit.retryAfter }, {
            'Retry-After': String(limit.retryAfter)
        });
    }

    const password = String(body.password || '');
    if (!isValidEmail(email) || !text(body.prenom, 100) || !text(body.nom, 100) || !text(body.telephone, 30)) {
        return response(400, { ok: false, error: 'INVALID_STUDENT_DATA' });
    }
    if (password.length < 8 || password.length > 128) {
        return response(400, { ok: false, error: 'INVALID_PASSWORD' });
    }

    const profile = {
        prenom: text(body.prenom, 100),
        nom: text(body.nom, 100),
        email,
        telephone: text(body.telephone, 30),
        date_nais: text(body.dateNaissance, 20) || null,
        genre: normalizeGenre(body.genre),
        adresse: text(body.adresse, 300),
        code_postal: text(body.codePostal, 20),
        ville: text(body.ville, 100),
        numero_neph: text(body.numeroNeph, 30) || null,
        pack: null,
        pack_label: null,
        hours_purchased: 0,
        hours_completed_initial: 0,
        lesson_unit_minutes: 45,
        transmission_type: null,
        payment_method: 'none',
        parent_prenom: text(body.parentPrenom, 100) || null,
        parent_nom: text(body.parentNom, 100) || null,
        is_heberge: ['oui', 'non'].includes(body.heberge) ? body.heberge : null,
        permis_invalide: ['oui', 'non'].includes(body.permisInvalide) ? body.permisInvalide : null,
        notes_admin: text(body.commentaireInscription, 2000) || null,
        documents: sanitizeDocuments(body.documents)
    };

    try {
        const { data, error } = await getSupabaseAdmin().rpc('create_registration_account', {
            p_data: profile,
            p_password_hash: hashPassword(password),
            p_allow_existing: false
        });
        if (error) throw error;
        return response(200, { ok: true, result: data });
    } catch (error) {
        const known = ['ACCOUNT_EXISTS', 'REGISTRATION_ALREADY_PENDING'];
        console.error('create-registration-request:', error.message);
        return response(400, {
            ok: false,
            error: known.includes(error.message) ? error.message : 'REGISTRATION_FAILED'
        });
    }
};
