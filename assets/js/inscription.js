// ===== INSCRIPTION FORM MANAGEMENT =====

let currentStep = 1;
const totalSteps = 3;

// Pack prices
const packPrices = {
    code: 20,
    'code-etudiant': 15,
    'code-classique': 20,
    am: 350,
    'tarif-chill-5': 239,
    'tarif-chill-10': 489,
    'tarif-chill-20': 699,
    'tarif-chill-25': 965,
    'tarif-zen-5': 239,
    'tarif-zen-10': 489,
    'tarif-zen-20': 699,
    'tarif-zen-25': 965,
    'tarif-premium-5': 389,
    'tarif-premium-10': 599,
    'tarif-premium-20': 799,
    'tarif-premium-25': 1095,
    'tarif-accelere-5': 489,
    'tarif-accelere-10': 749,
    'tarif-accelere-20': 899,
    'tarif-accelere-25': 1199,
    'tarif-chill-auto-5': 269,
    'tarif-chill-auto-13': 499,
    'tarif-zen-auto-5': 269,
    'tarif-zen-auto-13': 499,
    'tarif-premium-auto-5': 379,
    'tarif-premium-auto-13': 599,
    'tarif-accelere-auto-5': 499,
    'tarif-accelere-auto-13': 749,
    'tarif-aac-20': 889,
    'tarif-supervisee-20': 889,
    'tarif-aac-accelere-20': 999,
    'tarif-supervisee-accelere-20': 999,
    'tarif-aac-auto-13': 639,
    'tarif-supervisee-auto-13': 639,
    'tarif-aac-auto-accelere-13': 739,
    'tarif-supervisee-auto-accelere-13': 739,
    'heures-conduite': 0, // Will be calculated based on hours and transmission type
    'second-chance': 569,
    // Legacy aliases kept only for old bookmarked links.
    'boite-auto': 499,
    '20h': 699,
    chill: 699,
    zen: 699,
    'zen-auto': 499,
    accelere: 899,
    aac: 889,
    supervisee: 889
};

// Pack hours included
const packHours = {
    code: 0,
    'code-etudiant': 0,
    'code-classique': 0,
    am: 8,
    'tarif-chill-5': 5,
    'tarif-chill-10': 10,
    'tarif-chill-20': 20,
    'tarif-chill-25': 25,
    'tarif-zen-5': 5,
    'tarif-zen-10': 10,
    'tarif-zen-20': 20,
    'tarif-zen-25': 25,
    'tarif-premium-5': 5,
    'tarif-premium-10': 10,
    'tarif-premium-20': 20,
    'tarif-premium-25': 25,
    'tarif-accelere-5': 5,
    'tarif-accelere-10': 10,
    'tarif-accelere-20': 20,
    'tarif-accelere-25': 25,
    'tarif-chill-auto-5': 5,
    'tarif-chill-auto-13': 13,
    'tarif-zen-auto-5': 5,
    'tarif-zen-auto-13': 13,
    'tarif-premium-auto-5': 5,
    'tarif-premium-auto-13': 13,
    'tarif-accelere-auto-5': 5,
    'tarif-accelere-auto-13': 13,
    'tarif-aac-20': 20,
    'tarif-supervisee-20': 20,
    'tarif-aac-auto-13': 13,
    'tarif-supervisee-auto-13': 13,
    'heures-conduite': 0, // Will be calculated based on nombreHeures input
    'second-chance': 6,
    // Legacy aliases kept only for old bookmarked links.
    'boite-auto': 13,
    '20h': 20,
    chill: 20,
    zen: 20,
    'zen-auto': 13,
    accelere: 20,
    aac: 20,
    supervisee: 20
};

// Stripe variables
let stripe = null;
let elements = null;
let cardNumberElement = null;
let cardExpiryElement = null;
let cardCvcElement = null;
let stripePublishableKey = null;

function normalizePackId(packId) {
    return ({
        'boite-auto': 'tarif-chill-auto-13',
        '20h': 'tarif-chill-20',
        chill: 'tarif-chill-20',
        zen: 'tarif-chill-20',
        'zen-auto': 'tarif-chill-auto-13',
        'tarif-zen-5': 'tarif-chill-5',
        'tarif-zen-10': 'tarif-chill-10',
        'tarif-zen-20': 'tarif-chill-20',
        'tarif-zen-25': 'tarif-chill-25',
        'tarif-chill-30': 'tarif-chill-25',
        'tarif-zen-30': 'tarif-chill-25',
        'tarif-premium-30': 'tarif-premium-25',
        'tarif-accelere-30': 'tarif-accelere-25',
        'tarif-zen-auto-5': 'tarif-chill-auto-5',
        'tarif-zen-auto-13': 'tarif-chill-auto-13',
        accelere: 'tarif-accelere-20',
        aac: 'tarif-aac-20',
        supervisee: 'tarif-supervisee-20'
    })[packId] || packId;
}

const inscriptionPackCatalog = [
    { id: 'tarif-chill-5', title: 'Chill boîte manuelle', price: 239, hours: 5, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '5 cours', items: ['5 cours de conduite', 'Boîte manuelle', 'Suivi numérique'] },
    { id: 'tarif-chill-10', title: 'Chill boîte manuelle', price: 489, hours: 10, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '10 cours', items: ['10 cours de conduite', 'Boîte manuelle', 'Suivi numérique'] },
    { id: 'tarif-chill-20', title: 'Chill boîte manuelle', price: 699, hours: 20, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: 'Populaire', featured: true, items: ['20 cours de conduite', 'Boîte manuelle', 'Permis blanc inclus'] },
    { id: 'tarif-chill-25', title: 'Chill boîte manuelle', price: 965, hours: 25, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '25 cours', items: ['25 cours de conduite', 'Boîte manuelle', 'Accompagnement renforcé'] },
    { id: 'tarif-premium-5', title: 'Premium boîte manuelle', price: 389, hours: 5, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '5 cours', items: ['5 cours de conduite', 'Priorité planning', 'Suivi premium'] },
    { id: 'tarif-premium-10', title: 'Premium boîte manuelle', price: 599, hours: 10, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '10 cours', items: ['10 cours de conduite', 'Priorité planning', 'Suivi premium'] },
    { id: 'tarif-premium-20', title: 'Premium boîte manuelle', price: 799, hours: 20, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '20 cours', items: ['20 cours de conduite', 'Priorité planning', 'Suivi premium'] },
    { id: 'tarif-premium-25', title: 'Premium boîte manuelle', price: 1095, hours: 25, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '25 cours', items: ['25 cours de conduite', 'Priorité planning', 'Suivi premium'] },
    { id: 'tarif-accelere-5', title: 'Accéléré boîte manuelle', price: 489, hours: 5, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '5 cours', items: ['5 cours de conduite', 'Planning intensif', 'Boîte manuelle'] },
    { id: 'tarif-accelere-10', title: 'Accéléré boîte manuelle', price: 749, hours: 10, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '10 cours', items: ['10 cours de conduite', 'Planning intensif', 'Boîte manuelle'] },
    { id: 'tarif-accelere-20', title: 'Accéléré boîte manuelle', price: 899, hours: 20, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '20 cours', items: ['20 cours de conduite', 'Planning intensif', 'Accompagnement rapide'] },
    { id: 'tarif-accelere-25', title: 'Accéléré boîte manuelle', price: 1199, hours: 25, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: '25 cours', items: ['25 cours de conduite', 'Planning intensif', 'Accompagnement rapide'] },
    { id: 'tarif-chill-auto-5', title: 'Chill boîte automatique', price: 269, hours: 5, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '5 cours', items: ['5 cours de conduite', 'Boîte automatique', 'Suivi numérique'] },
    { id: 'tarif-chill-auto-13', title: 'Chill boîte automatique', price: 499, hours: 13, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '13 cours', items: ['13 cours de conduite', 'Boîte automatique', 'Permis blanc inclus'] },
    { id: 'tarif-premium-auto-5', title: 'Premium boîte automatique', price: 379, hours: 5, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '5 cours', items: ['5 cours de conduite', 'Boîte automatique', 'Suivi premium'] },
    { id: 'tarif-premium-auto-13', title: 'Premium boîte automatique', price: 599, hours: 13, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '13 cours', items: ['13 cours de conduite', 'Boîte automatique', 'Suivi premium'] },
    { id: 'tarif-accelere-auto-5', title: 'Accéléré boîte automatique', price: 499, hours: 5, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '5 cours', items: ['5 cours de conduite', 'Planning intensif', 'Boîte automatique'] },
    { id: 'tarif-accelere-auto-13', title: 'Accéléré boîte automatique', price: 749, hours: 13, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: '13 cours', items: ['13 cours de conduite', 'Planning intensif', 'Boîte automatique'] },
    { id: 'tarif-aac-20', title: 'Conduite accompagnée Chill', price: 889, hours: 20, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: 'AAC', items: ['Code + 20 cours', 'RDV préalable inclus', 'Dès 15 ans'] },
    { id: 'tarif-supervisee-20', title: 'Conduite supervisée Chill', price: 889, hours: 20, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: 'Supervisée', items: ['Code + 20 cours', 'RDV préalable inclus', 'À partir de 18 ans'] },
    { id: 'tarif-aac-auto-13', title: 'AAC boîte automatique Chill', price: 639, hours: 13, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: 'AAC auto', items: ['Code + 13 cours', 'Boîte automatique', 'RDV préalable inclus'] },
    { id: 'tarif-supervisee-auto-13', title: 'Supervisée boîte automatique Chill', price: 639, hours: 13, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: 'Supervisée auto', items: ['Code + 13 cours', 'Boîte automatique', 'RDV préalable inclus'] },
    { id: 'am', title: 'Voiture sans permis (AM)', price: 350, hours: 8, transmission: 'auto', vehicle: 'assets/vehicule-boite-auto.png', badge: 'AM', items: ['Dossier administratif', '8h de pratique', 'Module code et manoeuvres'] },
    { id: 'code-etudiant', title: 'Code étudiant', price: 15, hours: 0, transmission: 'manual', badge: 'Code', items: ['Accès code en ligne', 'Tarif étudiant', '1 mois inclus'] },
    { id: 'code-classique', title: 'Code classique', price: 20, hours: 0, transmission: 'manual', badge: 'Code', items: ['Accès code en ligne', 'Tests d’entraînement', '1 mois inclus'] },
    { id: 'second-chance', title: 'Forfait Second Chance', price: 569, hours: 6, transmission: 'manual', vehicle: 'assets/acceuil.png', badge: 'Second chance', items: ['Récupération du dossier', '3 séances ciblées', 'Nouvelle date d’examen'] }
];

