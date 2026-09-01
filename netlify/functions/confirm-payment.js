const Stripe = require('stripe');
const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { processSuccessfulPayment } = require('./_lib/payment-processing');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function paymentFromIntent(intent) {
    return {
        eventId: `confirm:${intent.id}`,
        paymentReference: intent.id,
        email: intent.metadata.customer_email || intent.receipt_email,
        amount: intent.amount_received / 100,
        source: intent.metadata.source,
        packId: intent.metadata.pack_id,
        packLabel: intent.metadata.pack_label,
        hours: Number(intent.metadata.hours || 0),
        transmission: intent.metadata.transmission,
        installments: Number(intent.metadata.installments_count || 0) || null,
        studentName: intent.metadata.student_name,
        paymentMethod: 'stripe_card'
    };
}

function paymentFromCheckout(session) {
    return {
        eventId: `confirm:${session.id}`,
        paymentReference: String(session.payment_intent || session.id),
        email: session.metadata?.customer_email || session.customer_details?.email || session.customer_email,
        amount: session.amount_total / 100,
        source: session.metadata?.source,
        packId: session.metadata?.pack_id,
        packLabel: session.metadata?.pack_label,
        hours: Number(session.metadata?.hours || 0),
        transmission: session.metadata?.transmission,
        studentName: session.customer_details?.name || '',
        paymentMethod: 'stripe_checkout'
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const sessionUser = verifySession(getBearerToken(event), ['student']);
        await assertSessionActive(sessionUser, getSupabaseAdmin());
        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const stripeSecret = getEnv('STRIPE_SECRET_KEY');
        if (!stripeSecret) return response(503, { ok: false, error: 'STRIPE_NOT_CONFIGURED' });
        const stripe = new Stripe(stripeSecret);
        let payment;

        if (body.paymentIntentId) {
            const intent = await stripe.paymentIntents.retrieve(String(body.paymentIntentId));
            if (intent.status !== 'succeeded' || intent.metadata.source !== 'student_pack') {
                return response(409, { ok: false, error: 'PAYMENT_NOT_COMPLETED' });
            }
            payment = paymentFromIntent(intent);
        } else if (body.checkoutSessionId) {
            const checkout = await stripe.checkout.sessions.retrieve(String(body.checkoutSessionId));
            if (checkout.payment_status !== 'paid' || checkout.metadata?.source !== 'additional_hours') {
                return response(409, { ok: false, error: 'PAYMENT_NOT_COMPLETED' });
            }
            payment = paymentFromCheckout(checkout);
        } else {
            return response(400, { ok: false, error: 'MISSING_PAYMENT_REFERENCE' });
        }

        if (normalizeEmail(payment.email) !== normalizeEmail(sessionUser.email)) {
            return response(403, { ok: false, error: 'PAYMENT_OWNER_MISMATCH' });
        }

        const result = await processSuccessfulPayment(payment);
        return response(200, { ok: true, result });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('confirm-payment:', error.message);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : 'PAYMENT_CONFIRMATION_FAILED'
        });
    }
};
