const { getSupabaseAdmin } = require('./_lib/auth');
const { examResultRequestHtml, sendResendEmail } = require('./_lib/exam-email');
const { requireScheduledInvocation } = require('./_lib/scheduled');

exports.handler = async (event) => {
    const blocked = requireScheduledInvocation(event);
    if (blocked) return blocked;

    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: exams, error } = await supabase
        .from('driving_exam_dates')
        .select('*')
        .lte('exam_date', cutoff)
        .is('result_requested_at', null)
        .is('result', null)
        .order('exam_date', { ascending: true })
        .limit(30);
    if (error) throw error;

    const results = [];
    for (const exam of exams || []) {
        try {
            await sendResendEmail({
                to: exam.student_email,
                subject: 'Renseigne ton résultat d\'examen - Auto-Ecole Breteuil',
                html: examResultRequestHtml(exam)
            });
            await supabase
                .from('driving_exam_dates')
                .update({ result_requested_at: new Date().toISOString() })
                .eq('id', exam.id);
            results.push({ id: exam.id, ok: true });
        } catch (emailError) {
            console.error('exam result request email:', exam.id, emailError.message);
            results.push({ id: exam.id, ok: false });
        }
    }

    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
};
