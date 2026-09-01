const { getSupabaseAdmin } = require('./_lib/auth');
const { sendDecisionEmail } = require('./_lib/decision-email');
const { requireScheduledInvocation } = require('./_lib/scheduled');

exports.handler = async (event) => {
    const blocked = requireScheduledInvocation(event);
    if (blocked) return blocked;

    const supabase = getSupabaseAdmin();
    const staleClaim = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: notifications, error } = await supabase
        .from('inscription_notifications')
        .select('id')
        .in('status', ['approved', 'rejected'])
        .eq('decision_email_sent', false)
        .or(`decision_email_claimed_at.is.null,decision_email_claimed_at.lt.${staleClaim}`)
        .order('reviewed_at', { ascending: true })
        .limit(20);
    if (error) throw error;

    const results = [];
    for (const notification of notifications || []) {
        try {
            await sendDecisionEmail(supabase, notification.id);
            results.push({ id: notification.id, ok: true });
        } catch (emailError) {
            console.error('decision email retry:', notification.id, emailError.message);
            results.push({ id: notification.id, ok: false });
        }
    }
    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
};