function renderInscriptionTariffPacks() {
    const packSelection = document.querySelector('.pack-selection');
    if (!packSelection) return;

    const grouped = [
        { key: 'chill', title: 'Permis Chill', transmission: 'manual', ids: ['tarif-chill-5', 'tarif-chill-10', 'tarif-chill-20', 'tarif-chill-25'], featured: false },
        { key: 'premium', title: 'Permis Premium', transmission: 'manual', ids: ['tarif-premium-5', 'tarif-premium-10', 'tarif-premium-20', 'tarif-premium-25'], featured: true },
        { key: 'accelere', title: 'Permis Accéléré', transmission: 'manual', ids: ['tarif-accelere-5', 'tarif-accelere-10', 'tarif-accelere-20', 'tarif-accelere-25'], featured: false },
        { key: 'chill-auto', title: 'Permis Chill boîte automatique', transmission: 'auto', ids: ['tarif-chill-auto-5', 'tarif-chill-auto-13'], featured: false },
        { key: 'premium-auto', title: 'Permis Premium boîte automatique', transmission: 'auto', ids: ['tarif-premium-auto-5', 'tarif-premium-auto-13'], featured: true },
        { key: 'accelere-auto', title: 'Permis Accéléré boîte automatique', transmission: 'auto', ids: ['tarif-accelere-auto-5', 'tarif-accelere-auto-13'], featured: false }
    ];
    const renderFamily = (family) => {
        const packs = family.ids.map(id => inscriptionPackCatalog.find(pack => pack.id === id)).filter(Boolean);
        const defaultHours = family.transmission === 'auto' ? 13 : 20;
        const selected = packs.find(pack => pack.hours === defaultHours) || packs.find(pack => pack.featured) || packs[packs.length - 1];
        const options = packs.map(pack => `
            <button type="button" class="inscription-hours-option ${pack.id === selected.id ? 'selected' : ''}" data-pack-id="${pack.id}" onclick="selectInscriptionPack('${pack.id}', this); return false;">
                <strong>${pack.hours}</strong><span>cours</span>
            </button>
        `).join('');
        return `
            <article class="pack-option inscription-pack-family ${family.featured ? 'featured' : ''}" data-family="${family.key}" data-transmission="${family.transmission}">
                <div class="pack-option-badge">${family.transmission === 'auto' ? 'Boîte automatique' : 'Boîte manuelle'}</div>
                ${packs.map(pack => `<input type="radio" name="pack" id="pack-${pack.id}" value="${pack.id}" ${pack.id === selected.id ? 'checked' : ''}>`).join('')}
                <label for="pack-${selected.id}">
                    <div class="pack-option-vehicle"><img src="${selected.vehicle}" alt="Véhicule ${family.transmission === 'auto' ? 'boîte automatique' : 'boîte manuelle'} Auto-Ecole Breteuil"></div>
                    <div class="pack-option-header"><h3>${family.title}</h3><div class="pack-option-price" data-price>${selected.price}€</div></div>
                    <p><span data-hours>${selected.hours}</span> cours de conduite</p>
                    <div class="inscription-hours-selector" aria-label="Nombre de cours pour ${family.title}">${options}</div>
                    <ul>${selected.items.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}</ul>
                </label>
            </article>
        `;
    };
    const fixed = inscriptionPackCatalog.filter(pack => ['am', 'code-etudiant', 'code-classique', 'second-chance'].includes(pack.id));
    packSelection.innerHTML = grouped.map(renderFamily).join('') + fixed.map(pack => `
        <article class="pack-option" data-pack="${pack.id}" data-transmission="${pack.transmission}">
            <input type="radio" name="pack" id="pack-${pack.id}" value="${pack.id}">
            <label for="pack-${pack.id}">
                ${pack.vehicle ? `<div class="pack-option-vehicle"><img src="${pack.vehicle}" alt="Véhicule Auto-Ecole Breteuil"></div>` : ''}
                <div class="pack-option-header"><h3>${pack.title}</h3><div class="pack-option-price">${pack.price}€</div></div>
                <p>${pack.hours > 0 ? `${pack.hours} cours de conduite` : 'Formation code'}</p>
                <ul>${pack.items.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}</ul>
            </label>
        </article>
    `).join('');
}

function selectInscriptionPack(packId, button) {
    const input = document.getElementById(`pack-${packId}`);
    const pack = inscriptionPackCatalog.find(item => item.id === packId);
    const family = button?.closest('.inscription-pack-family');
    if (!input || !pack || !family) return;
    input.checked = true;
    family.querySelectorAll('.inscription-hours-option').forEach(option => option.classList.remove('selected'));
    button.classList.add('selected');
    family.querySelector('[data-price]').textContent = `${pack.price}€`;
    family.querySelector('[data-hours]').textContent = pack.hours;
    family.querySelector('label').setAttribute('for', input.id);
    family.querySelector('.pack-option-vehicle img').src = pack.vehicle;
    family.querySelector('ul').innerHTML = pack.items.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('');
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

/* Legacy fallback markup is replaced above with tariff-style family cards. */
/*
    packSelection.innerHTML = inscriptionPackCatalog.map((pack) => `
        <div class="pack-option ${pack.featured ? 'featured' : ''}" data-pack="${pack.id}" data-transmission="${pack.transmission}">
            ${pack.badge ? `<div class="pack-option-badge">${pack.badge}</div>` : ''}
            <input type="radio" name="pack" id="pack-${pack.id}" value="${pack.id}">
            <label for="pack-${pack.id}">
                ${pack.vehicle ? `<div class="pack-option-vehicle"><img src="${pack.vehicle}" alt="Véhicule Auto-Ecole Breteuil"></div>` : ''}
                <div class="pack-option-header">
                    <h3>${pack.title}</h3>
                    <div class="pack-option-price">${pack.price}€</div>
                </div>
                <p>${pack.hours > 0 ? `${pack.hours} cours de conduite` : 'Formation code'}</p>
                <ul>${pack.items.map((item) => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}</ul>
            </label>
        </div>
    `).join('');
*/

function addDynamicTariffPack(urlParams) {
    const packParam = normalizePackId(urlParams.get('pack'));
    const requestedPrice = parseInt(urlParams.get('price') || '', 10);
    const requestedHours = parseInt(urlParams.get('hours') || '0', 10);
    const knownPack = Boolean(packParam && Object.prototype.hasOwnProperty.call(packPrices, packParam));
    const priceParam = knownPack ? Number(packPrices[packParam]) : requestedPrice;
    const hoursParam = knownPack ? Number(packHours[packParam] || 0) : requestedHours;
    const labelParam = urlParams.get('label') || packParam;
    const transmissionParam = urlParams.get('transmission') || 'manual';
    const safeLabel = String(labelParam).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));

    if (!packParam || !Number.isFinite(priceParam) || priceParam <= 0) {
        return;
    }

    if (!knownPack) {
        packPrices[packParam] = priceParam;
        packHours[packParam] = Number.isFinite(hoursParam) ? hoursParam : 0;
    }

    let radio = document.getElementById(`pack-${packParam}`);
    if (!radio) {
        const packSelection = document.querySelector('.pack-selection');
        if (!packSelection) return;

        const option = document.createElement('div');
        option.className = 'pack-option featured';
        option.dataset.pack = packParam;
        option.innerHTML = `
            <div class="pack-option-badge">Sélectionné</div>
            <input type="radio" name="pack" id="pack-${packParam}" value="${packParam}">
            <label for="pack-${packParam}">
                <div class="pack-option-header">
                    <h3>${safeLabel}</h3>
                    <div class="pack-option-price">${priceParam}€</div>
                </div>
                <p>${hoursParam > 0 ? `${hoursParam} cours de conduite` : 'Formation code'}</p>
                <ul>
                    <li><i class="fas fa-check"></i> Tarif sélectionné depuis la page tarifs</li>
                    <li><i class="fas fa-check"></i> Montant conservé pour le paiement</li>
                </ul>
            </label>
        `;

        packSelection.prepend(option);
        radio = option.querySelector('input[name="pack"]');
    } else {
        const option = radio.closest('.pack-option');
        const priceEl = option?.querySelector('.pack-option-price');
        const titleEl = option?.querySelector('h3');
        const subtitleEl = option?.querySelector('p');
        const hoursEl = option?.querySelector('[data-hours]');

        if (priceEl) priceEl.textContent = `${priceParam}€`;
        if (!knownPack && titleEl) titleEl.textContent = labelParam;
        if (hoursEl && hoursParam > 0) {
            hoursEl.textContent = String(hoursParam);
        } else if (subtitleEl && hoursParam > 0) {
            subtitleEl.textContent = `${hoursParam} cours de conduite`;
        }
    }

    radio.checked = true;
    const matchingHourButton = radio.closest('.inscription-pack-family')?.querySelector(`[data-pack-id="${packParam}"]`);
    if (matchingHourButton) {
        selectInscriptionPack(packParam, matchingHourButton);
    }

    const packTransmission = document.querySelector(`input[name="packTransmissionType"][value="${transmissionParam}"]`);
    if (packTransmission) {
        packTransmission.checked = true;
    }
}

// Initialize form
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inscription.js chargé');
    
    // Check URL parameters for pre-selected pack or admin mode
    const urlParams = new URLSearchParams(window.location.search);
    const packParam = normalizePackId(urlParams.get('pack'));
    const isAdminMode = urlParams.get('admin') === 'true';
    const referralCode = urlParams.get('ref');
    
    console.log('URL params:', { packParam, isAdminMode, referralCode });

    renderInscriptionTariffPacks();
    addDynamicTariffPack(urlParams);
    
    if (packParam && packPrices[packParam]) {
        const packInput = document.getElementById(`pack-${packParam}`);
        if (packInput) packInput.checked = true;
    }
    
    // Stocker le code de parrainage s'il existe
    if (referralCode) {
        console.log('🎁 Code de parrainage détecté:', referralCode);
        window.referralCode = referralCode;
        // Afficher un message de bienvenue
        showReferralWelcome(referralCode);
    }
    
    // Si mode admin, masquer l'étape de paiement
    if (isAdminMode) {
        const admin = await window.authSession?.requireRole(['admin']);
        if (!admin) {
            alert('Cette inscription est r&eacute;serv&eacute;e &agrave; l\'administration.');
            const redirectTarget = window.location.protocol === 'file:'
                ? 'inscription.html?admin=true'
                : `${window.location.pathname.replace(/^\//, '')}${window.location.search || ''}${window.location.hash || ''}`;
            window.location.replace(`connexion.html?redirect=${encodeURIComponent(redirectTarget)}`);
            return;
        }
        console.log('✅ Mode admin activé - paiement désactivé');
        window.adminInscriptionMode = true;
        // Afficher la section séances effectuées
        const adminSeancesSection = document.getElementById('adminSeancesSection');
        if (adminSeancesSection) adminSeancesSection.style.display = 'block';
    } else {
        console.log('Mode inscription normale');
    }
    
    // Update summary when pack or hours change
    document.querySelectorAll('input[name="pack"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateSummary();
            toggleDocumentsSection();
            toggleHeuresConduiteConfig();
            toggleTransmissionTypeSection();
            updateHeuresRestantes();
        });
    });
    
    // Update documents when license invalidation status changes
    document.querySelectorAll('input[name="permisInvalide"]').forEach(radio => {
        radio.addEventListener('change', () => {
            toggleDocumentsSection();
        });
    });
    
    // Check age when birth date changes
    const dateNaissanceInput = document.getElementById('dateNaissance');
    if (dateNaissanceInput) {
        dateNaissanceInput.addEventListener('change', () => {
            checkAge();
        });
    }
    
    const hoursField = document.getElementById('heures');
    if (hoursField) {
        hoursField.addEventListener('change', updateSummary);
    }
    
    // Listener pour le nombre de mensualités
    const installmentsCountField = document.getElementById('installmentsCount');
    if (installmentsCountField) {
        installmentsCountField.addEventListener('change', () => {
            updateInstallmentsPreview();
            updateSummary();
        });
    }
    
    // Listener pour séances effectuées
    const seancesField = document.getElementById('seancesEffectuees');
    if (seancesField) {
        seancesField.addEventListener('input', updateHeuresRestantes);
    }
    
    // Initial summary update
    updateSummary();
    
    // Initialize Stripe
    await initializeStripe();
    
    // Payment method selection
    initializePaymentMethodSelection();
    
    // Form submission
    const form = document.getElementById('inscriptionForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        console.log('Form submit handler attached');
    } else {
        console.error('Form not found!');
    }
});

