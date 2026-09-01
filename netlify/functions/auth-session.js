const { assertSessionActive, getBearerToken, getSupabaseAdmin, publicProfile, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const payload = verifySession(getBearerToken(event));
        const supabase = getSupabaseAdmin();
        await assertSessionActive(payload, supabase);

        return response(200, { ok: true, user: publicProfile(payload) });
    } catch (error) {
        const status = error.message === 'FORBIDDEN' ? 403 : 401;
        return response(status, { ok: false, error: error.message });
    }
};
