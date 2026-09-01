const { getEnv, getSupabaseAdmin } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

const DEFAULT_ADMIN_EMAIL = 'breteuilautoecole@gmail.com';

function text(value, maxLength = 500) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function cleanPhone(value) {
    return text(value, 30).replace(/[^0-9+().\s-]/g, '').trim();
}

function phoneHref(value) {
    const cleaned = String(value || '').replace(/[^\d+]/g, '');
    return cleaned ? `tel:${cleaned}` : '';
}

function email(value) {
    return text(value, 254).toLowerCase();
}

function isoDate(value) {
    const raw = text(value, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateFr(dateValue) {
    if (!dateValue) return 'Non précisé';
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function advisorEmailHtml(request) {
    const fullName = `${request.prenom} ${request.nom}`.trim();
    const callHref = phoneHref(request.telephone);
    const rows = [
        ['Nom', fullName],
        ['Téléphone', request.telephone],
        ['Email', request.email],
        ['Jour souhaité', formatDateFr(request.callback_date)],
        ['Créneau souhaité', request.callback_slot],
        ['Sujet', request.subject],
        ['Message', request.message || 'Aucun message précisé']
    ];

    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#17172d;line-height:1.6;">
            <div style="background:#ec4899;color:#fff;border-radius:18px;padding:22px 24px;margin-bottom:22px;">
                <h1 style="margin:0 0 8px;font-size:25px;">Nouvelle demande de rappel conseiller</h1>
                <p style="margin:0;">Une personne souhaite être contactée par l'Auto-Ecole Breteuil.</p>
            </div>
            <div style="border:1px solid #f9a8d4;border-radius:16px;overflow:hidden;background:#fff;">
                ${rows.map(([label, value]) => `
                    <div style="display:flex;gap:16px;padding:14px 18px;border-bottom:1px solid #fce7f3;">
                        <strong style="width:180px;color:#db2777;">${escapeHtml(label)}</strong>
                        <span style="flex:1;">${escapeHtml(value)}</span>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top:22px;">
                ${callHref ? `<a href="${escapeHtml(callHref)}" style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Rappeler ${escapeHtml(request.telephone)}</a>` : ''}
                <a href="mailto:${escapeHtml(request.email)}" style="display:inline-block;margin-left:8px;background:#17172d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Répondre par email</a>
            </p>
            <p style="font-size:13px;color:#64748b;margin-top:26px;">Demande envoyée depuis la page conseiller du site Auto-Ecole Breteuil.</p>
        </div>
    `;
}

function clientEmailHtml(request) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#17172d;line-height:1.65;">
            <div style="background:#ec4899;color:#fff;border-radius:20px;padding:24px;margin-bottom:22px;">
                <h1 style="margin:0 0 8px;font-size:25px;">Ta demande est bien prise en compte</h1>
                <p style="margin:0;">Auto-Ecole Breteuil a bien reçu ta demande de rappel.</p>
            </div>
            <div style="background:#fff;border:1px solid #fbcfe8;border-radius:18px;padding:22px;">
                <p>Bonjour ${escapeHtml(request.prenom)},</p>
                <p>
                    Nous avons bien reçu ta demande. Un conseiller prendra le temps d'échanger avec toi
                    et fera son maximum pour te rappeler ${escapeHtml(formatDateFr(request.callback_date))}
                    ${escapeHtml(request.callback_slot)}.
                </p>
                <p style="margin-bottom:0;">
                    Si ton créneau ne peut pas être respecté exactement, l'équipe te recontactera au plus proche
                    afin de répondre clairement à ta demande.
                </p>
            </div>
            <p style="font-size:13px;color:#64748b;margin-top:22px;">
                Auto-Ecole Breteuil<br>
                04 91 53 36 98 - breteuilautoecole@gmail.com
            </p>
        </div>
    `;
}

async function sendResendEmail({ to, replyTo, subject, html }) {
    const apiKey = getEnv('RESEND_API_KEY');
    const from = getEnv('RESEND_FROM_EMAIL');

    if (!apiKey || !from) {
        return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
    }

    const body = { from, to, subject, html };
    if (replyTo) body.reply_to = replyTo;

    const mailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const payload = await mailResponse.json().catch(() => ({}));
    if (!mailResponse.ok) {
        console.error('advisor-contact email:', payload);
        return { sent: false, reason: 'EMAIL_SEND_FAILED', details: payload };
    }

    return { sent: true, id: payload.id || null };
}

async function sendAdminEmail(request) {
    return sendResendEmail({
        to: getEnv('ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL,
        replyTo: request.email,
        subject: `Demande conseiller - ${request.prenom} ${request.nom}`,
        html: advisorEmailHtml(request)
    });
}

async function sendClientEmail(request) {
    return sendResendEmail({
        to: request.email,
        replyTo: getEnv('ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL,
        subject: 'Ta demande de rappel est bien prise en compte',
        html: clientEmailHtml(request)
    });
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

    const request = {
        prenom: text(body.prenom, 100),
        nom: text(body.nom, 100),
        email: email(body.email),
        telephone: cleanPhone(body.telephone),
        callback_date: isoDate(body.callback_date),
        callback_slot: text(body.callback_slot, 120),
        subject: text(body.subject, 120) || 'Demande de rappel conseiller',
        message: text(body.message, 1200)
    };

    const limited = consumeRateLimit(event, {
        scope: 'advisor-contact',
        identifier: request.email || request.telephone,
        limit: 4,
        windowMs: 60 * 60 * 1000
    });
    if (!limited.allowed) {
        return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: limited.retryAfter }, {
            'Retry-After': String(limited.retryAfter)
        });
    }

    if (!request.prenom || !request.nom || !request.telephone || !validEmail(request.email) || !request.callback_slot) {
        return response(400, { ok: false, error: 'INVALID_ADVISOR_REQUEST' });
    }

    const contactMessage = [
        "Demande de rappel conseiller depuis la page d'accueil.",
        `Date souhaitée: ${request.callback_date || 'Non précisée'}`,
        `Créneau souhaité: ${request.callback_slot}`,
        `Sujet: ${request.subject}`,
        request.message && `Message: ${request.message}`
    ].filter(Boolean).join('\n');

    try {
        const { error } = await getSupabaseAdmin().from('contact_requests').insert({
            prenom: request.prenom,
            nom: request.nom,
            email: request.email,
            telephone: request.telephone,
            sujet: 'autre',
            message: contactMessage,
            newsletter: false,
            status: 'nouveau'
        });
        if (error) throw error;

        const [adminMail, clientMail] = await Promise.all([
            sendAdminEmail(request),
            sendClientEmail(request)
        ]);

        return response(200, {
            ok: true,
            emailSent: adminMail.sent,
            clientEmailSent: clientMail.sent,
            emailReason: adminMail.reason || clientMail.reason || null
        });
    } catch (error) {
        console.error('advisor-contact:', error);
        return response(500, { ok: false, error: 'ADVISOR_CONTACT_FAILED' });
    }
};
