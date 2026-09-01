const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { examScheduledHtml, sendResendEmail } = require('./_lib/exam-email');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const ALLOWED_LOCATIONS = new Set(['Aubagne', 'Saint-Henri', 'Salon', 'Aix-en-Provence']);
const PERMIS_NOTES_PREFIX = 'PERMIS_JSON::';

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime());
}

function validIsoDate(value) {
    const date = new Date(value || '');
    return !Number.isNaN(date.getTime()) ? date.toISOString() : '';
}

function isMissingExamDateTable(error) {
    return error?.code === 'PGRST205'
        || /driving_exam_dates/i.test(error?.message || '')
        || /Could not find the table/i.test(error?.message || '');
}

function transmissionLabel(value, forfait) {
    const raw = String(value || forfait || '').toLowerCase();
    if (raw.includes('auto') || raw.includes('ba')) return 'BA';
    if (raw.includes('manual') || raw.includes('manuelle') || raw.includes('bm')) return 'BM';
    return '';
}

function parsePermisNotes(notes) {
    const raw = String(notes || '').trim();
    if (raw.startsWith(PERMIS_NOTES_PREFIX)) {
        try {
            const data = JSON.parse(raw.slice(PERMIS_NOTES_PREFIX.length));
            return {
                location: text(data.location, 60),
                examDate: text(data.examDate, 10),
                candidates: Array.isArray(data.candidates) ? data.candidates.map((candidate) => ({
                    name: text(candidate.name, 180),
                    phone: text(candidate.phone, 30),
                    email: text(candidate.email, 180).toLowerCase(),
                    transmission: text(candidate.transmission, 10)
                })).filter((candidate) => candidate.name || candidate.email) : []
            };
        } catch (_) {}
    }

    const parts = raw.split('|').map((part) => part.trim()).filter(Boolean);
    const location = text((parts[0] || '').replace(/^PERMIS\s*-\s*/i, ''), 60);
    const candidate = { name: '', phone: '', email: '', transmission: '' };
    const candidates = [];
    parts.slice(1).forEach((part) => {
        if (/^Candidats?\s*:/i.test(part)) {
            part.replace(/^Candidats?\s*:\s*/i, '').split(',').map((name) => text(name, 180)).filter(Boolean).forEach((name) => {
                candidates.push({ name, phone: '', email: '', transmission: '' });
            });
        } else if (/^Eleve\s*:/i.test(part)) {
            candidate.name = text(part.replace(/^Eleve\s*:\s*/i, ''), 180);
        } else if (/^Tel(?:ephone)?\s*:/i.test(part)) {
            candidate.phone = text(part.replace(/^Tel(?:ephone)?\s*:\s*/i, ''), 30);
        } else if (/^Transmission\s*:/i.test(part)) {
            candidate.transmission = text(part.replace(/^Transmission\s*:\s*/i, ''), 10);
        }
    });
    if (candidate.name || candidate.phone || candidate.transmission) candidates.unshift(candidate);
    return { location, examDate: '', candidates };
}

function encodePermisNotes(data) {
    return `${PERMIS_NOTES_PREFIX}${JSON.stringify({
        location: text(data.location, 60),
        examDate: text(data.examDate, 10),
        candidates: (data.candidates || []).map((candidate) => ({
            name: text(candidate.name, 180),
            phone: text(candidate.phone, 30),
            email: text(candidate.email, 180).toLowerCase(),
            transmission: text(candidate.transmission, 10)
        })).filter((candidate) => candidate.name || candidate.email)
    })}`;
}

function mergePermisCandidate(existingNotes, nextCandidate, { location, examDate }) {
    const existing = parsePermisNotes(existingNotes);
    const candidates = [...existing.candidates];
    const nextEmail = text(nextCandidate.email, 180).toLowerCase();
    const nextName = text(nextCandidate.name, 180).toLowerCase();
    const alreadyPresent = candidates.some((candidate) => {
        const candidateEmail = text(candidate.email, 180).toLowerCase();
        const candidateName = text(candidate.name, 180).toLowerCase();
        return (nextEmail && candidateEmail === nextEmail) || (!nextEmail && nextName && candidateName === nextName);
    });
    if (!alreadyPresent) candidates.push(nextCandidate);
    return encodePermisNotes({
        location: location || existing.location,
        examDate: examDate || existing.examDate,
        candidates
    });
}

