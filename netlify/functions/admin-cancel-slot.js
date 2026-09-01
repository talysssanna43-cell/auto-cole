const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function parseUuid(value) {
    const slotId = text(value, 80);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slotId)
        ? slotId
        : '';
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
        const slotId = parseUuid(body?.slot_id);
        if (!slotId) return response(400, { ok: false, error: 'SLOT_ID_REQUIRED' });

        const { data: slot, error: slotError } = await supabase
            .from('slots')
            .select('id,start_at,end_at,status,instructor')
            .eq('id', slotId)
            .maybeSingle();
        if (slotError) throw slotError;
        if (!slot) return response(404, { ok: false, error: 'SLOT_NOT_FOUND' });
        if (!['booked', 'done', 'completed'].includes(slot.status)) {
            return response(409, { ok: false, error: 'SLOT_NOT_BOOKED' });
        }

        const { data: reservations, error: reservationReadError } = await supabase
            .from('reservations')
            .select('id,email,first_name,last_name,phone,status')
            .eq('slot_id', slotId);
        if (reservationReadError) throw reservationReadError;

        const { error: reservationDeleteError } = await supabase
            .from('reservations')
            .delete()
            .eq('slot_id', slotId);
        if (reservationDeleteError) throw reservationDeleteError;

        const { error: slotUpdateError } = await supabase
            .from('slots')
            .update({ status: 'available' })
            .eq('id', slotId);
        if (slotUpdateError) throw slotUpdateError;

        return response(200, {
            ok: true,
            slot,
            reservations_deleted: reservations?.length || 0
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-cancel-slot:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ADMIN_CANCEL_SLOT_FAILED' });
    }
};
