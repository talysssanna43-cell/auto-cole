const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

const TABLE_NAME = 'driving_prep_progress';
const TOTAL_SESSIONS = 7;

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function cleanText(value, maxLength = 180) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function isMissingTable(error) {
    const message = String(error?.message || error?.details || '');
    return error?.code === '42P01' || error?.code === 'PGRST205' || /schema cache|does not exist|driving_prep_progress/i.test(message);
}

function isDrivingPack(user) {
    const pack = String(user?.forfait || user?.pack || '').toLowerCase();
    const goal = Number(user?.hours_goal || user?.hours_purchased || 0);
    if (goal > 0) return true;
    if (!pack) return false;
    if (pack.includes('code') || pack.includes('carte-rdv') || pack.includes('accompagnement')) return false;
    return [
        'tarif-',
        'chill',
        'zen',
        'premium',
        'accelere',
        'boite-auto',
        'aac',
        'supervisee',
        'second-chance',
        'am',
        'heure-conduite',
        'heures-conduite'
    ].some((prefix) => pack.startsWith(prefix) || pack === prefix);
}

async function loadStudent(supabase, email) {
    let { data, error } = await supabase
        .from('users')
        .select('id,email,prenom,nom,forfait,hours_goal,lesson_unit_minutes')
        .ilike('email', email)
        .maybeSingle();
    if (error) {
        const message = String(error?.message || error?.details || '');
        const missingLessonUnit = error?.code === '42703' || error?.code === 'PGRST204' || /lesson_unit_minutes|schema cache|column/i.test(message);
        if (missingLessonUnit) {
            const fallback = await supabase
                .from('users')
                .select('id,email,prenom,nom,forfait,hours_goal')
                .ilike('email', email)
                .maybeSingle();
            data = fallback.data;
            error = fallback.error;
        }
    }
    if (error) throw error;
    return data;
}

function summarize(items) {
    const rows = Array.isArray(items) ? items : [];
    const started = rows.length;
    const validated = rows.filter((item) => Number(item.best_percent || 0) >= 70).length;
    const toReview = rows.filter((item) => Number(item.best_percent || 0) > 0 && Number(item.best_percent || 0) < 70).length;
    const bestAverage = started
        ? Math.round(rows.reduce((sum, item) => sum + Number(item.best_percent || 0), 0) / started)
        : 0;
    return {
        total_sessions: TOTAL_SESSIONS,
        started_sessions: started,
        validated_sessions: validated,
        to_review_sessions: toReview,
        missing_sessions: Math.max(TOTAL_SESSIONS - started, 0),
        best_average: bestAverage
    };
}

async function listProgress(supabase, email) {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .ilike('student_email', email)
        .order('session_id', { ascending: true });
    if (error) throw error;
    return data || [];
}

async function upsertProgress(supabase, email, body) {
    const sessionId = Number(body.session_id || body.sessionId);
    const totalQuestions = Math.max(1, Math.min(300, Number(body.total_questions || body.total || 0) || 1));
    const bestScore = Math.max(0, Math.min(totalQuestions, Number(body.best_score || body.score || 0) || 0));
    const bestPercent = Math.round((bestScore / totalQuestions) * 100);
    const sessionTitle = cleanText(body.session_title || body.title || `Seance ${sessionId}`, 160);

    if (!Number.isInteger(sessionId) || sessionId < 1 || sessionId > 50) {
        const error = new Error('INVALID_SESSION_ID');
        error.statusCode = 400;
        throw error;
    }

    const existingResult = await supabase
        .from(TABLE_NAME)
        .select('*')
        .ilike('student_email', email)
        .eq('session_id', sessionId)
        .maybeSingle();
    if (existingResult.error) throw existingResult.error;

    const existing = existingResult.data;
    const previousPercent = Number(existing?.best_percent || 0);
    const shouldImprove = !existing || bestPercent >= previousPercent;
    const reviewedAt = new Date().toISOString();
    const payload = {
        student_email: email,
        session_id: sessionId,
        session_title: sessionTitle,
        best_score: shouldImprove ? bestScore : Number(existing.best_score || 0),
        total_questions: shouldImprove ? totalQuestions : Number(existing.total_questions || totalQuestions),
        best_percent: shouldImprove ? bestPercent : previousPercent,
        attempts: Number(existing?.attempts || 0) + 1,
        status: (shouldImprove ? bestPercent : previousPercent) >= 70 ? 'validated' : 'to_review',
        last_reviewed_at: reviewedAt,
        updated_at: reviewedAt
    };

    if (!existing) payload.first_reviewed_at = reviewedAt;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .upsert(payload, { onConflict: 'student_email,session_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    try {
        const session = verifySession(getBearerToken(event), ['student', 'admin']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const requestedEmail = normalizeEmail(event.queryStringParameters?.email);
        const email = session.app_role === 'admin' && requestedEmail ? requestedEmail : normalizeEmail(session.email);
        if (!email) return response(400, { ok: false, error: 'EMAIL_REQUIRED' });

        const student = await loadStudent(supabase, email);
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });
        if (!isDrivingPack(student)) {
            return response(403, { ok: false, error: 'NO_DRIVING_PACK' });
        }

        if (event.httpMethod === 'POST') {
            const body = parseJsonBody(event);
            if (!body) return response(400, { ok: false, error: 'INVALID_BODY' });
            try {
                const saved = await upsertProgress(supabase, email, body);
                const items = await listProgress(supabase, email);
                return response(200, { ok: true, storage_ready: true, item: saved, items, summary: summarize(items) });
            } catch (error) {
                if (!isMissingTable(error)) throw error;
                return response(200, {
                    ok: true,
                    storage_ready: false,
                    item: null,
                    items: [],
                    summary: summarize([]),
                    warning: 'DRIVING_PREP_PROGRESS_TABLE_MISSING'
                });
            }
        }

        try {
            const items = await listProgress(supabase, email);
            return response(200, { ok: true, storage_ready: true, student, items, summary: summarize(items) });
        } catch (error) {
            if (!isMissingTable(error)) throw error;
            return response(200, {
                ok: true,
                storage_ready: false,
                student,
                items: [],
                summary: summarize([]),
                warning: 'DRIVING_PREP_PROGRESS_TABLE_MISSING'
            });
        }
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED', 'INSCRIPTION_PENDING', 'INSCRIPTION_REJECTED'];
        const status = error.statusCode || (authErrors.includes(error.message) ? 401 : 500);
        console.error('driving-prep-progress:', error.message);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : (error.message || 'DRIVING_PREP_PROGRESS_FAILED')
        });
    }
};
