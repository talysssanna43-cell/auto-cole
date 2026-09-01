const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function parseUuid(value) {
    const id = text(value, 80);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        ? id
        : '';
}

function cleanDataUrl(value) {
    const raw = String(value || '');
    if (!/^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i.test(raw)) return '';
    return raw.length <= 7 * 1024 * 1024 ? raw : '';
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const studentEmail = String(session.email || '').trim().toLowerCase();
        const reservationId = parseUuid(body.reservation_id);
        const reason = text(body.reason, 1000);
        const justificationFile = cleanDataUrl(body.justification_file);
        const justificationFilename = text(body.justification_filename, 180);

        if (!studentEmail || !reservationId || !reason || !justificationFile || !justificationFilename) {
            return response(400, { ok: false, error: 'INVALID_CANCELLATION_REQUEST' });
        }

        const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .select('id,email,first_name,last_name,phone,status,slots(start_at,end_at,instructor)')
            .eq('id', reservationId)
            .maybeSingle();
        if (reservationError) throw reservationError;
        if (!reservation || String(reservation.email || '').toLowerCase() !== studentEmail) {
            return response(404, { ok: false, error: 'RESERVATION_NOT_FOUND' });
        }

        const slot = reservation.slots || {};
        const startAt = slot.start_at ? new Date(slot.start_at) : null;
        const slotDate = startAt && !Number.isNaN(startAt.getTime()) ? startAt.toISOString().slice(0, 10) : null;
        const slotTime = startAt && !Number.isNaN(startAt.getTime())
            ? `${String(startAt.getHours()).padStart(2, '0')}:${String(startAt.getMinutes()).padStart(2, '0')}`
            : null;

        const payload = {
            reservation_id: reservationId,
            user_email: studentEmail,
            user_name: text(`${reservation.first_name || ''} ${reservation.last_name || ''}`.trim() || body.user_name, 200),
            reason,
            justification_file: justificationFile,
            justification_filename: justificationFilename,
            status: 'pending',
            slot_date: slotDate,
            slot_time: slotTime,
            instructor: text(slot.instructor, 120),
            created_at: new Date().toISOString()
        };

        const { data: request, error: insertError } = await supabase
            .from('cancellation_requests')
            .insert(payload)
            .select('id')
            .single();
        if (insertError) throw insertError;

        await supabase
            .from('reservations')
            .update({ status: 'pending' })
            .eq('id', reservationId);

        return response(200, { ok: true, request_id: request.id });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-cancellation-request:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'STUDENT_CANCELLATION_REQUEST_FAILED' });
    }
};
