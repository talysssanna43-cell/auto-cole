const test = require('node:test');
const assert = require('node:assert/strict');
const { getAllowedAmounts, getHourlyPriceCents, getInstallmentSchedule, validatePurchase } = require('../netlify/functions/_lib/catalog');

test('les cours supplémentaires sont tarifés côté serveur', () => {
    assert.equal(getHourlyPriceCents('manual'), 5000);
    assert.equal(getHourlyPriceCents('auto'), 6000);
    assert.deepEqual(getAllowedAmounts({ hours: 5, transmission: 'auto' }, 'heures-conduite'), [30000]);
    assert.deepEqual(getAllowedAmounts({ hours: 0, transmission: 'manual' }, 'carte-rdv'), [8000]);
    assert.deepEqual(getAllowedAmounts({ hours: 0, transmission: 'manual' }, 'carte-accompagnement-manual'), [9000]);
    assert.deepEqual(getAllowedAmounts({ hours: 0, transmission: 'auto' }, 'carte-accompagnement-auto'), [10000]);
});

test('les montants officiels des packs ne dépendent pas du navigateur', () => {
    assert.deepEqual(getAllowedAmounts({}, 'boite-auto'), [49900]);
    assert.deepEqual(getAllowedAmounts({}, 'code'), [1500, 2000]);
    assert.deepEqual(getAllowedAmounts({}, 'inconnu'), []);
});

test('le webhook reçoit les deux confirmations Stripe nécessaires', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../netlify/functions/stripe-webhook.js'), 'utf8');
    assert.match(source, /payment_intent\.succeeded/);
    assert.match(source, /checkout\.session\.completed/);
    assert.match(source, /processSuccessfulPayment/);
});

test('le paiement en plusieurs fois est limite a 2 ou 3 echeances exactes', () => {
    const payload = { amount: 51397, hours: 13, transmission: 'auto', installments: 3 };
    const schedule = getInstallmentSchedule(payload, 'boite-auto');
    assert.deepEqual(schedule.amounts, [17133, 17132, 17132]);
    assert.equal(schedule.amounts.reduce((sum, amount) => sum + amount, 0), 51397);
    assert.equal(getInstallmentSchedule({ ...payload, installments: 4 }, 'boite-auto'), null);
});

test('le serveur exige le consentement avant de creer un paiement fractionne', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../netlify/functions/create-payment-intent.js'), 'utf8');
    assert.match(source, /installmentConsent !== true/);
    assert.match(source, /consent_at:/);
});

test('a displayed pack cannot credit more courses than its official definition', () => {
    assert.equal(validatePurchase({ amount: 49900, hours: 13, transmission: 'auto' }, 'boite-auto'), true);
    assert.equal(validatePurchase({ amount: 49900, hours: 99, transmission: 'auto' }, 'boite-auto'), false);
    assert.equal(validatePurchase({ amount: 23900, hours: 5, transmission: 'manual' }, 'tarif-chill-5'), true);
    assert.equal(validatePurchase({ amount: 23900, hours: 5, transmission: 'manual' }, 'tarif-zen-5'), true);
    assert.equal(validatePurchase({ amount: 49900, hours: 13, transmission: 'auto' }, 'tarif-zen-auto-13'), true);
    assert.equal(validatePurchase({ amount: 100, hours: 5, transmission: 'manual' }, 'tarif-chill-5'), false);
});

test('second chance and accelerated packs match the displayed offers', () => {
    assert.equal(validatePurchase({ amount: 56900, hours: 6, transmission: 'manual' }, 'second-chance'), true);
    assert.equal(validatePurchase({ amount: 56900, hours: 13, transmission: 'manual' }, 'second-chance'), false);
    assert.equal(validatePurchase({ amount: 99900, hours: 20, transmission: 'manual' }, 'tarif-aac-accelere-20'), true);
    assert.equal(validatePurchase({ amount: 73900, hours: 13, transmission: 'auto' }, 'tarif-aac-auto-accelere-13'), true);
});

