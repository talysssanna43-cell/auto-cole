// ===== INSCRIPTION FORM MANAGEMENT =====

let currentStep = 1;
const totalSteps = 3;

// Pack prices
const packPrices = {
    zen: 599,
    premium: 799,
    accelere: 999
};

// Stripe variables
let stripe = null;
let cardElement = null;
let stripePublishableKey = null;

// Initialize form
document.addEventListener('DOMContentLoaded', async () => {
    // Check URL parameters for pre-selected pack
    const urlParams = new URLSearchParams(window.location.search);
    const packParam = urlParams.get('pack');
    
    if (packParam && packPrices[packParam]) {
        document.getElementById(`pack-${packParam}`).checked = true;
    }
    
    // Update summary when pack or hours change
    document.querySelectorAll('input[name="pack"]').forEach(radio => {
        radio.addEventListener('change', updateSummary);
    });
    
    const hoursField = document.getElementById('heures');
    if (hoursField) {
        hoursField.addEventListener('change', updateSummary);
    }
    
    // Initial summary update
    updateSummary();
    
    // Initialize Stripe
    await initializeStripe();
    
    // Payment method selection
    initializePaymentMethodSelection();
    
    // Form submission
    document.getElementById('inscriptionForm').addEventListener('submit', handleSubmit);
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
        
        // Show next step
        document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
        
        // Update progress indicator
        const nextProgressStep = document.querySelector(`.progress-step:nth-child(${currentStep * 2 - 1})`);
        nextProgressStep.classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
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
    
    if (!isValid) {
        alert('Veuillez remplir tous les champs obligatoires');
    }
    
    return isValid;
}

// Update order summary
function updateSummary() {
    const selectedPack = document.querySelector('input[name="pack"]:checked');
    const selectedHours = document.getElementById('heures');
    
    if (selectedPack && selectedHours) {
        const packName = selectedPack.value;
        const packLabel = selectedPack.parentElement.querySelector('h3').textContent;
        const hours = selectedHours.value;
        
        // Update summary display
        document.getElementById('selectedPack').textContent = packLabel;
        document.getElementById('selectedHours').textContent = `${hours} heures`;
        
        // Calculate price (simplified - in real app would be more complex)
        let basePrice = packPrices[packName];
        const hourDiff = parseInt(hours) - 20;
        const pricePerHour = 40;
        const totalPrice = basePrice + (hourDiff * pricePerHour);
        
        document.getElementById('totalPrice').textContent = `${totalPrice}€`;
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate final step
    if (!validateStep(currentStep)) {
        return;
    }
    
    // Check CGV acceptance
    const cgvCheckbox = document.getElementById('cgv');
    if (!cgvCheckbox.checked) {
        alert('Vous devez accepter les conditions générales de vente');
        return;
    }
    
    // Collect form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!window.supabaseClient) {
        alert('Supabase n\'est pas initialisé, veuillez réessayer.');
        return;
    }

    // VÉRIFIER SI L'EMAIL EXISTE DÉJÀ AVANT LE PAIEMENT
    let existingUserId = null;
    try {
        const { data: existingUser, error: checkError } = await window.supabaseClient
            .from('users')
            .select('id, email')
            .ilike('email', data.email)
            .maybeSingle();

        if (checkError) {
            console.error('Erreur vérification email:', checkError);
            alert('Erreur lors de la vérification. Réessaie.');
            return;
        }

        if (existingUser) {
            const confirmUpdate = confirm('Un compte existe déjà avec cet email. Veux-tu mettre à jour ce compte avec les nouvelles infos ?');
            if (!confirmUpdate) {
                alert('Inscription annulée. Utilise un autre email ou connecte-toi.');
                return;
            }
            existingUserId = existingUser.id;
        }
    } catch (error) {
        console.error('Erreur réseau vérification:', error);
        alert('Impossible de vérifier l\'email. Réessaie.');
        return;
    }
    
    // Check payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (paymentMethod === 'card') {
        const cardholderName = document.getElementById('cardholderName').value.trim();
        if (!cardholderName) {
            alert('Merci de renseigner le nom du titulaire de la carte');
            return;
        }
        
        if (!stripe || !cardElement) {
            alert('Stripe n\'est pas initialisé. Recharge la page et réessaie.');
            return;
        }
        
        const paymentSuccess = await processStripePayment(data);
        if (!paymentSuccess) {
            return;
        }
    } else if (paymentMethod === '4x' || paymentMethod === 'cpf') {
        alert('Ce mode de paiement sera disponible prochainement. Utilise la carte bancaire pour l\'instant.');
        return;
    }

    // CRÉER OU METTRE À JOUR LE COMPTE UTILISATEUR APRÈS LE PAIEMENT
    try {
        const passwordHash = await window.hashPassword(data.password);

        const payload = {
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            password_hash: passwordHash,
            telephone: data.telephone,
            date_nais: data.dateNaissance,
            adresse: data.adresse,
            code_postal: data.codePostal,
            ville: data.ville
        };

        let error;
        
        if (existingUserId) {
            // Mettre à jour le compte existant
            const updateResult = await window.supabaseClient
                .from('users')
                .update(payload)
                .eq('id', existingUserId);
            error = updateResult.error;
        } else {
            // Créer un nouveau compte
            const insertResult = await window.supabaseClient
                .from('users')
                .insert(payload);
            error = insertResult.error;
        }

        if (error) {
            console.error('Erreur Supabase:', error);
            alert(error.message || 'Erreur lors de l\'inscription.');
            return;
        }

        window.location.href = 'inscription-success.html';
    } catch (error) {
        console.error('Erreur réseau inscription:', error);
        alert('Serveur indisponible pour le moment. Veuillez réessayer plus tard.');
    }
}

