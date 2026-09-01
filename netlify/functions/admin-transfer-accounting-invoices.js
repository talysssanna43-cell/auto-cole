const { assertSessionActive, getBearerToken, getEnv, getSupabaseAdmin, verifySession } = require('./_lib/auth');
const { handleOptions, parseJsonBody, response } = require('./_lib/http');

function clean(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function pdfEscape(value) {
    return String(value ?? '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/[\\()]/g, '\\$&');
}

function line(text, x, y, size = 10, bold = false, color = '0 0 0') {
    return `BT ${color} rg /F${bold ? '2' : '1'} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;
}

function rect(x, y, width, height, color) {
    return `q ${color} rg ${x} ${y} ${width} ${height} re f Q\n`;
}

function euro(value) {
    return `${Number(value || 0).toFixed(2)} EUR`;
}

function buildPdf({ monthLabel, invoices, summary }) {
    const pink = '0.96 0.17 0.53';
    const blue = '0.00 0.44 0.89';
    const green = '0.20 0.78 0.35';
    const navy = '0.07 0.08 0.16';
    const softPink = '1.00 0.93 0.97';
    const softBlue = '0.93 0.97 1.00';
    const light = '0.97 0.98 1.00';
    let y = 0;
    let content = '';

    content += rect(0, 760, 595, 82, pink);
    content += line('Auto-Ecole Breteuil', 42, 804, 22, true, '1 1 1');
    content += line('Recapitulatif comptable des factures et forfaits vendus', 42, 782, 11, false, '1 1 1');
    content += line(monthLabel || 'mois selectionne', 450, 804, 13, true, '1 1 1');

    y = 704;
    [
        ['Encaissements', summary?.encaissements, blue, softBlue],
        ['Decaissements', summary?.decaissements, pink, softPink],
        ['Solde tresorerie', summary?.soldeTresorerieDisponible, green, '0.93 1.00 0.95']
    ].forEach(([label, value, color, bg], index) => {
        const x = 42 + index * 170;
        content += rect(x, y, 150, 52, bg);
        content += line(label, x + 12, y + 32, 8, true, navy);
        content += line(euro(value), x + 12, y + 12, 15, true, color);
    });

    y = 650;
    content += line('Factures du mois', 42, y, 15, true, navy);
    content += line(`${(invoices || []).length} facture(s) trouvee(s)`, 430, y, 9, true, pink);
    y -= 26;
    content += rect(42, y - 6, 512, 22, navy);
    content += line('Date', 52, y, 8, true, '1 1 1');
    content += line('Facture', 104, y, 8, true, '1 1 1');
    content += line('Client', 190, y, 8, true, '1 1 1');
    content += line('Forfait', 340, y, 8, true, '1 1 1');
    content += line('Montant', 500, y, 8, true, '1 1 1');
    y -= 20;

    (invoices || []).slice(0, 26).forEach((invoice, index) => {
        const date = new Date(invoice.payment_date || Date.now()).toLocaleDateString('fr-FR');
        if (index % 2 === 0) content += rect(42, y - 5, 512, 18, light);
        content += line(date, 52, y, 7.5, false, navy);
        content += line(clean(invoice.invoice_number, 18), 104, y, 7.5, false, navy);
        content += line(clean(invoice.customer || invoice.email, 30), 190, y, 7.5, true, navy);
        content += line(clean(invoice.pack, 28), 340, y, 7.5, false, navy);
        content += line(euro(invoice.amount), 500, y, 7.5, true, pink);
        y -= 18;
    });

    if (!(invoices || []).length) content += line('Aucune facture disponible sur ce mois.', 52, y, 10, false, navy);
    if ((invoices || []).length > 26) {
        content += line(`... ${(invoices || []).length - 26} ligne(s) supplementaire(s) dans le site`, 42, y, 8, true, navy);
    }
    content += rect(0, 0, 595, 34, navy);
    content += line('Auto-Ecole Breteuil - 04 91 53 36 98 - breteuilautoecole@gmail.com', 42, 14, 8, false, '1 1 1');

    const stream = `<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}endstream`;
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        stream
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'binary'));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'binary');
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
        const to = clean(body?.to, 254).toLowerCase();
        if (!validEmail(to)) return response(400, { ok: false, error: 'INVALID_EMAIL' });

        const resendKey = getEnv('RESEND_API_KEY');
        if (!resendKey) return response(500, { ok: false, error: 'EMAIL_NOT_CONFIGURED' });

        const invoices = Array.isArray(body.invoices) ? body.invoices : [];
        const summary = body.summary || {};
        const monthLabel = clean(body.monthLabel, 80);
        const pdfBase64 = buildPdf({ monthLabel, invoices, summary }).toString('base64');

        const mailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Auto-Ecole Breteuil <contact@autoecolebreteuil.fr>',
                to,
                subject: `Comptabilite Auto-Ecole Breteuil - ${monthLabel}`,
                html: `<p>Bonjour,</p><p>Veuillez trouver en piece jointe le recapitulatif des factures et forfaits vendus pour ${monthLabel}.</p><p>Auto-Ecole Breteuil</p>`,
                attachments: [{
                    filename: `factures-auto-ecole-breteuil-${monthLabel.replace(/[^A-Za-z0-9_-]+/g, '_') || 'mois'}.pdf`,
                    content: pdfBase64
                }]
            })
        });

        const result = await mailResponse.json().catch(() => ({}));
        if (!mailResponse.ok) throw new Error(`EMAIL_PROVIDER_ERROR:${JSON.stringify(result)}`);
        return response(200, { ok: true });
    } catch (error) {
        const authErrors = ['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED', 'FORBIDDEN', 'ACCOUNT_DISABLED'];
        const status = authErrors.includes(error.message) ? 401 : 500;
        console.error('admin-transfer-accounting-invoices:', error.message);
        return response(status, { ok: false, error: status === 401 ? 'AUTH_REQUIRED' : 'TRANSFER_FAILED' });
    }
};
