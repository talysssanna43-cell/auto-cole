const {
    assertSessionActive,
    getBearerToken,
    getSupabaseAdmin,
    verifySession
} = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, max = 120) {
    return String(value || '').trim().slice(0, max);
}

async function requireAdmin(event) {
    const session = verifySession(getBearerToken(event), ['admin']);
    const supabase = getSupabaseAdmin();
    await assertSessionActive(session, supabase);
    return { session, supabase };
}

function tableFor(resource) {
    return {
        support: 'support_tickets',
        reviews: 'reviews',
        contact: 'contact_requests',
        code: 'inscription_notifications'
    }[resource] || '';
}

async function listRows(supabase, resource) {
    if (resource === 'support') {
        return supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });
    }

    if (resource === 'reviews') {
        return supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
    }

    if (resource === 'contact') {
        return supabase
            .from('contact_requests')
            .select('*')
            .order('created_at', { ascending: false });
    }

    if (resource === 'code') {
        return supabase
            .from('inscription_notifications')
            .select('*')
            .eq('pack', 'code')
            .order('created_at', { ascending: false });
    }

    throw new Error('INVALID_RESOURCE');
}

async function updateRow(supabase, resource, id, body) {
    const table = tableFor(resource);
    if (!table || !id) throw new Error('INVALID_REQUEST');

    if (resource === 'support') {
        const status = ['pending', 'resolved'].includes(body.status) ? body.status : null;
        if (!status) throw new Error('INVALID_STATUS');
        return supabase
            .from(table)
            .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
            .eq('id', id)
            .select()
            .maybeSingle();
    }

    if (resource === 'reviews') {
        const status = ['pending', 'published', 'rejected'].includes(body.status) ? body.status : null;
        if (!status) throw new Error('INVALID_STATUS');
        return supabase
            .from(table)
            .update({ status })
            .eq('id', id)
            .select()
            .maybeSingle();
    }

    if (resource === 'contact') {
        const status = ['nouveau', 'en_cours', 'resolu'].includes(body.status) ? body.status : null;
        if (!status) throw new Error('INVALID_STATUS');
        const result = await supabase
            .from(table)
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (!result.error || !String(result.error.message || '').toLowerCase().includes('updated_at')) {
            return result;
        }

        return supabase
            .from(table)
            .update({ status })
            .eq('id', id)
            .select()
            .maybeSingle();
    }

    if (resource === 'code') {
        return supabase
            .from(table)
            .update({ vu: body.vu === true })
            .eq('id', id)
            .select()
            .maybeSingle();
    }

    throw new Error('INVALID_RESOURCE');
}

async function deleteRow(supabase, resource, id) {
    const table = tableFor(resource);
    if (!table || !id || resource === 'code') throw new Error('INVALID_REQUEST');
    return supabase.from(table).delete().eq('id', id);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;

    try {
        const { supabase } = await requireAdmin(event);
        const params = event.queryStringParameters || {};
        const resource = clean(params.resource, 30);

        if (event.httpMethod === 'GET') {
            const { data, error } = await listRows(supabase, resource);
            if (error) throw error;
            return response(200, { ok: true, items: data || [] });
        }

        if (event.httpMethod === 'POST') {
            const body = parseJsonBody(event);
            if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });
            const action = clean(body.action, 30);
            const id = clean(body.id, 80);

            if (action === 'update') {
                const { data, error } = await updateRow(supabase, resource, id, body);
                if (error) throw error;
                return response(200, { ok: true, item: data || null });
            }

            if (action === 'delete') {
                const { error } = await deleteRow(supabase, resource, id);
                if (error) throw error;
                return response(200, { ok: true });
            }

            return response(400, { ok: false, error: 'INVALID_ACTION' });
        }

        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-page-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ADMIN_PAGE_DATA_FAILED' });
    }
};