// Navigate to next step
function nextStep() {
    if (validateStep(currentStep)) {
        // Mark current step as completed
        const currentProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
        currentProgressStep.classList.add('completed');
        
        // Hide current step
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
        
        // Move to next step
        currentStep++;
        
        // Si mode admin et on arrive à l'étape 3 (paiement), on soumet directement
        if (window.adminInscriptionMode && currentStep === 3) {
            console.log('🎯 Mode admin - soumission automatique du formulaire');
            // Soumettre le formulaire directement sans afficher l'étape de paiement
            skipPack = false; // On garde le pack sélectionné
            const form = document.getElementById('inscriptionForm');
            if (form) {
                // Utiliser setTimeout pour éviter les problèmes de timing
                setTimeout(async () => {
                    console.log('📤 Déclenchement de la soumission...');
                    await handleSubmitAdmin(form);
                }, 100);
            }
            return;
        }
        
        // Show next step
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
        
        // Update progress indicator
        const nextProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
        nextProgressStep.classList.add('active');
        
        // Si on arrive à l'étape 2 (documents), vérifier l'âge pour afficher/masquer le document parent
        if (currentStep === 2) {
            checkAge();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Skip pack selection and go directly to finalization without payment
let skipPack = false;

// Toggle documents section based on pack selection and license status
function toggleDocumentsSection() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    const documentsSection = document.getElementById('documentsSection');
    const commentaireSection = document.getElementById('commentaireSection');
    const permisInvalide = document.querySelector('input[name="permisInvalide"]:checked')?.value === 'oui';
    
    if (selectedPack && documentsSection) {
        documentsSection.style.display = 'block';
        if (commentaireSection) commentaireSection.style.display = 'block';
        
        // Show/hide documents based on license invalidation status
        const allDocs = documentsSection.querySelectorAll('.file-upload-wrapper');
        
        if (permisInvalide) {
            // Only show photo and ID for invalidated license
            allDocs.forEach(doc => {
                const input = doc.querySelector('input[type="file"]');
                if (input && (input.id === 'pieceIdentite' || input.id === 'ephoto')) {
                    doc.style.display = 'block';
                } else {
                    doc.style.display = 'none';
                }
            });
        } else {
            // Show all documents for normal case, except parent ID which is handled by checkAge()
            allDocs.forEach(doc => {
                const input = doc.querySelector('input[type="file"]');
                // Ne pas afficher le document parent ici, c'est géré par checkAge()
                if (input && input.id === 'pieceIdentiteParent') {
                    // Skip - sera géré par checkAge()
                    return;
                }
                doc.style.display = 'block';
            });
        }
        
        // Re-check age to ensure parent document visibility is correct
        checkAge();
    } else {
        if (documentsSection) documentsSection.style.display = 'none';
        if (commentaireSection) commentaireSection.style.display = 'none';
    }
}

// Check if user is a minor based on birth date
function checkAge() {
    const dateNaissanceInput = document.getElementById('dateNaissance');
    const representantSection = document.getElementById('representantLegalSection');
    const parentIdDoc = document.getElementById('parentIdDoc');
    const parentPrenomInput = document.getElementById('parentPrenom');
    const parentNomInput = document.getElementById('parentNom');
    
    if (!dateNaissanceInput || !dateNaissanceInput.value) {
        return;
    }
    
    const birthDate = new Date(dateNaissanceInput.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    console.log('Age calculé:', age);
    
    // Show/hide legal representative fields based on age
    if (age < 18) {
        console.log('Utilisateur mineur - affichage des champs représentant légal');
        if (representantSection) {
            representantSection.style.display = 'block';
            // Make parent fields required
            if (parentPrenomInput) parentPrenomInput.required = true;
            if (parentNomInput) parentNomInput.required = true;
        }
        if (parentIdDoc) {
            parentIdDoc.style.display = 'block';
        }
    } else {
        console.log('Utilisateur majeur - masquage des champs représentant légal');
        if (representantSection) {
            representantSection.style.display = 'none';
            // Make parent fields not required
            if (parentPrenomInput) {
                parentPrenomInput.required = false;
                parentPrenomInput.value = '';
            }
            if (parentNomInput) {
                parentNomInput.required = false;
                parentNomInput.value = '';
            }
        }
        if (parentIdDoc) {
            parentIdDoc.style.display = 'none';
            // Clear parent ID file
            const parentIdInput = document.getElementById('pieceIdentiteParent');
            if (parentIdInput) parentIdInput.value = '';
        }
    }
}

// Toggle hebergement documents
function toggleHebergementDocs() {
    const heberge = document.querySelector('input[name="heberge"]:checked');
    const hebergementDocs = document.getElementById('hebergementDocs');
    
    if (heberge && heberge.value === 'oui' && hebergementDocs) {
        hebergementDocs.style.display = 'block';
    } else if (hebergementDocs) {
        hebergementDocs.style.display = 'none';
    }
}

function skipPackSelection() {
    skipPack = true;
    // Deselect all packs
    document.querySelectorAll('input[name="pack"]').forEach(radio => radio.checked = false);
    
    // Hide documents section
    const documentsSection = document.getElementById('documentsSection');
    if (documentsSection) {
        documentsSection.style.display = 'none';
    }
    
    // Mark current step as completed
    const currentProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
    currentProgressStep.classList.add('completed');
    
    // Hide current step
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    
    // Move to next step
    currentStep++;
    
    // Show next step
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    
    // Update progress indicator
    const nextProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
    nextProgressStep.classList.add('active');
    
    // Update summary to show "Aucun pack"
    document.getElementById('selectedPack').textContent = 'Aucun pack sélectionné';
    document.getElementById('selectedHours').textContent = '-';
    document.getElementById('totalPrice').textContent = '0€';
    
    // Hide payment block since no payment needed
    const cardBlock = document.getElementById('cardPaymentBlock');
    if (cardBlock) cardBlock.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigate to previous step
function prevStep() {
    if (currentStep > 1) {
        // Remove active from current progress step
        const currentProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
        currentProgressStep.classList.remove('active');
        
        // Hide current step
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
        
        // Move to previous step
        currentStep--;
        
        // Show previous step
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Validate current step
function validateStep(step) {
    const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = currentStepElement.querySelectorAll('input[required]:not([type="file"]):not([type="radio"]):not([type="checkbox"]), select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = 'red';
            
            // Remove red border after user starts typing
            input.addEventListener('input', function() {
                this.style.borderColor = '';
            }, { once: true });
        }
    });
    
    // Check radio buttons separately
    const radioGroups = currentStepElement.querySelectorAll('input[type="radio"][required]');
    const checkedGroups = new Set();
    radioGroups.forEach(radio => {
        if (radio.checked) {
            checkedGroups.add(radio.name);
        }
    });
    
    // Check checkboxes separately
    const checkboxes = currentStepElement.querySelectorAll('input[type="checkbox"][required]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            isValid = false;
        }
    });
    
    // Les documents peuvent être ajoutés plus tard depuis l'espace élève.
    // Cette étape les signale mais ne bloque donc pas l'inscription.
    const shouldValidateDocumentsAtSignup = false;
    if (shouldValidateDocumentsAtSignup && step === 2) {
        const selectedPack = document.querySelector('input[name="pack"]:checked');
        
        if (selectedPack) {
            // Vérifier si le permis est invalidé
            const permisInvalide = document.querySelector('input[name="permisInvalide"]:checked')?.value === 'oui';
            
            // Définir les documents obligatoires selon le cas
            let requiredFields = [];
            if (permisInvalide) {
                requiredFields = ['pieceIdentite', 'ephoto'];
            } else {
                requiredFields = ['pieceIdentite', 'assr', 'jdc', 'justifDomicile', 'ephoto'];
            }
            
            const heberge = document.querySelector('input[name="heberge"]:checked')?.value;
            if (heberge === 'oui') {
                requiredFields.push('certifHebergement', 'pieceHebergeur');
            }
            
            // Ajouter la pièce d'identité du parent si mineur
            const dateNaissance = document.getElementById('dateNaissance')?.value;
            if (dateNaissance) {
                const birthDate = new Date(dateNaissance);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    requiredFields.push('pieceIdentiteParent');
                }
            }
            
            // Vérifier que tous les documents sont présents
            const missingDocs = [];
            for (const field of requiredFields) {
                const fileInput = document.getElementById(field);
                if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                    missingDocs.push(field);
                }
            }
            
            if (missingDocs.length > 0) {
                const docNames = {
                    'pieceIdentite': 'Pièce d\'identité',
                    'assr': 'ASSR',
                    'jdc': 'JDC ou Attestation de recensement',
                    'justifDomicile': 'Justificatif de domicile',
                    'ephoto': 'E-photo',
                    'certifHebergement': 'Certificat d\'hébergement',
                    'pieceHebergeur': 'Pièce d\'identité de l\'hébergeur',
                    'pieceIdentiteParent': 'Pièce d\'identité du représentant légal'
                };
                
                const missingNames = missingDocs.map(doc => docNames[doc] || doc).join('\n• ');
                alert(`Documents a completer\n\nSi vous les avez deja, vous pouvez les ajouter maintenant :\n\n- ${missingNames}\n\nVous pouvez aussi continuer votre inscription et les deposer plus tard depuis votre espace eleve.`);
            }
        }
    }
    
    if (!isValid) {
        alert('Veuillez remplir tous les champs obligatoires');
    }
    
    return isValid;
}

// Update payment method display
function updatePaymentMethod() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const cardBlock = document.getElementById('cardPaymentBlock');
    const installmentsBlock = document.getElementById('installmentsPaymentBlock');
    
    if (paymentMethod === 'installments') {
        // Paiement en plusieurs fois → Stripe avec frais
        if (cardBlock) cardBlock.style.display = 'none';
        if (installmentsBlock) {
            installmentsBlock.style.display = 'block';
            updateInstallmentsPreview();
        }
    } else {
        // Paiement comptant → Stripe
        if (cardBlock) cardBlock.style.display = 'block';
        if (installmentsBlock) installmentsBlock.style.display = 'none';
    }
    
    updateSummary(); // Recalculer le prix avec ou sans les frais
}

// Update Installments preview
function updateInstallmentsPreview() {
    let purchase;
    try {
        purchase = getSelectedPurchaseDetails();
    } catch {
        return;
    }

    const installments = parseInt(document.getElementById('installmentsCount')?.value || '3', 10);
    if (![2, 3].includes(installments)) return;

    // Work in cents so the preview matches the exact Stripe total.
    const totalCents = Math.round(purchase.amountCents * 1.03);
    const baseCents = Math.floor(totalCents / installments);
    const remainder = totalCents - (baseCents * installments);
    const formatAmount = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')}€`;
    const monthlyDisplay = Array.from({ length: installments }, (_, index) => {
        const cents = baseCents + (index < remainder ? 1 : 0);
        return `${index + 1}${index === 0 ? 'ère' : 'ème'}: ${formatAmount(cents)}`;
    }).join(' • ');

    const installmentsTotal = document.getElementById('installmentsTotal');
    const installmentsMonthly = document.getElementById('installmentsMonthly');
    if (installmentsTotal) installmentsTotal.textContent = formatAmount(totalCents);
    if (installmentsMonthly) installmentsMonthly.textContent = monthlyDisplay;
}

