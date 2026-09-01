const { getSupabaseAdmin, hashPassword, sha256 } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function validPassword(value) {
    return typeof value === 'string'
        && value.length >= 10
        && value.length <= 128
        && /[A-Z]/.test(value)
        && /[a-z]/.test(value)
        && /\d/.test(value);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    const token = String(body?.token || '');
    const password = body?.password;
    if (!token || !validPassword(password)) {
        return response(400, { ok: false, error: 'INVALID_RESET_REQUEST' });
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data: consumed, error: consumeError } = await supabase.rpc('consume_password_reset', {
            p_token_hash: sha256(token),
            p_password_hash: hashPassword(password)
        });
        if (consumeError) throw consumeError;
        if (!consumed) {
            return response(400, { ok: false, error: 'RESET_LINK_INVALID' });
        }

        return response(200, { ok: true });
    } catch (error) {
        console.error('confirm-password-reset:', error.message);
        return response(503, { ok: false, error: 'RESET_UNAVAILABLE' });
    }
};
