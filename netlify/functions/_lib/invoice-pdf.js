function pdfEscape(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/([\\()])/g, '\\$1');
}

function money(value) {
    const amount = Number(value || 0);
    return `${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'} EUR`;
}

function dateFr(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
}

function textLine(text, x, y, size = 11, bold = false) {
    return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function buildPdf(objects) {
    let output = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets[index + 1] = Buffer.byteLength(output, 'binary');
        output += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(output, 'binary');
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        output += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(output, 'binary');
}

function createInvoicePdf(invoice) {
    const total = Number(invoice.amount || 0);
    const totalHt = total / 1.2;
    const tva = total - totalHt;
    const description = invoice.description || (invoice.forfait ? `Forfait ${invoice.forfait}` : 'Achat');
    const content = [
        '0.06 0.09 0.16 rg 0 782 595 60 re f',
        '0.93 0.28 0.60 rg',
        textLine('AUTO-ECOLE BRETEUIL', 36, 812, 20, true),
        textLine('FACTURE', 458, 812, 18, true),
        '0 0 0 rg',
        textLine('1A Rue Edouard Delanglade - 13006 Marseille', 36, 768, 9),
        textLine('04 91 53 36 98 - breteuilautoecole@gmail.com', 36, 754, 9),
        textLine('TVA : FR89398665596', 36, 740, 9),
        '0.93 0.28 0.60 RG 36 720 m 559 720 l S',
        textLine(`Facture N ${invoice.invoice_number || invoice.id}`, 36, 694, 12, true),
        textLine(`Date : ${dateFr(invoice.payment_date)}`, 390, 694, 11),
        textLine('ELEVE', 36, 654, 11, true),
        textLine(invoice.student_name || invoice.user_email || 'Eleve', 36, 634, 11),
        textLine(invoice.user_email || '', 36, 618, 10),
        textLine(invoice.student_phone || '', 36, 602, 10),
        '0.95 0.96 0.98 rg 36 535 523 42 re f',
        '0 0 0 rg',
        textLine('DESCRIPTION', 48, 551, 10, true),
        textLine('QUANTITE', 390, 551, 10, true),
        textLine('MONTANT TTC', 470, 551, 10, true),
        textLine(description, 48, 515, 10),
        textLine('1', 412, 515, 10),
        textLine(money(total), 475, 515, 10),
        '0.93 0.28 0.60 RG 360 470 m 559 470 l S',
        textLine(`Total HT : ${money(totalHt)}`, 390, 448, 10),
        textLine(`TVA 20% : ${money(tva)}`, 390, 429, 10),
        textLine(`TOTAL TTC : ${money(total)}`, 390, 402, 13, true),
        '0.13 0.70 0.38 rg',
        textLine('PAYE', 36, 402, 13, true),
        '0 0 0 rg',
        textLine(`Mode de paiement : ${invoice.payment_method || 'Non precise'}`, 36, 380, 10),
        textLine('Merci pour votre confiance.', 36, 104, 11, true),
        textLine('Auto-Ecole Breteuil vous accompagne jusqu au bout de votre formation.', 36, 86, 10),
        textLine('Document genere electroniquement.', 36, 52, 8)
    ].join('\n');

    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
    ];
    return buildPdf(objects);
}

module.exports = { createInvoicePdf };