// Update order summary
function updateSummary() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    
    if (selectedPack) {
        const packName = selectedPack.value;
        const packLabel = selectedPack.parentElement.querySelector('h3').textContent;
        
        // Update summary display
        document.getElementById('selectedPack').textContent = packLabel;
        
        // For heures-conduite pack, get the calculated price
        let totalPrice = packPrices[packName];
        
        // Vérifier si l'utilisateur est étudiant pour le pack Code
        if (packName === 'code') {
            const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
            const isStudent = codeStudentCheckbox && codeStudentCheckbox.checked;
            totalPrice = isStudent ? 15 : 20;
            console.log(`📊 Récapitulatif - Pack Code - Étudiant: ${isStudent}, Prix: ${totalPrice}€`);
        }
        
        // For heures-conduite, show the number of courses and transmission type
        if (packName === 'heures-conduite') {
            const nombreHeures = document.getElementById('nombreHeures');
            const transmissionType = document.querySelector('input[name="transmissionType"]:checked');
            
            if (nombreHeures && nombreHeures.value) {
                const hours = nombreHeures.value;
                const transmissionLabel = transmissionType ? 
                    (transmissionType.value === 'manual' ? 'Boîte manuelle' : 'Boîte automatique') : '';
                
                document.getElementById('selectedHours').textContent = `${hours} cours - ${transmissionLabel}`;
            } else {
                document.getElementById('selectedHours').textContent = 'Configuration requise';
            }
        } else if (packName === 'code') {
            // Code de la route : 0 cours de conduite
            document.getElementById('selectedHours').textContent = '0 cours de conduite';
        } else {
            // For other packs, show default courses
            const selectedHours = document.getElementById('heures');
            if (selectedHours) {
                document.getElementById('selectedHours').textContent = `${selectedHours.value} cours`;
            } else {
                document.getElementById('selectedHours').textContent = '20 cours';
            }
        }
        
        // Vérifier si paiement en plusieurs fois
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        if (paymentMethod === 'installments') {
            // Frais de 3% pour le paiement en plusieurs fois
            const feeRate = 1.03;  // +3%
            totalPrice = Math.round(totalPrice * feeRate);
            document.getElementById('totalPrice').textContent = `${totalPrice}€`;
        } else {
            document.getElementById('totalPrice').textContent = `${totalPrice}€`;
        }
    }
}

// Handle admin form submission (called directly with form element)
async function legacyHandleSubmitAdmin(form) {
    console.log('📝 Traitement inscription admin...');
    
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Données collectées:', data);
    
    await processInscription(data);
}

async function handleSubmitAdmin(form) {
    const session = await window.authSession?.requireRole(['admin']);
    const token = window.authSession?.getToken();
    if (!session || !token) {
        alert('Ta session administrateur a expir&eacute;. Reconnecte-toi.');
        window.location.href = 'connexion.html';
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (!String(data.password || '').trim() || String(data.password || '').length < 8) {
        alert('Le mot de passe de l’élève est obligatoire et doit contenir au moins 8 caractères.');
        const passwordInput = document.getElementById('motdepasse');
        if (passwordInput) passwordInput.focus();
        return;
    }
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    if (!selectedPack) {
        alert('Choisis un forfait avant de continuer.');
        return;
    }

    const packId = selectedPack.value;
    const selectedLabel = selectedPack.closest('.pack-option')?.querySelector('h3')?.textContent?.trim() || packId;
    let transmission = 'manual';
    if (packId === 'heures-conduite') {
        transmission = document.querySelector('input[name="transmissionType"]:checked')?.value || 'manual';
    } else if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(packId)) {
        transmission = document.querySelector('input[name="packTransmissionType"]:checked')?.value || 'manual';
    } else if (packId === 'am' || packId === 'boite-auto' || packId.includes('-auto')) {
        transmission = 'auto';
    }

    const purchasedHours = packId === 'heures-conduite'
        ? Number(document.getElementById('nombreHeures')?.value || 0)
        : Number(packHours[packId] || 0);
    const documents = {};
    for (const input of form.querySelectorAll('.file-input-hidden')) {
        const file = input.files?.[0];
        if (!file) continue;
        documents[input.id] = {
            name: file.name,
            type: file.type,
            data: await fileToBase64(file)
        };
    }

    try {
        const response = await fetch('/.netlify/functions/admin-create-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                ...data,
                pack: packId,
                pack_label: selectedLabel,
                hours_purchased: purchasedHours,
                hours_completed_initial: Number(data.seancesEffectuees || 0) * 2,
                lesson_unit_minutes: 45,
                transmission_type: transmission,
                documents
            })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || result.message || 'REGISTRATION_FAILED');
        }
        showSuccessMessage();
    } catch (error) {
        console.error('Inscription administrateur:', error);
        const messages = {
            INVALID_STUDENT_DATA: 'Impossible d\'enregistrer cette inscription : prénom, nom, e-mail ou téléphone manquant.',
            INVALID_PASSWORD: 'Impossible d\'enregistrer cette inscription : le mot de passe doit contenir au moins 8 caractères.',
            INVALID_PACK: 'Impossible d\'enregistrer cette inscription : le forfait choisi n\'est pas valide.',
            INVALID_TRANSMISSION: 'Impossible d\'enregistrer cette inscription : le type de boîte choisi n\'est pas valide.',
            INVALID_HOURS: 'Impossible d\'enregistrer cette inscription : le nombre d\'heures choisi n\'est pas valide.',
            ACCOUNT_EXISTS: 'Un compte existe déjà avec cette adresse e-mail.',
            REGISTRATION_ALREADY_PENDING: 'Une demande d\'inscription est déjà en attente pour cette adresse e-mail.'
        };
        alert(messages[error.message] || 'Impossible d\'enregistrer cette inscription. Vérifie les informations puis réessaie.');
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (window.adminInscriptionMode) {
        await handleSubmitAdmin(e.target);
        return;
    }
    
    console.log('Form submission started...');
    
    // Désactiver le bouton pour éviter les doubles soumissions
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        if (submitButton.disabled) {
            console.log('⚠️ Soumission déjà en cours, ignorée');
            return;
        }
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';
    }
    
    // En mode admin, on saute la validation de l'étape 3 (paiement) car on ne l'affiche pas
    if (!window.adminInscriptionMode) {
        // Validate final step
        if (!validateStep(currentStep)) {
            console.log('Validation failed');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-check"></i> Finaliser l\'inscription';
            }
            return;
        }
        
        console.log('Validation passed');
        
        // Check CGV acceptance
        const cgvCheckbox = document.getElementById('cgv');
        if (!cgvCheckbox || !cgvCheckbox.checked) {
            alert('Vous devez accepter les conditions générales de vente');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-check"></i> Finaliser l\'inscription';
            }
            return;
        }
        
        console.log('CGV accepted');
    } else {
        console.log('Mode admin - validation et CGV ignorés');
    }
    
    // Collect form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await processInscription(data);
}

