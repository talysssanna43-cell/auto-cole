const Stripe = require('stripe');
const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { computePackChange } = require('./_lib/pack-change');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function isLocalOrigin(event) {
    const origin = String(event.headers.origin || event.headers.Origin || '');
    const host = String(event.headers.host || event.headers.Host || '');
    return /localhost|127\.0\.0\.1/i.test(origin) || /localhost|127\.0\.0\.1/i.test(host);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const stripeSecret = getEnv('STRIPE_SECRET_KEY');
        if (!stripeSecret) return response(503, { ok: false, error: 'STRIPE_NOT_CONFIGURED' });
        if (isLocalOrigin(event) && /^sk_live_/i.test(stripeSecret)) {
            return response(409, {
                ok: false,
                error: 'STRIPE_LIVE_BLOCKED_ON_LOCALHOST',
                message: 'Mode test local active : paiement Stripe live bloque sur localhost.'
            });
        }

        const supabase = getSupabaseAdmin();
        const session = verifySession(getBearerToken(event), ['student']);
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        const newPackId = clean(body?.new_pack, 80);
        const email = String(session.email || '').trim().toLowerCase();

        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .maybeSingle();
        if (studentError) throw studentError;
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const { currentPack, nextPack, amountDue, transmission } = computePackChange(student, newPackId);
        if (currentPack.id === nextPack.id) return response(400, { ok: false, error: 'SAME_PACK' });
        if (amountDue <= 0) return response(409, { ok: false, error: 'NO_PAYMENT_REQUIRED' });

        const stripe = new Stripe(stripeSecret);
        const origin = /^https?:\/\//i.test(event.headers.origin || '')
            ? event.headers.origin
            : (getEnv('URL', ['SITE_URL']) || 'https://autoecolebreteuil.com');

        const checkout = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Changement de forfait Auto-Ecole Breteuil',
                        description: `${currentPack.label} vers ${nextPack.label}`
                    },
                    unit_amount: Math.round(amountDue * 100)
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${origin}/espace-eleve.html?pack_upgrade_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/espace-eleve.html?pack_upgrade_success=false`,
            customer_email: email,
            client_reference_id: email,
            metadata: {
                source: 'pack_upgrade',
                customer_email: email,
                current_pack: currentPack.id,
                new_pack: nextPack.id,
                pack_id: nextPack.id,
                pack_label: nextPack.label,
                hours: String(nextPack.courses),
                transmission,
                amount_due: String(amountDue)
            }
        });

        return response(200, {
            ok: true,
            url: checkout.url,
            change: { from_pack: currentPack.id, to_pack: nextPack.id, amount_due: amountDue }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('create-pack-upgrade-checkout:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'PACK_UPGRADE_CHECKOUT_FAILED' });
    }
};