async function findStudentProfile(supabase, email) {
    let result = await supabase
        .from('users')
        .select('genre,telephone,transmission_type,forfait,prenom,nom')
        .ilike('email', email)
        .maybeSingle();

    if (result.error) {
        const message = String(result.error?.message || result.error?.details || '');
        const missingOptionalColumn = result.error?.code === '42703'
            || result.error?.code === 'PGRST204'
            || /genre|schema cache|column/i.test(message);
        if (!missingOptionalColumn) throw result.error;
        result = await supabase
            .from('users')
            .select('telephone,transmission_type,forfait,prenom,nom')
            .ilike('email', email)
            .maybeSingle();
        if (result.error) throw result.error;
    }
    return result.data || {};
}

async function blockExamSlot(supabase, { studentEmail, studentName, studentPhone, transmission, location, examDate, startAt, endAt, instructor }) {
    const candidate = {
        name: studentName,
        phone: studentPhone,
        email: studentEmail,
        transmission
    };
    const notes = encodePermisNotes({ location, examDate, candidates: [candidate] });
    const { data: existingSlot, error: checkError } = await supabase
        .from('slots')
        .select('id,status,notes')
        .eq('start_at', startAt)
        .eq('instructor', instructor)
        .maybeSingle();
    if (checkError) throw checkError;

    if (existingSlot && !['available', 'permis', 'indisponible'].includes(existingSlot.status)) {
        const error = new Error('EXAM_SLOT_ALREADY_BOOKED');
        error.statusCode = 409;
        throw error;
    }

    if (existingSlot) {
        const mergedNotes = existingSlot.status === 'permis'
            ? mergePermisCandidate(existingSlot.notes, candidate, { location, examDate })
            : notes;
        const { error: updateError } = await supabase
            .from('slots')
            .update({
                end_at: endAt,
                status: 'permis',
                notes: mergedNotes
            })
            .eq('id', existingSlot.id);
        if (updateError) throw updateError;
        return existingSlot.id;
    }

    const { data: insertedSlot, error: insertError } = await supabase
        .from('slots')
        .insert({
            start_at: startAt,
            end_at: endAt,
            instructor,
            status: 'permis',
            notes
        })
        .select('id')
        .single();
    if (insertError) throw insertError;
    return insertedSlot?.id || null;
}

async function assertExamSlotCanBeBlocked(supabase, { startAt, instructor }) {
    const { data: existingSlot, error } = await supabase
        .from('slots')
        .select('id,status')
        .eq('start_at', startAt)
        .eq('instructor', instructor)
        .maybeSingle();
    if (error) throw error;
    if (existingSlot && !['available', 'permis', 'indisponible'].includes(existingSlot.status)) {
        const slotError = new Error('EXAM_SLOT_ALREADY_BOOKED');
        slotError.statusCode = 409;
        throw slotError;
    }
}