// Process inscription (common logic for both admin and normal mode)
async function processInscription(data) {
    console.log('🔄 Traitement de l\'inscription...');
    
    // Handle document uploads if pack is selected
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    const selectedPackValue = selectedPack ? selectedPack.value : null;
    let documents = {};
    
    if (selectedPack && !window.adminInscriptionMode) {
        console.log('Pack selected, processing documents...');
        
        // Vérifier si le permis est invalidé pour déterminer les documents requis
        const permisInvalide = document.querySelector('input[name="permisInvalide"]:checked')?.value === 'oui';
        
        // Les documents sont attendus pour le dossier, mais ils ne bloquent pas
        // l'inscription : l'eleve peut les ajouter plus tard depuis son espace.
        let expectedFields = [];
        if (permisInvalide) {
            // Si permis invalidé : seulement pièce d'identité et e-photo
            expectedFields = ['pieceIdentite', 'ephoto'];
        } else {
            // Sinon : tous les documents de base
            expectedFields = ['pieceIdentite', 'assr', 'jdc', 'justifDomicile', 'ephoto'];
        }
        
        const heberge = document.querySelector('input[name="heberge"]:checked')?.value;
        
        // Ajouter les documents d'hébergement si nécessaire
        if (heberge === 'oui') {
            expectedFields.push('certifHebergement', 'pieceHebergeur');
        }
        
        // Ajouter la pièce d'identité du parent si mineur
        const dateNaissance = document.getElementById('dateNaissance')?.value;
        if (dateNaissance) {
            const birthDate = new Date(dateNaissance);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                expectedFields.push('pieceIdentiteParent');
            }
        }
        
        // Ajouter la carte étudiante si pack Code et case étudiant cochée
        const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
        if (selectedPackValue === 'code' && codeStudentCheckbox && codeStudentCheckbox.checked) {
            expectedFields.push('codeStudentCardFile');
        }
        
        console.log('Documents attendus:', expectedFields);
        
        const uploadedFields = expectedFields.filter(field => {
            const fileInput = document.getElementById(field);
            return fileInput && fileInput.files && fileInput.files[0];
        });
        
        // Convertir uniquement les fichiers fournis.
        for (const field of uploadedFields) {
            const fileInput = document.getElementById(field);
            console.log(`Checking ${field}:`, fileInput, fileInput?.files);
            
            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    console.log(`Converting ${field} to base64...`);
                    const base64 = await fileToBase64(fileInput.files[0]);
                    documents[field] = {
                        name: fileInput.files[0].name,
                        type: fileInput.files[0].type,
                        data: base64
                    };
                    console.log(`${field} converted successfully`);
                } catch (err) {
                    console.error(`Error converting ${field}:`, err);
                    alert(`Erreur lors du traitement du fichier ${field}. Réessaie.`);
                    throw err;
                }
            }
        }
        
        console.log('Documents fournis a l inscription:', uploadedFields);
        console.log('Total documents collected:', Object.keys(documents).length);
        console.log('Documents object:', documents);
    } else {
        console.log('No pack selected or admin mode - skipping documents');
    }

    // Public registrations never query the users table from the browser.
    // The server validates the email, price and account state before Stripe.
    if (!window.adminInscriptionMode) {
        await processPublicRegistration(data, documents);
        return;
    }

    let paymentRecord = null;

    console.log('🔍 Vérification Supabase...');
    if (!window.supabaseClient) {
        alert('Supabase n\'est pas initialisé, veuillez réessayer.');
        return;
    }
    console.log('✅ Supabase client OK');

    // VÉRIFIER SI L'EMAIL EXISTE DÉJÀ AVANT LE PAIEMENT
    let existingUserId = null;
    console.log('🔍 Vérification email existant:', data.email);
    try {
        const { data: existingUser, error: checkError } = await window.supabaseClient
            .from('users')
            .select('id, email')
            .ilike('email', data.email)
            .maybeSingle();
        
        console.log('Résultat vérification:', { existingUser, checkError });

        if (checkError) {
            console.error('Erreur vérification email:', checkError);
            alert('Erreur lors de la vérification. Réessaie.');
            return;
        }

        if (existingUser) {
            // En mode admin, on met à jour le compte existant sans demander
            if (window.adminInscriptionMode) {
                console.log('⚠️ Compte existant détecté - mise à jour en mode admin');
                existingUserId = existingUser.id;
            } else {
                alert('⚠️ Un compte existe déjà avec cet email.\n\nTu es déjà inscrit(e) ! Merci de te connecter avec tes identifiants.\n\nSi tu as oublié ton mot de passe, contacte l\'auto-école.');
                window.location.href = 'connexion.html';
                return;
            }
        }
    } catch (error) {
        console.error('Erreur réseau vérification:', error);
        alert('Impossible de vérifier l\'email. Réessaie.');
        return;
    }
    
    // Si l'utilisateur a ignoré le pack, pas de paiement requis
    if (skipPack) {
        console.log('Pack ignoré - inscription sans paiement');
    } else if (window.adminInscriptionMode) {
        // Mode admin : pas de paiement requis
        console.log('Mode admin - inscription sans paiement');
    } else {
        // Check payment method
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        
        // Mode test local : si Stripe n'est pas dispo, on saute le paiement
        const isLocalTest = false;
        
        if (paymentMethod === 'card') {
            const cardholderName = document.getElementById('cardholderName')?.value?.trim();
            if (!cardholderName && !isLocalTest) {
                alert('Merci de renseigner le nom du titulaire de la carte');
                return;
            }
            
            if (!stripe || !elements || !cardNumberElement) {
                if (isLocalTest) {
                    console.log('Mode test local : paiement Stripe ignoré');
                } else {
                    alert('Stripe n\'est pas initialisé. Recharge la page et réessaie.');
                    return;
                }
            } else {
                const paymentResult = await processStripePayment(data, documents);
                if (!paymentResult) {
                    return;
                }
                paymentRecord = paymentResult;
            }
        } else if (paymentMethod === 'installments') {
            // Paiement en plusieurs fois avec Stripe
            const cardholderName = document.getElementById('installmentsCardholderName')?.value?.trim();
            if (!cardholderName) {
                alert('Merci de renseigner le nom du titulaire de la carte');
                return;
            }
            
            if (!stripe || !elements || !window.installmentsCardNumberElement) {
                if (isLocalTest) {
                    console.log('Mode test local : paiement Stripe installments ignoré');
                } else {
                    alert('Stripe n\'est pas initialisé. Recharge la page et réessaie.');
                    return;
                }
            } else {
                const paymentResult = await processStripeInstallmentsPayment(data, documents);
                if (!paymentResult) {
                    return;
                }
                paymentRecord = paymentResult;
            }
        }
    }

    // The webhook is the only authority that creates the account, credits hours,
    // generates the invoice and sends the confirmation email after a real payment.
    if (paymentRecord && !window.adminInscriptionMode) {
        window.location.replace('inscription-success.html');
        return;
    }

    // Enregistrer le paiement (analytics CA) - TOUJOURS enregistrer, même en mode admin
    if (selectedPackValue && !skipPack && window.supabaseClient && paymentRecord) {
        try {
            const packPrice = paymentRecord?.amount_eur || (selectedPackValue === 'heures-conduite' 
                ? (parseInt(document.getElementById('nombreHeures')?.value || 0) * 
                   parseInt(document.querySelector('input[name="transmissionType"]:checked')?.dataset.price || 0))
                : packPrices[selectedPackValue] || 0);
            
            const packLabels = {
                'code': 'Code de la route',
                'am': 'Voiture sans permis (AM)',
                'boite-auto': 'Permis B automatique',
                '20h': '20 cours de conduite',
                'chill': 'Permis B complet',
                'accelere': 'Pack Accéléré',
                'aac': 'Conduite Accompagnée (AAC)',
                'supervisee': 'Conduite Supervisée',
                'heures-conduite': 'Heures de conduite',
                'second-chance': 'Forfait Second Chance'
            };
            
            // Déterminer le type de transmission
            let transmissionType = 'manual';
            if (selectedPackValue === 'heures-conduite') {
                const transmissionInput = document.querySelector('input[name="transmissionType"]:checked');
                transmissionType = transmissionInput?.value === 'auto' ? 'auto' : 'manual';
            } else if (selectedPackValue === 'boite-auto' || selectedPackValue === 'am') {
                transmissionType = 'auto';
            } else if (selectedPackValue.includes('-auto')) {
                transmissionType = 'auto';
            } else if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(selectedPackValue)) {
                const packTransmission = document.querySelector('input[name="packTransmissionType"]:checked');
                transmissionType = packTransmission?.value === 'auto' ? 'auto' : 'manual';
            }
            
            // Calculer les heures
            let hoursPurchased = 0;
            if (selectedPackValue === 'heures-conduite') {
                hoursPurchased = parseInt(document.getElementById('nombreHeures')?.value || 0);
            } else {
                hoursPurchased = packHours[selectedPackValue] || 0;
            }
            
            const paymentData = {
                amount_eur: packPrice,
                currency: 'eur',
                pack_id: selectedPackValue,
                pack_label: packLabels[selectedPackValue] || selectedPackValue,
                customer_email: data.email,
                user_email: data.email,
                user_name: `${data.prenom} ${data.nom}`,
                stripe_payment_intent_id: paymentRecord?.stripe_payment_intent_id || null,
                payment_method: paymentRecord?.payment_method || paymentMethod || 'stripe',
                amount: packPrice,
                hours_purchased: hoursPurchased,
                transmission_type: transmissionType
            };
            
            console.log('💾 Enregistrement paiement:', paymentData);
            
            const { error: paymentError } = await window.supabaseClient
                .from('payments')
                .insert(paymentData);
                
            if (paymentError) {
                console.error('❌ Erreur enregistrement paiement:', paymentError);
            } else {
                console.log('✅ Paiement enregistré dans payments');
            }
        } catch (e) {
            console.error('❌ Exception enregistrement paiement:', e);
        }
    }

    // CRÉER LE COMPTE UTILISATEUR IMMÉDIATEMENT après paiement
    try {
        // Créer le compte si paiement effectué OU en mode admin
        if (paymentRecord || window.adminInscriptionMode) {
            const passwordHash = await window.hashPassword(data.password);

            // Calculate hours_goal based on pack
            let hoursGoal = 20; // Default for most packs
            
            if (selectedPack) {
                const packValue = selectedPack.value;
                
                if (packValue === 'heures-conduite') {
                    const nombreHeures = document.getElementById('nombreHeures');
                    hoursGoal = nombreHeures ? parseInt(nombreHeures.value) || 0 : 0;
                } else if (packHours[packValue] !== undefined) {
                    hoursGoal = packHours[packValue] || 0;
                } else if (packValue === 'boite-auto') {
                    hoursGoal = 13;
                } else if (packValue === 'am') {
                    hoursGoal = 8;
                } else if (packValue === 'second-chance') {
                    hoursGoal = 6;
                }
            }

            const seancesEffectuees = document.getElementById('seancesEffectuees');
            const seances = parseInt(seancesEffectuees?.value) || 0;
            const hoursCompletedInitial = seances * 2;

            const payload = {
                prenom: data.prenom,
                nom: data.nom,
                email: data.email,
                password_hash: passwordHash,
                telephone: data.telephone,
                date_nais: data.dateNaissance,
                genre: data.genre || null,
                adresse: data.adresse,
                code_postal: data.codePostal,
                ville: data.ville,
                forfait: selectedPack ? selectedPack.value : null,
                numero_neph: data.numeroNeph || null,
                hours_goal: hoursGoal,
                hours_completed_initial: hoursCompletedInitial,
                lesson_unit_minutes: 45,
                documents: Object.keys(documents).length > 0 ? documents : null
            };

            let error;
            let result;
            
            if (existingUserId) {
                result = await window.supabaseClient
                    .from('users')
                    .update(payload)
                    .eq('id', existingUserId);
                error = result.error;
            } else {
                result = await window.supabaseClient
                    .from('users')
                    .upsert(payload, { onConflict: 'email' });
                error = result.error;
            }

            if (error) {
                console.error('❌ Erreur création compte:', error);
                alert(`Erreur lors de l'inscription: ${error.message}`);
                return;
            }

            console.log('✅ Compte utilisateur créé avec succès');
        } else {
            console.log('⏳ Pas de paiement - Le compte sera créé lors de la validation admin');
        }

        // Traiter le parrainage si un code a été utilisé
        // En mode test local, on accepte même sans paymentRecord
        const isLocalTest = false;
        if (window.referralCode && !window.adminInscriptionMode && (paymentRecord || isLocalTest)) {
            console.log('🎁 Traitement du parrainage avec code:', window.referralCode);
            console.log('PaymentRecord:', paymentRecord, 'LocalTest:', isLocalTest);
            try {
                await processReferral(window.referralCode, data.email, `${data.prenom} ${data.nom}`, paymentRecord);
            } catch (refError) {
                console.error('Erreur lors du traitement du parrainage:', refError);
                // Ne pas bloquer l'inscription si le parrainage échoue
            }
        } else {
            console.log('⚠️ Parrainage non traité. Code:', window.referralCode, 'AdminMode:', window.adminInscriptionMode, 'PaymentRecord:', !!paymentRecord, 'LocalTest:', isLocalTest);
        }

        // Create admin notification SEULEMENT si paiement effectué OU mode admin
        console.log('🔍 selectedPackValue:', selectedPackValue);
        console.log('✅ Création de la notification d\'inscription...');
        
        // Ne créer la notification que si paiement ou mode admin
        if (!paymentRecord && !window.adminInscriptionMode) {
            console.log('⚠️ Pas de paiement et pas en mode admin - notification non créée');
        } else {
            try {
                const notifData = {
                    user_email: data.email,
                    user_name: `${data.prenom} ${data.nom}`,
                    user_prenom: data.prenom,
                    user_nom: data.nom,
                    user_telephone: data.telephone,
                    user_date_naissance: data.dateNaissance,
                    genre: data.genre || null,
                    user_adresse: data.adresse,
                    user_code_postal: data.codePostal,
                    user_ville: data.ville,
                    numero_neph: data.numeroNeph || null,
                    pack: selectedPackValue || null,
                    documents: Object.keys(documents).length > 0 ? documents : null,
                    documents_count: Object.keys(documents).length,
                    status: 'pending',
                    payment_method: window.adminInscriptionMode ? 'cash' : 'card',
                    lesson_unit_minutes: 45,
                    user_password: data.password,
                    parent_prenom: data.parentPrenom || null,
                    parent_nom: data.parentNom || null,
                    is_heberge: data.heberge || null,
                    permis_invalide: data.permisInvalide || null,
                    notes_admin: data.commentaireInscription || null
                };
            
            // Calculer heures selon le pack
            if (selectedPackValue) {
                const seancesEffectuees = document.getElementById('seancesEffectuees');
                const seances = parseInt(seancesEffectuees?.value) || 0;
                const heuresEffectuees = seances * 2;
                
                let heuresIncluses = 0;
                
                if (selectedPackValue === 'heures-conduite') {
                    const nombreHeures = document.getElementById('nombreHeures');
                    const transmissionType = document.querySelector('input[name="transmissionType"]:checked');
                    
                    if (nombreHeures && transmissionType) {
                        const hours = parseInt(nombreHeures.value) || 0;
                        const pricePerHour = parseInt(transmissionType.dataset.price) || 0;
                        const totalPrice = hours * pricePerHour;
                        
                        heuresIncluses = hours;
                        notifData.hours_purchased = hours;
                        notifData.amount_paid = totalPrice;
                        notifData.transmission_type = transmissionType.value === 'manual' ? 'manual' : 'auto';
                    }
                } else {
                    // Pour les autres packs, utiliser packHours
                    heuresIncluses = packHours[selectedPackValue] || 0;
                    
                    // Ajouter des valeurs par défaut pour tous les packs
                    if (selectedPackValue === 'code' || selectedPackValue.startsWith('code-')) {
                        // Vérifier si l'utilisateur est étudiant pour le pack Code
                        const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
                        const isStudent = codeStudentCheckbox && codeStudentCheckbox.checked;
                        const codePrice = packPrices[selectedPackValue] || (isStudent ? 15 : 20);
                        
                        console.log(`📚 Pack Code - Étudiant: ${isStudent}, Prix: ${codePrice}€`);
                        
                        notifData.hours_purchased = 0;
                        notifData.amount_paid = codePrice;
                        notifData.transmission_type = null;
                    } else if (selectedPackValue === 'boite-auto' || selectedPackValue.includes('-auto')) {
                        // Pack boîte auto → toujours BA
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = 'auto';
                    } else if (selectedPackValue === '20h') {
                        // Pack 20 cours de conduite -> toujours BM
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = 'manual';
                    } else if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(selectedPackValue)) {
                        // Packs avec choix BM/BA
                        const packTransmission = document.querySelector('input[name="packTransmissionType"]:checked');
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = packTransmission ? packTransmission.value : 'manual';
                    } else if (selectedPackValue === 'am') {
                        // Pack AM (VSP) → BA
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = 'auto';
                    } else {
                        // Autres packs (chill, etc.) → BM par défaut
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = 'manual';
                    }
                }
            } else {
                // Pas de pack sélectionné - inscription sans forfait
                notifData.hours_purchased = 0;
                notifData.amount_paid = 0;
                notifData.transmission_type = null;
            }
            
            console.log('📦 notifData à insérer:', notifData);
            
            const notifResult = await window.supabaseClient
                .from('inscription_notifications')
                .insert(notifData);
            
            if (notifResult.error) {
                console.error('❌ Erreur notification:', notifResult.error);
                console.error('📋 Détails erreur:', JSON.stringify(notifResult.error, null, 2));
            } else {
                console.log('✅ Notification créée avec succès');
            }
            
            // Créer une facture si un paiement a été effectué
            if (paymentRecord && notifData.amount_paid > 0) {
                try {
                    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                    
                    let description = '';
                    if (selectedPack) {
                        const packLabel = selectedPack.parentElement.querySelector('h3')?.textContent || selectedPack.value;
                        description = `Forfait ${packLabel}`;
                    } else if (notifData.hours_purchased > 0) {
                        description = `${notifData.hours_purchased} cours de conduite`;
                    }
                    
                    const invoiceData = {
                        invoice_number: invoiceNumber,
                        user_email: data.email,
                        student_name: `${data.prenom} ${data.nom}`,
                        payment_date: new Date().toISOString(),
                        amount: paymentRecord?.amount_eur || notifData.amount_paid,
                        description: description,
                        forfait: selectedPack ? selectedPack.value : null,
                        hours_purchased: notifData.hours_purchased || 0,
                        payment_method: paymentRecord.payment_method || 'stripe',
                        stripe_payment_intent_id: paymentRecord.stripe_payment_intent_id || null
                    };
                    
                    const { error: invoiceError } = await window.supabaseClient
                        .from('invoices')
                        .insert(invoiceData);
                    
                    if (invoiceError) {
                        console.error('❌ Erreur création facture:', invoiceError);
                    } else {
                        console.log('✅ Facture créée:', invoiceNumber);
                    }
                } catch (invoiceErr) {
                    console.error('Error creating invoice:', invoiceErr);
                }
            }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
                // Don't block registration if notification fails
            }
        }

        // Success - show success message
        console.log('✅ Inscription terminée - affichage du message de succès');
        showSuccessMessage();
    } catch (error) {
        console.error('Erreur réseau inscription:', error);
        alert('Serveur indisponible pour le moment. Veuillez réessayer plus tard.');
    }
}

