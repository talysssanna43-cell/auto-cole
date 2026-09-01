const {
    assertSessionActive,
    getBearerToken,
    getSupabaseAdmin,
    verifySession
} = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const ALLOWED_STATUS = new Set(['accepted', 'rejected', 'pending']);

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function parseDocuments(value) {
    if (!value) return {};
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
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

async function updateDocumentRow({ supabase, table, idColumn, idValue, documents, extra = {} }) {
    const { error } = await supabase
        .from(table)
        .update({ documents, ...extra })
        .eq(idColumn, idValue);
    if (error) throw error;
}

async function syncUserDocumentStatus(supabase, userEmail, documentKey, nextDocument) {
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('email,documents')
        .ilike('email', userEmail)
        .limit(1)
        .maybeSingle();
    if (fetchError) throw fetchError;
    if (!user?.email) return;

    const userDocuments = parseDocuments(user.documents);
    if (!userDocuments[documentKey]) return;

    userDocuments[documentKey] = {
        ...userDocuments[documentKey],
        ...nextDocument
    };

    await updateDocumentRow({
        supabase,
        table: 'users',
        idColumn: 'email',
        idValue: user.email,
        documents: userDocuments
    });
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const supabase = getSupabaseAdmin();
        const session = await assertSessionActive(verifySession(getBearerToken(event), ['admin']), supabase);
        const body = parseJsonBody(event) || {};
        const userEmail = normalizeEmail(body.userEmail);
        const documentKey = String(body.documentKey || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
        const status = String(body.status || '').toLowerCase();
        const comment = String(body.comment || '').trim().slice(0, 800);

        if (!userEmail || !documentKey || !ALLOWED_STATUS.has(status)) {
            return response(400, { ok: false, error: 'INVALID_REQUEST' });
        }
        if (status === 'rejected' && !comment) {
            return response(400, { ok: false, error: 'COMMENT_REQUIRED' });
        }

        const { data: notification, error: notificationError } = await supabase
            .from('inscription_notifications')
            .select('id,documents')
            .ilike('user_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (notificationError) throw notificationError;

        let documents = parseDocuments(notification?.documents);
        if (documents[documentKey]) {
            const nextDocument = {
                ...documents[documentKey],
                status,
                admin_comment: status === 'rejected' ? comment : '',
                reviewed_by: session.email,
                reviewed_at: new Date().toISOString()
            };
            documents[documentKey] = nextDocument;
            await updateDocumentRow({
                supabase,
                table: 'inscription_notifications',
                idColumn: 'id',
                idValue: notification.id,
                documents,
                extra: { documents_count: countPendingDocuments(documents) }
            });
            await syncUserDocumentStatus(supabase, userEmail, documentKey, nextDocument);
            return response(200, { ok: true });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email,documents')
            .ilike('email', userEmail)
            .maybeSingle();
        if (userError) throw userError;

        documents = parseDocuments(user?.documents);
        if (!documents[documentKey]) {
            return response(404, { ok: false, error: 'DOCUMENT_NOT_FOUND' });
        }

        documents[documentKey] = {
            ...documents[documentKey],
            status,
            admin_comment: status === 'rejected' ? comment : '',
            reviewed_by: session.email,
            reviewed_at: new Date().toISOString()
        };
        await updateDocumentRow({
            supabase,
            table: 'users',
            idColumn: 'email',
            idValue: user.email,
            documents
        });

        return response(200, { ok: true });
    } catch (error) {
        console.error('admin-document-status:', error.message);
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        return response(authErrors.includes(error.message) ? 401 : 500, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : 'DOCUMENT_STATUS_FAILED'
        });
    }
};
