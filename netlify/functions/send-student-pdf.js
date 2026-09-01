const {
    assertSessionActive,
    getBearerToken,
    getEnv,
    getSupabaseAdmin,
    verifySession
} = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[character]);
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
        const studentEmail = String(body?.studentEmail || '').trim().toLowerCase();
        const pdfBase64 = String(body?.pdfBase64 || '');
        if (!studentEmail || !/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64) || pdfBase64.length > 5_000_000) {
            return response(400, { ok: false, error: 'INVALID_PDF' });
        }

        const { data: student, error } = await supabase
            .from('users')
            .select('prenom,nom,email')
            .ilike('email', studentEmail)
            .maybeSingle();
        if (error) throw error;
        if (!student) return response(404, { ok: false, error: 'STUDENT_NOT_FOUND' });

        const apiKey = getEnv('RESEND_API_KEY');
        const from = getEnv('RESEND_FROM_EMAIL');
        if (!apiKey || !from) return response(503, { ok: false, error: 'EMAIL_NOT_CONFIGURED' });

        const studentName = `${student.prenom || ''} ${student.nom || ''}`.trim();
        const mailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to: student.email,
                subject: 'Votre fiche r&eacute;capitulative - Auto-Ecole Breteuil',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17172a">
                        <h1 style="color:#ec4899">Auto-Ecole Breteuil</h1>
                        <p>Bonjour ${escapeHtml(studentName)},</p>
                        <p>Vous trouverez en pi&egrave;ce jointe votre fiche r&eacute;capitulative avec les informations utiles au suivi de votre formation.</p>
                        <p>Pour toute question, contactez-nous au <strong>04 91 53 36 98</strong>.</p>
                    </div>`,
                attachments: [{
                    filename: `Fiche_${studentName.replace(/[^A-Za-z0-9_-]+/g, '_') || 'eleve'}.pdf`,
                    content: pdfBase64
                }]
            })
        });
        if (!mailResponse.ok) throw new Error('EMAIL_PROVIDER_ERROR');
        return response(200, { ok: true });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('send-student-pdf:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'EMAIL_FAILED' });
    }
};
