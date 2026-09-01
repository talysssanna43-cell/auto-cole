const PACKS = Object.freeze({
    'tarif-chill-5': { label: 'Chill boite manuelle - 5 cours', price: 239, courses: 5, transmission: 'manual' },
    'tarif-chill-10': { label: 'Chill boite manuelle - 10 cours', price: 489, courses: 10, transmission: 'manual' },
    'tarif-chill-20': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    'tarif-chill-25': { label: 'Chill boite manuelle - 25 cours', price: 965, courses: 25, transmission: 'manual' },
    'tarif-chill-30': { label: 'Chill boite manuelle - 30 cours', price: 1149, courses: 30, transmission: 'manual', legacy: true },
    'tarif-premium-5': { label: 'Premium boite manuelle - 5 cours', price: 389, courses: 5, transmission: 'manual' },
    'tarif-premium-10': { label: 'Premium boite manuelle - 10 cours', price: 599, courses: 10, transmission: 'manual' },
    'tarif-premium-20': { label: 'Premium boite manuelle - 20 cours', price: 799, courses: 20, transmission: 'manual' },
    'tarif-premium-25': { label: 'Premium boite manuelle - 25 cours', price: 1095, courses: 25, transmission: 'manual' },
    'tarif-premium-30': { label: 'Premium boite manuelle - 30 cours', price: 1249, courses: 30, transmission: 'manual', legacy: true },
    'tarif-accelere-5': { label: 'Accelere boite manuelle - 5 cours', price: 489, courses: 5, transmission: 'manual' },
    'tarif-accelere-10': { label: 'Accelere boite manuelle - 10 cours', price: 749, courses: 10, transmission: 'manual' },
    'tarif-accelere-20': { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'manual' },
    'tarif-accelere-25': { label: 'Accelere boite manuelle - 25 cours', price: 1199, courses: 25, transmission: 'manual' },
    'tarif-accelere-30': { label: 'Accelere boite manuelle - 30 cours', price: 1399, courses: 30, transmission: 'manual', legacy: true },
    'tarif-chill-auto-5': { label: 'Chill boite automatique - 5 cours', price: 269, courses: 5, transmission: 'auto' },
    'tarif-chill-auto-13': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'auto' },
    'tarif-premium-auto-5': { label: 'Premium boite automatique - 5 cours', price: 379, courses: 5, transmission: 'auto' },
    'tarif-premium-auto-13': { label: 'Premium boite automatique - 13 cours', price: 599, courses: 13, transmission: 'auto' },
    'tarif-accelere-auto-5': { label: 'Accelere boite automatique - 5 cours', price: 499, courses: 5, transmission: 'auto' },
    'tarif-accelere-auto-13': { label: 'Accelere boite automatique - 13 cours', price: 749, courses: 13, transmission: 'auto' },
    'tarif-aac-20': { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    'tarif-supervisee-20': { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    'tarif-aac-auto-13': { label: 'AAC boite automatique - 13 cours', price: 639, courses: 13, transmission: 'auto' },
    'tarif-supervisee-auto-13': { label: 'Supervisee boite automatique - 13 cours', price: 639, courses: 13, transmission: 'auto' },
    code: { label: 'Code classique', price: 20, courses: 0, transmission: 'none' },
    'code-etudiant': { label: 'Code etudiant', price: 15, courses: 0, transmission: 'none' },
    am: { label: 'Voiture sans permis AM', price: 350, courses: 8, transmission: 'auto' },
    'second-chance': { label: 'Forfait Second Chance', price: 569, courses: 6, transmission: 'manual' },
    'boite-auto': { label: 'Chill boite automatique - 13 cours', price: 499, courses: 13, transmission: 'auto' },
    '20h': { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    chill: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    zen: { label: 'Chill boite manuelle - 20 cours', price: 699, courses: 20, transmission: 'manual' },
    accelere: { label: 'Accelere boite manuelle - 20 cours', price: 899, courses: 20, transmission: 'manual' },
    aac: { label: 'Conduite accompagnee - 20 cours', price: 889, courses: 20, transmission: 'manual' },
    supervisee: { label: 'Conduite supervisee - 20 cours', price: 889, courses: 20, transmission: 'manual' }
});

function getPack(id) {
    const key = String(id || '').trim();
    const pack = PACKS[key];
    return pack && !pack.legacy ? { ...pack, id: key } : null;
}

function getCurrentPack(student) {
    const key = String(student?.forfait || '').trim();
    const current = PACKS[key];
    return current ? { ...current, id: key } : {
        id: student?.forfait || 'unknown',
        label: student?.forfait || 'Forfait actuel',
        price: 0,
        courses: Number(student?.hours_goal || 0),
        transmission: student?.transmission_type || 'manual'
    };
}

function computePackChange(student, newPackId) {
    const currentPack = getCurrentPack(student);
    const nextPack = getPack(newPackId);
    if (!nextPack) throw new Error('INVALID_PACK');
    const amountDue = Math.max(0, Number(nextPack.price || 0) - Number(currentPack.price || 0));
    const transmission = nextPack.transmission === 'none'
        ? (student?.transmission_type || 'manual')
        : nextPack.transmission;
    return { currentPack, nextPack, amountDue, transmission };
}

module.exports = { PACKS, computePackChange, getCurrentPack, getPack };
