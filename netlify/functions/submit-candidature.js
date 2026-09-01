const { getSupabaseAdmin } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

const ALLOWED_DOCUMENTS = /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|rtf)|text\/rtf|image\/(png|jpe?g|webp));base64,/i;
const MAX_DOCUMENT_LENGTH = 2_100_000;

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function email(value) {
    return text(value, 254).toLowerCase();
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function documentData(value, required = false) {
    const data = String(value || '');
    if (!data) return required ? null : null;
    if (!/^data:/i.test(data) || !ALLOWED_DOCUMENTS.test(data.slice(5)) || data.length > MAX_DOCUMENT_LENGTH) {
        throw new Error('INVALID_DOCUMENT');
    }
    return data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

    const address = email(body.email);
    const limited = consumeRateLimit(event, {
        scope: 'candidature',
        identifier: address,
        limit: 3,
        windowMs: 6 * 60 * 60 * 1000
    });
    if (!limited.allowed) {
        return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: limited.retryAfter }, {
            'Retry-After': String(limited.retryAfter)
        });
    }

    try {
        const application = {
            prenom: text(body.prenom, 100),
            nom: text(body.nom, 100),
            email: address,
            telephone: text(body.telephone, 30),
            poste: text(body.poste, 120),
            disponibilites: text(body.disponibilites, 500) || null,
            message: text(body.message, 4000) || null,
            cv_url: documentData(body.cv, true),
            lettre_url: documentData(body.lettre, false),
            status: 'nouveau'
        };

        if (!application.prenom || !application.nom || !validEmail(address)
            || !application.telephone || !application.poste || !application.cv_url) {
            return response(400, { ok: false, error: 'INVALID_APPLICATION' });
        }

        const { error } = await getSupabaseAdmin().from('candidatures').insert(application);
        if (error) throw error;
        return response(200, { ok: true });
    } catch (error) {
        console.error('submit-candidature:', error.message);
        return response(400, { ok: false, error: error.message === 'INVALID_DOCUMENT' ? 'INVALID_DOCUMENT' : 'APPLICATION_FAILED' });
    }
};
