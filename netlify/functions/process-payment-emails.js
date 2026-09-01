const { getSupabaseAdmin } = require('./_lib/auth');
const { sendInvoiceIfNeeded } = require('./_lib/payment-processing');
const { requireScheduledInvocation } = require('./_lib/scheduled');

exports.handler = async (event) => {
    const blocked = requireScheduledInvocation(event);
    if (blocked) return blocked;
    const supabase = getSupabaseAdmin();
    const staleClaim = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('stripe_payment_intent_id,user_email')
        .eq('confirmation_email_sent', false)
        .not('stripe_payment_intent_id', 'is', null)
        .or(`confirmation_email_claimed_at.is.null,confirmation_email_claimed_at.lt.${staleClaim}`)
        .order('payment_date', { ascending: true })
        .limit(20);
    if (error) throw error;

    const results = [];
    for (const invoice of invoices || []) {
        try {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('hours_goal, lesson_unit_minutes')
                .ilike('email', invoice.user_email)
                .maybeSingle();
            if (userError) throw userError;
            await sendInvoiceIfNeeded(supabase, invoice.stripe_payment_intent_id, Number(user?.hours_goal || 0));
            results.push({ payment: invoice.stripe_payment_intent_id, ok: true });
        } catch (emailError) {
            console.error('payment email retry:', invoice.stripe_payment_intent_id, emailError.message);
            results.push({ payment: invoice.stripe_payment_intent_id, ok: false });
        }
    }

    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
};
