const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            const instructor = text(params.instructor, 120);
            let query = supabase
                .from('slots')
                .select('id,start_at,end_at,instructor,status,notes')
                .eq('status', 'indisponible')
                .order('start_at', { ascending: true })
                .limit(500);
            if (instructor) query = query.eq('instructor', instructor);
            const { data, error } = await query;
            if (error) throw error;
            return response(200, { ok: true, slots: data || [] });
        }

        const body = parseJsonBody(event);
        const slotId = text(body?.slot_id, 80);
        if (!slotId) return response(400, { ok: false, error: 'SLOT_ID_REQUIRED' });

        const { data: slot, error: slotError } = await supabase
            .from('slots')
            .select('id,status')
            .eq('id', slotId)
            .maybeSingle();
        if (slotError) throw slotError;
        if (!slot) return response(404, { ok: false, error: 'SLOT_NOT_FOUND' });
        if (slot.status !== 'indisponible') {
            return response(409, { ok: false, error: 'SLOT_IS_NOT_UNAVAILABLE' });
        }

        const { error: deleteError } = await supabase
            .from('slots')
            .delete()
            .eq('id', slotId)
            .eq('status', 'indisponible');
        if (deleteError) throw deleteError;

        return response(200, { ok: true });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-delete-unavailable-slot:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'DELETE_UNAVAILABLE_SLOT_FAILED' });
    }
};
