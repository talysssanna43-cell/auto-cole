const Stripe = require('stripe');
const { getEnv, getSupabaseAdmin } = require('./_lib/auth');
const { processSuccessfulPayment } = require('./_lib/payment-processing');
const { requireScheduledInvocation } = require('./_lib/scheduled');

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
}

async function sendFailureEmail(plan) {
    const apiKey = getEnv('RESEND_API_KEY');
    const from = getEnv('RESEND_FROM_EMAIL');
    const adminEmail = getEnv('ADMIN_EMAIL') || 'breteuilautoecole@gmail.com';
    if (!apiKey || !from) return;

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: plan.user_email,
            bcc: adminEmail,
            subject: 'Action requise pour votre &eacute;ch&eacute;ance - Auto-Ecole Breteuil',
            html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#17172a">
                <h1 style="color:#ec4899">Auto-Ecole Breteuil</h1>
                <p>Bonjour,</p>
                <p>Le d&eacute;bit de votre prochaine &eacute;ch&eacute;ance pour <strong>${escapeHtml(plan.pack_label)}</strong> n'a pas pu &ecirc;tre valid&eacute;.</p>
                <p>Aucun nouveau d&eacute;bit ne sera tent&eacute; automatiquement tant que la situation n'aura pas &eacute;t&eacute; r&eacute;gularis&eacute;e.</p>
                <p>Contactez-nous au <strong>04 91 53 36 98</strong> ou &agrave; <strong>breteuilautoecole@gmail.com</strong>.</p>
            </div>`
        })
    });
}

exports.handler = async (event) => {
    const blocked = requireScheduledInvocation(event);
    if (blocked) return blocked;

    const secret = getEnv('STRIPE_SECRET_KEY');
    if (!secret) return { statusCode: 503, body: JSON.stringify({ error: 'STRIPE_NOT_CONFIGURED' }) };

    const stripe = new Stripe(secret);
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data: plans, error } = await supabase
        .from('installment_plans')
        .select('*')
        .eq('status', 'active')
        .lte('next_charge_at', now)
        .order('next_charge_at', { ascending: true })
        .limit(20);
    if (error) throw error;

    const results = [];
    for (const plan of plans || []) {
        const nextNumber = Number(plan.paid_installments || 0) + 1;
        const amounts = Array.isArray(plan.installment_amounts_cents)
            ? plan.installment_amounts_cents.map(Number)
            : [];
        const amount = amounts[nextNumber - 1];
        if (!amount || !plan.stripe_customer_id || !plan.stripe_payment_method_id) {
            await supabase.from('installment_plans').update({
                status: 'past_due',
                last_error: 'PAYMENT_METHOD_MISSING',
                updated_at: new Date().toISOString()
            }).eq('id', plan.id);
            await sendFailureEmail(plan).catch(() => {});
            results.push({ id: plan.id, ok: false, error: 'PAYMENT_METHOD_MISSING' });
            continue;
        }

        let intent;
        try {
            intent = await stripe.paymentIntents.create({
                amount,
                currency: 'eur',
                customer: plan.stripe_customer_id,
                payment_method: plan.stripe_payment_method_id,
                off_session: true,
                confirm: true,
                receipt_email: plan.user_email,
                description: `Auto-Ecole Breteuil - ${plan.pack_label} - echeance ${nextNumber}/${plan.installment_count}`,
                metadata: {
                    source: 'installment_payment',
                    customer_email: plan.user_email,
                    pack_id: plan.pack_id,
                    pack_label: plan.pack_label,
                    hours: '0',
                    transmission: plan.transmission_type,
                    installments_count: String(plan.installment_count),
                    installment_number: String(nextNumber),
                    installment_plan_reference: plan.initial_payment_intent_id,
                    student_name: plan.user_email
                }
            }, { idempotencyKey: `installment:${plan.id}:${nextNumber}` });

            if (intent.status !== 'succeeded') throw new Error(`PAYMENT_${intent.status}`);
        } catch (paymentError) {
            await supabase.from('installment_plans').update({
                status: 'past_due',
                last_error: String(paymentError.message || 'PAYMENT_FAILED').slice(0, 500),
                updated_at: new Date().toISOString()
            }).eq('id', plan.id);
            await sendFailureEmail(plan).catch(() => {});
            results.push({ id: plan.id, ok: false, error: 'PAYMENT_FAILED' });
            continue;
        }

        try {
            await processSuccessfulPayment({
                eventId: `scheduled:${intent.id}`,
                paymentReference: intent.id,
                email: plan.user_email,
                amount: intent.amount_received / 100,
                source: 'installment_payment',
                packId: plan.pack_id,
                packLabel: `${plan.pack_label} - echeance ${nextNumber}/${plan.installment_count}`,
                hours: 0,
                transmission: plan.transmission_type,
                installments: plan.installment_count,
                planReference: plan.initial_payment_intent_id,
                installmentNumber: nextNumber,
                stripeCustomerId: plan.stripe_customer_id,
                stripePaymentMethodId: plan.stripe_payment_method_id,
                studentName: plan.user_email,
                paymentMethod: 'stripe_card_installment'
            });
            results.push({ id: plan.id, ok: true, installment: nextNumber });
        } catch (processingError) {
            await supabase.from('installment_plans').update({
                last_error: `PROCESSING_FAILED:${String(processingError.message || 'UNKNOWN').slice(0, 450)}`,
                updated_at: new Date().toISOString()
            }).eq('id', plan.id);
            results.push({ id: plan.id, ok: false, error: 'PROCESSING_FAILED' });
        }
    }

    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
};