// Show success message
function legacyShowSuccessMessage() {
    const formWrapper = document.querySelector('.form-wrapper');
    
    formWrapper.innerHTML = `
        <div class="success-message" style="text-align: center; padding: var(--spacing-2xl); max-width: 700px; margin: 0 auto;">
            <div style="font-size: 5rem; color: var(--success-color); margin-bottom: var(--spacing-lg);">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 style="color: var(--text-dark); margin-bottom: var(--spacing-md); font-size: 2rem;">
                🎉 Félicitations ! Ton inscription a bien été effectuée !
            </h2>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; text-align: left;">
                <h3 style="color: #856404; margin: 0 0 1rem 0; font-size: 1.2rem;">
                    <i class="fas fa-info-circle"></i> Prochaines étapes
                </h3>
                <ol style="color: #856404; margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                    <li><strong>Ton dossier est en cours d'étude</strong> par notre équipe administrative</li>
                    <li><strong>Tu recevras un email de confirmation</strong> une fois ton inscription validée</li>
                    <li><strong>Cet email contiendra tes identifiants</strong> pour accéder à ton espace élève</li>
                    <li><strong>Tu pourras alors te connecter</strong> et commencer ta formation !</li>
                </ol>
            </div>
            
            <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 1rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="margin: 0; color: #0c5460; font-size: 1rem;">
                    <i class="fas fa-clock"></i> <strong>Délai de traitement :</strong> Nous étudions généralement les dossiers sous 24-48h. Tu seras notifié(e) par email dès que ton inscription sera validée.
                </p>
            </div>
            
            <p style="color: var(--text-light); font-size: 1rem; margin: 1.5rem 0;">
                <strong>Important :</strong> Tu ne pourras pas te connecter tant que ton inscription n'aura pas été validée par notre équipe. Vérifie régulièrement ta boîte mail (et tes spams) !
            </p>
            
            <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                <a href="index.html" class="btn-primary">
                    <i class="fas fa-home"></i> Retour à l'accueil
                </a>
            </div>
        </div>
    `;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Confetti animation (optional)
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function showSuccessMessage() {
    const formWrapper = document.querySelector('.form-wrapper');
    if (!formWrapper) return;

    formWrapper.innerHTML = `
        <section class="success-message" style="text-align:center;padding:var(--spacing-2xl);max-width:700px;margin:0 auto;">
            <div style="font-size:5rem;color:var(--success-color);margin-bottom:var(--spacing-lg);">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
            </div>
            <h2 style="color:var(--text-dark);margin-bottom:var(--spacing-md);font-size:2rem;">Inscription enregistr&eacute;e</h2>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:1.5rem;border-radius:8px;margin:2rem 0;text-align:left;">
                <h3 style="color:#856404;margin:0 0 1rem;font-size:1.2rem;"><i class="fas fa-info-circle" aria-hidden="true"></i> Prochaines &eacute;tapes</h3>
                <ol style="color:#856404;margin:0;padding-left:1.5rem;line-height:1.8;">
                    <li>Notre &eacute;quipe &eacute;tudie ton dossier.</li>
                    <li>Tu recevras un e-mail d&egrave;s que ton inscription sera valid&eacute;e.</li>
                    <li>Tu pourras ensuite te connecter &agrave; ton espace &eacute;l&egrave;ve avec tes identifiants.</li>
                </ol>
            </div>
            <p style="color:var(--text-light);font-size:1rem;margin:1.5rem 0;">Le traitement prend g&eacute;n&eacute;ralement 24 &agrave; 48 h. Pense &agrave; v&eacute;rifier tes spams.</p>
            <a href="index.html" class="btn-primary"><i class="fas fa-home" aria-hidden="true"></i> Retour &agrave; l'accueil</a>
        </section>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Phone validation
function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]{10,}$/;
    return re.test(phone);
}

// Real-time validation
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('telephone');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.style.borderColor = 'red';
                showError(this, 'Email invalide');
            } else {
                this.style.borderColor = '';
                hideError(this);
            }
        });
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                this.style.borderColor = 'red';
                showError(this, 'Numéro de téléphone invalide');
            } else {
                this.style.borderColor = '';
                hideError(this);
            }
        });
    }
});

// Show error message
function showError(input, message) {
    hideError(input);
    const error = document.createElement('div');
    error.className = 'error-message';
    error.style.color = 'red';
    error.style.fontSize = '0.875rem';
    error.style.marginTop = '0.25rem';
    error.textContent = message;
    input.parentElement.appendChild(error);
}

// Hide error message
function hideError(input) {
    const error = input.parentElement.querySelector('.error-message');
    if (error) {
        error.remove();
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialize file upload interactions
document.addEventListener('DOMContentLoaded', () => {
    const fileInputs = document.querySelectorAll('.file-input-hidden');
    
    fileInputs.forEach(input => {
        const uploadArea = input.nextElementSibling;
        
        // Handle file selection
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const fileNameDisplay = uploadArea.querySelector('.file-selected-name');
            const uploadText = uploadArea.querySelector('.file-upload-text');
            const uploadSubtext = uploadArea.querySelector('.file-upload-subtext');
            
            if (file) {
                uploadArea.classList.add('has-file');
                fileNameDisplay.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name}`;
                fileNameDisplay.style.display = 'block';
                uploadText.style.display = 'none';
                uploadSubtext.style.display = 'none';
            } else {
                uploadArea.classList.remove('has-file');
                fileNameDisplay.style.display = 'none';
                uploadText.style.display = 'block';
                uploadSubtext.style.display = 'block';
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    });
});

// ===== STRIPE INTEGRATION =====

