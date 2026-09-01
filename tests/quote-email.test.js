const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
    adminQuoteEmailHtml,
    buildQuotePdf,
    clientQuoteEmailHtml,
    quoteFileName
} = require('../netlify/functions/_lib/quote-pdf');
const { _test } = require('../netlify/functions/submit-quote');

function validPayload(overrides = {}) {
    return {
        prenom: 'Naila',
        nom: 'Test',
        age: 18,
        nationalite: 'Française',
        email: 'naila@example.com',
        telephone: '06 12 34 56 78',
        financement: 'CPF',
        organisme: 'Mon Compte Formation',
        organisme_email: '',
        pack_id: 'tarif-chill-20',
        amount: 69900,
        hours: 20,
        transmission: 'manual',
        disponibilite: 'Flexible',
        objectif: 'Budget',
        message: 'Je souhaite commencer rapidement.',
        ...overrides
    };
}

function validQuote(overrides = {}) {
    const quote = _test.normalizeQuoteRequest(validPayload(overrides));
    assert.equal(_test.validateQuoteRequest(quote), '');
    return quote;
}

test('le PDF du devis contient une référence et un montant validés', () => {
    const quote = validQuote();
    const pdf = buildQuotePdf(quote);
    const source = pdf.toString('binary');

    assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4');
    assert.ok(pdf.length > 2000);
    assert.match(source, new RegExp(quote.reference));
    assert.match(source, /699,00 EUR TTC/);
    assert.equal(quoteFileName(quote.reference), `Devis_Auto_Ecole_Breteuil_${quote.reference}.pdf`);
});

test('les e-mails client et admin annoncent et joignent le même devis', () => {
    const quote = validQuote();
    quote.prenom = '<Naila>';
    const clientHtml = clientQuoteEmailHtml(quote);
    const adminHtml = adminQuoteEmailHtml(quote);

    assert.match(clientHtml, /joint à cet e-mail au format PDF/);
    assert.match(clientHtml, /699,00 EUR TTC/);
    assert.match(adminHtml, /Le PDF envoyé au client est également joint/);
    assert.doesNotMatch(clientHtml, /<Naila>/);
    assert.match(clientHtml, /&lt;Naila&gt;/);
});

test('une offre ou un prix modifié dans le navigateur est refusé', () => {
    const alteredPrice = _test.normalizeQuoteRequest(validPayload({ amount: 100 }));
    const alteredTransmission = _test.normalizeQuoteRequest(validPayload({ transmission: 'auto' }));

    assert.equal(_test.validateQuoteRequest(alteredPrice), 'INVALID_OFFER');
    assert.equal(_test.validateQuoteRequest(alteredTransmission), 'INVALID_OFFER');
});

test('le formulaire passe uniquement par la fonction serveur de devis PDF', () => {
    const source = fs.readFileSync(require.resolve('../devis.html'), 'utf8');
    const functionSource = fs.readFileSync(require.resolve('../netlify/functions/submit-quote.js'), 'utf8');

    assert.match(source, /fetch\('\/.netlify\/functions\/submit-quote'/);
    assert.doesNotMatch(source, /formsubmit\.co/);
    assert.doesNotMatch(source, /\.from\('demandes_devis'\)/);
    assert.match(functionSource, /validatePurchase\(/);
    assert.match(functionSource, /attachments:\s*\[pdfAttachment\]/);
});
