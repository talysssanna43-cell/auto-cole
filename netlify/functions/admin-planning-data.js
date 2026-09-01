const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, response } = require('./_lib/http');

function sanitizeText(value, max = 200) {
    return String(value || '').trim().slice(0, max);
}

function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
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

async function fetchAll(buildQuery, maxRows = 10000) {
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

async function loadSearchStudents(supabase, query, options = {}) {
    const includeAll = Boolean(options.includeAll);
    const q = normalize(query);
    if (q.length < 2 && !includeAll) return [];

    // Keep the search index lightweight: document payloads can contain several
    // base64 files and are loaded only when the admin opens a student record.
    const users = await fetchAll(() => supabase
        .from('users')
        .select('email,prenom,nom,telephone,transmission_type,forfait,hours_goal')
        .order('nom', { ascending: true }), 3000);

    const notifications = await loadSearchNotifications(supabase);

    const studentsByEmail = new Map();

    users.forEach((user) => {
        const email = String(user.email || '').toLowerCase();
        if (!email) return;
        const haystack = normalize([
            user.prenom,
            user.nom,
            user.email,
            user.telephone
        ].join(' '));
        if (!includeAll && !haystack.includes(q)) return;
        studentsByEmail.set(email, {
            ...user,
            lesson_unit_minutes: inferLessonUnitMinutes(user),
            _pending: false
        });
    });

    notifications.forEach((notification) => {
        const email = String(notification.user_email || '').toLowerCase();
        if (!email || studentsByEmail.has(email)) return;
        const haystack = normalize([
            notification.user_prenom,
            notification.user_nom,
            notification.user_name,
            notification.user_email,
            notification.user_telephone
        ].join(' '));
        if (!includeAll && !haystack.includes(q)) return;
        const parts = String(notification.user_name || '').split(/\s+/).filter(Boolean);
        studentsByEmail.set(email, {
            email: notification.user_email,
            prenom: notification.user_prenom || parts[0] || '',
            nom: notification.user_nom || parts.slice(1).join(' ') || '',
            telephone: notification.user_telephone || '',
            transmission_type: notification.transmission_type || null,
            forfait: notification.pack || '',
            hours_goal: notification.hours_purchased || 0,
            lesson_unit_minutes: inferLessonUnitMinutes(notification),
            status: notification.status,
            _pending: true
        });
    });

    return Array.from(studentsByEmail.values()).slice(0, includeAll ? 5000 : 30);
}

async function loadSearchNotifications(supabase) {
    try {
        return await fetchAll(() => supabase
            .from('inscription_notifications')
            .select('user_email,user_prenom,user_nom,user_telephone,user_name,transmission_type,status,created_at,lesson_unit_minutes,pack,hours_purchased')
            .order('created_at', { ascending: false }), 3000);
    } catch (error) {
        const message = String(error?.message || error?.details || '');
        const missingLessonUnit = error?.code === '42703' || error?.code === 'PGRST204' || /lesson_unit_minutes|schema cache|column/i.test(message);
        if (!missingLessonUnit) throw error;

        const notifications = await fetchAll(() => supabase
            .from('inscription_notifications')
            .select('user_email,user_prenom,user_nom,user_telephone,user_name,transmission_type,status,created_at,pack,hours_purchased')
            .order('created_at', { ascending: false }), 3000);
        return notifications.map((notification) => ({
            ...notification,
            lesson_unit_minutes: 45
        }));
    }
}

function notificationHasDocuments(notification) {
    if (!notification) return false;
    if (Number(notification.documents_count || 0) > 0) return true;
    if (!notification.documents) return false;
    if (typeof notification.documents === 'string') return notification.documents.trim().length > 2;
    return typeof notification.documents === 'object' && !Array.isArray(notification.documents) && Object.keys(notification.documents).length > 0;
}

async function loadDocumentReviews(supabase) {
    const notifications = await fetchAll(() => supabase
        .from('inscription_notifications')
        .select('user_email,user_prenom,user_nom,user_name,documents_count,created_at,status')
        .in('status', ['approved', 'accepted'])
        .gt('documents_count', 0)
        .order('created_at', { ascending: false }), 3000);

    const seenEmails = new Set();
    return notifications.reduce((reviews, notification) => {
        const email = String(notification.user_email || '').trim().toLowerCase();
        if (!email || seenEmails.has(email)) return reviews;
        seenEmails.add(email);
        const pendingCount = Math.max(0, Number(notification.documents_count || 0));
        if (!pendingCount) return reviews;
        reviews.push({
            user_email: notification.user_email,
            user_name: [notification.user_prenom, notification.user_nom].filter(Boolean).join(' ').trim()
                || notification.user_name
                || notification.user_email,
            pending_count: pendingCount,
            documents_count: pendingCount,
            last_uploaded_at: notification.created_at || null
        });
        return reviews;
    }, []);
}

async function loadNotificationsForEmail(supabase, email) {
    try {
        return await fetchAll(() => supabase
            .from('inscription_notifications')
            .select('*')
            .ilike('user_email', email)
            .order('created_at', { ascending: false }), 20);
    } catch (error) {
        const missingTable = error.code === '42P01' || error.code === 'PGRST205';
        if (missingTable) return [];
        throw error;
    }
}

function notificationToStudent(notification, fallbackEmail) {
    if (!notification) return null;
    const parts = String(notification.user_name || '').trim().split(/\s+/).filter(Boolean);
    return {
        email: notification.user_email || fallbackEmail,
        prenom: notification.user_prenom || parts[0] || '',
        nom: notification.user_nom || parts.slice(1).join(' ') || '',
        telephone: notification.user_telephone || '',
        genre: notification.genre || '',
        date_nais: notification.user_date_naissance || null,
        adresse: notification.user_adresse || '',
        code_postal: notification.user_code_postal || '',
        ville: notification.user_ville || '',
        numero_neph: notification.numero_neph || '',
        forfait: notification.pack_label || notification.pack || '',
        pack: notification.pack || '',
        pack_label: notification.pack_label || '',
        hours_goal: Number(notification.hours_purchased || 0),
        hours_completed_initial: Number(notification.hours_completed_initial || 0),
        lesson_unit_minutes: inferLessonUnitMinutes(notification),
        transmission_type: notification.transmission_type || '',
        notes_admin: notification.notes_admin || '',
        documents: notification.documents || null,
        documents_count: Number(notification.documents_count || 0),
        created_at: notification.created_at || null,
        _pending: notification.status === 'pending'
    };
}

async function loadStudentDetails(supabase, email) {
    const normalizedEmail = sanitizeText(email, 320).toLowerCase();
    if (!normalizedEmail) {
        const error = new Error('EMAIL_REQUIRED');
        error.statusCode = 400;
        throw error;
    }

    const { data: student, error: studentError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();
    if (studentError) throw studentError;

    const notifications = await loadNotificationsForEmail(supabase, normalizedEmail);
    const notification = notifications.find(notificationHasDocuments) || notifications[0] || null;
    const fallbackStudent = notificationToStudent(notification, normalizedEmail);
    const mergedStudent = student
        ? {
            ...fallbackStudent,
            ...student,
            documents: student.documents || fallbackStudent?.documents || null,
            documents_count: Number(student.documents_count || fallbackStudent?.documents_count || 0),
            lesson_unit_minutes: inferLessonUnitMinutes(student)
        }
        : fallbackStudent;

    const reservations = await fetchAll(() => supabase
        .from('reservations')
        .select('*, slots(*)')
        .ilike('email', normalizedEmail)
        .order('created_at', { ascending: false }), 3000);

    let cancellations = [];
    try {
        cancellations = await fetchAll(() => supabase
            .from('cancellation_requests')
            .select('*')
            .ilike('user_email', normalizedEmail), 3000);
    } catch (error) {
        if (error.code !== '42P01' && error.code !== 'PGRST205') throw error;
    }

    return { student: mergedStudent, notification, notifications, reservations, cancellations };
}

async function loadInstructors(supabase) {
    return fetchAll(() => supabase
        .from('instructors')
        .select('id,prenom,nom,email,telephone,specialites,is_active,visible_to_students,gender')
        .eq('is_active', true)
        .order('prenom', { ascending: true }), 3000);
}

async function loadUsersForEmails(supabase, emails) {
    try {
        return await fetchAll(() => supabase
            .from('users')
            .select('email,forfait,hours_goal,telephone,transmission_type,nom,prenom,lesson_unit_minutes')
            .in('email', emails), 3000);
    } catch (error) {
        const message = String(error?.message || error?.details || '');
        const missingLessonUnit = error?.code === '42703' || error?.code === 'PGRST204' || /lesson_unit_minutes|schema cache|column/i.test(message);
        if (!missingLessonUnit) throw error;

        const users = await fetchAll(() => supabase
            .from('users')
            .select('email,forfait,hours_goal,telephone,transmission_type,nom,prenom')
            .in('email', emails), 3000);
        return users.map((user) => ({
            ...user,
            lesson_unit_minutes: inferLessonUnitMinutes(user)
        }));
    }
}

function isCourseBasedPack(value) {
    return String(value || '').toLowerCase().trim().startsWith('tarif-');
}

function inferLessonUnitMinutes(record) {
    const explicit = Number(record?.lesson_unit_minutes || 0);
    if (explicit === 45 || explicit === 120) return explicit;
    return isCourseBasedPack(record?.forfait || record?.pack) ? 45 : 120;
}

async function loadBookedSlots(supabase, params) {
    const instructor = sanitizeText(params?.instructor, 120);
    if (!instructor) {
        const error = new Error('INSTRUCTOR_REQUIRED');
        error.statusCode = 400;
        throw error;
    }

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
        .order('start_at', { ascending: true }), 3000);

    const slotIds = slots.map((slot) => slot.id).filter(Boolean);
    let reservations = [];
    if (slotIds.length) {
        reservations = await fetchAll(() => supabase
            .from('reservations')
            .select('slot_id,first_name,last_name,phone,email,status')
            .in('slot_id', slotIds), 5000);
    }

    const reservationsBySlot = new Map();
    reservations.forEach((reservation) => {
        if (!reservation.slot_id) return;
        if (!reservationsBySlot.has(reservation.slot_id)) reservationsBySlot.set(reservation.slot_id, []);
        reservationsBySlot.get(reservation.slot_id).push(reservation);
    });

    const emails = Array.from(new Set(reservations.map((reservation) => String(reservation.email || '').toLowerCase()).filter(Boolean)));
    const packMap = new Map();
    const transmissionMap = new Map();
    const forfaitMap = new Map();
    const hoursCompletedMap = new Map();
    const hoursGoalMap = new Map();
    const lessonUnitMap = new Map();
    const phoneMap = new Map();
    const nameMap = new Map();

    if (emails.length) {
        const inscriptions = await fetchAll(() => supabase
            .from('inscription_notifications')
            .select('user_email,pack,transmission_type,created_at')
            .in('user_email', emails)
            .order('created_at', { ascending: false }), 3000);

        inscriptions.forEach((inscription) => {
            const email = String(inscription.user_email || '').toLowerCase();
            if (!email || packMap.has(email)) return;
            packMap.set(email, inscription.pack || '');
            transmissionMap.set(email, inscription.transmission_type || null);
        });

        const users = await loadUsersForEmails(supabase, emails);

        users.forEach((user) => {
            const email = String(user.email || '').toLowerCase();
            if (!email) return;
            forfaitMap.set(email, user.forfait || '');
            hoursGoalMap.set(email, user.hours_goal || 0);
            lessonUnitMap.set(email, inferLessonUnitMinutes(user));
            phoneMap.set(email, user.telephone || '');
            if (user.transmission_type) transmissionMap.set(email, user.transmission_type);
            const fullName = [user.prenom, user.nom].filter(Boolean).join(' ').trim();
            if (fullName) nameMap.set(email, fullName);
        });

        const completedReservations = await fetchAll(() => supabase
            .from('reservations')
            .select('email,status,slots(start_at,end_at)')
            .in('email', emails)
            .eq('status', 'done'), 5000);

        completedReservations.forEach((reservation) => {
            const email = String(reservation.email || '').toLowerCase();
            if (!email || !reservation.slots?.start_at || !reservation.slots?.end_at) return;
            const startAt = new Date(reservation.slots.start_at);
            const endAt = new Date(reservation.slots.end_at);
            const hours = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
            if (Number.isFinite(hours) && hours > 0) {
                hoursCompletedMap.set(email, (hoursCompletedMap.get(email) || 0) + hours);
            }
        });
    }

    const items = [];
    slots.forEach((slot) => {
        const slotReservations = reservationsBySlot.get(slot.id) || [];
        const isPermis = slot.status === 'permis';
        const isIndisponible = slot.status === 'indisponible';
        if (slot.status !== 'booked' && !slotReservations.length && !isPermis && !isIndisponible) return;

        const reservation = firstReservation({ reservations: slotReservations });
        const email = String(reservation?.email || '').toLowerCase();
        const fullName = nameMap.get(email) || '';
        const firstName = fullName ? fullName.split(' ')[0] : (reservation?.first_name || (email ? email.split('@')[0] : 'Réservé'));
        const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : (reservation?.last_name || '');

        items.push({
            start_at: slot.start_at,
            booking: {
                start_at: slot.start_at,
                status: slot.status,
                notes: slot.notes || '',
                slot_uuid: slot.id,
                student: (isPermis || isIndisponible) ? null : {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phoneMap.get(email) || reservation?.phone || '',
                    email,
                    pack: packMap.get(email) || '',
                    transmission_type: transmissionMap.get(email) || null,
                    forfait: forfaitMap.get(email) || '',
                    hours_completed: hoursCompletedMap.get(email) || 0,
                    hours_goal: hoursGoalMap.get(email) || 0,
                    lesson_unit_minutes: lessonUnitMap.get(email) || inferLessonUnitMinutes({ forfait: forfaitMap.get(email), pack: packMap.get(email) })
                }
            }
        });
    });

    return {
        range: { start: start.toISOString(), end: end.toISOString() },
        items,
        totals: {
            slots: slots.length,
            reservations: reservations.length,
            displayed: items.length
        }
    };
}

function shouldRetryWithoutColumn(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === '42703' || error?.code === 'PGRST204' || /column|schema cache/i.test(message);
}

async function loadUsersForActiveStats(supabase) {
    const selects = [
        'email,is_admin,is_active,forfait,hours_goal,lesson_unit_minutes',
        'email,is_admin,forfait,hours_goal,lesson_unit_minutes',
        'email,is_active,forfait,hours_goal,lesson_unit_minutes',
        'email,forfait,hours_goal,lesson_unit_minutes',
        'email,is_admin,is_active,forfait,hours_goal',
        'email,is_admin,forfait,hours_goal',
        'email,is_active,forfait,hours_goal',
        'email,forfait,hours_goal'
    ];

    let lastError = null;
    for (const columns of selects) {
        try {
            return await fetchAll(() => supabase
                .from('users')
                .select(columns), 10000);
        } catch (error) {
            lastError = error;
            if (!shouldRetryWithoutColumn(error)) throw error;
        }
    }
    throw lastError || new Error('USERS_STATS_LOAD_FAILED');
}

function isCountableReservation(reservation) {
    const status = normalize(reservation?.status);
    return status && !status.includes('cancelled') && status !== 'canceled' && status !== 'refused';
}

function isCountableStudent(user) {
    const email = String(user?.email || '').trim();
    if (!email) return false;
    if (user?.is_admin === true) return false;
    if (user?.is_active === false) return false;
    return true;
}

async function loadPassedPermitEmails(supabase) {
    const emails = new Set();

    try {
        const examResults = await fetchAll(() => supabase
            .from('exam_results')
            .select('student_email,result')
            .eq('result', 'passed'), 10000);
        examResults.forEach((row) => {
            const email = String(row.student_email || '').trim().toLowerCase();
            if (email) emails.add(email);
        });
    } catch (error) {
        const missing = error?.code === '42P01' || error?.code === 'PGRST205';
        if (!missing && !shouldRetryWithoutColumn(error)) throw error;
    }

    try {
        const examDates = await fetchAll(() => supabase
            .from('driving_exam_dates')
            .select('student_email,result')
            .eq('result', 'passed'), 10000);
        examDates.forEach((row) => {
            const email = String(row.student_email || '').trim().toLowerCase();
            if (email) emails.add(email);
        });
    } catch (error) {
        const missing = error?.code === '42P01' || error?.code === 'PGRST205';
        if (!missing && !shouldRetryWithoutColumn(error)) throw error;
    }

    return emails;
}

async function loadGlobalStats(supabase, params) {
    const now = new Date();
    const defaultTodayStart = new Date(now);
    defaultTodayStart.setHours(0, 0, 0, 0);
    const defaultTodayEnd = new Date(defaultTodayStart);
    defaultTodayEnd.setDate(defaultTodayEnd.getDate() + 1);
    const defaultWeekStart = new Date(defaultTodayStart);
    const day = defaultWeekStart.getDay();
    defaultWeekStart.setDate(defaultWeekStart.getDate() + (day === 0 ? -6 : 1 - day));
    const defaultWeekEnd = new Date(defaultWeekStart);
    defaultWeekEnd.setDate(defaultWeekEnd.getDate() + 7);

    const todayStart = parseDate(params?.todayStart || params?.today_start, defaultTodayStart.toISOString());
    const todayEnd = parseDate(params?.todayEnd || params?.today_end, defaultTodayEnd.toISOString());
    const weekStart = parseDate(params?.weekStart || params?.week_start, defaultWeekStart.toISOString());
    const weekEnd = parseDate(params?.weekEnd || params?.week_end, defaultWeekEnd.toISOString());

    const slots = await fetchAll(() => supabase
        .from('slots')
        .select('id,start_at,end_at,status,instructor,notes')
        .gte('start_at', weekStart.toISOString())
        .lt('start_at', weekEnd.toISOString()), 10000);

    const lessonSlotIds = slots
        .filter((slot) => {
            const status = normalize(slot.status);
            if (!slot.id) return false;
            if (status === 'permis' || status === 'indisponible' || status === 'available') return false;
            return true;
        })
        .map((slot) => slot.id);

    let reservations = [];
    if (lessonSlotIds.length) {
        reservations = await fetchAll(() => supabase
            .from('reservations')
            .select('slot_id,email,status')
            .in('slot_id', lessonSlotIds), 10000);
    }

    const slotById = new Map(slots.map((slot) => [slot.id, slot]));
    const todayEmails = new Set();
    const weekEmails = new Set();

    reservations.forEach((reservation) => {
        if (!isCountableReservation(reservation)) return;
        const email = String(reservation.email || '').trim().toLowerCase();
        if (!email) return;
        const slot = slotById.get(reservation.slot_id);
        if (!slot?.start_at) return;
        const startAt = new Date(slot.start_at);
        if (startAt >= weekStart && startAt < weekEnd) weekEmails.add(email);
        if (startAt >= todayStart && startAt < todayEnd) todayEmails.add(email);
    });

    const users = await loadUsersForActiveStats(supabase);
    const passedPermitEmails = await loadPassedPermitEmails(supabase);
    const activeStudents = users.filter((user) => {
        if (!isCountableStudent(user)) return false;
        const email = String(user.email || '').trim().toLowerCase();
        return !passedPermitEmails.has(email);
    }).length;

    return {
        todayStudents: todayEmails.size,
        weekStudents: weekEmails.size,
        activeStudents,
        todaySessions: reservations.filter((reservation) => {
            if (!isCountableReservation(reservation)) return false;
            const startAt = new Date(slotById.get(reservation.slot_id)?.start_at || 0);
            return startAt >= todayStart && startAt < todayEnd;
        }).length,
        weekSessions: reservations.filter(isCountableReservation).length
    };
}

async function loadPendingCancellationRequests(supabase) {
    try {
        return await fetchAll(() => supabase
            .from('cancellation_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false }), 3000);
    } catch (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') return [];
        throw error;
    }
}

async function loadStudentAvailabilities(supabase) {
    let availabilities = [];
    try {
        availabilities = await fetchAll(() => supabase
            .from('student_availability')
            .select('*')
            .eq('wants_cancellation_notifications', true), 3000);
    } catch (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') return [];
        throw error;
    }

    const emails = [...new Set(availabilities.map((item) => String(item.user_email || '').toLowerCase()).filter(Boolean))];
    const profiles = emails.length ? await loadUsersForEmails(supabase, emails) : [];
    const profilesByEmail = new Map(profiles.map((profile) => [String(profile.email || '').toLowerCase(), profile]));

    return availabilities.map((availability) => ({
        ...availability,
        _profile: profilesByEmail.get(String(availability.user_email || '').toLowerCase()) || null
    }));
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const params = event.queryStringParameters || {};
        const type = sanitizeText(params.type, 80);

        if (type === 'students') {
            const students = await loadSearchStudents(supabase, params.q || params.search || '');
            return response(200, { ok: true, students });
        }

        if (type === 'student-index') {
            const students = await loadSearchStudents(supabase, '', { includeAll: true });
            return response(200, { ok: true, students });
        }

        if (type === 'student-details') {
            const details = await loadStudentDetails(supabase, params.email);
            return response(200, { ok: true, ...details });
        }

        if (type === 'instructors') {
            const instructors = await loadInstructors(supabase);
            return response(200, { ok: true, instructors });
        }

        if (type === 'booked-slots') {
            const result = await loadBookedSlots(supabase, params);
            return response(200, { ok: true, ...result });
        }

        if (type === 'global-stats') {
            const stats = await loadGlobalStats(supabase, params);
            return response(200, { ok: true, stats });
        }

        if (type === 'cancellation-requests') {
            const requests = await loadPendingCancellationRequests(supabase);
            return response(200, { ok: true, requests });
        }

        if (type === 'document-reviews') {
            const reviews = await loadDocumentReviews(supabase);
            return response(200, { ok: true, reviews });
        }

        if (type === 'student-availabilities') {
            const availabilities = await loadStudentAvailabilities(supabase);
            return response(200, { ok: true, availabilities });
        }

        return response(400, { ok: false, error: 'INVALID_TYPE' });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = error.statusCode || (authErrors.includes(error.message) ? 401 : 500);
        console.error('admin-planning-data:', error.message);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : (error.message || 'ADMIN_PLANNING_DATA_FAILED')
        });
    }
};
