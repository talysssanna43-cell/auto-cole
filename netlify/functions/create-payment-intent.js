const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ ok: true })
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Méthode non autorisée' })
        };
    }

    if (!stripe) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Clé Stripe manquante côté serveur.' })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (error) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Corps de requête invalide.' })
        };
    }

    const amount = Number(payload.amount);
    const currency = (payload.currency || 'eur').toLowerCase();
    const packId = payload.packId || 'pack_inconnu';
    const packLabel = payload.packLabel || 'Pack Auto-Ecole';
    const customerEmail = payload.customerEmail || null;
    const description = payload.description || `Inscription ${packLabel}`;

    if (!Number.isInteger(amount) || amount <= 0) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Le montant doit être un entier positif (en centimes).' })
        };
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            description,
            receipt_email: customerEmail || undefined,
            automatic_payment_methods: { enabled: true },
            metadata: {
                pack_id: packId,
                pack_label: packLabel,
                hours: payload.hours || '20',
                customer_email: customerEmail || 'non_renseigne'
            }
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
        };
    } catch (error) {
        console.error('Stripe PI error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Création du paiement impossible.', details: error.message })
        };
    }
};
