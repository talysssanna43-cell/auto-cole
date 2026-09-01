const seoConfig = require('../../seo/pages.json');
const { getSupabaseAdmin } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

const allowedPaths = new Set(seoConfig.pages.map((page) => page.path));

function isMissingTable(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === '42P01' || error?.code === 'PGRST205' || message.includes('site_seo_settings');
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    const pagePath = String(event.queryStringParameters?.page || '').trim();
    if (!allowedPaths.has(pagePath)) return response(400, { ok: false, error: 'INVALID_PAGE' });

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('site_seo_settings')
            .select('page_path,title,description,h1,updated_at')
            .eq('page_path', pagePath)
            .maybeSingle();
        if (error) {
            if (isMissingTable(error)) return response(200, { ok: true, setting: null });
            throw error;
        }
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
            },
            body: JSON.stringify({ ok: true, setting: data || null })
        };
    } catch (error) {
        console.error('public-seo-settings:', error.message);
        return response(200, { ok: true, setting: null });
    }
};
