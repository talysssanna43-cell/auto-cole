const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').trim().slice(0, max);
}

function parseDate(value, fallback) {
    const date = new Date(value || fallback);
    return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

function clampWeekRange(start, end) {
    const maxSpanMs = 1000 * 60 * 60 * 24 * 10;
    if (end.getTime() <= start.getTime()) {
        const next = new Date(start);
        next.setDate(next.getDate() + 7);
        return next;
    }
    if (end.getTime() - start.getTime() > maxSpanMs) {
        const next = new Date(start);
        next.setTime(start.getTime() + maxSpanMs);
        return next;
    }
    return end;
}

async function fetchAll(buildQuery, maxRows = 5000) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; from < maxRows; from += pageSize) {
        const { data, error } = await buildQuery().range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < pageSize) break;
    }
    return rows;
}

function firstReservation(slot) {
    return Array.isArray(slot.reservations) ? slot.reservations[0] : slot.reservations;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['instructor']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const email = String(session.email || '').toLowerCase();
        const { data: instructorRow, error: instructorError } = await supabase
            .from('instructors')
            .select('id,prenom,nom,email,is_active')
            .ilike('email', email)
            .maybeSingle();
        if (instructorError) throw instructorError;
        if (!instructorRow || instructorRow.is_active === false) {
            return response(403, { ok: false, error: 'ACCOUNT_DISABLED' });
        }

        const now = new Date();
        const defaultStart = new Date(now);
        defaultStart.setDate(defaultStart.getDate() - defaultStart.getDay() + 1);
        defaultStart.setHours(0, 0, 0, 0);
        const defaultEnd = new Date(defaultStart);
        defaultEnd.setDate(defaultEnd.getDate() + 7);

        const params = event.queryStringParameters || {};
        const start = parseDate(params.start, defaultStart.toISOString());
        const end = clampWeekRange(start, parseDate(params.end, defaultEnd.toISOString()));
        end.setHours(23, 59, 59, 999);

        const instructorNames = Array.from(new Set([
            instructorRow.prenom,
            `${instructorRow.prenom || ''} ${instructorRow.nom || ''}`.trim(),
            text(params.instructor, 120)
        ].filter(Boolean)));

        const slots = await fetchAll(() => supabase
            .from('slots')
            .select('id,start_at,end_at,status,notes,instructor,instructor_id,reservations(id,email,first_name,last_name,phone,status)')
            .in('instructor', instructorNames)
            .gte('start_at', start.toISOString())
            .lte('start_at', end.toISOString())
            .order('start_at', { ascending: true }));

        const visibleSlots = (slots || []).filter((slot) => {
            if (slot.status === 'permis' || slot.status === 'indisponible') return true;
            if (slot.status !== 'booked') return false;
            const reservation = firstReservation(slot);
            return Boolean(reservation?.id);
        });

        const emails = Array.from(new Set(
            visibleSlots
                .map((slot) => firstReservation(slot)?.email)
                .filter(Boolean)
                .map((value) => String(value).toLowerCase())
        ));

        const packMap = new Map();
        const transmissionMap = new Map();
        if (emails.length) {
            const inscriptions = await fetchAll(() => supabase
                .from('inscription_notifications')
                .select('user_email,pack,transmission_type,created_at')
                .in('user_email', emails)
                .order('created_at', { ascending: false }));
            inscriptions.forEach((inscription) => {
                const studentEmail = String(inscription.user_email || '').toLowerCase();
                if (!studentEmail || packMap.has(studentEmail)) return;
                packMap.set(studentEmail, inscription.pack || '');
                transmissionMap.set(studentEmail, inscription.transmission_type || null);
            });

            const users = await fetchAll(() => supabase
                .from('users')
                .select('email,forfait,transmission_type')
                .in('email', emails));
            users.forEach((user) => {
                const studentEmail = String(user.email || '').toLowerCase();
                if (!studentEmail) return;
                if (user.forfait && !packMap.has(studentEmail)) packMap.set(studentEmail, user.forfait);
                if (user.transmission_type) transmissionMap.set(studentEmail, user.transmission_type);
            });
        }

        const items = visibleSlots.map((slot) => {
            const reservation = firstReservation(slot);
            const studentEmail = String(reservation?.email || '').toLowerCase();
            return {
                ...slot,
                pack: studentEmail ? packMap.get(studentEmail) || null : null,
                transmission_type: studentEmail ? transmissionMap.get(studentEmail) || null : null
            };
        });

        return response(200, {
            ok: true,
            instructor: instructorRow.prenom,
            range: { start: start.toISOString(), end: end.toISOString() },
            slots: items
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('instructor-planning-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'INSTRUCTOR_PLANNING_FAILED' });
    }
};
