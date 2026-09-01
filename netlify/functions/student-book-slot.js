const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function parseIsoDate(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return null;
    return date;
}

function isSundayInParis(date) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris',
        weekday: 'short'
    }).format(date) === 'Sun';
}

function isCourseBasedPack(value) {
    return String(value || '').toLowerCase().trim().startsWith('tarif-');
}

function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

const LEGACY_INSTRUCTORS = new Set(['mylene', 'sammy', 'nail', 'daho']);

function inferLessonUnitMinutes(user) {
    const explicit = Number(user?.lesson_unit_minutes || 0);
    if (explicit === 45 || explicit === 120) return explicit;
    return isCourseBasedPack(user?.forfait || user?.pack) ? 45 : 120;
}

function durationHours(slot) {
    if (!slot?.start_at || !slot?.end_at) return 0;
    const start = new Date(slot.start_at);
    const end = new Date(slot.end_at);
    const hours = (end.getTime() - start.getTime()) / 3600000;
    return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function validDuration(startAt, endAt, lessonUnitMinutes) {
    const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 135) return false;
    if (lessonUnitMinutes === 45) return minutes === 45 || minutes === 90;
    return minutes === 60 || minutes === 120;
}

function isNailNewPackSlot(instructor, startAt, endAt) {
    if (normalize(instructor) !== 'nail') return false;
    const day = startAt.getDay();
    const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
    const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
    return day >= 1 && day <= 5
        && (startMinutes === (15 * 60) || startMinutes === ((15 * 60) + 45))
        && minutes === 45;
}

function isBookingAllowedForLessonFormat(instructor, startAt, endAt, lessonUnitMinutes) {
    const instructorKey = normalize(instructor);
    const isLegacyInstructor = LEGACY_INSTRUCTORS.has(instructorKey);
    const specialNailSlot = isNailNewPackSlot(instructor, startAt, endAt);
    if (lessonUnitMinutes === 45) return !isLegacyInstructor || specialNailSlot;
    if (specialNailSlot) return false;
    return isLegacyInstructor;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const studentEmail = String(session.email || '').trim().toLowerCase();
        const startAt = parseIsoDate(body.start_at);
        const endAt = parseIsoDate(body.end_at);
        const instructor = text(body.instructor, 120);
        if (!studentEmail || !startAt || !endAt || !instructor) {
            return response(400, { ok: false, error: 'INVALID_SLOT_DATA' });
        }
        if (isSundayInParis(startAt)) {
            return response(409, { ok: false, error: 'SUNDAY_CLOSED' });
        }

        let { data: user, error: userError } = await supabase
            .from('users')
            .select('id,prenom,nom,email,telephone,forfait,hours_goal,hours_completed_initial,lesson_unit_minutes')
            .ilike('email', studentEmail)
            .maybeSingle();
        if (userError && /lesson_unit_minutes|schema cache|column/i.test(String(userError.message || userError.details || ''))) {
            const fallback = await supabase
                .from('users')
                .select('id,prenom,nom,email,telephone,forfait,hours_goal,hours_completed_initial')
                .ilike('email', studentEmail)
                .maybeSingle();
            user = fallback.data;
            userError = fallback.error;
        }
        if (userError) throw userError;
        if (!user) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const lessonUnitMinutes = inferLessonUnitMinutes(user);
        if (!validDuration(startAt, endAt, lessonUnitMinutes)) {
            return response(400, { ok: false, error: 'INVALID_SLOT_DURATION' });
        }
        if (!isBookingAllowedForLessonFormat(instructor, startAt, endAt, lessonUnitMinutes)) {
            return response(409, { ok: false, error: 'INCOMPATIBLE_PLANNING_MODE' });
        }

        const { data: overlap, error: overlapError } = await supabase
            .from('reservations')
            .select('id,slots!inner(start_at,end_at)')
            .ilike('email', studentEmail)
            .in('status', ['upcoming', 'booked'])
            .lt('slots.start_at', endAt.toISOString())
            .gt('slots.end_at', startAt.toISOString())
            .limit(1);
        if (overlapError) throw overlapError;
        if (overlap?.length) return response(409, { ok: false, error: 'STUDENT_TIME_CONFLICT' });

        const { data: reservations, error: reservationsError } = await supabase
            .from('reservations')
            .select('status,slots(start_at,end_at)')
            .ilike('email', studentEmail)
            .in('status', ['upcoming', 'booked', 'done', 'completed']);
        if (reservationsError) throw reservationsError;

        const unitHours = lessonUnitMinutes === 45 ? 0.75 : 1;
        const toUnits = (hours) => Math.max(0, Math.round((Number(hours) || 0) / unitHours));
        const usedUnits = (reservations || []).reduce((sum, reservation) => {
            return sum + toUnits(durationHours(reservation.slots));
        }, Math.max(Number(user.hours_completed_initial || 0), 0));
        const requestedUnits = toUnits((endAt.getTime() - startAt.getTime()) / 3600000);
        const goal = Math.max(Number(user.hours_goal || 0), 0);
        if (goal <= 0 || usedUnits + requestedUnits > goal) {
            return response(409, { ok: false, error: 'INSUFFICIENT_BALANCE' });
        }

        const { data: existingSlots, error: slotLookupError } = await supabase
            .from('slots')
            .select('id,status,start_at,end_at')
            .eq('instructor', instructor)
            .lt('start_at', endAt.toISOString())
            .gt('end_at', startAt.toISOString());
        if (slotLookupError) throw slotLookupError;

        const exactSlot = (existingSlots || []).find((slot) => new Date(slot.start_at).getTime() === startAt.getTime());
        const blockingSlot = (existingSlots || []).find((slot) => {
            if (slot.id === exactSlot?.id) return false;
            return slot.status !== 'available';
        });
        if (blockingSlot) {
            return response(409, { ok: false, error: 'SLOT_NOT_AVAILABLE' });
        }

        let slotId = exactSlot?.id || null;
        const existingStatus = exactSlot?.status || null;
        if (slotId && existingStatus !== 'available') {
            return response(409, { ok: false, error: 'SLOT_NOT_AVAILABLE' });
        }

        if (slotId) {
            const { error: updateError } = await supabase
                .from('slots')
                .update({ status: 'booked', end_at: endAt.toISOString() })
                .eq('id', slotId);
            if (updateError) throw updateError;
        } else {
            const { data: insertedSlot, error: insertSlotError } = await supabase
                .from('slots')
                .insert({
                    start_at: startAt.toISOString(),
                    end_at: endAt.toISOString(),
                    instructor,
                    status: 'booked'
                })
                .select('id')
                .single();
            if (insertSlotError) throw insertSlotError;
            slotId = insertedSlot.id;
        }

        const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .insert({
                slot_id: slotId,
                email: studentEmail,
                first_name: user.prenom || null,
                last_name: user.nom || null,
                phone: user.telephone || null,
                status: 'upcoming'
            })
            .select('id')
            .single();
        if (reservationError) {
            await supabase.from('slots').update({ status: 'available' }).eq('id', slotId);
            throw reservationError;
        }

        return response(200, {
            ok: true,
            slot_id: slotId,
            reservation_id: reservation.id
        });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-book-slot:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'STUDENT_BOOK_SLOT_FAILED' });
    }
};