async function initializeStripe() {
    try {
        // Local development must use the same secure Stripe configuration as production.
        // The legacy mock fields remain disabled so a test never looks like a real payment.
        const isLocalTest = false;

        if (isLocalTest) {
            // Champs pour paiement comptant
            const number = document.getElementById('card-number');
            const exp = document.getElementById('card-expiry');
            const cvc = document.getElementById('card-cvc');

            if (number) {
                number.innerHTML = '<input type="text" class="mock-card-input" placeholder="1234 1234 1234 1234" inputmode="numeric" autocomplete="cc-number">';
            }
            if (exp) {
                exp.innerHTML = '<input type="text" class="mock-card-input" placeholder="MM / AA" inputmode="numeric" autocomplete="cc-exp">';
            }
            if (cvc) {
                cvc.innerHTML = '<input type="text" class="mock-card-input" placeholder="CVC" inputmode="numeric" autocomplete="cc-csc">';
            }

            // Champs pour paiement en plusieurs fois
            const installmentsNumber = document.getElementById('installments-card-number');
            const installmentsExp = document.getElementById('installments-card-expiry');
            const installmentsCvc = document.getElementById('installments-card-cvc');

            if (installmentsNumber) {
                installmentsNumber.innerHTML = '<input type="text" class="mock-card-input" placeholder="1234 1234 1234 1234" inputmode="numeric" autocomplete="cc-number">';
            }
            if (installmentsExp) {
                installmentsExp.innerHTML = '<input type="text" class="mock-card-input" placeholder="MM / AA" inputmode="numeric" autocomplete="cc-exp">';
            }
            if (installmentsCvc) {
                installmentsCvc.innerHTML = '<input type="text" class="mock-card-input" placeholder="CVC" inputmode="numeric" autocomplete="cc-csc">';
            }

            console.log('Mode local détecté - Stripe désactivé, champs simulés créés');
            return;
        }

        const response = await fetch('/.netlify/functions/stripe-config');
        const config = await response.json();
        
        if (!config.publishableKey) {
            console.error('Clé publique Stripe manquante');
            return;
        }
        
        stripePublishableKey = config.publishableKey;
        stripe = Stripe(stripePublishableKey);

        elements = stripe.elements();
        const baseStyle = {
            fontSize: '16px',
            color: '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '::placeholder': { color: '#a0a0a0' }
        };

        // Split card fields for compact Stripe-like layout - Paiement comptant
        cardNumberElement = elements.create('cardNumber', { style: { base: baseStyle } });
        cardExpiryElement = elements.create('cardExpiry', { style: { base: baseStyle } });
        cardCvcElement = elements.create('cardCvc', { style: { base: baseStyle } });

        cardNumberElement.mount('#card-number');
        cardExpiryElement.mount('#card-expiry');
        cardCvcElement.mount('#card-cvc');

        const onChange = (event) => {
            const displayError = document.getElementById('card-errors');
            displayError.textContent = event.error ? event.error.message : '';
        };
        cardNumberElement.on('change', onChange);
        cardExpiryElement.on('change', onChange);
        cardCvcElement.on('change', onChange);
        
        // Stripe n'autorise qu'un champ de chaque type par instance Elements.
        const installmentsElements = stripe.elements();
        window.installmentsCardNumberElement = installmentsElements.create('cardNumber', { style: { base: baseStyle } });
        window.installmentsCardExpiryElement = installmentsElements.create('cardExpiry', { style: { base: baseStyle } });
        window.installmentsCardCvcElement = installmentsElements.create('cardCvc', { style: { base: baseStyle } });

        window.installmentsCardNumberElement.mount('#installments-card-number');
        window.installmentsCardExpiryElement.mount('#installments-card-expiry');
        window.installmentsCardCvcElement.mount('#installments-card-cvc');

        const onChangeInstallments = (event) => {
            const displayError = document.getElementById('installments-card-errors');
            displayError.textContent = event.error ? event.error.message : '';
        };
        window.installmentsCardNumberElement.on('change', onChangeInstallments);
        window.installmentsCardExpiryElement.on('change', onChangeInstallments);
        window.installmentsCardCvcElement.on('change', onChangeInstallments);
        
        console.log('Stripe initialisé avec succès');
    } catch (error) {
        console.error('Erreur initialisation Stripe:', error);
    }
}

function initializePaymentMethodSelection() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardBlock = document.getElementById('cardPaymentBlock');
    
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'card' && radio.checked) {
                cardBlock.classList.add('active');
            } else {
                cardBlock.classList.remove('active');
            }
        });
    });
    
    const cardRadio = document.getElementById('payment-card');
    if (cardRadio && cardRadio.checked) {
        cardBlock.classList.add('active');
    }
}

function getSelectedPurchaseDetails() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    if (!selectedPack) {
        throw new Error('Choisis un forfait avant de payer.');
    }

    const packId = selectedPack.value;
    const packLabel = selectedPack.closest('.pack-option')?.querySelector('h3')?.textContent?.trim() || packId;
    let hours = Number(packHours[packId] || 0);
    let transmission = 'manual';
    let amountEuros = Number(packPrices[packId] || 0);

    if (packId === 'code') {
        amountEuros = document.getElementById('codeStudentCheckbox')?.checked ? 15 : 20;
    } else if (packId === 'heures-conduite') {
        hours = Number.parseInt(document.getElementById('nombreHeures')?.value || '', 10);
        transmission = document.querySelector('input[name="transmissionType"]:checked')?.value === 'auto'
            ? 'auto'
            : 'manual';
        const unitPrice = transmission === 'auto' ? 60 : 50;
        if (!Number.isInteger(hours) || hours < 1 || hours > 40) {
            throw new Error('Indique entre 1 et 40 cours de conduite.');
        }
        amountEuros = hours * unitPrice;
    } else if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(packId)) {
        transmission = document.querySelector('input[name="packTransmissionType"]:checked')?.value === 'auto'
            ? 'auto'
            : 'manual';
    } else if (packId === 'am' || packId === 'boite-auto' || packId.includes('-auto')) {
        transmission = 'auto';
    }

    if (!Number.isFinite(amountEuros) || amountEuros <= 0) {
        throw new Error('Le tarif de ce forfait est indisponible. Recommence ou contacte l\'auto-ecole.');
    }

    return {
        packId,
        packLabel,
        hours,
        transmission,
        amountEuros,
        amountCents: Math.round(amountEuros * 100)
    };
}

window.getSelectedPurchaseDetails = getSelectedPurchaseDetails;

function restoreRegistrationSubmitButton() {
    const submitButton = document.querySelector('button[type="submit"]');
    if (!submitButton) return;
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-check"></i> Finaliser l\'inscription';
}

async function processPublicRegistration(formData, documents) {
    if (skipPack) {
        try {
            const response = await fetch('/.netlify/functions/create-registration-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, documents })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error === 'ACCOUNT_EXISTS'
                    ? 'Un compte existe deja avec cette adresse e-mail.'
                    : result.error === 'REGISTRATION_ALREADY_PENDING'
                        ? 'Une demande est deja en attente pour cette adresse e-mail.'
                        : 'La demande d\'inscription n\'a pas pu etre enregistree.');
            }
            window.location.replace('inscription-success.html');
            return true;
        } catch (error) {
            console.error('Registration request:', error);
            alert(error.message || 'La demande d\'inscription n\'a pas pu etre enregistree.');
            restoreRegistrationSubmitButton();
            return false;
        }
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    if (paymentMethod === 'card') {
        if (!document.getElementById('cardholderName')?.value?.trim()) {
            alert('Merci de renseigner le nom du titulaire de la carte.');
            restoreRegistrationSubmitButton();
            return false;
        }
        if (!stripe || !elements || !cardNumberElement) {
            alert('Le paiement securise est momentanement indisponible. Contacte l\'auto-ecole au 04 91 53 36 98.');
            restoreRegistrationSubmitButton();
            return false;
        }
    } else if (paymentMethod === 'installments') {
        const count = Number.parseInt(document.getElementById('installmentsCount')?.value || '', 10);
        if (![2, 3].includes(count)) {
            alert('Le paiement en plusieurs fois est disponible en 2 ou 3 echeances.');
            restoreRegistrationSubmitButton();
            return false;
        }
        if (!document.getElementById('installmentsMandate')?.checked) {
            alert('Merci de confirmer l autorisation de prelevement des echeances suivantes.');
            restoreRegistrationSubmitButton();
            return false;
        }
        if (!document.getElementById('installmentsCardholderName')?.value?.trim()) {
            alert('Merci de renseigner le nom du titulaire de la carte.');
            restoreRegistrationSubmitButton();
            return false;
        }
        if (!stripe || !elements || !window.installmentsCardNumberElement) {
            alert('Le paiement securise est momentanement indisponible. Contacte l\'auto-ecole au 04 91 53 36 98.');
            restoreRegistrationSubmitButton();
            return false;
        }
    } else {
        alert('Choisis un mode de paiement.');
        restoreRegistrationSubmitButton();
        return false;
    }

    let paymentResult = null;
    try {
        paymentResult = paymentMethod === 'installments'
            ? await window.processStripeInstallmentsPayment(formData, documents)
            : await processStripePayment(formData, documents);
    } catch (error) {
        console.error('Public registration payment:', error);
        alert(error.message || 'Le paiement n\'a pas pu etre finalise.');
        restoreRegistrationSubmitButton();
        return false;
    }

    if (!paymentResult) return false;
    window.location.replace('inscription-success.html');
    return true;
}

async function processStripePayment(formData, documents = {}) {
    const feedback = document.getElementById('paymentFeedback');
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    feedback.className = 'payment-feedback processing';
    feedback.textContent = 'Traitement du paiement en cours...';
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Paiement en cours...';
    
    try {
        const selectedPack = document.querySelector('input[name="pack"]:checked');
        const packName = selectedPack.value;
        const purchase = getSelectedPurchaseDetails();
        
        // Vérifier si l'utilisateur est étudiant pour le pack Code
        let packPrice = packPrices[packName];
        if (packName === 'code') {
            const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
            const isStudent = codeStudentCheckbox && codeStudentCheckbox.checked;
            packPrice = isStudent ? 15 : 20;
            console.log(`💳 Paiement Pack Code - Étudiant: ${isStudent}, Prix: ${packPrice}€`);
        }

        let hoursForPayment = packHours[packName] || 0;
        let transmissionForPayment = packName.includes('-auto') || packName === 'boite-auto' || packName === 'am' ? 'auto' : 'manual';

        if (packName === 'heures-conduite') {
            const nombreHeures = document.getElementById('nombreHeures');
            const transmissionType = document.querySelector('input[name="transmissionType"]:checked');
            hoursForPayment = parseInt(nombreHeures?.value || '0', 10);
            transmissionForPayment = transmissionType?.value === 'auto' ? 'auto' : 'manual';
        } else if (['aac', 'supervisee', 'accelere', 'second-chance'].includes(packName)) {
            const packTransmission = document.querySelector('input[name="packTransmissionType"]:checked');
            transmissionForPayment = packTransmission?.value === 'auto' ? 'auto' : 'manual';
        }
        
        const amountInCents = packPrice * 100;
        
        const paymentIntentResponse = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'registration',
                amount: purchase.amountCents,
                currency: 'eur',
                packId: purchase.packId,
                packLabel: purchase.packLabel,
                hours: purchase.hours,
                transmission: purchase.transmission,
                customerEmail: formData.email,
                description: `Inscription Auto-Ecole - ${purchase.packLabel}`,
                registration: {
                    prenom: formData.prenom,
                    nom: formData.nom,
                    email: formData.email,
                    telephone: formData.telephone,
                    password: formData.password,
                    dateNaissance: formData.dateNaissance,
                    genre: formData.genre,
                    adresse: formData.adresse,
                    codePostal: formData.codePostal,
                    ville: formData.ville,
                    numeroNeph: formData.numeroNeph,
                    referralCode: window.referralCode || null,
                    documents
                }
            })
        });
        
        const { clientSecret, message } = await paymentIntentResponse.json();
        
        if (!clientSecret) {
            throw new Error(message || 'Impossible de créer le paiement');
        }
        
        const cardholderName = document.getElementById('cardholderName').value.trim();
        
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumberElement,
                billing_details: {
                    name: cardholderName || `${formData.prenom} ${formData.nom}`,
                    email: formData.email,
                    phone: formData.telephone,
                    address: {
                        line1: formData.adresse,
                        postal_code: formData.codePostal,
                        city: formData.ville,
                        country: 'FR'
                    }
                }
            }
        });
        
        if (stripeError) {
            throw new Error(stripeError.message);
        }
        
        if (paymentIntent.status === 'succeeded') {
            feedback.className = 'payment-feedback success';
            feedback.textContent = '✓ Paiement réussi ! Finalisation de ton inscription...';
            return {
                stripe_payment_intent_id: paymentIntent.id,
                amount_eur: purchase.amountEuros,
                pack_id: purchase.packId,
                pack_label: purchase.packLabel
            };
        } else {
            throw new Error('Le paiement n\'a pas abouti. Statut: ' + paymentIntent.status);
        }
    } catch (error) {
        console.error('Erreur paiement Stripe:', error);
        feedback.className = 'payment-feedback error';
        feedback.textContent = '✗ ' + (error.message || 'Erreur lors du paiement');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return null;
    }
}

