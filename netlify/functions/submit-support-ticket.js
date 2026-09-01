const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

const ATTACHMENT_PREFIX = /^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,/i;

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function attachmentData(attachment) {
    const data = String(attachment?.data || '');
    if (!data) return null;
    if (!ATTACHMENT_PREFIX.test(data) || data.length > 950_000) throw new Error('INVALID_ATTACHMENT');
    return data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student', 'instructor', 'admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });
        const rate = consumeRateLimit(event, {
            scope: 'support-ticket',
            identifier: session.email,
            limit: 8,
            windowMs: 24 * 60 * 60 * 1000
        });
        if (!rate.allowed) {
            return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: rate.retryAfter }, {
                'Retry-After': String(rate.retryAfter)
            });
        }

        const message = text(body.message, 4000);
        if (!message) return response(400, { ok: false, error: 'INVALID_TICKET' });

        const { error } = await supabase.from('support_tickets').insert({
            user_email: session.email,
            user_name: `${session.profile?.prenom || ''} ${session.profile?.nom || ''}`.trim() || session.email,
            message,
            attachment_url: attachmentData(body.attachment),
            status: 'pending'
        });
        if (error) throw error;
        return response(200, { ok: true });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        console.error('submit-support-ticket:', error.message);
        return response(authErrors.includes(error.message) ? 401 : 400, {
            ok: false,
            error: authErrors.includes(error.message)
                ? 'AUTH_REQUIRED'
                : error.message === 'INVALID_ATTACHMENT'
                    ? 'INVALID_ATTACHMENT'
                    : 'SUPPORT_TICKET_FAILED'
        });
    }
};
