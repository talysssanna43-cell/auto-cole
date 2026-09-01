const {
    assertSessionActive,
    getBearerToken,
    getSupabaseAdmin,
    verifySession
} = require('./_lib/auth');
const { getPackDefinition } = require('./_lib/catalog');
const { createInvoicePdf } = require('./_lib/invoice-pdf');
const { handleOptions, response } = require('./_lib/http');

function clean(value, fallback = '') {
    const result = String(value ?? '').trim();
    return result || fallback;
}

function makeInvoiceNumber(packId) {
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const pack = clean(packId, 'FORFAIT').replace(/[^a-z0-9]+/gi, '-').toUpperCase();
    return `FACT-ADMIN-${stamp}-${pack}`;
}

function filePart(value) {
    return clean(value, 'facture')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'facture';
}

async function ensureAdminRegistrationInvoice(supabase, session, invoices) {
    const { data: registration, error: registrationError } = await supabase
        .from('inscription_notifications')
        .select('id,user_email,user_name,user_prenom,user_nom,user_telephone,pack,pack_label,hours_purchased,payment_method,status,created_at,transmission_type')
        .ilike('user_email', session.email)
        .eq('status', 'approved')
        .eq('payment_method', 'admin')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration?.pack) return invoices;

    const alreadyPresent = invoices.some((invoice) =>
        String(invoice.forfait || '') === String(registration.pack)
        && String(invoice.payment_method || '').toLowerCase() === 'admin'
    );
    if (alreadyPresent) return invoices;

    const definition = getPackDefinition(registration.pack);
    const amount = Number(definition?.amounts?.[0] || 0) / 100;
    if (!amount) return invoices;

    const studentName = clean(
        registration.user_name,
        `${clean(registration.user_prenom)} ${clean(registration.user_nom)}`.trim() || session.email
    );
    const invoicePayload = {
        invoice_number: makeInvoiceNumber(registration.pack),
        user_email: session.email,
        student_name: studentName,
        amount,
        payment_method: 'admin',
        description: `Forfait ${clean(registration.pack_label, registration.pack)}`,
        forfait: registration.pack,
        hours_purchased: Number(registration.hours_purchased || definition.hours || 0),
        payment_date: registration.created_at || new Date().toISOString()
    };

    const { data: created, error: createError } = await supabase
        .from('invoices')
        .insert(invoicePayload)
        .select('*')
        .single();
    if (createError) throw createError;

    return [created, ...invoices];
}

exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'METHOD_NOT_ALLOWED' });

    try {
        const session = verifySession(getBearerToken(event), ['student']);
        const supabase = getSupabaseAdmin();
        await assertSessionActive(session, supabase);

        const [{ data: invoiceRows, error: invoiceError }, { data: user, error: userError }] = await Promise.all([
            supabase
                .from('invoices')
                .select('*')
                .ilike('user_email', session.email)
                .order('payment_date', { ascending: false }),
            supabase
                .from('users')
                .select('prenom,nom,email,telephone')
                .ilike('email', session.email)
                .maybeSingle()
        ]);

        if (invoiceError) throw invoiceError;
        if (userError) throw userError;

        let invoices = await ensureAdminRegistrationInvoice(supabase, session, invoiceRows || []);
        invoices = invoices.map((invoice) => {
            const completeInvoice = {
                ...invoice,
                student_name: clean(invoice.student_name, `${clean(user?.prenom)} ${clean(user?.nom)}`.trim() || session.email),
                student_phone: clean(invoice.student_phone, user?.telephone)
            };
            return {
                ...completeInvoice,
                pdfBase64: createInvoicePdf(completeInvoice).toString('base64'),
                pdfFileName: `Facture_${filePart(invoice.invoice_number || invoice.id)}.pdf`
            };
        });

        return response(200, { ok: true, invoices });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('student-invoices:', error.message);
        return response(status, {
            ok: false,
            error: status === 401 ? 'AUTH_REQUIRED' : 'INVOICES_UNAVAILABLE'
        });
    }
};
