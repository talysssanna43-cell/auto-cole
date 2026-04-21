// ===== INSCRIPTION FORM MANAGEMENT =====

let currentStep = 1;
const totalSteps = 3;

// Pack prices
const packPrices = {
    code: 20,
    am: 350,
    'boite-auto': 859,
    '20h': 900,
    zen: 995,
    accelere: 999,
    aac: 1190,
    supervisee: 1190,
    'heures-conduite': 0, // Will be calculated based on hours and transmission type
    'second-chance': 569
};

// Pack hours included
const packHours = {
    code: 0,
    am: 8,
    'boite-auto': 13,
    '20h': 20,
    zen: 20,
    accelere: 20,
    aac: 20,
    supervisee: 20,
    'heures-conduite': 0, // Will be calculated based on nombreHeures input
    'second-chance': 6
};

// Stripe variables
let stripe = null;
let elements = null;
let cardNumberElement = null;
let cardExpiryElement = null;
let cardCvcElement = null;
let stripePublishableKey = null;

// Initialize form
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inscription.js chargé');
    
    // Check URL parameters for pre-selected pack or admin mode
    const urlParams = new URLSearchParams(window.location.search);
    const packParam = urlParams.get('pack');
    const isAdminMode = urlParams.get('admin') === 'true';
    const referralCode = urlParams.get('ref');
    
    console.log('URL params:', { packParam, isAdminMode, referralCode });
    
    if (packParam && packPrices[packParam]) {
        document.getElementById(`pack-${packParam}`).checked = true;
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
    const permisInvalide = document.querySelector('input[name="permisInvalide"]:checked')?.value === 'oui';
    
    if (selectedPack && documentsSection) {
        documentsSection.style.display = 'block';
        
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
    } else if (documentsSection) {
        documentsSection.style.display = 'none';
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
    
    // Si on est à l'étape 2 (documents), vérifier que tous les documents obligatoires sont présents
    if (step === 2) {
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
                alert(`❌ Documents manquants !\n\nMerci de fournir les documents suivants avant de continuer :\n\n• ${missingNames}\n\nTous les documents marqués d'une étoile (*) sont obligatoires.`);
                isValid = false;
            }
        }
    }
    
    if (!isValid && step !== 2) {
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
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    if (!selectedPack) return;
    
    const packValue = selectedPack.value;
    const basePrice = packPrices[packValue] || 0;
    
    const installments = parseInt(document.getElementById('installmentsCount')?.value || '3');
    
    // Taux de majoration selon le nombre de mensualités
    const feeRates = {
        2: 1.0432,  // +4.32%
        3: 1.0456,  // +4.56%
        4: 1.0576   // +5.76%
    };
    
    const feeRate = feeRates[installments] || 1.0456;
    const totalWithFees = Math.round(basePrice * feeRate);
    
    // Calculer la mensualité de base
    const baseMonthlyAmount = Math.floor(totalWithFees / installments);
    // Calculer le reste pour ajuster la dernière mensualité
    const remainder = totalWithFees - (baseMonthlyAmount * installments);
    
    // Construire l'affichage détaillé des mensualités
    let monthlyDisplay = '';
    for (let i = 1; i <= installments; i++) {
        const amount = (i === installments && remainder > 0) 
            ? baseMonthlyAmount + remainder 
            : baseMonthlyAmount;
        monthlyDisplay += `${i}${i === 1 ? 'ère' : 'ème'}: ${amount}€`;
        if (i < installments) monthlyDisplay += ' • ';
    }
    
    const installmentsTotal = document.getElementById('installmentsTotal');
    const installmentsMonthly = document.getElementById('installmentsMonthly');
    
    if (installmentsTotal) installmentsTotal.textContent = `${totalWithFees}€`;
    if (installmentsMonthly) installmentsMonthly.innerHTML = monthlyDisplay;
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
        
        // For heures-conduite, also show the number of hours and transmission type
        if (packName === 'heures-conduite') {
            const nombreHeures = document.getElementById('nombreHeures');
            const transmissionType = document.querySelector('input[name="transmissionType"]:checked');
            
            if (nombreHeures && nombreHeures.value) {
                const hours = nombreHeures.value;
                const transmissionLabel = transmissionType ? 
                    (transmissionType.value === 'manual' ? 'Boîte manuelle' : 'Boîte automatique') : '';
                
                document.getElementById('selectedHours').textContent = `${hours} heures - ${transmissionLabel}`;
            } else {
                document.getElementById('selectedHours').textContent = 'Configuration requise';
            }
        } else if (packName === 'code') {
            // Code de la route : 0 heures de conduite
            document.getElementById('selectedHours').textContent = '0 heures de conduite';
        } else {
            // For other packs, show default hours (20h for most packs)
            const selectedHours = document.getElementById('heures');
            if (selectedHours) {
                document.getElementById('selectedHours').textContent = `${selectedHours.value} heures`;
            } else {
                document.getElementById('selectedHours').textContent = '20 heures';
            }
        }
        
        // Vérifier si paiement en plusieurs fois
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        if (paymentMethod === 'installments') {
            // Taux de majoration selon le nombre de mensualités
            const installments = parseInt(document.getElementById('installmentsCount')?.value || '3');
            const feeRates = {
                2: 1.0432,  // +4.32%
                3: 1.0456,  // +4.56%
                4: 1.0576   // +5.76%
            };
            const feeRate = feeRates[installments] || 1.0456;
            totalPrice = Math.round(totalPrice * feeRate);
            document.getElementById('totalPrice').textContent = `${totalPrice}€`;
        } else {
            document.getElementById('totalPrice').textContent = `${totalPrice}€`;
        }
    }
}

