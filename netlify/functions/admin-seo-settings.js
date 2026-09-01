const seoConfig = require('../../seo/pages.json');
const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const allowedPaths = new Set(seoConfig.pages.map((page) => page.path));

function cleanText(value, max) {
    return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function isMissingTable(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('site_seo_settings');
}

async function triggerBuild() {
    const hook = String(process.env.NETLIFY_BUILD_HOOK_URL || '').trim();
    if (!hook || !/^https:\/\/api\.netlify\.com\/build_hooks\//i.test(hook)) return false;
    const result = await fetch(hook, { method: 'POST' });
    return result.ok;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST', 'DELETE'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (event.httpMethod === 'GET') {
            const { data, error } = await supabase
                .from('site_seo_settings')
                .select('page_path,title,description,h1,updated_at,updated_by')
                .order('page_path');
            if (error) {
                if (isMissingTable(error)) return response(424, { ok: false, error: 'SEO_SETTINGS_TABLE_MISSING' });
                throw error;
            }
            return response(200, { ok: true, settings: data || [] });
        }

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_JSON' });
        const pagePath = String(body.page_path || '').trim();
        if (!allowedPaths.has(pagePath)) return response(400, { ok: false, error: 'INVALID_PAGE' });

        if (event.httpMethod === 'DELETE') {
            const { error } = await supabase.from('site_seo_settings').delete().eq('page_path', pagePath);
            if (error) {
                if (isMissingTable(error)) return response(424, { ok: false, error: 'SEO_SETTINGS_TABLE_MISSING' });
                throw error;
            }
            return response(200, { ok: true, reset: true });
        }

        const payload = {
            page_path: pagePath,
            title: cleanText(body.title, 70),
            description: cleanText(body.description, 180),
            h1: cleanText(body.h1, 140),
            updated_at: new Date().toISOString(),
            updated_by: session.email || null
        };
        if (payload.title.length < 20 || payload.description.length < 80 || payload.h1.length < 10) {
            return response(400, { ok: false, error: 'INVALID_SEO_CONTENT' });
        }

        const { data, error } = await supabase
            .from('site_seo_settings')
            .upsert(payload, { onConflict: 'page_path' })
            .select('page_path,title,description,h1,updated_at,updated_by')
            .single();
        if (error) {
            if (isMissingTable(error)) return response(424, { ok: false, error: 'SEO_SETTINGS_TABLE_MISSING' });
            throw error;
        }

        let buildTriggered = false;
        try {
            buildTriggered = await triggerBuild();
        } catch (buildError) {
            console.error('admin-seo-settings build hook:', buildError.message);
        }
        return response(200, { ok: true, setting: data, buildTriggered });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-seo-settings:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'SEO_SETTINGS_FAILED' });
    }
};
