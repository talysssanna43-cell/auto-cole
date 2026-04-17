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

    const { quantity, pricePerHour, gearboxType, customerEmail } = payload;

    if (!quantity || !pricePerHour || !gearboxType) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Paramètres manquants (quantity, pricePerHour, gearboxType)' })
        };
    }

    const totalAmount = quantity * pricePerHour;
    const amountInCents = Math.round(totalAmount * 100);

    try {
        // Créer une Checkout Session Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Heures de conduite - Boîte ${gearboxType === 'manual' ? 'Manuelle' : 'Automatique'}`,
                            description: `${quantity} heure(s) de conduite à ${pricePerHour}€/h`
                        },
                        unit_amount: Math.round(pricePerHour * 100)
                    },
                    quantity: quantity
                }
            ],
            mode: 'payment',
            success_url: `${event.headers.origin || 'https://autoecolebreteuil.com'}/espace-eleve.html?payment_success=true`,
            cancel_url: `${event.headers.origin || 'https://autoecolebreteuil.com'}/espace-eleve.html?payment_success=false`,
            customer_email: customerEmail || undefined,
            client_reference_id: `${customerEmail}_${quantity}h_${gearboxType}`,
            metadata: {
                quantity: String(quantity),
                gearboxType: gearboxType,
                customerEmail: customerEmail || 'non_renseigne',
                pricePerHour: String(pricePerHour)
            }
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error('Stripe Checkout Session error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Création de la session impossible.', details: error.message })
        };
    }
};
