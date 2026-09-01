import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readEnv() {
    const envPath = path.join(rootDir, '.env');
    if (!fs.existsSync(envPath)) return {};
    return Object.fromEntries(
        fs.readFileSync(envPath, 'utf8')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#') && line.includes('='))
            .map((line) => {
                const index = line.indexOf('=');
                const key = line.slice(0, index).trim();
                let value = line.slice(index + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                return [key, value];
            })
    );
}

function rewriteValue(value) {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(rewriteValue);
    if (typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteValue(item)]));
    }
    if (typeof value !== 'string') return value;
    return value
        .replace(/tarif-zen-auto/g, 'tarif-chill-auto')
        .replace(/tarif-zen/g, 'tarif-chill')
        .replace(/zen-auto/g, 'chill-auto')
        .replace(/\bZEN\b/g, 'CHILL')
        .replace(/\bZen\b/g, 'Chill')
        .replace(/\bzen\b/g, 'chill');
}

function hasZen(value) {
    return JSON.stringify(value ?? '').toLowerCase().includes('zen');
}

async function supabaseFetch(env, endpoint, options = {}) {
    const url = `${env.SUPABASE_URL || env.VITE_SUPABASE_URL}/rest/v1/${endpoint}`;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
    if (!url.startsWith('http') || !key) throw new Error('SUPABASE_ENV_MISSING');
    const response = await fetch(url, {
        ...options,
        headers: {
            apikey: key,
            authorization: `Bearer ${key}`,
            ...(options.body ? { 'content-type': 'application/json', prefer: 'return=representation' } : {}),
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    if (!response.ok) {
        const message = data?.message || data?.hint || text || response.statusText;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

async function updateSupabase(env) {
    const targets = {
        users: ['forfait', 'pack', 'pack_id', 'pack_label', 'selected_pack', 'formula', 'metadata'],
        inscription_notifications: ['pack', 'pack_id', 'pack_label', 'forfait', 'formula', 'metadata'],
        payments: ['pack', 'pack_id', 'pack_label', 'description', 'metadata'],
        payment_records: ['pack', 'pack_id', 'pack_label', 'description', 'metadata'],
        invoices: ['pack', 'pack_id', 'pack_label', 'description', 'metadata'],
        installment_plans: ['pack', 'pack_id', 'pack_label', 'description', 'metadata'],
        parrainages: ['filleul_pack', 'pack', 'metadata']
    };

    const summary = {};

    for (const [table, columns] of Object.entries(targets)) {
        summary[table] = { updated: 0, skipped: 0 };
        for (const column of columns) {
            let rows;
            try {
                rows = await supabaseFetch(env, `${table}?select=id,${column}`);
            } catch {
                summary[table].skipped += 1;
                continue;
            }

            for (const row of rows || []) {
                if (!row?.id || !hasZen(row[column])) continue;
                const next = rewriteValue(row[column]);
                if (JSON.stringify(next) === JSON.stringify(row[column])) continue;
                await supabaseFetch(env, `${table}?id=eq.${encodeURIComponent(row.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ [column]: next })
                });
                summary[table].updated += 1;
            }
        }
    }

    return summary;
}

async function stripeRequest(env, endpoint, options = {}) {
    const key = env.STRIPE_SECRET_KEY || env.STRIPE_API_KEY;
    if (!key) throw new Error('STRIPE_ENV_MISSING');
    const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
        ...options,
        headers: {
            authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
            ...(options.body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
            ...(options.headers || {})
        }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || response.statusText);
    return data;
}

function encodeForm(fields) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
        if (value != null) params.set(key, String(value));
    }
    return params;
}

function changedMetadata(metadata = {}) {
    const next = {};
    let changed = false;
    for (const [key, value] of Object.entries(metadata)) {
        const rewritten = rewriteValue(value);
        next[`metadata[${key}]`] = rewritten;
        if (rewritten !== value) changed = true;
    }
    return changed ? next : {};
}

async function updateStripe(env) {
    const summary = { products: 0, prices: 0 };
    try {
        let startingAfter = null;
        do {
            const params = new URLSearchParams({ limit: '100' });
            if (startingAfter) params.set('starting_after', startingAfter);
            const page = await stripeRequest(env, `products?${params}`);
            for (const product of page.data || []) {
                const fields = {
                    ...changedMetadata(product.metadata),
                    ...(hasZen(product.name) ? { name: rewriteValue(product.name) } : {}),
                    ...(hasZen(product.description) ? { description: rewriteValue(product.description) } : {})
                };
                if (Object.keys(fields).length) {
                    await stripeRequest(env, `products/${product.id}`, {
                        method: 'POST',
                        body: encodeForm(fields)
                    });
                    summary.products += 1;
                }
            }
            startingAfter = page.has_more ? page.data.at(-1)?.id : null;
        } while (startingAfter);

        startingAfter = null;
        do {
            const params = new URLSearchParams({ limit: '100' });
            if (startingAfter) params.set('starting_after', startingAfter);
            const page = await stripeRequest(env, `prices?${params}`);
            for (const price of page.data || []) {
                const fields = {
                    ...changedMetadata(price.metadata),
                    ...(hasZen(price.nickname) ? { nickname: rewriteValue(price.nickname) } : {})
                };
                if (Object.keys(fields).length) {
                    await stripeRequest(env, `prices/${price.id}`, {
                        method: 'POST',
                        body: encodeForm(fields)
                    });
                    summary.prices += 1;
                }
            }
            startingAfter = page.has_more ? page.data.at(-1)?.id : null;
        } while (startingAfter);
    } catch (error) {
        summary.error = error.message;
    }
    return summary;
}

const env = { ...process.env, ...readEnv() };
const supabase = await updateSupabase(env);
const stripe = await updateStripe(env);
console.log(JSON.stringify({ supabase, stripe }, null, 2));
