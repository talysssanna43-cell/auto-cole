const { getSupabaseAdmin } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

const SUBJECTS = new Set(['inscription', 'tarifs', 'planning', 'cpf', 'reclamation', 'autre']);

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function email(value) {
    return text(value, 254).toLowerCase();
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

    const address = email(body.email);
    const limited = consumeRateLimit(event, {
        scope: 'contact',
        identifier: address,
        limit: 5,
        windowMs: 60 * 60 * 1000
    });
    if (!limited.allowed) {
        return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: limited.retryAfter }, {
            'Retry-After': String(limited.retryAfter)
        });
    }

    const subject = text(body.sujet, 50);
    const message = text(body.message, 4000);
    const request = {
        prenom: text(body.prenom, 100),
        nom: text(body.nom, 100),
        email: address,
        telephone: text(body.telephone, 30) || null,
        sujet: subject,
        message,
        newsletter: body.newsletter === true,
        status: 'nouveau'
    };

    if (!request.prenom || !request.nom || !validEmail(address) || !SUBJECTS.has(subject) || !message) {
        return response(400, { ok: false, error: 'INVALID_CONTACT_REQUEST' });
    }

    try {
        const { error } = await getSupabaseAdmin().from('contact_requests').insert(request);
        if (error) throw error;
        return response(200, { ok: true });
    } catch (error) {
        console.error('submit-contact-request:', error.message);
        return response(500, { ok: false, error: 'CONTACT_REQUEST_FAILED' });
    }
};
