const {
    assertSessionActive,
    getBearerToken,
    getSupabaseAdmin,
    verifySession
} = require('./_lib/auth');
const { createInvoicePdf } = require('./_lib/invoice-pdf');
const { handleOptions, response } = require('./_lib/http');

function filePart(value) {
    return String(value || 'facture')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'facture';
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);
        const invoiceId = String(event.queryStringParameters?.id || '').trim();
        if (!invoiceId) return response(400, { ok: false, error: 'MISSING_INVOICE_ID' });

        const [{ data: invoice, error: invoiceError }, { data: user, error: userError }] = await Promise.all([
            supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .ilike('user_email', session.email)
                .maybeSingle(),
            supabase
                .from('users')
                .select('prenom,nom,telephone')
                .ilike('email', session.email)
                .maybeSingle()
        ]);
        if (invoiceError) throw invoiceError;
        if (userError) throw userError;
        if (!invoice) return response(404, { ok: false, error: 'INVOICE_NOT_FOUND' });

        const completeInvoice = {
            ...invoice,
            student_name: invoice.student_name || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || session.email,
            student_phone: user?.telephone || ''
        };
        const pdf = createInvoicePdf(completeInvoice);
        const fileName = `Facture_${filePart(invoice.invoice_number || invoice.id)}.pdf`;
        return response(200, { ok: true, fileName, pdfBase64: pdf.toString('base64') });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-invoice-pdf:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'PDF_UNAVAILABLE' });
    }
};
