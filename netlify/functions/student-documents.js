const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { sanitizeDocuments } = require('./_lib/documents');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function parseDocuments(value) {
    if (!value) return {};
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function countPendingDocuments(documents) {
    return Object.values(documents || {}).filter((document) => {
        const status = String(document?.status || '').toLowerCase();
        return status === 'pending' || (!status && Boolean(document?.data || document?.name));
    }).length;
}

function expectedDocumentKeys(user = {}) {
    const invalidated = String(user.permis_invalide || '').toLowerCase() === 'oui';
    const heberge = String(user.is_heberge || '').toLowerCase() === 'oui';
    const keys = invalidated
        ? ['pieceIdentite', 'ephoto']
        : ['pieceIdentite', 'assr', 'jdc', 'justifDomicile', 'ephoto'];
    if (heberge) keys.push('certifHebergement', 'pieceHebergeur');

    if (user.date_nais) {
        const birth = new Date(`${String(user.date_nais).slice(0, 10)}T00:00:00`);
        if (!Number.isNaN(birth.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
            if (age < 18) keys.push('pieceIdentiteParent');
        }
    }
    return [...new Set(keys)];
}

async function loadStudent(supabase, email) {
    let { data, error } = await supabase
        .from('users')
        .select('id,email,prenom,nom,documents,date_nais,is_heberge,permis_invalide')
        .ilike('email', email)
        .maybeSingle();
    if (error && /is_heberge|permis_invalide|schema cache|column/i.test(String(error.message || error.details || ''))) {
        const fallback = await supabase
            .from('users')
            .select('id,email,prenom,nom,documents,date_nais')
            .ilike('email', email)
            .maybeSingle();
        data = fallback.data;
        error = fallback.error;
    }
    if (error) throw error;
    return data;
}

async function updateLatestNotification(supabase, email, documents) {
    const { data, error } = await supabase
        .from('inscription_notifications')
        .select('id')
        .ilike('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    if (!data?.id) return;

    let { error: updateError } = await supabase
        .from('inscription_notifications')
        .update({ documents, documents_count: countPendingDocuments(documents) })
        .eq('id', data.id);
    if (updateError && /documents_count|schema cache|column/i.test(String(updateError.message || updateError.details || ''))) {
        const fallback = await supabase
            .from('inscription_notifications')
            .update({ documents })
            .eq('id', data.id);
        updateError = fallback.error;
    }
    if (updateError) throw updateError;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const supabase = getSupabaseAdmin();
        const session = await assertSessionActive(verifySession(getBearerToken(event), ['student', 'admin']), supabase);
        const requestedEmail = normalizeEmail(event.queryStringParameters?.email);
        const email = session.app_role === 'admin' && requestedEmail ? requestedEmail : normalizeEmail(session.email);
        if (!email) return response(400, { ok: false, error: 'EMAIL_REQUIRED' });

        const student = await loadStudent(supabase, email);
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const documents = parseDocuments(student.documents);
        if (event.httpMethod === 'GET') {
            return response(200, {
                ok: true,
                expected: expectedDocumentKeys(student),
                documents
            });
        }

        const body = parseJsonBody(event) || {};
        const documentKey = String(body.documentKey || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
        const safe = sanitizeDocuments({ [documentKey]: body.document }, { maxDocuments: 1 });
        if (!documentKey || !safe?.[documentKey]) {
            return response(400, { ok: false, error: 'INVALID_DOCUMENT' });
        }

        const nextDocuments = {
            ...documents,
            [documentKey]: {
                ...safe[documentKey],
                status: 'pending',
                admin_comment: '',
                uploaded_by: session.email,
                uploaded_at: new Date().toISOString()
            }
        };

        const { error } = await supabase
            .from('users')
            .update({ documents: nextDocuments })
            .ilike('email', email);
        if (error) throw error;

        await updateLatestNotification(supabase, email, nextDocuments);
        return response(200, { ok: true, expected: expectedDocumentKeys(student), documents: nextDocuments });
    } catch (error) {
        console.error('student-documents:', error.message);
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        return response(authErrors.includes(error.message) ? 401 : 500, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : 'STUDENT_DOCUMENTS_FAILED'
        });
    }
};