test('les douze tarifs promotionnels manuels correspondent au classeur fourni', () => {
    const expected = {
        chill: { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
        premium: { 5: 38900, 10: 59900, 20: 79900, 25: 109500 },
        accelere: { 5: 48900, 10: 74900, 20: 89900, 25: 119900 }
    };

    for (const [pack, prices] of Object.entries(expected)) {
        for (const [hours, amount] of Object.entries(prices)) {
            assert.equal(
                validatePurchase({ amount, hours: Number(hours), transmission: 'manual' }, `tarif-${pack}-${hours}`),
                true,
                `${pack} ${hours} cours`
            );
        }
    }

    assert.equal(validatePurchase({ amount: 114900, hours: 30, transmission: 'manual' }, 'tarif-chill-30'), false);
    assert.equal(validatePurchase({ amount: 124900, hours: 30, transmission: 'manual' }, 'tarif-premium-30'), false);
    assert.equal(validatePurchase({ amount: 139900, hours: 30, transmission: 'manual' }, 'tarif-accelere-30'), false);
});

test('les anciens packs 30 cours restent lisibles mais ne peuvent plus etre choisis', () => {
    const { computePackChange, getCurrentPack, getPack } = require('../netlify/functions/_lib/pack-change');
    assert.equal(getCurrentPack({ forfait: 'tarif-chill-30' }).courses, 30);
    assert.equal(getPack('tarif-chill-30'), null);
    assert.equal(getPack('tarif-chill-25').price, 965);
    assert.throws(
        () => computePackChange({ forfait: 'tarif-chill-20' }, 'tarif-chill-30'),
        /INVALID_PACK/
    );
});

test('Stripe valide les packs 25 cours au comptant et en plusieurs fois', () => {
    const packs = [
        { id: 'tarif-chill-25', amount: 96500 },
        { id: 'tarif-premium-25', amount: 109500 },
        { id: 'tarif-accelere-25', amount: 119900 }
    ];

    for (const pack of packs) {
        assert.equal(validatePurchase({ amount: pack.amount, hours: 25, transmission: 'manual' }, pack.id), true);
        for (const installments of [2, 3]) {
            const total = Math.round(pack.amount * 1.03);
            const payload = { amount: total, hours: 25, transmission: 'manual', installments };
            assert.equal(validatePurchase(payload, pack.id), true);
            const schedule = getInstallmentSchedule(payload, pack.id);
            assert.equal(schedule.amounts.length, installments);
            assert.equal(schedule.amounts.reduce((sum, amount) => sum + amount, 0), total);
        }
    }

    const fs = require('node:fs');
    const stripeSource = fs.readFileSync(require.resolve('../netlify/functions/create-payment-intent.js'), 'utf8');
    assert.match(stripeSource, /validatePurchase\(payload, packId\)/);
    assert.match(stripeSource, /amount:\s*chargedAmount/);
    assert.match(stripeSource, /pack_id:\s*packId/);
});

test('the server rejects a transmission that does not match the selected pack', () => {
    assert.equal(validatePurchase({ amount: 49900, hours: 13, transmission: 'manual' }, 'tarif-chill-auto-13'), false);
    assert.equal(validatePurchase({ amount: 69900, hours: 20, transmission: 'auto' }, 'tarif-chill-20'), false);
});

test('active admin workflows do not rely on unsupported prompt dialogs', () => {
    const fs = require('node:fs');
    const planning = fs.readFileSync(require.resolve('../assets/js/admin-planning.js'), 'utf8');
    const accounting = fs.readFileSync(require.resolve('../assets/js/admin-comptabilite.js'), 'utf8');
    assert.doesNotMatch(planning, /\bprompt\s*\(/);
    assert.doesNotMatch(accounting, /\bprompt\s*\(/);
});

test('cash and installment card fields use separate Stripe Elements instances', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../assets/js/inscription.js'), 'utf8');
    assert.match(source, /const installmentsElements = stripe\.elements\(\)/);
    assert.match(source, /installmentsElements\.create\('cardNumber'/);
});

test('student and admin bookings enforce Sunday closure on the server', () => {
    const fs = require('node:fs');
    for (const file of ['student-book-slot.js', 'admin-book-slot.js']) {
        const source = fs.readFileSync(require.resolve(`../netlify/functions/${file}`), 'utf8');
        assert.match(source, /isSundayInParis\(startAt\)/);
        assert.match(source, /SUNDAY_CLOSED/);
    }
});

test('refusing a cancellation keeps the reservation active', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../netlify/functions/admin-cancellation-decision.js'), 'utf8');
    assert.doesNotMatch(source, /status:\s*'cancelled_refused'/);
    assert.match(source, /REQUEST_ALREADY_PROCESSED/);
});

test('accounting does not count the same Stripe payment more than once', () => {
    const { _test } = require('../netlify/functions/admin-accounting-data.js');
    const rows = [
        { id: 'invoice-1', stripe_payment_intent_id: 'pi_same', amount: 649, email: 'a@example.fr', payment_date: '2026-08-10', pack: 'tarif-chill-20', hours_purchased: 20 },
        { id: 'payment-1', stripe_payment_intent_id: 'pi_same', amount: 649, email: 'a@example.fr', payment_date: '2026-08-10', pack: 'tarif-chill-20', hours_purchased: 20 }
    ];
    assert.equal(_test.dedupeInvoices(rows).length, 1);
});

test('accounting includes instructor bonuses in cash outflow and EBE', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../netlify/functions/admin-accounting-data.js'), 'utf8');
    assert.match(source, /const decaissements = fixedCosts \+ variableExpenses \+ bonusCharges/);
    assert.match(source, /const ebe = valeurAjoutee - salaryCharges - bonusCharges - taxes/);
});

test('every admin server endpoint checks an active admin session', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const directory = path.resolve(__dirname, '../netlify/functions');
    const files = fs.readdirSync(directory).filter((file) => /^admin-.*\.js$/.test(file));
    assert.ok(files.length >= 10);
    for (const file of files) {
        const source = fs.readFileSync(path.join(directory, file), 'utf8');
        assert.match(source, /verifySession\(getBearerToken\(event\), \['admin'\]\)/, `${file} must require the admin role`);
        assert.match(source, /assertSessionActive\(/, `${file} must verify that the account is active`);
    }
});

test('payment emails are never sent directly from the browser', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../assets/js/inscription.js'), 'utf8');
    assert.doesNotMatch(source, /sendPaymentConfirmationEmail/);
});

test('public registration reaches the server before any legacy browser query', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../assets/js/inscription.js'), 'utf8');
    const secureBranch = source.indexOf('await processPublicRegistration(data, documents);');
    const legacyUsersQuery = source.indexOf(".from('users')");
    assert.ok(secureBranch >= 0);
    assert.ok(legacyUsersQuery > secureBranch);
    assert.match(source, /create-registration-request/);
});

test('admin login is resolved before instructor login for the same email', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../netlify/functions/auth-login.js'), 'utf8');
    const userLookup = source.indexOf(".from('users')");
    const adminPriority = source.indexOf("user?.is_admin === true");
    const instructorLookup = source.indexOf(".from('instructors')");
    const configuredFallback = source.indexOf('configuredAdmin');

    assert.ok(userLookup >= 0);
    assert.ok(adminPriority > userLookup);
    assert.ok(instructorLookup > adminPriority);
    assert.ok(configuredFallback > instructorLookup);
});
