const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, max = 300) {
    return String(value || '').trim().slice(0, max);
}

function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function instructorNameFromSession(session) {
    return clean(session.profile?.instructor_name || session.profile?.prenom || session.email, 120);
}

function buildMotif(body) {
    const kind = clean(body.kind, 40) === 'incident' ? 'Incident vehicule' : 'Ticket essence';
    const pieces = [
        kind,
        `Plaque: ${clean(body.plate, 40) || 'non renseignee'}`
    ];
    if (body.time) pieces.push(`Heure: ${clean(body.time, 20)}`);
    if (kind === 'Incident vehicule') {
        pieces.push(`Type: ${clean(body.incident_type, 120) || 'incident non precise'}`);
    }
    if (body.comment) pieces.push(`Detail: ${clean(body.comment, 500)}`);
    return pieces.join(' | ');
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['instructor']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const instructorName = instructorNameFromSession(session);
        if (!instructorName) return response(403, { ok: false, error: 'INSTRUCTOR_NOT_FOUND' });

        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase
                .from('expenses')
                .select('id, motif, montant, date, created_at, photo_url, instructor_name')
                .eq('instructor_name', instructorName)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(30);
            if (error) throw error;
            return response(200, { ok: true, expenses: data || [] });
        }

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_JSON' });

        const amount = Number(body.amount);
        const date = clean(body.date || todayDate(), 20);
        const plate = clean(body.plate, 40);
        const kind = clean(body.kind, 40);

        if (!['fuel', 'incident'].includes(kind)) return response(400, { ok: false, error: 'INVALID_KIND' });
        if (!plate) return response(400, { ok: false, error: 'MISSING_PLATE' });
        if (!Number.isFinite(amount) || amount <= 0) return response(400, { ok: false, error: 'INVALID_AMOUNT' });
        if (!validDate(date)) return response(400, { ok: false, error: 'INVALID_DATE' });
        if (kind === 'incident' && !clean(body.incident_type, 120)) {
            return response(400, { ok: false, error: 'MISSING_INCIDENT_TYPE' });
        }

        const { data, error } = await supabase
            .from('expenses')
            .insert({
                instructor_name: instructorName,
                motif: buildMotif(body),
                montant: Number(amount.toFixed(2)),
                date,
                photo_url: clean(body.photo_url, 1000) || null
            })
            .select('id, motif, montant, date, created_at, photo_url, instructor_name')
            .single();

        if (error) throw error;
        return response(200, { ok: true, expense: data });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('instructor-expenses:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'INSTRUCTOR_EXPENSE_FAILED' });
    }
};
