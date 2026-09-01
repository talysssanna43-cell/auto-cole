const PACK_PRICES_CENTS = Object.freeze({
    code: [1500, 2000],
    'code-etudiant': 1500,
    'code-classique': 2000,
    am: 35000,
    'boite-auto': 49900,
    '20h': { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
    chill: { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
    zen: { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
    accelere: { 5: 48900, 10: 74900, 20: 89900, 25: 119900 },
    aac: { 20: 88900, 30: 99900 },
    supervisee: { 20: 88900, 30: 99900 },
    'second-chance': 56900,
    'carte-rdv': 8000,
    'carte-accompagnement-manual': 9000,
    'carte-accompagnement-auto': 10000
});

const TARIF_PACK_PRICES_CENTS = Object.freeze({
    chill: { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
    zen: { 5: 23900, 10: 48900, 20: 69900, 25: 96500 },
    premium: { 5: 38900, 10: 59900, 20: 79900, 25: 109500 },
    accelere: { 5: 48900, 10: 74900, 20: 89900, 25: 119900 },
    'chill-auto': { 5: 26900, 13: 49900 },
    'zen-auto': { 5: 26900, 13: 49900 },
    'premium-auto': { 5: 37900, 13: 59900 },
    'accelere-auto': { 5: 49900, 13: 74900 },
    aac: { 20: 88900, 30: 99900 },
    supervisee: { 20: 88900, 30: 99900 },
    'aac-accelere': { 20: 99900 },
    'supervisee-accelere': { 20: 99900 },
    'aac-auto': { 13: 63900 },
    'supervisee-auto': { 13: 63900 },
    'aac-auto-accelere': { 13: 73900 },
    'supervisee-auto-accelere': { 13: 73900 }
});

const PACK_HOURS = Object.freeze({
    'boite-auto': [13],
    code: [0],
    'code-etudiant': [0],
    'code-classique': [0],
    'carte-rdv': [0],
    'carte-accompagnement-manual': [0],
    'carte-accompagnement-auto': [0],
    am: [8],
    '20h': [20],
    zen: [5, 10, 20, 25],
    'zen-auto': [5, 13],
    chill: [5, 10, 20, 25],
    'chill-auto': [5, 13],
    premium: [5, 10, 20, 25],
    accelere: [5, 10, 20, 25],
    aac: [20, 30],
    supervisee: [20, 30],
    'aac-auto-accelere': [13],
    'supervisee-auto-accelere': [13],
    'second-chance': [6]
});

const HOURLY_PRICES_CENTS = Object.freeze({ manual: 5000, auto: 6000 });

function normalizeTransmission(value) {
    return ['auto', 'automatic'].includes(value) ? 'auto' : 'manual';
}

function getBaseAmount(payload, packId) {
    const hours = Number(payload.hours || 0);
    const transmission = normalizeTransmission(payload.transmission || payload.gearboxType);

    if (packId === 'heures-conduite' || packId?.startsWith('heure-conduite')) {
        if (!Number.isInteger(hours) || hours < 1 || hours > 40) return null;
        return hours * HOURLY_PRICES_CENTS[transmission];
    }

    if (packId?.startsWith('tarif-')) {
        const withoutPrefix = packId.slice('tarif-'.length);
        const lastDash = withoutPrefix.lastIndexOf('-');
        if (lastDash === -1) return null;
        const basePack = withoutPrefix.slice(0, lastDash);
        const selectedHours = Number(withoutPrefix.slice(lastDash + 1));
        return TARIF_PACK_PRICES_CENTS[basePack]?.[selectedHours] || null;
    }

    const expected = PACK_PRICES_CENTS[packId];
    if (Array.isArray(expected)) return expected;
    if (expected && typeof expected === 'object') return expected[hours] || null;
    return expected || null;
}

function getOfficialHours(packId, payload = {}) {
    if (packId === 'heures-conduite' || packId?.startsWith('heure-conduite')) {
        const hours = Number(payload.hours || 0);
        return Number.isInteger(hours) && hours >= 1 && hours <= 40 ? [hours] : [];
    }

    if (packId?.startsWith('tarif-')) {
        const withoutPrefix = packId.slice('tarif-'.length);
        const lastDash = withoutPrefix.lastIndexOf('-');
        if (lastDash === -1) return [];
        const selectedHours = Number(withoutPrefix.slice(lastDash + 1));
        return Number.isInteger(selectedHours) ? [selectedHours] : [];
    }

    return PACK_HOURS[packId] || [];
}

function getAllowedAmounts(payload, packId) {
    const expected = getBaseAmount(payload, packId);
    const amounts = (Array.isArray(expected) ? expected : [expected]).filter(Boolean);
    return payload.installments
        ? amounts.map((amount) => Math.round(amount * 1.03))
        : amounts;
}

function splitInstallmentAmount(totalAmount, installmentCount) {
    const baseAmount = Math.floor(totalAmount / installmentCount);
    const remainder = totalAmount - (baseAmount * installmentCount);
    return Array.from({ length: installmentCount }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

function getInstallmentSchedule(payload, packId) {
    const installmentCount = Number(payload.installments || 0);
    const totalAmount = Number(payload.amount || 0);
    if (![2, 3].includes(installmentCount) || !Number.isInteger(totalAmount)) return null;

    const allowedTotals = getAllowedAmounts({ ...payload, installments: installmentCount }, packId);
    if (!allowedTotals.includes(totalAmount)) return null;
    return {
        installmentCount,
        totalAmount,
        amounts: splitInstallmentAmount(totalAmount, installmentCount)
    };
}

function getHourlyPriceCents(transmission) {
    return HOURLY_PRICES_CENTS[normalizeTransmission(transmission)];
}

function getPackDefinition(packId) {
    const id = String(packId || '').trim();
    if (!id || id === 'heures-conduite' || id.startsWith('heure-conduite')) return null;

    if (id.startsWith('tarif-')) {
        const withoutPrefix = id.slice('tarif-'.length);
        const lastDash = withoutPrefix.lastIndexOf('-');
        if (lastDash === -1) return null;
        const basePack = withoutPrefix.slice(0, lastDash);
        const hours = Number(withoutPrefix.slice(lastDash + 1));
        const amount = TARIF_PACK_PRICES_CENTS[basePack]?.[hours] || null;
        if (!amount || !Number.isInteger(hours)) return null;
        const transmission = basePack.includes('-auto') ? 'auto' : 'manual';
        return {
            id,
            basePack,
            hours,
            amounts: [amount],
            transmissions: [transmission]
        };
    }

    const expected = PACK_PRICES_CENTS[id];
    if (!expected) return null;
    const hours = getOfficialHours(id, { hours: 0 })[0] || 0;
    const amount = Array.isArray(expected)
        ? expected[0]
        : typeof expected === 'object'
            ? expected[hours]
            : expected;
    if (!amount && id !== 'code') return null;

    let transmissions = ['manual'];
    if (id === 'boite-auto' || id === 'am' || id.includes('-auto')) transmissions = ['auto'];
    if (id === 'carte-accompagnement-auto') transmissions = ['auto'];
    if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(id)) transmissions = ['manual', 'auto'];

    return {
        id,
        hours,
        amounts: Array.isArray(expected) ? expected : [amount].filter(Boolean),
        transmissions
    };
}

function validatePurchase(payload, packId) {
    const amount = Number(payload.amount || 0);
    const hours = Number(payload.hours || 0);
    if (!Number.isInteger(amount) || !Number.isInteger(hours)) return false;
    const allowedAmounts = getAllowedAmounts(payload, packId);
    const allowedHours = getOfficialHours(packId, payload);
    const definition = getPackDefinition(packId);
    const transmission = normalizeTransmission(payload.transmission || payload.gearboxType);
    const transmissionAllowed = !definition || definition.transmissions.includes(transmission);
    return allowedAmounts.includes(amount) && allowedHours.includes(hours) && transmissionAllowed;
}

module.exports = {
    getAllowedAmounts,
    getInstallmentSchedule,
    getHourlyPriceCents,
    getPackDefinition,
    validatePurchase,
    normalizeTransmission,
    PACK_PRICES_CENTS,
    TARIF_PACK_PRICES_CENTS
};