// Handle admin form submission (called directly with form element)
async function handleSubmitAdmin(form) {
    console.log('📝 Traitement inscription admin...');
    
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Données collectées:', data);
    
    await processInscription(data);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Form submission started...');
    
    // En mode admin, on saute la validation de l'étape 3 (paiement) car on ne l'affiche pas
    if (!window.adminInscriptionMode) {
        // Validate final step
        if (!validateStep(currentStep)) {
            console.log('Validation failed');
            return;
        }
        
        console.log('Validation passed');
        
        // Check CGV acceptance
        const cgvCheckbox = document.getElementById('cgv');
        if (!cgvCheckbox || !cgvCheckbox.checked) {
            alert('Vous devez accepter les conditions générales de vente');
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
        
        // Définir les documents obligatoires selon le cas
        let requiredFields = [];
        if (permisInvalide) {
            // Si permis invalidé : seulement pièce d'identité et e-photo
            requiredFields = ['pieceIdentite', 'ephoto'];
        } else {
            // Sinon : tous les documents de base
            requiredFields = ['pieceIdentite', 'assr', 'jdc', 'justifDomicile', 'ephoto'];
        }
        
        const heberge = document.querySelector('input[name="heberge"]:checked')?.value;
        
        // Ajouter les documents d'hébergement si nécessaire
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
        
        // Ajouter la carte étudiante si pack Code et case étudiant cochée
        const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
        if (selectedPackValue === 'code' && codeStudentCheckbox && codeStudentCheckbox.checked) {
            requiredFields.push('codeStudentCardFile');
        }
        
        console.log('Documents obligatoires:', requiredFields);
        
        // Vérifier que tous les documents obligatoires sont présents
        const missingDocs = [];
        for (const field of requiredFields) {
            const fileInput = document.getElementById(field);
            if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                missingDocs.push(field);
            }
        }
        
        // Si des documents manquent, afficher une erreur et arrêter
        if (missingDocs.length > 0) {
            const docNames = {
                'pieceIdentite': 'Pièce d\'identité',
                'assr': 'ASSR',
                'jdc': 'JDC ou Attestation de recensement',
                'justifDomicile': 'Justificatif de domicile',
                'ephoto': 'E-photo',
                'certifHebergement': 'Certificat d\'hébergement',
                'pieceHebergeur': 'Pièce d\'identité de l\'hébergeur',
                'pieceIdentiteParent': 'Pièce d\'identité du représentant légal',
                'codeStudentCardFile': 'Carte étudiante'
            };
            
            const missingNames = missingDocs.map(doc => docNames[doc] || doc).join(', ');
            alert(`❌ Documents manquants !\n\nMerci de fournir les documents suivants pour continuer :\n\n${missingNames}\n\nTous les documents marqués d'une étoile (*) sont obligatoires.`);
            throw new Error('Documents manquants');
        }
        
        // Convertir tous les fichiers en base64
        for (const field of requiredFields) {
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
        
        console.log('✅ Tous les documents obligatoires sont présents');
        console.log('Total documents collected:', Object.keys(documents).length);
        console.log('Documents object:', documents);
    } else {
        console.log('No pack selected or admin mode - skipping documents');
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
        const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        
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
                const paymentResult = await processStripePayment(data);
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
                const paymentResult = await processStripeInstallmentsPayment(data);
                if (!paymentResult) {
                    return;
                }
                paymentRecord = paymentResult;
            }
        }
    }

    // Enregistrer le paiement (analytics CA)
    if (selectedPackValue && !skipPack && !window.adminInscriptionMode && window.supabaseClient) {
        try {
            const packPrice = selectedPackValue === 'heures-conduite' 
                ? (parseInt(document.getElementById('nombreHeures')?.value || 0) * 
                   parseInt(document.querySelector('input[name="transmissionType"]:checked')?.dataset.price || 0))
                : packPrices[selectedPackValue] || 0;
            
            const packLabels = {
                'code': 'Code de la route',
                'am': 'Voiture sans permis (AM)',
                'boite-auto': 'Permis B automatique',
                '20h': '20h de conduite',
                'zen': 'Permis B complet',
                'accelere': 'Pack Accéléré',
                'aac': 'Conduite Accompagnée (AAC)',
                'supervisee': 'Conduite Supervisée',
                'heures-conduite': 'Heures de conduite',
                'second-chance': 'Forfait Second Chance'
            };
            
            await window.supabaseClient
                .from('payments')
                .insert({
                    amount_eur: packPrice,
                    currency: 'eur',
                    pack_id: selectedPackValue,
                    pack_label: packLabels[selectedPackValue] || selectedPackValue,
                    customer_email: data.email,
                    stripe_payment_intent_id: paymentRecord?.stripe_payment_intent_id || null
                });
            console.log('✅ Paiement enregistré dans analytics');
        } catch (e) {
            console.warn('Impossible d\'enregistrer le paiement (analytics):', e);
        }
    }

    // NE PAS CRÉER LE COMPTE UTILISATEUR IMMÉDIATEMENT
    // Le compte sera créé par l'admin lors de la validation de l'inscription
    try {
        // En mode admin, on crée quand même le compte immédiatement
        if (window.adminInscriptionMode) {
            const passwordHash = await window.hashPassword(data.password);

            // Calculate hours_goal based on pack
            let hoursGoal = 20; // Default for most packs
            
            if (selectedPack) {
                const packValue = selectedPack.value;
                
                if (packValue === 'heures-conduite') {
                    const nombreHeures = document.getElementById('nombreHeures');
                    hoursGoal = nombreHeures ? parseInt(nombreHeures.value) || 0 : 0;
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
                adresse: data.adresse,
                code_postal: data.codePostal,
                ville: data.ville,
                forfait: selectedPack ? selectedPack.value : null,
                hours_goal: hoursGoal,
                hours_completed_initial: hoursCompletedInitial,
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
                console.error('❌ Erreur création compte admin:', error);
                alert(`Erreur lors de l'inscription: ${error.message}`);
                return;
            }

            console.log('✅ Compte créé en mode admin');
        } else {
            console.log('⏳ Mode inscription normale - Le compte sera créé lors de la validation admin');
        }

        // Traiter le parrainage si un code a été utilisé
        // En mode test local, on accepte même sans paymentRecord
        const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
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

        // Create admin notification (même sans pack pour permettre validation admin)
        console.log('🔍 selectedPackValue:', selectedPackValue);
        console.log('✅ Création de la notification d\'inscription...');
        try {
            const notifData = {
                user_email: data.email,
                user_name: `${data.prenom} ${data.nom}`,
                user_prenom: data.prenom,
                user_nom: data.nom,
                user_telephone: data.telephone,
                user_date_naissance: data.dateNaissance,
                user_adresse: data.adresse,
                user_code_postal: data.codePostal,
                user_ville: data.ville,
                pack: selectedPackValue || null,
                documents_count: Object.keys(documents).length,
                status: 'pending',
                payment_method: window.adminInscriptionMode ? 'cash' : 'card',
                user_password: data.password,
                parent_prenom: data.parentPrenom || null,
                parent_nom: data.parentNom || null,
                is_heberge: data.heberge || null,
                permis_invalide: data.permisInvalide || null
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
                    if (selectedPackValue === 'code') {
                        // Vérifier si l'utilisateur est étudiant pour le pack Code
                        const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
                        const isStudent = codeStudentCheckbox && codeStudentCheckbox.checked;
                        const codePrice = isStudent ? 15 : 20;
                        
                        console.log(`📚 Pack Code - Étudiant: ${isStudent}, Prix: ${codePrice}€`);
                        
                        notifData.hours_purchased = 0;
                        notifData.amount_paid = codePrice;
                        notifData.transmission_type = null;
                    } else if (selectedPackValue === 'boite-auto') {
                        // Pack boîte auto → toujours BA
                        notifData.hours_purchased = heuresIncluses;
                        notifData.amount_paid = packPrices[selectedPackValue] || 0;
                        notifData.transmission_type = 'auto';
                    } else if (selectedPackValue === '20h') {
                        // Pack 20h de conduite → toujours BM
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
                        // Autres packs (zen, etc.) → BM par défaut
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
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't block registration if notification fails
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
function showSuccessMessage() {
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
        const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

        if (isLocalTest) {
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

            console.log('Mode local détecté - Stripe désactivé');
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
        
        // Créer des éléments Stripe séparés pour le bloc paiement en plusieurs fois
        window.installmentsCardNumberElement = elements.create('cardNumber', { style: { base: baseStyle } });
        window.installmentsCardExpiryElement = elements.create('cardExpiry', { style: { base: baseStyle } });
        window.installmentsCardCvcElement = elements.create('cardCvc', { style: { base: baseStyle } });

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

async function processStripePayment(formData) {
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
        
        // Vérifier si l'utilisateur est étudiant pour le pack Code
        let packPrice = packPrices[packName];
        if (packName === 'code') {
            const codeStudentCheckbox = document.getElementById('codeStudentCheckbox');
            const isStudent = codeStudentCheckbox && codeStudentCheckbox.checked;
            packPrice = isStudent ? 15 : 20;
            console.log(`💳 Paiement Pack Code - Étudiant: ${isStudent}, Prix: ${packPrice}€`);
        }
        
        const amountInCents = packPrice * 100;
        
        const paymentIntentResponse = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'eur',
                packId: packName,
                packLabel: selectedPack.parentElement.querySelector('h3').textContent,
                customerEmail: formData.email,
                description: `Inscription Auto-École - ${selectedPack.parentElement.querySelector('h3').textContent}`
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
                amount_eur: packPrice,
                pack_id: packName,
                pack_label: selectedPack.parentElement.querySelector('h3').textContent
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

// Update heures de conduite price
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
    
    // Ensure even number
    if (hours % 2 !== 0) {
        hours = Math.floor(hours / 2) * 2;
        nombreHeuresInput.value = hours;
    }
    
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
                                <li>🎁 <strong>${referrerName}</strong> recevra automatiquement <strong>1 heure de conduite gratuite</strong></li>
                                <li>🚗 Vous pourrez accéder à votre espace élève et réserver vos heures</li>
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
