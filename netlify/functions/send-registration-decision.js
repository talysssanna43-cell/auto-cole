const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { sendDecisionEmail } = require('./_lib/decision-email');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        const notificationId = String(body?.notificationId || '');
        const decision = String(body?.decision || '');
        const rejectionMessage = String(body?.rejectionMessage || '').trim().slice(0, 1500);
        if (!notificationId || !['approved', 'rejected'].includes(decision)) {
            return response(400, { ok: false, error: 'INVALID_DECISION' });
        }

        const { data: result, error } = await supabase.rpc('decide_registration', {
            p_notification_id: notificationId,
            p_decision: decision,
            p_rejection_message: rejectionMessage || null,
            p_reviewed_by: session.email
        });
        if (error) throw error;
        const emailSent = await sendDecisionEmail(supabase, notificationId).catch((emailError) => {
            console.error('registration decision email:', emailError.message);
            return false;
        });
        return response(200, { ok: true, result, emailSent });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const clientError = /INVALID_DECISION|REJECTION_REASON_REQUIRED|REGISTRATION_NOT_FOUND|REGISTRATION_ALREADY_REVIEWED|ACCOUNT_NOT_READY/.test(String(error.message || ''));
        const status = authErrors.includes(error.message) ? 401 : clientError ? 409 : 500;
        console.error('send-registration-decision:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : clientError ? 'DECISION_NOT_APPLIED' : 'DECISION_FAILED' });
    }
};
