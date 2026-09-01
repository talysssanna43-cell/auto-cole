const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { sendResendEmail } = require('./_lib/exam-email');
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

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatSlotDate(value) {
    if (!value) return 'date non précisée';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function cancellationDecisionHtml(request, decision, adminReason) {
    const accepted = decision === 'accepted';
    const title = accepted ? 'Ta demande d’annulation est acceptée' : 'Réponse à ta demande d’annulation';
    const accent = accepted ? '#16a34a' : '#be123c';
    const studentName = escapeHtml(request.user_name || 'Bonjour');
    const slotDate = escapeHtml(formatSlotDate(request.slot_date));
    const slotTime = escapeHtml(request.slot_time || 'heure non précisée');
    const instructor = escapeHtml(request.instructor || 'moniteur non précisé');
    const reasonBlock = !accepted
        ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:14px;padding:16px;margin:20px 0;">
               <p style="margin:0 0 6px;font-weight:700;color:#991b1b;">Motif de refus</p>
               <p style="margin:0;color:#7f1d1d;">${escapeHtml(adminReason || 'La demande ne peut pas être acceptée en l’état.')}</p>
           </div>`
        : '';
    const mainMessage = accepted
        ? 'Ta demande a bien été acceptée. Le créneau a été libéré et il ne sera pas conservé comme cours à venir sur ton planning.'
        : 'Ta demande a bien été étudiée par l’auto-école, mais elle ne peut pas être acceptée pour le moment.';

    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#1a1a2e;line-height:1.65;">
            <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:18px;padding:24px;margin-bottom:24px;">
                <h1 style="color:${accent};margin:0 0 12px;font-size:26px;">${title}</h1>
                <p style="margin:0;font-size:16px;">Bonjour ${studentName},</p>
            </div>
            <p>${mainMessage}</p>
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:20px 0;">
                <p style="margin:0;"><strong>Créneau concerné :</strong> ${slotDate}, ${slotTime}</p>
                <p style="margin:6px 0 0;"><strong>Moniteur :</strong> ${instructor}</p>
            </div>
            ${reasonBlock}
            <p>Si tu as une question ou si tu veux reprendre un créneau, l’équipe reste disponible pour t’accompagner.</p>
            <p style="margin-top:24px;font-weight:700;">Auto-Ecole Breteuil</p>
            <p style="font-size:14px;color:#666;">04 91 53 36 98 - breteuilautoecole@gmail.com</p>
        </div>
    `;
}

async function notifyStudent(request, decision, adminReason) {
    const to = text(request.user_email, 255).toLowerCase();
    if (!to || !to.includes('@')) return { sent: false, reason: 'MISSING_STUDENT_EMAIL' };

    const subject = decision === 'accepted'
        ? 'Votre demande d’annulation est acceptée'
        : 'Réponse à votre demande d’annulation';

    try {
        await sendResendEmail({
            to,
            subject,
            html: cancellationDecisionHtml(request, decision, adminReason)
        });
        return { sent: true, reason: null };
    } catch (error) {
        console.error('cancellation decision email:', error.message);
        return { sent: false, reason: error.message || 'EMAIL_SEND_FAILED' };
    }
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
        const requestId = parseUuid(body?.request_id);
        const decision = text(body?.decision, 30);
        const adminReason = text(body?.admin_reason, 1000);
        if (!requestId || !['accepted', 'refused'].includes(decision)) {
            return response(400, { ok: false, error: 'INVALID_DECISION' });
        }
        if (decision === 'refused' && adminReason.length < 3) {
            return response(400, { ok: false, error: 'ADMIN_REASON_REQUIRED' });
        }

        const { data: request, error: requestError } = await supabase
            .from('cancellation_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();
        if (requestError) throw requestError;
        if (!request) return response(404, { ok: false, error: 'REQUEST_NOT_FOUND' });
        if (String(request.status || 'pending').toLowerCase() !== 'pending') {
            return response(409, { ok: false, error: 'REQUEST_ALREADY_PROCESSED' });
        }

        const { error: updateRequestError } = await supabase
            .from('cancellation_requests')
            .update({ status: decision, updated_at: new Date().toISOString() })
            .eq('id', requestId);
        if (updateRequestError) throw updateRequestError;

        let releasedSlotId = null;
        if (request.reservation_id) {
            if (decision === 'accepted') {
                const { data: reservation, error: reservationError } = await supabase
                    .from('reservations')
                    .select('slot_id,notes')
                    .eq('id', request.reservation_id)
                    .maybeSingle();
                if (reservationError) throw reservationError;

                releasedSlotId = reservation?.slot_id || null;
                const { error: deleteReservationError } = await supabase
                    .from('reservations')
                    .delete()
                    .eq('id', request.reservation_id);
                if (deleteReservationError) throw deleteReservationError;

                if (releasedSlotId) {
                    const { error: updateSlotError } = await supabase
                        .from('slots')
                        .update({ status: 'available' })
                        .eq('id', releasedSlotId);
                    if (updateSlotError) throw updateSlotError;
                }
            } else {
                const { data: reservation, error: reservationError } = await supabase
                    .from('reservations')
                    .select('notes')
                    .eq('id', request.reservation_id)
                    .maybeSingle();
                if (reservationError) throw reservationError;
                const existingNotes = String(reservation?.notes || '').trim();
                const refusalNote = `Demande d'annulation refusée par l'admin - ${adminReason}`;
                const { error: refuseError } = await supabase
                    .from('reservations')
                    .update({
                        notes: existingNotes ? `${existingNotes}\n${refusalNote}` : refusalNote
                    })
                    .eq('id', request.reservation_id);
                if (refuseError) throw refuseError;
            }
        }

        const emailResult = await notifyStudent(request, decision, adminReason);

        return response(200, {
            ok: true,
            slot_id: releasedSlotId,
            email_sent: emailResult.sent,
            email_reason: emailResult.reason
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-cancellation-decision:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ADMIN_CANCELLATION_DECISION_FAILED' });
    }
};
