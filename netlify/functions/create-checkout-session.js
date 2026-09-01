const Stripe = require('stripe');
const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { getHourlyPriceCents, normalizeTransmission } = require('./_lib/catalog');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { message: 'Méthode non autorisée.' });

    const secret = getEnv('STRIPE_SECRET_KEY');
    if (!secret) return response(503, { message: 'Stripe n’est pas configuré côté serveur.' });

    const payload = parseJsonBody(event);
    const quantity = Number(payload?.quantity);
    const transmission = normalizeTransmission(payload?.gearboxType);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 40) {
        return response(400, { message: 'Le nombre d’heures doit être compris entre 1 et 40.' });
    }

    try {
        const sessionUser = verifySession(getBearerToken(event), ['student']);
        await assertSessionActive(sessionUser, getSupabaseAdmin());
        const customerEmail = normalizeEmail(sessionUser.email);
        if (payload.customerEmail && normalizeEmail(payload.customerEmail) !== customerEmail) {
            return response(403, { message: 'Compte de paiement incorrect.' });
        }

        const unitAmount = getHourlyPriceCents(transmission);
        const stripe = new Stripe(secret);
        const origin = /^https?:\/\//i.test(event.headers.origin || '')
            ? event.headers.origin
            : (getEnv('URL', ['SITE_URL']) || 'https://autoecolebreteuil.com');
        const checkout = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Heures de conduite - Boîte ${transmission === 'auto' ? 'automatique' : 'manuelle'}`,
                        description: `${quantity} heure(s) de conduite`
                    },
                    unit_amount: unitAmount
                },
                quantity
            }],
            mode: 'payment',
            success_url: `${origin}/espace-eleve.html?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/espace-eleve.html?payment_success=false`,
            customer_email: customerEmail,
            client_reference_id: customerEmail,
            metadata: {
                source: 'additional_hours',
                customer_email: customerEmail,
                hours: String(quantity),
                transmission,
                pack_id: 'heures-conduite',
                pack_label: `${quantity} heure(s) de conduite`
            }
        });
        return response(200, { url: checkout.url });
    } catch (error) {
        const status = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED'].includes(error.message) ? 401 : 500;
        console.error('create-checkout-session:', error.message);
        return response(status, { message: status === 401 ? 'Reconnecte-toi avant de payer.' : 'Création de la session impossible.' });
    }
};