// Toggle heures de conduite configuration section
function toggleHeuresConduiteConfig() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    const heuresConfig = document.getElementById('heuresConduiteConfig');
    
    if (selectedPack && selectedPack.value === 'heures-conduite') {
        heuresConfig.style.display = 'block';
    } else {
        heuresConfig.style.display = 'none';
    }
}

// Toggle transmission type section for packs that need it
function toggleTransmissionTypeSection() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    const transmissionSection = document.getElementById('transmissionTypeSection');
    
    // Packs qui nécessitent un choix BM/BA
    const packsNeedingChoice = ['aac', 'supervisee', 'accelere', 'second-chance'];
    
    if (selectedPack && packsNeedingChoice.includes(selectedPack.value)) {
        transmissionSection.style.display = 'block';
    } else {
        transmissionSection.style.display = 'none';
    }
}

// Update heures restantes
function updateHeuresRestantes() {
    const seancesInput = document.getElementById('seancesEffectuees');
    const heuresRestantesDisplay = document.getElementById('heuresRestantesDisplay');
    const heuresRestantesValue = document.getElementById('heuresRestantesValue');
    
    if (!seancesInput || !window.adminInscriptionMode) {
        if (heuresRestantesDisplay) heuresRestantesDisplay.style.display = 'none';
        return;
    }
    
    // Get selected pack
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    if (!selectedPack) {
        heuresRestantesDisplay.style.display = 'none';
        return;
    }
    
    let heuresIncluses = 0;
    
    // For heures-conduite pack, get from nombreHeures input
    if (selectedPack.value === 'heures-conduite') {
        const nombreHeuresInput = document.getElementById('nombreHeures');
        heuresIncluses = parseInt(nombreHeuresInput?.value) || 0;
    } else {
        // For other packs, get from packHours
        heuresIncluses = packHours[selectedPack.value] || 0;
    }
    
    const seancesEffectuees = parseInt(seancesInput.value) || 0;
    const heuresEffectuees = seancesEffectuees * 2;
    const heuresRestantes = Math.max(0, heuresIncluses - heuresEffectuees);
    
    if (heuresIncluses > 0) {
        heuresRestantesDisplay.style.display = 'block';
        heuresRestantesValue.textContent = heuresRestantes + 'h';
    } else {
        heuresRestantesDisplay.style.display = 'none';
    }
    
    if (selectedPack.value === 'heures-conduite') {
        updateHeuresPrice();
    }
}

// Update cours de conduite price
function updateHeuresPrice() {
    const transmissionInput = document.querySelector('input[name="transmissionType"]:checked');
    const nombreHeuresInput = document.getElementById('nombreHeures');
    const totalPriceEl = document.getElementById('heuresConduiteTotalPrice');
    const packPriceEl = document.getElementById('heures-conduite-price');
    
    if (!transmissionInput || !nombreHeuresInput) {
        totalPriceEl.textContent = '0€';
        return;
    }
    
    let hours = parseInt(nombreHeuresInput.value) || 0;
    
    const pricePerHour = parseInt(transmissionInput.dataset.price) || 0;
    const totalPrice = hours * pricePerHour;
    
    totalPriceEl.textContent = totalPrice + '€';
    
    // Update pack price in the selection
    if (hours > 0 && pricePerHour > 0) {
        packPriceEl.textContent = totalPrice + '€';
        packPrices['heures-conduite'] = totalPrice;
    } else {
        packPriceEl.textContent = '-';
        packPrices['heures-conduite'] = 0;
    }
    
    // Update summary if this pack is selected
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    if (selectedPack && selectedPack.value === 'heures-conduite') {
        updateSummary();
    }
}

// Afficher un message de bienvenue pour le parrainage
function showReferralWelcome(code) {
    const step1 = document.getElementById('step1');
    if (!step1) return;
    
    const welcomeMessage = document.createElement('div');
    welcomeMessage.style.cssText = `
        background: linear-gradient(135deg, #fff9fb 0%, #fff 100%);
        border: 2px solid rgba(233,30,99,0.2);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
    `;
    welcomeMessage.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎁</div>
        <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">Bienvenue !</h3>
        <p style="color: #666; margin: 0;">
            Tu as été parrainé avec le code <strong>${code}</strong><br>
            Ton parrain recevra 1h de conduite gratuite dès que tu auras payé ton forfait !
        </p>
    `;
    
    step1.insertBefore(welcomeMessage, step1.firstChild);
}

// Traiter le parrainage après paiement validé
async function processReferral(referralCode, refereeEmail, refereeName, paymentRecord) {
    console.log('========================================');
    console.log('🎁 DÉBUT DU TRAITEMENT DU PARRAINAGE');
    console.log('Code:', referralCode);
    console.log('Filleul email:', refereeEmail);
    console.log('Filleul nom:', refereeName);
    console.log('PaymentRecord:', paymentRecord);
    console.log('========================================');
    
    try {
        // Vérifier que le code de parrainage existe
        console.log('🔍 Recherche du code de parrainage dans la base...');
        const { data: referralData, error: fetchError } = await window.supabaseClient
            .from('referrals')
            .select('*')
            .eq('referral_code', referralCode)
            .is('referee_email', null)
            .maybeSingle();
        
        console.log('Résultat recherche:', { referralData, fetchError });
        
        if (fetchError) {
            console.error('❌ Erreur lors de la recherche du code:', fetchError);
            return;
        }
        
        if (!referralData) {
            console.error('❌ Code de parrainage invalide ou déjà utilisé');
            return;
        }
        
        console.log('✅ Code de parrainage valide trouvé:', referralData);
        console.log('Parrain:', referralData.referrer_email);
        
        // Mettre à jour le parrainage avec les infos du filleul
        console.log('📝 Mise à jour du parrainage avec les infos du filleul...');
        const { error: updateError } = await window.supabaseClient
            .from('referrals')
            .update({
                referee_email: refereeEmail,
                referee_name: refereeName,
                payment_verified: true,
                status: 'pending'
            })
            .eq('id', referralData.id);
        
        if (updateError) {
            console.error('❌ Erreur lors de la mise à jour du parrainage:', updateError);
            return;
        }
        
        console.log('✅ Parrainage mis à jour avec succès');
        console.log('⏳ L\'heure de parrainage sera créditée après validation de l\'inscription par l\'admin');
        
        // Envoyer un email au filleul pour l'informer
        console.log('📧 Envoi d\'un email au filleul...');
        await sendReferralConfirmationEmail(refereeEmail, refereeName, referralData.referrer_name);
        
        console.log('========================================');
        console.log('🎁 FIN DU TRAITEMENT DU PARRAINAGE');
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ ERREUR GÉNÉRALE lors du traitement du parrainage:', error);
        console.error('Stack:', error.stack);
    }
}

// Envoyer un email de confirmation au filleul
async function sendReferralConfirmationEmail(refereeEmail, refereeName, referrerName) {
    try {
        const subject = '🎁 Merci pour votre inscription avec parrainage - Auto-École Breteuil';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #e91e63 0%, #f06292 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; border-left: 4px solid #e91e63; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎁 Merci pour votre inscription !</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${refereeName}</strong>,</p>
                        <p>Merci de vous être inscrit(e) à l'Auto-École Breteuil avec le code de parrainage de <strong>${referrerName}</strong> !</p>
                        
                        <div class="info-box">
                            <h3 style="margin-top: 0; color: #e91e63;">📋 Prochaines étapes</h3>
                            <p>Votre inscription est actuellement <strong>en attente de validation</strong> par notre équipe administrative.</p>
                            <p>Une fois votre inscription validée :</p>
                            <ul>
                                <li>✅ Vous recevrez un email de confirmation avec vos identifiants</li>
                                <li>🎁 <strong>${referrerName}</strong> recevra automatiquement <strong>1 cours de conduite gratuit</strong></li>
                                <li>🚗 Vous pourrez accéder à votre espace élève et réserver vos cours</li>
                            </ul>
                        </div>
                        
                        <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <strong>⏳ Délai de traitement :</strong> Notre équipe traite généralement les inscriptions sous 24-48h. Vous recevrez un email dès que votre inscription sera validée.
                        </p>
                        
                        <p>Merci de votre confiance et à très bientôt sur la route ! 🚗</p>
                    </div>
                    <div class="footer">
                        <p><strong>Auto-École Breteuil</strong></p>
                        <p>Marseille 13006</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const { error } = await window.supabaseClient.functions.invoke('send-email', {
            body: {
                to: refereeEmail,
                subject: subject,
                html: htmlContent
            }
        });
        
        if (error) {
            console.error('❌ Erreur envoi email filleul:', error);
        } else {
            console.log('✅ Email de confirmation envoyé au filleul');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    }
}

// ===== GESTION PACK CODE ÉTUDIANT =====
document.addEventListener('DOMContentLoaded', () => {
    const packCodeRadio = document.getElementById('pack-code');
    const codeStudentSection = document.getElementById('codeStudentSection');
    const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
    const codeStudentCardUpload = document.getElementById('codeStudentCardUpload');
    const codeStudentCardFile = document.getElementById('codeStudentCardFile');
    const codePriceDisplay = document.getElementById('codePriceDisplay');
    
    // Afficher/masquer la section étudiant quand le pack Code est sélectionné
    const allPackRadios = document.querySelectorAll('input[name="pack"]');
    allPackRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (codeStudentSection) {
                if (this.value === 'code' && this.checked) {
                    codeStudentSection.style.display = 'block';
                    console.log('✅ Section étudiant affichée pour pack Code');
                } else {
                    codeStudentSection.style.display = 'none';
                    // Réinitialiser la case étudiant si on change de pack
                    if (codeStudentCheckbox) {
                        codeStudentCheckbox.checked = false;
                        if (codeStudentCardUpload) codeStudentCardUpload.style.display = 'none';
                        if (codePriceDisplay) codePriceDisplay.textContent = '20€';
                        packPrices.code = 20;
                    }
                }
            }
        });
    });
    
    // Gérer la case à cocher étudiant
    if (codeStudentCheckbox) {
        codeStudentCheckbox.addEventListener('change', function(e) {
            e.stopPropagation(); // Empêcher la propagation de l'événement
            const isStudent = this.checked;
            
            console.log('📚 Case étudiant changée:', isStudent);
            
            // Afficher/masquer l'upload de carte étudiante
            if (codeStudentCardUpload) {
                codeStudentCardUpload.style.display = isStudent ? 'block' : 'none';
                console.log('Upload carte étudiante:', isStudent ? 'visible' : 'caché');
            }
            
            // Rendre le champ obligatoire ou non
            if (codeStudentCardFile) {
                codeStudentCardFile.required = isStudent;
            }
            
            // Mettre à jour le prix affiché
            if (codePriceDisplay) {
                codePriceDisplay.textContent = isStudent ? '15€' : '20€';
            }
            
            // Mettre à jour le prix dans packPrices pour le calcul
            packPrices.code = isStudent ? 15 : 20;
            
            console.log(`📚 Pack Code: ${isStudent ? 'Étudiant (15€)' : 'Classique (20€)'}`);
            
            // Mettre à jour le récapitulatif de commande
            if (typeof updateSummary === 'function') {
                updateSummary();
            }
        });
    }
});
