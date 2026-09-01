const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { resultReceivedHtml, sendResendEmail } = require('./_lib/exam-email');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');
const { consumeRateLimit } = require('./_lib/rate-limit');

function text(value, maxLength) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function validExamDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return !Number.isNaN(date.getTime()) && date <= today;
}

function mainInstructor(reservations) {
    const counts = new Map();
    for (const reservation of reservations || []) {
        const slot = reservation.slots;
        if (!slot?.instructor || !slot.end_at || new Date(slot.end_at) > new Date()) continue;
        counts.set(slot.instructor, (counts.get(slot.instructor) || 0) + 1);
    }
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const entry = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
    if (!entry || total === 0 || entry[1] / total < 0.75) return null;
    return entry[0];
}

function validPdf(value) {
    if (!value) return true;
    if (typeof value !== 'object') return false;
    if (text(value.name, 180).toLowerCase().endsWith('.pdf') === false) return false;
    const type = String(value.type || '');
    if (type && type !== 'application/pdf') return false;
    const data = String(value.data || '');
    return data.startsWith('data:application/pdf;base64,') && data.length < 6_500_000;
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
        const rate = consumeRateLimit(event, {
            scope: 'exam-result',
            identifier: session.email,
            limit: 2,
            windowMs: 24 * 60 * 60 * 1000
        });
        if (!rate.allowed) {
            return response(429, { ok: false, error: 'TOO_MANY_REQUESTS', retryAfter: rate.retryAfter }, {
                'Retry-After': String(rate.retryAfter)
            });
        }

        const result = text(body.result, 20);
        const examDate = text(body.exam_date, 10);
        const rating = Number(body.rating);
        const examDateId = text(body.exam_date_id, 80);
        const resultPdf = body.result_pdf || null;
        if (!['passed', 'failed'].includes(result) || !validExamDate(examDate)
            || !Number.isInteger(rating) || rating < 1 || rating > 5 || !validPdf(resultPdf)) {
            return response(400, { ok: false, error: 'INVALID_EXAM_RESULT' });
        }

        const [{ data: student, error: studentError }, { data: reservations, error: reservationsError }] = await Promise.all([
            supabase.from('users').select('prenom,nom').ilike('email', session.email).maybeSingle(),
            supabase.from('reservations')
                .select('status,slots(instructor,end_at)')
                .ilike('email', session.email)
                .in('status', ['upcoming', 'done', 'completed'])
        ]);
        if (studentError) throw studentError;
        if (reservationsError) throw reservationsError;

        let instructor = mainInstructor(reservations);
        if (!student || !instructor) {
            const { data: scheduledExam, error: scheduledExamError } = await supabase
                .from('driving_exam_dates')
                .select('id,instructor')
                .eq('id', examDateId || '00000000-0000-0000-0000-000000000000')
                .ilike('student_email', session.email)
                .maybeSingle();
            if (scheduledExamError) throw scheduledExamError;
            instructor = scheduledExam?.instructor || null;
            if (!instructor) return response(400, { ok: false, error: 'INSTRUCTOR_NOT_ELIGIBLE' });
        }

        const { data: existing, error: existingError } = await supabase
            .from('exam_results')
            .select('id')
            .ilike('student_email', session.email)
            .eq('exam_date', examDate)
            .maybeSingle();
        if (existingError) throw existingError;
        if (existing) return response(409, { ok: false, error: 'EXAM_RESULT_ALREADY_SUBMITTED' });

        const studentName = student
            ? `${student.prenom || ''} ${student.nom || ''}`.trim()
            : text(body.student_name, 180);

        const examResultData = {
            student_email: session.email,
            student_name: studentName || session.email,
            result,
            exam_date: examDate,
            instructor,
            rating,
            appreciation: text(body.appreciation, 2000) || null,
            submitted_at: new Date().toISOString(),
            result_pdf: resultPdf || null
        };

        const { error: insertError } = await supabase.from('exam_results').insert(examResultData);
        if (insertError) throw insertError;

        if (examDateId) {
            await supabase
                .from('driving_exam_dates')
                .update({
                    result,
                    rating,
                    appreciation: examResultData.appreciation,
                    result_pdf: resultPdf || null,
                    result_submitted_at: new Date().toISOString()
                })
                .eq('id', examDateId)
                .ilike('student_email', session.email);
        }

        try {
            await sendResendEmail({
                to: session.email,
                subject: result === 'passed'
                    ? 'Bravo pour ton permis - Auto-Ecole Breteuil'
                    : 'On continue ensemble - Auto-Ecole Breteuil',
                html: resultReceivedHtml(examResultData)
            });
        } catch (emailError) {
            console.error('exam result received email:', emailError.message);
        }

        return response(200, { ok: true, instructor });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        console.error('submit-exam-result:', error.message);
        return response(authErrors.includes(error.message) ? 401 : 500, {
            ok: false,
            error: authErrors.includes(error.message) ? 'AUTH_REQUIRED' : 'EXAM_RESULT_FAILED'
        });
    }
};
