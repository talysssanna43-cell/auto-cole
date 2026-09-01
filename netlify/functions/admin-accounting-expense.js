const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const CATEGORIES = new Set([
    'Personnel',
    'Vehicules',
    'Local',
    'Informatique & logiciels',
    'Comptabilite & administratif',
    'Marketing & commercial',
    'Banque & paiements',
    'Fiscalite & taxes',
    'Pedagogie & reglementation',
    'Entretien general & fournitures',
    'Assurances',
    'Telecommunications',
    'Imprevus & pertes',
    'Amortissements hors vehicules',
    'Dirigeant'
]);

function clean(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

function buildMotif(body) {
    return [
        `Categorie: ${clean(body.category, 80)}`,
        `Libelle: ${clean(body.label, 180)}`,
        body.vendor ? `Fournisseur: ${clean(body.vendor, 160)}` : '',
        body.reference ? `Reference: ${clean(body.reference, 120)}` : '',
        body.notes ? `Note: ${clean(body.notes, 700)}` : ''
    ].filter(Boolean).join(' | ');
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_JSON' });

        const category = clean(body.category, 80);
        const label = clean(body.label, 180);
        const date = clean(body.date || todayDate(), 20);
        const amount = Number(body.amount);
        const attachmentDataUrl = clean(body.attachmentDataUrl, 1200000);

        if (!CATEGORIES.has(category)) return response(400, { ok: false, error: 'INVALID_CATEGORY' });
        if (!label) return response(400, { ok: false, error: 'MISSING_LABEL' });
        if (!validDate(date)) return response(400, { ok: false, error: 'INVALID_DATE' });
        if (!Number.isFinite(amount) || amount <= 0) return response(400, { ok: false, error: 'INVALID_AMOUNT' });

        const { data, error } = await supabase
            .from('expenses')
            .insert({
                instructor_name: 'ADMIN COMPTA',
                motif: buildMotif(body),
                montant: Number(amount.toFixed(2)),
                date,
                photo_url: attachmentDataUrl || clean(body.attachmentUrl, 1000) || null
            })
            .select('id, motif, montant, date, created_at, photo_url, instructor_name')
            .single();

        if (error) throw error;
        return response(200, { ok: true, expense: data });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-accounting-expense:', error);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ACCOUNTING_EXPENSE_FAILED' });
    }
};