async function markExamRequestScheduled(supabase, { studentEmail, examId, requestId }) {
    const payload = {
        status: 'scheduled',
        scheduled_exam_id: examId,
        updated_at: new Date().toISOString()
    };
    let requestQuery = supabase
        .from('exam_requests')
        .update(payload)
        .eq('status', 'pending');
    requestQuery = requestId
        ? requestQuery.eq('id', requestId)
        : requestQuery.ilike('student_email', studentEmail);
    const { error } = await requestQuery;

    const message = String(error?.message || error?.details || '');
    if (!error) {
        // Continue below: a fallback request may still exist from before exam_requests was installed.
    } else if (error?.code === '42P01' || error?.code === 'PGRST205' || /exam_requests|Could not find the table|relation .* does not exist/i.test(message)) {
        let fallbackQuery = supabase
            .from('contact_requests')
            .update({ status: 'exam_scheduled', updated_at: new Date().toISOString() })
            .eq('sujet', 'Demande permis à planifier')
            .eq('status', 'exam_pending');
        fallbackQuery = requestId
            ? fallbackQuery.eq('id', requestId)
            : fallbackQuery.ilike('email', studentEmail);
        const { error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return;
    } else if (error?.code === '42703' || error?.code === 'PGRST204' || /scheduled_exam_id|updated_at|schema cache|column/i.test(message)) {
        let retryQuery = supabase
            .from('exam_requests')
            .update({ status: 'scheduled' })
            .eq('status', 'pending');
        retryQuery = requestId
            ? retryQuery.eq('id', requestId)
            : retryQuery.ilike('student_email', studentEmail);
        await retryQuery;
    } else {
        throw error;
    }

    let fallbackQuery = supabase
        .from('contact_requests')
        .update({ status: 'exam_scheduled', updated_at: new Date().toISOString() })
        .eq('sujet', 'Demande permis à planifier')
        .eq('status', 'exam_pending');
    fallbackQuery = requestId
        ? fallbackQuery.eq('id', requestId)
        : fallbackQuery.ilike('email', studentEmail);
    const { error: fallbackError } = await fallbackQuery;
    if (fallbackError) throw fallbackError;
}

function normalizeGenre(value) {
    return ['homme', 'femme', 'autre'].includes(value) ? value : '';
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

        const studentEmail = text(body.student_email, 180).toLowerCase();
        const studentName = text(body.student_name, 180);
        const location = text(body.location, 60);
        const examDate = text(body.exam_date, 10);
        const instructor = text(body.instructor, 120);
        const examRequestId = text(body.exam_request_id, 80);
        const startAt = validIsoDate(body.start_at);
        const endAt = validIsoDate(body.end_at);

        if (!studentEmail.includes('@') || !studentName || !ALLOWED_LOCATIONS.has(location) || !validDate(examDate) || !instructor || !startAt || !endAt || endAt <= startAt) {
            return response(400, { ok: false, error: 'INVALID_EXAM_DATE' });
        }

        await assertExamSlotCanBeBlocked(supabase, { startAt, instructor });
        const studentProfile = await findStudentProfile(supabase, studentEmail);
        const studentGenre = normalizeGenre(body.genre) || normalizeGenre(studentProfile.genre);
        const studentPhone = text(body.student_phone || studentProfile.telephone, 30);
        const resolvedStudentName = studentName || [studentProfile.prenom, studentProfile.nom].filter(Boolean).join(' ').trim();
        const resolvedTransmission = transmissionLabel(body.transmission_type || studentProfile.transmission_type, studentProfile.forfait);

        const { data: inserted, error: insertError } = await supabase
            .from('driving_exam_dates')
            .insert({
                student_email: studentEmail,
                student_name: resolvedStudentName,
                location,
                exam_date: examDate,
                instructor,
                created_by: session.email
            })
            .select('*')
            .single();
        if (isMissingExamDateTable(insertError)) {
            return response(424, {
                ok: false,
                error: 'EXAM_DATE_TABLE_MISSING',
                message: 'La table driving_exam_dates est absente. Execute le fichier sql/exam-date-workflow.sql dans Supabase.'
            });
        }
        if (insertError) throw insertError;

        await blockExamSlot(supabase, {
            studentEmail,
            studentName: resolvedStudentName,
            studentPhone,
            transmission: resolvedTransmission,
            location,
            examDate,
            startAt,
            endAt,
            instructor
        });
        await markExamRequestScheduled(supabase, { studentEmail, examId: inserted.id, requestId: examRequestId });
        const examForEmail = { ...inserted, start_at: startAt, end_at: endAt, genre: studentGenre };

        try {
            await sendResendEmail({
                to: studentEmail,
                subject: 'Ta date d\'examen de conduite - Auto-Ecole Breteuil',
                html: examScheduledHtml(examForEmail)
            });
            await supabase
                .from('driving_exam_dates')
                .update({ scheduled_email_sent_at: new Date().toISOString() })
                .eq('id', inserted.id);
        } catch (emailError) {
            console.error('exam scheduled email:', emailError.message);
        }

        return response(200, { ok: true, exam: inserted });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        console.error('create-exam-date:', error.message);
        const statusCode = authErrors.includes(error.message) ? 401 : error.statusCode || 500;
        return response(statusCode, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : error.message === 'EXAM_SLOT_ALREADY_BOOKED' ? 'EXAM_SLOT_ALREADY_BOOKED' : 'EXAM_DATE_FAILED'
        });
    }
};