// Show success message
function showSuccessMessage() {
    const formWrapper = document.querySelector('.form-wrapper');
    
    formWrapper.innerHTML = `
        <div class="success-message" style="text-align: center; padding: var(--spacing-2xl);">
            <div style="font-size: 5rem; color: var(--success-color); margin-bottom: var(--spacing-lg);">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 style="color: var(--text-dark); margin-bottom: var(--spacing-md);">
                Inscription réussie !
            </h2>
            <p style="color: var(--text-light); font-size: 1.125rem; margin-bottom: var(--spacing-xl);">
                Félicitations ! Ton inscription a été enregistrée avec succès.<br>
                Tu vas recevoir un email de confirmation dans quelques instants.
            </p>
            <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap;">
                <a href="index.html" class="btn-primary">
                    <i class="fas fa-home"></i> Retour à l'accueil
                </a>
                <a href="connexion.html" class="btn-secondary">
                    <i class="fas fa-sign-in-alt"></i> Se connecter
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

// ===== STRIPE INTEGRATION =====

async function initializeStripe() {
    try {
        const response = await fetch('/.netlify/functions/stripe-config');
        const config = await response.json();
        
        if (!config.publishableKey) {
            console.error('Clé publique Stripe manquante');
            return;
        }
        
        stripePublishableKey = config.publishableKey;
        stripe = Stripe(stripePublishableKey);
        
        const elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1a1a1a',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    '::placeholder': {
                        color: '#a0a0a0'
                    }
                },
                invalid: {
                    color: '#ef4444'
                }
            }
        });
        
        cardElement.mount('#card-element');
        
        cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
        
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
        const packPrice = packPrices[packName];
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
                card: cardElement,
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
            return true;
        } else {
            throw new Error('Le paiement n\'a pas abouti. Statut: ' + paymentIntent.status);
        }
    } catch (error) {
        console.error('Erreur paiement Stripe:', error);
        feedback.className = 'payment-feedback error';
        feedback.textContent = '✗ ' + (error.message || 'Erreur lors du paiement');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return false;
    }
}
