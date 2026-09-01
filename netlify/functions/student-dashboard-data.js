const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isCourseBasedPack(value) {
    return String(value || '').toLowerCase().trim().startsWith('tarif-');
}

function inferLessonUnitMinutes(user) {
    const explicit = Number(user?.lesson_unit_minutes || 0);
    if (explicit === 45 || explicit === 120) return explicit;
    return isCourseBasedPack(user?.forfait || user?.pack) ? 45 : 120;
}

function durationHours(slot) {
    if (!slot?.start_at || !slot?.end_at) return 0;
    const start = new Date(slot.start_at);
    const end = new Date(slot.end_at);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function effectiveStatus(reservation, nowMs = Date.now()) {
    const status = reservation.status || 'upcoming';
    const endMs = reservation.slots?.end_at ? new Date(reservation.slots.end_at).getTime() : 0;
    if (status === 'upcoming' && endMs && endMs < nowMs) return 'done';
    return status;
}

function sessionFromReservation(reservation) {
    const slot = reservation.slots;
    if (!slot?.start_at || !slot?.end_at) return null;
    const startAt = new Date(slot.start_at);
    const endAt = new Date(slot.end_at);
    return {
        id: reservation.id,
        date: slot.start_at.split('T')[0],
        start_time: startAt.toTimeString().slice(0, 5),
        end_time: endAt.toTimeString().slice(0, 5),
        duration_hours: durationHours(slot),
        instructor: slot.instructor || 'Moniteur',
        status: effectiveStatus(reservation),
        notes: reservation.notes || '',
        slot_id: reservation.slot_id || null
    };
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student', 'admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const requestedEmail = normalizeEmail(event.queryStringParameters?.email);
        const email = session.app_role === 'admin' && requestedEmail ? requestedEmail : normalizeEmail(session.email);
        if (!email) return response(400, { ok: false, error: 'EMAIL_REQUIRED' });

        let { data: user, error: userError } = await supabase
            .from('users')
            .select('id,prenom,nom,email,telephone,forfait,hours_goal,hours_completed_initial,transmission_type,lesson_unit_minutes')
            .ilike('email', email)
            .maybeSingle();
        if (userError && /lesson_unit_minutes|schema cache|column/i.test(String(userError.message || userError.details || ''))) {
            const fallback = await supabase
                .from('users')
                .select('id,prenom,nom,email,telephone,forfait,hours_goal,hours_completed_initial,transmission_type')
                .ilike('email', email)
                .maybeSingle();
            user = fallback.data;
            userError = fallback.error;
        }
        if (userError) throw userError;
        if (!user) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });
        user.lesson_unit_minutes = inferLessonUnitMinutes(user);

        const { data: reservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('id,email,status,notes,slot_id,slots(start_at,end_at,instructor)')
            .ilike('email', email)
            .order('created_at', { ascending: false });
        if (reservationsError) throw reservationsError;

        const sessions = (reservations || [])
            .map(sessionFromReservation)
            .filter(Boolean)
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.start_time}:00`).getTime();
                const dateB = new Date(`${b.date}T${b.start_time}:00`).getTime();
                return dateB - dateA;
            });

        const unitHours = user.lesson_unit_minutes === 45 ? 0.75 : 1;
        const toUnits = (hours) => Math.max(0, Math.round((Number(hours) || 0) / unitHours));
        const completedHours = sessions
            .filter((item) => ['done', 'completed'].includes(item.status))
            .reduce((sum, item) => sum + toUnits(item.duration_hours), 0);
        const reservedHours = sessions
            .filter((item) => ['upcoming', 'pending'].includes(item.status))
            .reduce((sum, item) => sum + toUnits(item.duration_hours), 0);
        const initialCompletedHours = Math.max(Number(user.hours_completed_initial || 0), 0);
        const hoursGoal = Math.max(Number(user.hours_goal || 0), 0);
        const remainingHours = Math.max(hoursGoal - initialCompletedHours - completedHours - reservedHours, 0);

        return response(200, {
            ok: true,
            user,
            sessions,
            totals: {
                hours_goal: hoursGoal,
                hours_completed_initial: initialCompletedHours,
                completed_hours: completedHours,
                reserved_hours: reservedHours,
                remaining_hours: remainingHours,
                session_count: sessions.length
            }
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-dashboard-data:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'STUDENT_DASHBOARD_FAILED' });
    }
};
