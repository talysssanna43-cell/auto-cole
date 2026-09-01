const { getEnv } = require('./auth');

function euro(value) {
    return `${Number(value || 0).toFixed(2).replace('.', ',')} EUR`;
}

function cleanText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
}

function pdfEscape(value) {
    return cleanText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
}

function siteBaseUrl() {
    return (getEnv('URL', ['SITE_URL']) || 'https://autoecolebreteuil.com').replace(/\/$/, '');
}

function hasDrivingPreparationAccess(invoice) {
    const hours = Number(invoice.hours_purchased || invoice.hours || 0);
    const pack = String(invoice.forfait || invoice.pack_id || invoice.pack || '').toLowerCase();
    if (hours > 0) return true;
    if (!pack || pack.includes('code') || pack.includes('carte-rdv') || pack.includes('accompagnement')) return false;
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

function unitLabel(invoice, quantity) {
    const pack = String(invoice.forfait || invoice.pack_id || invoice.pack || '').toLowerCase();
    const courseBased = Number(invoice.lesson_unit_minutes || 0) === 45 || pack.startsWith('tarif-');
    if (courseBased) return `cours`;
    return Number(quantity || 0) > 1 ? 'heures' : 'heure';
}

function makePdfLine(text, x, y, size = 10, bold = false) {
    return `BT /F${bold ? '2' : '1'} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;
}

function buildInvoicePdf(invoice) {
    const totalTtc = Number(invoice.amount || 0);
    const totalHt = totalTtc / 1.2;
    const tva = totalTtc - totalHt;
    const date = new Date(invoice.payment_date || Date.now()).toLocaleDateString('fr-FR');
    let content = '';
    content += '0.93 0.28 0.60 rg 0 792 612 -74 re f\n';
    content += makePdfLine('AUTO ECOLE BRETEUIL', 42, 744, 22, true);
    content += makePdfLine('1A Rue Edouard Delanglade - 13006 Marseille', 42, 724, 9);
    content += makePdfLine('Tel: 04 91 53 36 98 - breteuilautoecole@gmail.com', 42, 710, 9);
    content += makePdfLine('FACTURE', 430, 724, 24, true);
    content += makePdfLine(`Facture n. ${invoice.invoice_number}`, 42, 660, 12, true);
    content += makePdfLine(`Date: ${date}`, 420, 660, 10);
    content += makePdfLine('Client', 42, 620, 12, true);
    content += makePdfLine(invoice.student_name, 42, 602, 10);
    content += makePdfLine(invoice.user_email, 42, 586, 10);
    content += makePdfLine('Prestation', 42, 540, 12, true);
    content += makePdfLine(invoice.description || 'Paiement Auto-Ecole Breteuil', 42, 520, 10);
    content += makePdfLine(`Heures creditees: ${Number(invoice.hours_purchased || 0)} h`, 42, 504, 10);
    content += makePdfLine(`Mode de paiement: ${invoice.payment_method || 'Stripe'}`, 42, 488, 10);
    content += makePdfLine(`Reference paiement: ${invoice.stripe_payment_intent_id || invoice.payment_reference || 'Stripe'}`, 42, 472, 9);
    content += '0.10 0.10 0.18 rg 330 382 220 82 re f\n';
    content += makePdfLine(`Total HT: ${euro(totalHt)}`, 350, 432, 10);
    content += makePdfLine(`TVA 20%: ${euro(tva)}`, 350, 412, 10);
    content += makePdfLine(`TOTAL TTC: ${euro(totalTtc)}`, 350, 390, 13, true);
    content += makePdfLine('Statut: paye', 42, 410, 11, true);
    content += makePdfLine('Merci pour votre confiance.', 42, 350, 11, true);
    content += makePdfLine('Auto-Ecole Breteuil - TVA FR89398665596', 42, 72, 8);

    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        `<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}endstream`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'binary'));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'binary');
}

function buildHtml(invoice, hoursAvailable) {
    const hours = Math.max(0, Number(hoursAvailable ?? invoice.hours_purchased ?? 0) || 0);
    const studentName = escapeHtml(invoice.student_name);
    const description = escapeHtml(invoice.description || 'votre formation');
    const baseUrl = siteBaseUrl();
    const studentSpaceUrl = `${baseUrl}/connexion.html?redirect=espace-eleve.html`;
    const preparationUrl = `${baseUrl}/cours-theorique.html`;
    const unit = unitLabel(invoice, hours);
    const hoursText = hours > 0
        ? `Votre solde de conduite a été mis à jour : vous disposez maintenant de <strong>${hours} ${unit}</strong> sur votre espace élève.`
        : 'Votre paiement est bien enregistré dans votre dossier élève.';
    const preparationBlock = hasDrivingPreparationAccess(invoice)
        ? `<div style="margin:24px 0;padding:18px;border-radius:18px;background:#f8fbff;border:1px solid #dbeafe">
                <p style="margin:0 0 10px;font-weight:700;color:#17172a">Votre plateforme de préparation conduite est ouverte.</p>
                <p style="margin:0 0 14px;color:#475569">Avant vos cours, vous pouvez réviser les points utiles au permis. Votre progression est enregistrée pour que vous et l'auto-école puissiez voir les séances validées et celles à revoir.</p>
                <a href="${preparationUrl}" style="display:inline-block;background:#13ce66;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Accéder à ma préparation</a>
           </div>`
        : '';

    return `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f7f7fb;color:#17172a">
            <div style="background:#17172a;padding:26px 30px">
                <h1 style="margin:0;color:#ec4899;font-size:24px">Auto-Ecole Breteuil</h1>
                <p style="margin:8px 0 0;color:#fff">Confirmation de paiement</p>
            </div>
            <div style="padding:30px;background:#fff">
                <p>Bonjour ${studentName},</p>
                <p>Nous vous confirmons que votre paiement pour <strong>${description}</strong> a bien été effectué.</p>
                <p>${hoursText}</p>
                <p>Votre facture est disponible en pièce jointe de cet e-mail, au format PDF.</p>
                ${preparationBlock}
                <p>Vous pouvez consulter votre solde d'heures, votre suivi et vos rendez-vous depuis votre espace élève :</p>
                <p style="margin:24px 0">
                    <a href="${studentSpaceUrl}" style="display:inline-block;background:#ec4899;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">Accéder à mon espace élève</a>
                </p>
                <p>Pour toute question, l'auto-école reste disponible au <strong>04 91 53 36 98</strong> ou à <strong>breteuilautoecole@gmail.com</strong>.</p>
                <p style="margin-top:26px">Toute l'équipe de l'Auto-Ecole Breteuil vous remercie pour votre confiance et vous dit à très bientôt.</p>
                <p><strong>L'équipe Auto-Ecole Breteuil</strong></p>
            </div>
        </div>`;
}

async function sendPaymentEmail(invoice, hoursAvailable) {
    const apiKey = getEnv('RESEND_API_KEY');
    const from = getEnv('RESEND_FROM_EMAIL');
    if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED');

    const pdfBase64 = buildInvoicePdf(invoice).toString('base64');
    const filename = `Facture_${cleanText(invoice.invoice_number).replace(/\s+/g, '_')}.pdf`;
    const mailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from,
            to: invoice.user_email,
            subject: 'Confirmation de paiement - Auto-Ecole Breteuil',
            html: buildHtml(invoice, hoursAvailable),
            attachments: [{ filename, content: pdfBase64 }]
        })
    });
    const result = await mailResponse.json().catch(() => ({}));
    if (!mailResponse.ok) throw new Error(`EMAIL_PROVIDER_ERROR:${JSON.stringify(result)}`);
    return result;
}

module.exports = { buildHtml, buildInvoicePdf, sendPaymentEmail };
