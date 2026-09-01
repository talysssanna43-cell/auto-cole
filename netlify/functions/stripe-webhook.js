const Stripe = require('stripe');
const { getEnv } = require('./_lib/auth');
const { processSuccessfulPayment } = require('./_lib/payment-processing');

function metadataPayment(event) {
    if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        return {
            eventId: event.id,
            paymentReference: intent.id,
            email: intent.metadata.customer_email || intent.receipt_email,
            amount: intent.amount_received / 100,
            source: intent.metadata.source || 'registration',
            packId: intent.metadata.pack_id,
            packLabel: intent.metadata.pack_label,
            hours: Number(intent.metadata.hours || 0),
            transmission: intent.metadata.transmission,
            installments: Number(intent.metadata.installments_count || 0) || null,
            planReference: intent.metadata.installment_plan_reference,
            installmentNumber: Number(intent.metadata.installment_number || 0),
            stripeCustomerId: String(intent.customer || ''),
            stripePaymentMethodId: String(intent.payment_method || ''),
            studentName: intent.metadata.student_name,
            paymentMethod: intent.metadata.installments_count
                ? `stripe_card_installment_${intent.metadata.installment_number || '1'}_of_${intent.metadata.installments_count}`
                : 'stripe_card'
        };
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        if (session.payment_status !== 'paid') return null;
        return {
            eventId: event.id,
            paymentReference: String(session.payment_intent || session.id),
            email: session.metadata?.customer_email || session.customer_details?.email || session.customer_email,
            amount: session.amount_total / 100,
            source: session.metadata?.source || 'additional_hours',
            packId: session.metadata?.pack_id || 'heures-conduite',
            packLabel: session.metadata?.pack_label || 'Heures de conduite',
            hours: Number(session.metadata?.hours || 0),
            transmission: session.metadata?.transmission,
            studentName: session.customer_details?.name || '',
            paymentMethod: 'stripe_checkout'
        };
    }

    return null;
}

exports.handler = async (event) => {
    const stripeSecret = getEnv('STRIPE_SECRET_KEY');
    const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
    if (!stripeSecret || !webhookSecret) {
        return { statusCode: 503, body: JSON.stringify({ error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' }) };
    }

    let stripeEvent;
    try {
        const stripe = new Stripe(stripeSecret);
        const signature = event.headers['stripe-signature'];
        stripeEvent = stripe.webhooks.constructEvent(event.body, signature, webhookSecret);
    } catch (error) {
        console.error('stripe-webhook signature:', error.message);
        return { statusCode: 400, body: JSON.stringify({ error: 'INVALID_SIGNATURE' }) };
    }

    const payment = metadataPayment(stripeEvent);
    if (!payment) return { statusCode: 200, body: JSON.stringify({ received: true, ignored: true }) };

    try {
        const result = await processSuccessfulPayment(payment);
        return { statusCode: 200, body: JSON.stringify({ received: true, result }) };
    } catch (error) {
        console.error('stripe-webhook processing:', error.message);
        return { statusCode: 500, body: JSON.stringify({ error: 'PAYMENT_PROCESSING_FAILED' }) };
    }
};
