const auth = require('./_lib/auth');
const { getEnv, safeEqualText } = auth;
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const BUSINESS = Object.freeze({
    name: 'Auto-Ecole Breteuil',
    phone: '04 91 53 36 98',
    email: 'breteuilautoecole@gmail.com',
    address: '1A Rue Edouard Delanglade, 13006 Marseille',
    website: 'https://auto-ecole-breteuil.fr'
});

const SUBJECTS = new Set(['inscription', 'tarifs', 'planning', 'cpf', 'reclamation', 'autre']);

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function normalizeSubject(value) {
    const subject = text(value, 50).toLowerCase();
    return SUBJECTS.has(subject) ? subject : 'autre';
}

function safePhone(value) {
    return text(value, 30).replace(/[^0-9+(). -]/g, '').trim();
}

function getHeader(headers, name) {
    const lowerName = name.toLowerCase();
    return Object.entries(headers || {}).find(([key]) => key.toLowerCase() === lowerName)?.[1] || '';
}

function getToolCalls(message) {
    if (Array.isArray(message?.toolCallList)) return message.toolCallList;
    if (!Array.isArray(message?.toolWithToolCallList)) return [];
    return message.toolWithToolCallList.map((entry) => entry.toolCall || entry).filter(Boolean);
}

function getToolName(call) {
    return call?.name || call?.function?.name || call?.tool?.name || '';
}

function getToolArguments(call) {
    const raw = call?.arguments || call?.parameters || call?.function?.arguments || call?.function?.parameters || {};
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (error) {
            return {};
        }
    }
    return raw && typeof raw === 'object' ? raw : {};
}

function fallbackNameFromPhone(phone) {
    const suffix = String(phone || '').replace(/\D/g, '').slice(-4);
    return suffix ? `Appel ${suffix}` : 'Appel telephone';
}

function syntheticEmail(phone, callId) {
    const token = String(phone || callId || Date.now()).replace(/\D/g, '').slice(-12) || 'appel';
    return `appel-${token}@auto-ecole-breteuil.local`;
}

async function saveLead(args, message) {
    const call = message?.call || {};
    const customer = message?.customer || call?.customer || {};
    const phone = safePhone(args.telephone || args.phone || customer.number || customer.phoneNumber);
    const fullName = text(args.nomComplet || args.fullName || args.nom || '', 160);
    const [firstName, ...lastParts] = fullName.split(/\s+/).filter(Boolean);
    const prenom = text(args.prenom || firstName || fallbackNameFromPhone(phone), 100);
    const nom = text(args.nom || lastParts.join(' ') || 'Vapi', 100);
    const motif = text(args.motif || args.reason || args.message || 'Demande recueillie par le repondeur Vapi.', 2000);
    const preferredCallback = text(args.creneauRappel || args.preferredCallback || '', 120);
    const summary = [
        'Demande recueillie par le repondeur Vapi.',
        motif && `Motif: ${motif}`,
        preferredCallback && `Creneau de rappel souhaite: ${preferredCallback}`,
        call?.id && `ID appel Vapi: ${call.id}`
    ].filter(Boolean).join('\n');

    const request = {
        prenom,
        nom,
        email: text(args.email, 254).toLowerCase() || syntheticEmail(phone, call?.id),
        telephone: phone || null,
        sujet: normalizeSubject(args.sujet || args.subject),
        message: summary,
        newsletter: false,
        status: 'nouveau'
    };

    const { error } = await auth.getSupabaseAdmin().from('contact_requests').insert(request);
    if (error) throw error;
    return {
        ok: true,
        message: 'La demande est enregistree. Dis au correspondant que l equipe le rappellera rapidement.'
    };
}

function businessInfo(args) {
    const topic = text(args.topic || args.sujet || '', 100).toLowerCase();
    return {
        ok: true,
        business: BUSINESS,
        topic,
        essentials: {
            address: BUSINESS.address,
            phone: BUSINESS.phone,
            email: BUSINESS.email,
            manualPermit: 'Permis B boite manuelle: minimum legal 20h. Offres promotionnelles: Chill 5 cours 239 EUR, 10 cours 489 EUR, 20 cours 699 EUR, 25 cours 965 EUR; Premium 5 cours 389 EUR, 10 cours 599 EUR, 20 cours 799 EUR, 25 cours 1095 EUR; Accelere 5 cours 489 EUR, 10 cours 749 EUR, 20 cours 899 EUR, 25 cours 1199 EUR.',
            automaticPermit: 'Permis B boite automatique: minimum legal 13h. Offres serveur connues: Chill 5 cours 269 EUR, Chill 13 cours 499 EUR, Premium 5 cours 379 EUR, Premium 13 cours 599 EUR, accelere 5 cours 499 EUR, accelere 13 cours 749 EUR.',
            hourlyLessons: 'Cours a l unite: 50 EUR/cours en boite manuelle, 60 EUR/cours en boite automatique.',
            code: 'Code de la route: offres connues a 15 EUR et 20 EUR selon la formule.',
            accelerated: 'Permis accelere: disponible en boite manuelle et automatique, avec priorite sur les cours du samedi selon la FAQ du site.',
            saturday: 'Les cours du samedi existent, avec priorite aux eleves en forfait accelere.',
            registration: 'L inscription peut se faire sur le site. Pour un dossier precis, collecter nom, telephone et motif.'
        }
    };
}

function toolResult(toolCallId, name, result) {
    return {
        toolCallId,
        name,
        result: typeof result === 'string' ? result : JSON.stringify(result)
    };
}

async function handleToolCalls(message) {
    const results = [];
    for (const call of getToolCalls(message)) {
        const id = call.id || call.toolCallId;
        const name = getToolName(call);
        const args = getToolArguments(call);
        try {
            if (name === 'collect_lead') {
                results.push(toolResult(id, name, await saveLead(args, message)));
            } else if (name === 'get_business_info') {
                results.push(toolResult(id, name, businessInfo(args)));
            } else {
                results.push(toolResult(id, name, { ok: false, error: `UNKNOWN_TOOL:${name}` }));
            }
        } catch (error) {
            console.error('vapi-webhook tool error:', error.message);
            results.push(toolResult(id, name, {
                ok: false,
                error: 'TOOL_FAILED',
                message: 'La demande n a pas pu etre enregistree automatiquement. Propose de rappeler le standard.'
            }));
        }
    }
    return response(200, { results });
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const secret = getEnv('VAPI_WEBHOOK_SECRET');
    if (secret) {
        const received = getHeader(event.headers, 'x-vapi-secret');
        if (!safeEqualText(received, secret)) {
            return response(401, { ok: false, error: 'INVALID_VAPI_SECRET' });
        }
    }

    const body = parseJsonBody(event);
    if (!body?.message) return response(400, { ok: false, error: 'INVALID_BODY' });

    if (body.message.type === 'tool-calls') {
        return handleToolCalls(body.message);
    }

    if (body.message.type === 'end-of-call-report') {
        console.info('Vapi end-of-call-report:', body.message.call?.id || 'unknown-call');
    }

    return response(200, { ok: true });
};
