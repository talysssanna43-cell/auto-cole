const { assertSessionActive, getBearerToken, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, max = 500) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function validExamDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
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

        const studentEmail = clean(body.student_email, 180).toLowerCase();
        const studentName = clean(body.student_name, 180);
        const result = clean(body.result, 20);
        const examDate = clean(body.exam_date, 10);
        const instructor = clean(body.instructor, 120);
        const rating = Number(body.rating);

        if (!studentEmail || !studentEmail.includes('@') || !studentName || !instructor) {
            return response(400, { ok: false, error: 'MISSING_FIELDS' });
        }
        if (!['passed', 'failed'].includes(result) || !validExamDate(examDate)) {
            return response(400, { ok: false, error: 'INVALID_EXAM_RESULT' });
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return response(400, { ok: false, error: 'INVALID_RATING' });
        }

        const examResultData = {
            student_email: studentEmail,
            student_name: studentName,
            result,
            exam_date: examDate,
            instructor,
            rating,
            appreciation: clean(body.appreciation, 2000) || null,
            submitted_at: new Date().toISOString(),
            submitted_by_admin: true
        };

        const { error: insertError } = await supabase
            .from('exam_results')
            .insert(examResultData);
        if (insertError) throw insertError;

        await supabase
            .from('driving_exam_dates')
            .update({
                result,
                rating,
                appreciation: examResultData.appreciation,
                result_submitted_at: new Date().toISOString()
            })
            .ilike('student_email', studentEmail)
            .eq('exam_date', examDate);

        return response(200, { ok: true, instructor });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-submit-exam-result:', error);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : 'EXAM_RESULT_FAILED'
        });
    }
};
