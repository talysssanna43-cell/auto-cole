function cleanPdfText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function pdfEscape(value) {
    return cleanPdfText(value)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

function formatMoney(amountCents) {
    return `${(Number(amountCents || 0) / 100).toFixed(2).replace('.', ',')} EUR TTC`;
}

function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function makePdfLine(text, x, y, size = 10, bold = false) {
    return `BT /F${bold ? '2' : '1'} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;
}

function wrapText(value, maxCharacters = 72) {
    const words = cleanPdfText(value).split(/\s+/).filter(Boolean);
    if (!words.length) return ['Non precise'];

    const lines = [];
    let current = '';
    for (const word of words) {
        if (word.length > maxCharacters) {
            if (current) lines.push(current);
            lines.push(word.slice(0, maxCharacters));
            current = word.slice(maxCharacters);
            continue;
        }
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxCharacters) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function addWrappedLines(content, value, x, y, options = {}) {
    const lines = wrapText(value, options.maxCharacters || 72).slice(0, options.maxLines || 3);
    const lineHeight = options.lineHeight || 15;
    for (const line of lines) {
        content.value += makePdfLine(line, x, y, options.size || 9, options.bold || false);
        y -= lineHeight;
    }
    return y;
}

function buildQuotePdf(quote) {
    let stream = '';
    const content = { value: '' };

    content.value += '0.93 0.16 0.49 rg 0 708 612 84 re f\n';
    content.value += '1 1 1 rg\n';
    content.value += makePdfLine('AUTO-ECOLE BRETEUIL', 42, 753, 21, true);
    content.value += makePdfLine('1A Rue Edouard Delanglade - 13006 Marseille', 42, 731, 9);
    content.value += makePdfLine('DEVIS ESTIMATIF', 408, 744, 18, true);

    content.value += '0.10 0.10 0.17 rg\n';
    content.value += makePdfLine(`Reference : ${quote.reference}`, 42, 669, 11, true);
    content.value += makePdfLine(`Date d'emission : ${formatDate(quote.createdAt)}`, 390, 669, 9);
    content.value += makePdfLine(`Valable jusqu'au : ${formatDate(quote.validUntil)}`, 390, 653, 9);

    content.value += '0.97 0.97 0.98 rg 32 545 548 82 re f\n';
    content.value += '0.10 0.10 0.17 rg\n';
    content.value += makePdfLine('CLIENT', 48, 605, 11, true);
    content.value += makePdfLine(`${quote.prenom} ${quote.nom}`, 48, 585, 10, true);
    content.value += makePdfLine(quote.email, 48, 568, 9);
    content.value += makePdfLine(quote.telephone, 320, 585, 9);
    content.value += makePdfLine(`Age : ${quote.age} ans`, 320, 568, 9);

    content.value += makePdfLine('FORMATION DEMANDEE', 42, 510, 11, true);
    let y = addWrappedLines(content, quote.offerName, 42, 490, {
        maxCharacters: 74,
        maxLines: 2,
        size: 10,
        bold: true,
        lineHeight: 16
    });
    y -= 4;
    content.value += '0.93 0.16 0.49 rg\n';
    content.value += makePdfLine(formatMoney(quote.amountCents), 414, 490, 17, true);
    content.value += '0.10 0.10 0.17 rg\n';
    content.value += makePdfLine(`Transmission : ${quote.transmissionLabel}`, 42, y, 9);
    content.value += makePdfLine(`Volume : ${quote.hoursLabel}`, 260, y, 9);

    y -= 36;
    content.value += makePdfLine('INFORMATIONS DE LA DEMANDE', 42, y, 11, true);
    y -= 21;
    content.value += makePdfLine(`Financement : ${quote.financement}`, 42, y, 9);
    y -= 16;
    content.value += makePdfLine(`Organisme : ${quote.organisme}`, 42, y, 9);
    y -= 16;
    content.value += makePdfLine(`Disponibilites : ${quote.disponibilite || 'Non precisees'}`, 42, y, 9);
    y -= 16;
    content.value += makePdfLine(`Objectif : ${quote.objectif || 'Non precise'}`, 42, y, 9);
    y -= 19;
    content.value += makePdfLine('Informations complementaires :', 42, y, 9, true);
    y -= 15;
    y = addWrappedLines(content, quote.message || 'Aucune information complementaire.', 42, y, {
        maxCharacters: 92,
        maxLines: 3,
        size: 8,
        lineHeight: 13
    });

    content.value += '0.95 0.96 0.97 rg 32 102 548 68 re f\n';
    content.value += '0.22 0.24 0.30 rg\n';
    content.value += makePdfLine('CONDITIONS', 46, 151, 9, true);
    content.value += makePdfLine("Ce devis estimatif est etabli d'apres les informations transmises en ligne.", 46, 135, 8);
    content.value += makePdfLine('La validation definitive depend du dossier, des disponibilites et de la signature du contrat.', 46, 122, 8);

    content.value += '0.10 0.10 0.17 rg\n';
    content.value += makePdfLine('Auto-Ecole Breteuil - Tel. 04 91 53 36 98 - breteuilautoecole@gmail.com', 42, 70, 8);
    content.value += makePdfLine('TVA : FR89398665596 - Prix indique TTC', 42, 56, 8);

    stream += content.value;
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        `<< /Length ${Buffer.byteLength(stream, 'binary')} >>\nstream\n${stream}endstream`
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

function quoteFileName(reference) {
    const safeReference = cleanPdfText(reference).replace(/[^A-Za-z0-9_-]/g, '_');
    return `Devis_Auto_Ecole_Breteuil_${safeReference}.pdf`;
}

function clientQuoteEmailHtml(quote) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#17172d;line-height:1.65;">
            <div style="background:#ec287e;color:#fff;padding:26px 28px;">
                <h1 style="margin:0 0 8px;font-size:26px;">Votre devis est prêt</h1>
                <p style="margin:0;">Référence ${escapeHtml(quote.reference)}</p>
            </div>
            <div style="padding:28px;background:#fff;border:1px solid #e5e7eb;border-top:0;">
                <p>Bonjour ${escapeHtml(quote.prenom)},</p>
                <p>Nous avons bien reçu votre demande. Votre devis Auto-Ecole Breteuil est joint à cet e-mail au format PDF.</p>
                <div style="background:#f8fafc;border-left:4px solid #ec287e;padding:16px 18px;margin:22px 0;">
                    <p style="margin:0 0 8px;"><strong>Formation :</strong> ${escapeHtml(quote.offerName)}</p>
                    <p style="margin:0;font-size:22px;color:#db2777;"><strong>${escapeHtml(formatMoney(quote.amountCents))}</strong></p>
                </div>
                <p>Ce devis estimatif reste valable jusqu'au ${escapeHtml(formatDate(quote.validUntil))}. L'équipe vous contactera pour vérifier votre dossier, vos disponibilités et finaliser l'inscription.</p>
                <p>Une question ? Appelez-nous au <strong>04 91 53 36 98</strong> ou répondez directement à cet e-mail.</p>
                <p style="margin-top:26px;"><strong>L'équipe Auto-Ecole Breteuil</strong><br>1A Rue Edouard Delanglade, 13006 Marseille</p>
            </div>
        </div>
    `;
}

function adminQuoteEmailHtml(quote) {
    const rows = [
        ['Référence', quote.reference],
        ['Client', `${quote.prenom} ${quote.nom}`],
        ['Âge / nationalité', `${quote.age} ans / ${quote.nationalite}`],
        ['E-mail', quote.email],
        ['Téléphone', quote.telephone],
        ['Formation', quote.offerName],
        ['Prix', formatMoney(quote.amountCents)],
        ['Financement', quote.financement],
        ['Organisme', quote.organisme],
        ["E-mail de l'organisme", quote.organismeEmail || 'Non renseigné'],
        ['Disponibilités', quote.disponibilite || 'Non renseignées'],
        ['Objectif', quote.objectif || 'Non renseigné'],
        ['Message', quote.message || 'Aucun message']
    ];

    return `
        <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#17172d;line-height:1.55;">
            <div style="background:#17172d;color:#fff;padding:24px 26px;">
                <h1 style="color:#ec4899;margin:0 0 8px;font-size:25px;">Nouvelle demande de devis</h1>
                <p style="margin:0;">Le PDF envoyé au client est également joint à cet e-mail.</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:0;background:#fff;">
                ${rows.map(([label, value]) => `
                    <div style="display:flex;gap:16px;padding:12px 18px;border-bottom:1px solid #f1f5f9;">
                        <strong style="width:180px;color:#db2777;">${escapeHtml(label)}</strong>
                        <span style="flex:1;">${escapeHtml(value)}</span>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top:22px;">
                <a href="mailto:${escapeHtml(quote.email)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;">Répondre au client</a>
                <a href="tel:${escapeHtml(String(quote.telephone).replace(/[^\d+]/g, ''))}" style="display:inline-block;margin-left:8px;background:#17172d;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700;">Appeler le client</a>
            </p>
        </div>
    `;
}

module.exports = {
    buildQuotePdf,
    clientQuoteEmailHtml,
    adminQuoteEmailHtml,
    formatMoney,
    quoteFileName
};
