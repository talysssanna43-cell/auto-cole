const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

function parseDate(value, fallback) {
    const date = new Date(value || fallback);
    return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function clampRange(start, end) {
    const maxSpanMs = 1000 * 60 * 60 * 24 * 370;
    if (end.getTime() <= start.getTime()) {
        const next = new Date(start);
        next.setFullYear(next.getFullYear() + 1);
        return next;
    }
    if (end.getTime() - start.getTime() > maxSpanMs) {
        const next = new Date(start);
        next.setTime(start.getTime() + maxSpanMs);
        return next;
    }
    return end;
}

async function fetchAll(buildQuery) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; from < 10000; from += pageSize) {
        const { data, error } = await buildQuery().range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

function fallbackPaymentMethod(row) {
    return row.payment_method || 'card';
}

function amountForPack(row) {
    const packPrices = {
        code: 20,
        am: 350,
        aac: 889,
        'boite-auto': 499,
        supervisee: 889,
        chill: 649,
        premium: 749,
        accelere: 899,
        '20h': 649,
        'tarif-chill-20': 649,
        'tarif-premium-20': 749,
        'tarif-accelere-20': 899,
        'tarif-chill-auto-13': 499,
        'tarif-premium-auto-13': 599,
        'tarif-accelere-auto-13': 749,
        'tarif-aac-20': 889,
        'tarif-supervisee-20': 889,
        'tarif-aac-auto-13': 639,
        'tarif-supervisee-auto-13': 639,
        'heure-conduite-manual': 90,
        'heure-conduite-auto': 100,
        'second-chance': 569
    };
    if (row.pack === 'heures-conduite' && !row.amount_paid) return 0;
    return Number(row.amount_paid || packPrices[row.pack] || 0);
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), 0, 1).toISOString();
        const defaultEnd = new Date(now.getFullYear() + 1, 0, 1).toISOString();
        const rangeStart = parseDate(event.queryStringParameters?.start, defaultStart);
        const rangeEnd = clampRange(rangeStart, parseDate(event.queryStringParameters?.end, defaultEnd));

        const startIso = rangeStart.toISOString();
        const endIso = rangeEnd.toISOString();

        const notifications = await fetchAll(() => supabase
            .from('inscription_notifications')
            .select('id, created_at, user_email, pack, status, hours_purchased, amount_paid, payment_method')
            .gte('created_at', startIso)
            .lt('created_at', endIso)
            .order('created_at', { ascending: true }));

        const slots = await fetchAll(() => supabase
            .from('slots')
            .select('id, start_at, end_at, status, reservations(email)')
            .eq('status', 'booked')
            .gte('start_at', startIso)
            .lt('start_at', endIso)
            .order('start_at', { ascending: true }));

        const nowMs = Date.now();
        const doneSlots = slots
            .filter((slot) => {
                const startMs = new Date(slot.start_at).getTime();
                return Number.isFinite(startMs) && startMs < nowMs;
            })
            .map((slot) => {
                const reservations = Array.isArray(slot.reservations) ? slot.reservations : [];
                return {
                    ...slot,
                    user_email: reservations[0]?.email || null
                };
            });

        const emailToPack = {};
        notifications.forEach((item) => {
            if (item.user_email) emailToPack[String(item.user_email).toLowerCase()] = item.pack;
        });

        const signups = notifications.filter((item) => item.status === 'approved');
        const payments = notifications.map((item) => ({
            ...item,
            amount_eur: amountForPack(item),
            payment_method: fallbackPaymentMethod(item)
        }));
        const codeRousseauPayments = notifications
            .filter((item) => item.pack === 'code')
            .map((item) => ({
                ...item,
                montant: Number(item.amount_paid || 20)
            }));

        return response(200, {
            ok: true,
            range: { start: startIso, end: endIso },
            signups,
            payments,
            doneSlots: doneSlots.map((slot) => ({
                ...slot,
                pack: emailToPack[String(slot.user_email || '').toLowerCase()] || 'unknown'
            })),
            codeRousseauPayments,
            totals: {
                signups: signups.length,
                notifications: notifications.length,
                payments: payments.length,
                doneSlots: doneSlots.length
            }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-analytics-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'ANALYTICS_LOAD_FAILED' });
    }
};
