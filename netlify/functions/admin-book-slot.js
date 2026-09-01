const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function text(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function email(value) {
    return text(value, 254).toLowerCase();
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

function validDuration(startAt, endAt) {
    const minutes = (endAt.getTime() - startAt.getTime()) / 60000;
    return Number.isFinite(minutes) && minutes > 0 && minutes <= 135;
}

function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function isCourseBasedPack(value) {
    return String(value || '').toLowerCase().trim().startsWith('tarif-');
}

function inferLessonUnitMinutes(body) {
    const explicit = Number(body?.lesson_unit_minutes || 0);
    if (explicit === 45 || explicit === 120) return explicit;
    return isCourseBasedPack(body?.forfait || body?.pack) ? 45 : 120;
}

const LEGACY_INSTRUCTORS = new Set(['mylene', 'sammy', 'nail', 'daho']);

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

const VEHICLES = Object.freeze({
    'c3-1': { id: 'c3-1', name: 'C3 N°1 EW-426-SR', label: 'BM', transmission: 'manual' },
    'c3-2': { id: 'c3-2', name: 'C3 N°2 permis', label: 'BM', transmission: 'manual' },
    c4: { id: 'c4', name: 'C4', label: 'BA', transmission: 'auto' }
});

function normaliseVehicleId(value) {
    const raw = String(value || '').toLowerCase().trim();
    if (raw === 'c3-1' || raw.includes('ew-426-sr') || raw.includes('ew 426 sr') || raw.includes('c3 n°1') || raw.includes('c3 n 1')) return 'c3-1';
    if (raw === 'c3-2' || raw.includes('c3 n°2') || raw.includes('c3 n 2') || raw.includes('c3 2') || (raw.includes('c3') && raw.includes('permis'))) return 'c3-2';
    if (raw === 'c4' || raw.includes('c4')) return 'c4';
    return '';
}

function vehicleFromSlot(slot) {
    const raw = String(slot?.notes || '').toLowerCase();
    const explicit = normaliseVehicleId(raw);
    if (explicit) return explicit;
    const instructor = String(slot?.instructor || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (instructor === 'elodie') return 'c3-1';
    if (instructor === 'eric') return 'c3-2';
    return '';
}

function notesWithVehicle(existingNotes, vehicle) {
    const cleaned = String(existingNotes || '')
        .replace(/\s*\[VEHICLE:[^\]]+\]/gi, '')
        .replace(/\s*\[VEHICLE_NAME:[^\]]+\]/gi, '')
        .trim();
    const prefix = `[VEHICLE:${vehicle.id}] [VEHICLE_NAME:${vehicle.name}]`;
    return cleaned ? `${cleaned} ${prefix}` : prefix;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        const startAt = parseIsoDate(body.start_at);
        const endAt = parseIsoDate(body.end_at);
        const instructor = text(body.instructor, 120);
        const studentEmail = email(body.email);
        const firstName = text(body.first_name, 100);
        const lastName = text(body.last_name, 100);
        const phone = text(body.phone, 30);
        const requestedTransmission = text(body.transmission_type, 20).toLowerCase();
        const lessonUnitMinutes = inferLessonUnitMinutes(body);
        let vehicleId = normaliseVehicleId(body.vehicle_id || body.vehicle_name);
        if (requestedTransmission === 'auto') vehicleId = 'c4';
        const vehicle = VEHICLES[vehicleId];

        if (!startAt || !endAt || !validDuration(startAt, endAt) || !instructor || !studentEmail) {
            return response(400, { ok: false, error: 'INVALID_SLOT_DATA' });
        }
        if (isSundayInParis(startAt)) {
            return response(409, { ok: false, error: 'SUNDAY_CLOSED' });
        }
        if (!vehicle || (requestedTransmission === 'manual' && vehicle.transmission !== 'manual')) {
            return response(400, { ok: false, error: 'INVALID_VEHICLE' });
        }
        if (!isBookingAllowedForLessonFormat(instructor, startAt, endAt, lessonUnitMinutes)) {
            return response(409, { ok: false, error: 'INCOMPATIBLE_PLANNING_MODE' });
        }

        const { data: existingReservations, error: overlapError } = await supabase
            .from('reservations')
            .select('id,slots!inner(start_at,end_at)')
            .ilike('email', studentEmail)
            .in('status', ['upcoming', 'booked'])
            .lt('slots.start_at', endAt.toISOString())
            .gt('slots.end_at', startAt.toISOString())
            .limit(1);
        if (overlapError) throw overlapError;
        if (existingReservations?.length) {
            return response(409, { ok: false, error: 'STUDENT_TIME_CONFLICT' });
        }

        const { data: existingSlots, error: slotLookupError } = await supabase
            .from('slots')
            .select('id,status,notes,start_at,end_at')
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

        const { data: overlappingVehicleSlots, error: vehicleOverlapError } = await supabase
            .from('slots')
            .select('id,instructor,start_at,end_at,status,notes')
            .in('status', ['booked', 'done', 'completed', 'permis'])
            .lt('start_at', endAt.toISOString())
            .gt('end_at', startAt.toISOString());
        if (vehicleOverlapError) throw vehicleOverlapError;
        const vehicleConflict = (overlappingVehicleSlots || []).find((slot) => slot.id !== slotId && vehicleFromSlot(slot) === vehicle.id);
        if (vehicleConflict) {
            return response(409, {
                ok: false,
                error: 'VEHICLE_TIME_CONFLICT',
                vehicle: vehicle.name,
                instructor: vehicleConflict.instructor
            });
        }

        const nextNotes = notesWithVehicle(exactSlot?.notes, vehicle);

        if (slotId) {
            const { error: updateError } = await supabase
                .from('slots')
                .update({ status: 'booked', end_at: endAt.toISOString(), notes: nextNotes })
                .eq('id', slotId);
            if (updateError) throw updateError;
        } else {
            const { data: insertedSlot, error: insertSlotError } = await supabase
                .from('slots')
                .insert({
                    start_at: startAt.toISOString(),
                    end_at: endAt.toISOString(),
                    instructor,
                    status: 'booked',
                    notes: nextNotes
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
                first_name: firstName,
                last_name: lastName,
                phone,
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
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const conflictErrors = ['SLOT_NOT_AVAILABLE', 'STUDENT_TIME_CONFLICT', 'VEHICLE_TIME_CONFLICT', 'INCOMPATIBLE_PLANNING_MODE'];
        const badRequestErrors = ['INVALID_BODY', 'INVALID_SLOT_DATA', 'INVALID_VEHICLE'];
        const status = authErrors.includes(error.message)
            ? 401
            : conflictErrors.includes(error.message)
                ? 409
                : badRequestErrors.includes(error.message)
                    ? 400
                    : 500;
        console.error('admin-book-slot:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : error.message || 'ADMIN_BOOK_SLOT_FAILED' });
    }
};
