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

async function fetchAll(buildQuery, maxRows = 3000) {
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

async function loadInstructors(supabase) {
    let instructors;
    try {
        instructors = await fetchAll(() => supabase
            .from('instructors')
            .select('id,prenom,nom,email,telephone,is_active,visible_to_students,gender,work_schedule,custom_schedule')
            .eq('is_active', true)
            .eq('visible_to_students', true)
            .order('prenom', { ascending: true }));
    } catch (error) {
        const message = String(error?.message || error?.details || '');
        if (!/work_schedule|custom_schedule|schema cache|column/i.test(message)) throw error;
        instructors = await fetchAll(() => supabase
            .from('instructors')
            .select('id,prenom,nom,email,telephone,is_active,visible_to_students,gender')
            .eq('is_active', true)
            .eq('visible_to_students', true)
            .order('prenom', { ascending: true }));
    }

    const bonuses = await fetchAll(() => supabase
        .from('instructor_bonuses')
        .select('instructor')
        .eq('status', 'active'));

    return { instructors, bonuses };
}

async function loadBookedSlots(supabase, params, studentEmail) {
    const instructor = text(params?.instructor, 120);
    if (!instructor) return { items: [], totals: { reservations: 0, blocked: 0 } };

    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - defaultStart.getDay() + 1);
    defaultStart.setHours(0, 0, 0, 0);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultEnd.getDate() + 7);

    const start = parseDate(params?.start, defaultStart.toISOString());
    const end = clampWeekRange(start, parseDate(params?.end, defaultEnd.toISOString()));
    end.setHours(23, 59, 59, 999);

    const slots = await fetchAll(() => supabase
        .from('slots')
        .select('id,start_at,end_at,status,instructor,notes')
        .eq('instructor', instructor)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .in('status', ['booked', 'permis', 'indisponible'])
        .order('start_at', { ascending: true }));

    const slotIds = slots.map((slot) => slot.id).filter(Boolean);
    let reservations = [];
    if (slotIds.length) {
        reservations = await fetchAll(() => supabase
            .from('reservations')
            .select('slot_id,email,status')
            .in('slot_id', slotIds)
            .in('status', ['upcoming', 'completed', 'done', 'booked']));
    }

    const reservationBySlot = new Map();
    reservations.forEach((reservation) => {
        if (reservation.slot_id) reservationBySlot.set(reservation.slot_id, reservation);
    });

    const items = slots
        .filter((slot) => {
            if (slot.status === 'booked') {
                const reservation = reservationBySlot.get(slot.id);
                return reservation && String(reservation.email || '').toLowerCase() !== studentEmail;
            }
            return true;
        })
        .map((slot) => ({
            id: slot.id,
            start_at: slot.start_at,
            end_at: slot.end_at,
            instructor: slot.instructor,
            status: slot.status,
            notes: slot.notes || ''
        }));

    return {
        range: { start: start.toISOString(), end: end.toISOString() },
        items,
        totals: { reservations: reservations.length, blocked: items.length }
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const params = event.queryStringParameters || {};
        const type = text(params.type, 80);

        if (type === 'instructors') {
            const data = await loadInstructors(supabase);
            return response(200, { ok: true, ...data });
        }

        if (type === 'booked-slots') {
            const data = await loadBookedSlots(supabase, params, String(session.email || '').toLowerCase());
            return response(200, { ok: true, ...data });
        }

        return response(400, { ok: false, error: 'INVALID_TYPE' });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-planning-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'STUDENT_PLANNING_DATA_FAILED' });
    }
};
