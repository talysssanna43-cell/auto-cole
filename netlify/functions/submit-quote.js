const crypto = require('crypto');
const { getEnv, getSupabaseAdmin } = require('./_lib/auth');
const { validatePurchase } = require('./_lib/catalog');
const { sendResendEmail } = require('./_lib/exam-email');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');
const {
    adminQuoteEmailHtml,
    buildQuotePdf,
    clientQuoteEmailHtml,
    quoteFileName
} = require('./_lib/quote-pdf');

const DEFAULT_ADMIN_EMAIL = 'breteuilautoecole@gmail.com';
const FINANCING_OPTIONS = new Set(['CPF', 'Mission Locale', 'Département 13', 'France Travail', 'Autre']);
const AVAILABILITY_OPTIONS = new Set(['', 'Semaine', 'Week-end', 'Flexible']);
const OBJECTIVE_OPTIONS = new Set(['', 'Permis rapidement', 'Budget', 'Confort planning']);

function text(value, maxLength = 500) {
    return String(value || '')
        .replace(/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/\r\n/g, '\n')
        .trim()
        .slice(0, maxLength);
}

function cleanPhone(value) {
    return text(value, 30).replace(/[^0-9+().\s-]/g, '').trim();
}

function cleanEmail(value) {
    return text(value, 254).toLowerCase();
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function quoteReference(now = new Date()) {
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `DEV-${datePart}-${randomPart}`;
}

function canonicalOfferName(packId, hours, transmission) {
    if (packId.startsWith('tarif-')) {
        const withoutPrefix = packId.slice('tarif-'.length);
        const lastDash = withoutPrefix.lastIndexOf('-');
        const basePack = withoutPrefix.slice(0, lastDash).replace(/-auto$/, '');
        const labels = {
            chill: 'Permis Chill',
            premium: 'Permis Premium',
            accelere: 'Permis Accéléré',
            aac: 'Conduite accompagnée',
            supervisee: 'Conduite supervisée'
        };
        const label = labels[basePack];
        if (label) return `${label} - boîte ${transmission === 'auto' ? 'automatique' : 'manuelle'} - ${hours} cours`;
    }

    const fixedLabels = {
        am: 'Permis Young - voiture sans permis - 8 cours',
        'code-etudiant': 'Code de la route - Pack Étudiant',
        'code-classique': 'Code de la route - Pack Classique',
        'carte-rdv': 'Rendez-vous préalable ou pédagogique',
        'carte-accompagnement-manual': "Accompagnement à l'examen - boîte manuelle",
        'carte-accompagnement-auto': "Accompagnement à l'examen - boîte automatique"
    };
    if (fixedLabels[packId]) return fixedLabels[packId];
    if (packId === 'heures-conduite') {
        return `Cours de conduite - boîte ${transmission === 'auto' ? 'automatique' : 'manuelle'} - ${hours} cours`;
    }
    return '';
}

function normalizeQuoteRequest(body) {
    const packId = text(body.pack_id, 100);
    const amountCents = Number(body.amount);
    const hours = Number(body.hours);
    const age = Number(body.age);
    const transmission = text(body.transmission, 20).toLowerCase();
    const organismeEmail = cleanEmail(body.organisme_email);
    const createdAt = new Date();
    const validUntil = new Date(createdAt);
    validUntil.setDate(validUntil.getDate() + 30);

    return {
        reference: quoteReference(createdAt),
        createdAt,
        validUntil,
        prenom: text(body.prenom, 100),
        nom: text(body.nom, 100),
        age,
        nationalite: text(body.nationalite, 100),
        email: cleanEmail(body.email),
        telephone: cleanPhone(body.telephone),
        financement: text(body.financement, 100),
        organisme: text(body.organisme, 180),
        organismeEmail,
        packId,
        amountCents,
        hours,
        transmission,
        transmissionLabel: ['code-etudiant', 'code-classique', 'carte-rdv'].includes(packId)
            ? 'Non applicable'
            : transmission === 'auto' ? 'Boîte automatique' : 'Boîte manuelle',
        hoursLabel: hours > 0 ? `${hours} cours` : 'Prestation forfaitaire',
        disponibilite: text(body.disponibilite, 100),
        objectif: text(body.objectif, 100),
        message: text(body.message, 1200),
        botField: text(body['bot-field'], 100)
    };
}

function validateQuoteRequest(quote) {
    if (
        !quote.prenom
        || !quote.nom
        || !Number.isInteger(quote.age)
        || quote.age < 14
        || quote.age > 99
        || !quote.nationalite
        || !validEmail(quote.email)
        || !quote.telephone
        || !FINANCING_OPTIONS.has(quote.financement)
        || !quote.organisme
        || (quote.organismeEmail && !validEmail(quote.organismeEmail))
        || !AVAILABILITY_OPTIONS.has(quote.disponibilite)
        || !OBJECTIVE_OPTIONS.has(quote.objectif)
        || !quote.packId
        || !Number.isInteger(quote.amountCents)
        || !Number.isInteger(quote.hours)
        || !['manual', 'auto'].includes(quote.transmission)
    ) {
        return 'INVALID_QUOTE_REQUEST';
    }

    const validOffer = validatePurchase({
        amount: quote.amountCents,
        hours: quote.hours,
        transmission: quote.transmission
    }, quote.packId);
    if (!validOffer) return 'INVALID_OFFER';

    quote.offerName = canonicalOfferName(quote.packId, quote.hours, quote.transmission);
    if (!quote.offerName) return 'INVALID_OFFER';
    return '';
}

function storedMessage(quote) {
    return [
        `Référence devis : ${quote.reference}`,
        `Âge : ${quote.age} ans`,
        `Nationalité : ${quote.nationalite}`,
        `E-mail organisme : ${quote.organismeEmail || 'Non renseigné'}`,
        `Disponibilités : ${quote.disponibilite || 'Non renseignées'}`,
        `Objectif : ${quote.objectif || 'Non renseigné'}`,
        `Montant estimatif TTC : ${(quote.amountCents / 100).toFixed(2)} EUR`,
        `Pack : ${quote.packId}`,
        quote.message && `Message : ${quote.message}`
    ].filter(Boolean).join('\n');
}

async function sendQuoteEmails(quote) {
    const pdfAttachment = {
        filename: quoteFileName(quote.reference),
        content: buildQuotePdf(quote).toString('base64')
    };
    const adminEmail = getEnv('ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL;
    const [clientResult, adminResult] = await Promise.allSettled([
        sendResendEmail({
            to: quote.email,
            replyTo: adminEmail,
            subject: `Votre devis ${quote.reference} - Auto-Ecole Breteuil`,
            html: clientQuoteEmailHtml(quote),
            attachments: [pdfAttachment]
        }),
        sendResendEmail({
            to: adminEmail,
            replyTo: quote.email,
            subject: `Nouvelle demande de devis ${quote.reference} - ${quote.prenom} ${quote.nom}`,
            html: adminQuoteEmailHtml(quote),
            attachments: [pdfAttachment]
        })
    ]);

    return {
        clientEmailSent: clientResult.status === 'fulfilled',
        adminEmailSent: adminResult.status === 'fulfilled',
        clientError: clientResult.status === 'rejected' ? clientResult.reason : null,
        adminError: adminResult.status === 'rejected' ? adminResult.reason : null
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const body = parseJsonBody(event);
    if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

    const quote = normalizeQuoteRequest(body);
    if (quote.botField) return response(200, { ok: true, ignored: true });

    const limited = consumeRateLimit(event, {
        scope: 'submit-quote',
        identifier: quote.email || quote.telephone,
        limit: 4,
        windowMs: 60 * 60 * 1000
    });
    if (!limited.allowed) {
        return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: limited.retryAfter }, {
            'Retry-After': String(limited.retryAfter)
        });
    }

    const validationError = validateQuoteRequest(quote);
    if (validationError) return response(400, { ok: false, error: validationError });

    try {
        const { error } = await getSupabaseAdmin().from('demandes_devis').insert({
            nom: quote.nom,
            prenom: quote.prenom,
            email: quote.email,
            telephone: quote.telephone,
            financement: quote.financement,
            organisme: quote.organisme,
            forfait: quote.offerName,
            message: storedMessage(quote)
        });
        if (error) throw error;
    } catch (error) {
        console.error('submit-quote storage:', error);
        return response(500, { ok: false, error: 'QUOTE_STORAGE_FAILED' });
    }

    const mail = await sendQuoteEmails(quote);
    if (mail.clientError) console.error('submit-quote client email:', mail.clientError);
    if (mail.adminError) console.error('submit-quote admin email:', mail.adminError);

    if (!mail.clientEmailSent) {
        return response(502, {
            ok: false,
            error: 'QUOTE_EMAIL_FAILED',
            requestSaved: true,
            reference: quote.reference,
            clientEmailSent: false,
            adminEmailSent: mail.adminEmailSent
        });
    }

    return response(200, {
        ok: true,
        requestSaved: true,
        reference: quote.reference,
        clientEmailSent: true,
        adminEmailSent: mail.adminEmailSent
    });
};

exports._test = {
    canonicalOfferName,
    normalizeQuoteRequest,
    storedMessage,
    validateQuoteRequest
};
