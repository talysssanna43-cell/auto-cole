const crypto = require('crypto');
const { getEnv, getSupabaseAdmin, sha256 } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function getSiteOrigin(event) {
    const configured = getEnv('URL', ['SITE_URL']);
    if (configured) return configured.replace(/\/$/, '');
    const origin = event.headers.origin || '';
    return /^https?:\/\//i.test(origin) ? origin.replace(/\/$/, '') : 'https://autoecolebreteuil.com';
}

async function sendResetEmail(email, name, link) {
    const apiKey = getEnv('RESEND_API_KEY');
    const from = getEnv('RESEND_FROM_EMAIL');
    if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED');

    const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to: email,
            subject: 'Réinitialisation de ton mot de passe - Auto-Ecole Breteuil',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#202033;line-height:1.6">
                    <h1 style="font-size:24px">Réinitialisation du mot de passe</h1>
                    <p>Bonjour ${name || ''},</p>
                    <p>Une demande de réinitialisation a été effectuée pour ton espace élève.</p>
                    <p style="margin:28px 0"><a href="${link}" style="background:#ee2b7b;color:white;padding:13px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Choisir un nouveau mot de passe</a></p>
                    <p>Ce lien est valable pendant 30 minutes et ne peut être utilisé qu'une seule fois.</p>
                    <p>Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet e-mail. Ton mot de passe actuel reste inchangé.</p>
                    <hr style="border:0;border-top:1px solid #ddd;margin:28px 0">
                    <p style="font-size:14px;color:#666">Auto-Ecole Breteuil · 04 91 53 36 98 · breteuilautoecole@gmail.com</p>
                </div>`
        })
    });

    if (!emailResponse.ok) throw new Error('EMAIL_PROVIDER_ERROR');
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    const email = normalizeEmail(body?.email);
    if (!email) return response(400, { ok: false, error: 'INVALID_EMAIL' });
    const rate = consumeRateLimit(event, { scope: 'password-reset', identifier: email, limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rate.allowed) return response(429, { ok: true });

    const genericSuccess = response(200, { ok: true });

    try {
        const supabase = getSupabaseAdmin();
        let { data: user, error } = await supabase
            .from('users')
            .select('id, prenom, email')
            .ilike('email', email)
            .maybeSingle();
        if (error) throw error;
        if (!user) {
            const instructorResult = await supabase
                .from('instructors')
                .select('id, prenom, email')
                .ilike('email', email)
                .maybeSingle();
            if (instructorResult.error) throw instructorResult.error;
            user = instructorResult.data;
        }
        if (!user) return genericSuccess;

        const rawToken = crypto.randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
            user_email: normalizeEmail(user.email),
            token_hash: sha256(rawToken),
            expires_at: expiresAt
        });
        if (tokenError) throw tokenError;

        const link = `${getSiteOrigin(event)}/reset-password.html?token=${encodeURIComponent(rawToken)}`;
        await sendResetEmail(user.email, user.prenom, link);
        return genericSuccess;
    } catch (error) {
        console.error('request-password-reset:', error.message);
        return response(503, { ok: false, error: 'RESET_UNAVAILABLE' });
    }
};
