const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const FALLBACK_SUBJECT = 'Demande permis à planifier';
const FALLBACK_PREFIX = 'EXAM_REQUEST::';

function clean(value, max = 200) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function normalizeEmail(value) {
    return clean(value, 254).toLowerCase();
}

function isMissingTable(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === '42P01'
        || error?.code === 'PGRST205'
        || /exam_requests|Could not find the table|relation .* does not exist/i.test(message);
}

function isSchemaColumnError(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === '42703' || error?.code === 'PGRST204' || /schema cache|column/i.test(message);
}

function parseDate(value) {
    const date = new Date(value || '');
    return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function packDeadlineDays(pack) {
    const raw = String(pack || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return raw.includes('premium') || raw.includes('accelere') ? 30 : 365;
}

function transmissionLabel(value, pack) {
    const raw = String(value || pack || '').toLowerCase();
    if (raw.includes('auto') || raw.includes('ba')) return 'auto';
    if (raw.includes('manual') || raw.includes('manuelle') || raw.includes('bm')) return 'manual';
    return '';
}

function displayTransmission(value) {
    return value === 'auto' ? 'BA' : value === 'manual' ? 'BM' : '';
}

function publicRequest(row) {
    const now = Date.now();
    const deadlineDays = Number(row.deadline_days || packDeadlineDays(row.pack || row.pack_label));
    const createdAt = parseDate(row.created_at) || new Date(now);
    const packStartedAt = parseDate(row.pack_started_at || row.created_at) || createdAt;
    const startedAt = deadlineDays === 30 ? createdAt : packStartedAt;
    const calculatedDeadlineAt = addDays(startedAt, deadlineDays);
    const deadlineAt = deadlineDays === 30
        ? calculatedDeadlineAt
        : (parseDate(row.deadline_at) || calculatedDeadlineAt);
    const totalMs = Math.max(1, deadlineDays * 86400000);
    const elapsedMs = now - startedAt.getTime();
    const urgency = Math.max(0, Math.min(1, elapsedMs / totalMs));
    const daysLeft = Math.ceil((deadlineAt.getTime() - now) / 86400000);

    return {
        id: row.id,
        student_email: row.student_email,
        student_name: row.student_name,
        student_phone: row.student_phone || '',
        instructor: row.instructor || '',
        requested_by_email: row.requested_by_email || '',
        requested_by_role: row.requested_by_role || '',
        pack: row.pack || '',
        pack_label: row.pack_label || row.pack || '',
        transmission_type: row.transmission_type || '',
        transmission_label: displayTransmission(row.transmission_type),
        pack_started_at: row.pack_started_at,
        deadline_days: deadlineDays,
        deadline_at: deadlineAt.toISOString(),
        days_left: daysLeft,
        urgency,
        status: row.status || 'pending',
        comment: row.comment || '',
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
        prenom: parts[0] || '',
        nom: parts.slice(1).join(' ')
    };
}

function fallbackStatus(status) {
    if (status === 'scheduled') return 'exam_scheduled';
    if (status === 'dismissed') return 'exam_dismissed';
    return 'exam_pending';
}

function requestStatusFromFallback(status) {
    if (status === 'exam_scheduled') return 'scheduled';
    if (status === 'exam_dismissed') return 'dismissed';
    return 'pending';
}

function encodeFallbackRequest(payload) {
    return `${FALLBACK_PREFIX}${JSON.stringify(payload)}`;
}

function decodeFallbackRequest(row) {
    let payload = {};
    const rawMessage = String(row?.message || '');
    if (rawMessage.startsWith(FALLBACK_PREFIX)) {
        try {
            payload = JSON.parse(rawMessage.slice(FALLBACK_PREFIX.length));
        } catch (error) {
            payload = {};
        }
    }
    const name = [row?.prenom, row?.nom].filter(Boolean).join(' ').trim();
    return publicRequest({
        ...payload,
        id: row.id,
        student_email: payload.student_email || row.email || '',
        student_name: payload.student_name || name || row.email || '',
        student_phone: payload.student_phone || row.telephone || '',
        status: requestStatusFromFallback(row.status),
        comment: payload.comment || (!rawMessage.startsWith(FALLBACK_PREFIX) ? rawMessage : ''),
        created_at: row.created_at,
        updated_at: row.updated_at || row.created_at
    });
}

async function createFallbackRequest(supabase, payload) {
    const name = splitName(payload.student_name);
    const rowPayload = {
        prenom: name.prenom,
        nom: name.nom,
        email: payload.student_email,
        telephone: payload.student_phone || '',
        sujet: FALLBACK_SUBJECT,
        message: encodeFallbackRequest(payload),
        newsletter: false,
        status: fallbackStatus(payload.status),
        updated_at: new Date().toISOString()
    };

    const existing = await supabase
        .from('contact_requests')
        .select('*')
        .eq('sujet', FALLBACK_SUBJECT)
        .eq('status', fallbackStatus('pending'))
        .ilike('email', payload.student_email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (existing.error) throw existing.error;

    const query = existing.data?.id
        ? supabase.from('contact_requests').update(rowPayload).eq('id', existing.data.id).select('*').single()
        : supabase.from('contact_requests').insert(rowPayload).select('*').single();

    const { data, error } = await query;
    if (error) throw error;
    return decodeFallbackRequest(data);
}

async function listFallbackRequests(supabase) {
    const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('sujet', FALLBACK_SUBJECT)
        .eq('status', fallbackStatus('pending'))
        .order('created_at', { ascending: true })
        .limit(100);
    if (error) throw error;
    return (data || []).map(decodeFallbackRequest)
        .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());
}

async function updateFallbackRequest(supabase, body) {
    const id = clean(body?.id, 80);
    const status = ['pending', 'scheduled', 'dismissed'].includes(body?.status) ? body.status : '';
    if (!id || !status) {
        const error = new Error('INVALID_REQUEST');
        error.statusCode = 400;
        throw error;
    }
    const { data, error } = await supabase
        .from('contact_requests')
        .update({ status: fallbackStatus(status), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('sujet', FALLBACK_SUBJECT)
        .select('*')
        .maybeSingle();
    if (error) throw error;
    return data ? decodeFallbackRequest(data) : null;
}

async function markFallbackRequestScheduledByEmail(supabase, studentEmail) {
    const { error } = await supabase
        .from('contact_requests')
        .update({ status: fallbackStatus('scheduled'), updated_at: new Date().toISOString() })
        .eq('sujet', FALLBACK_SUBJECT)
        .eq('status', fallbackStatus('pending'))
        .ilike('email', studentEmail);
    if (error) throw error;
}

async function fetchLatestProfile(supabase, studentEmail) {
    const userSelects = [
        'email,prenom,nom,telephone,forfait,transmission_type,created_at',
        'email,prenom,nom,telephone,forfait,transmission_type'
    ];
    let user = null;
    for (const columns of userSelects) {
        const { data, error } = await supabase
            .from('users')
            .select(columns)
            .ilike('email', studentEmail)
            .maybeSingle();
        if (!error) {
            user = data || null;
            break;
        }
        if (!isSchemaColumnError(error)) throw error;
    }

    const notificationSelects = [
        'user_email,user_prenom,user_nom,user_name,user_telephone,pack,pack_label,transmission_type,created_at',
        'user_email,user_prenom,user_nom,user_name,user_telephone,pack,transmission_type,created_at'
    ];
    let notification = null;
    for (const columns of notificationSelects) {
        const { data, error } = await supabase
            .from('inscription_notifications')
            .select(columns)
            .ilike('user_email', studentEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (!error) {
            notification = data || null;
            break;
        }
        if (!isSchemaColumnError(error)) throw error;
    }

    const notifName = notification?.user_name
        || [notification?.user_prenom, notification?.user_nom].filter(Boolean).join(' ').trim();
    const userName = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim();
    const pack = notification?.pack || user?.forfait || '';
    const packLabel = notification?.pack_label || pack;

    return {
        student_email: studentEmail,
        student_name: userName || notifName || studentEmail,
        student_phone: user?.telephone || notification?.user_telephone || '',
        pack,
        pack_label: packLabel,
        transmission_type: transmissionLabel(user?.transmission_type || notification?.transmission_type, pack),
        pack_started_at: notification?.created_at || user?.created_at || new Date().toISOString()
    };
}

async function requesterName(supabase, session) {
    if (session.app_role === 'admin') return clean(session.profile?.prenom || 'Admin', 120);
    const email = String(session.email || '').toLowerCase();
    const { data, error } = await supabase
        .from('instructors')
        .select('prenom,nom,email')
        .ilike('email', email)
        .maybeSingle();
    if (error) throw error;
    return clean(data?.prenom || session.profile?.instructor_name || session.profile?.prenom || email, 120);
}

async function createRequest(supabase, session, body) {
    const studentEmail = normalizeEmail(body?.student_email);
    if (!studentEmail.includes('@')) {
        const error = new Error('INVALID_STUDENT');
        error.statusCode = 400;
        throw error;
    }

    const profile = await fetchLatestProfile(supabase, studentEmail);
    const instructor = clean(body?.instructor || await requesterName(supabase, session), 120);
    const deadlineDays = packDeadlineDays(profile.pack || profile.pack_label);
    const startedAt = new Date();
    const deadlineAt = addDays(startedAt, deadlineDays);

    const payload = {
        ...profile,
        student_name: clean(body?.student_name, 180) || profile.student_name,
        instructor,
        requested_by_email: normalizeEmail(session.email),
        requested_by_role: session.app_role,
        deadline_days: deadlineDays,
        deadline_at: deadlineAt.toISOString(),
        status: 'pending',
        comment: clean(body?.comment, 800),
        updated_at: new Date().toISOString()
    };

    const existing = await supabase
        .from('exam_requests')
        .select('id')
        .ilike('student_email', studentEmail)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
    if (isMissingTable(existing.error)) return createFallbackRequest(supabase, payload);
    if (existing.error) throw existing.error;

    const query = existing.data?.id
        ? supabase.from('exam_requests').update(payload).eq('id', existing.data.id).select('*').single()
        : supabase.from('exam_requests').insert(payload).select('*').single();

    const { data, error } = await query;
    if (isMissingTable(error)) return createFallbackRequest(supabase, payload);
    if (error) throw error;
    return publicRequest(data);
}

async function listRequests(supabase) {
    const { data, error } = await supabase
        .from('exam_requests')
        .select('*')
        .eq('status', 'pending')
        .order('deadline_at', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(100);
    if (isMissingTable(error)) return listFallbackRequests(supabase);
    if (error) throw error;
    return (data || []).map(publicRequest);
}

async function updateRequest(supabase, body) {
    const id = clean(body?.id, 80);
    const status = ['pending', 'scheduled', 'dismissed'].includes(body?.status) ? body.status : '';
    if (!id || !status) {
        const error = new Error('INVALID_REQUEST');
        error.statusCode = 400;
        throw error;
    }
    const { data, error } = await supabase
        .from('exam_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();
    if (isMissingTable(error)) return updateFallbackRequest(supabase, body);
    if (error) throw error;
    return data ? publicRequest(data) : null;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;

    try {
        const method = event.httpMethod;
        const allowedRoles = method === 'GET' || method === 'PATCH' ? ['admin'] : ['admin', 'instructor'];
        const session = verifySession(getBearerToken(event), allowedRoles);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        if (method === 'GET') {
            return response(200, { ok: true, requests: await listRequests(supabase) });
        }

        const body = parseJsonBody(event);
        if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });

        if (method === 'POST') {
            return response(200, { ok: true, request: await createRequest(supabase, session, body) });
        }

        if (method === 'PATCH') {
            return response(200, { ok: true, request: await updateRequest(supabase, body) });
        }

        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = isMissingTable(error)
            ? 424
            : error.statusCode || (authErrors.includes(error.message) ? 401 : 500);
        console.error('exam-requests:', error.message);
        return response(status, {
            ok: false,
            error: status === 424
                ? 'EXAM_REQUESTS_STORAGE_MISSING'
                : authErrors.includes(error.message)
                    ? 'AUTH_REQUIRED'
                    : error.message || 'EXAM_REQUEST_FAILED'
        });
    }
};

module.exports._private = {
    decodeFallbackRequest,
    encodeFallbackRequest,
    fallbackStatus,
    markFallbackRequestScheduledByEmail
};
