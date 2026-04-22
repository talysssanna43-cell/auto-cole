// ===== PACK SELECTION & PAYMENT =====
let selectedPack = null;
let stripeTarifs = null;
let elementsTarifs = null;
let cardNumberElementTarifs = null;
let cardExpiryElementTarifs = null;
let cardCvcElementTarifs = null;

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('ae_user'));
    } catch {
        return null;
    }
}

function selectPack(packId, packName, price, hours) {
    selectedPack = { id: packId, name: packName, price: price, hours: hours || 0 };
    const user = getStoredUser();
    
    const modal = document.getElementById('packModal');
    const modalNotLogged = document.getElementById('modalNotLogged');
    const modalLogged = document.getElementById('modalLogged');
    
    // Always show payment form directly (no login required)
    modalNotLogged.style.display = 'none';
    modalLogged.style.display = 'block';
    document.getElementById('modalPackNameLogged').textContent = packName;
    document.getElementById('modalPackPriceLogged').textContent = price + ' €';
    // Pre-fill name from user data if available
    const nameField = document.getElementById('cardholderNameTarifs');
    if (nameField && user && user.prenom && user.nom) {
        nameField.value = user.prenom + ' ' + user.nom;
    }
    initStripeForTarifs();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('packModal').style.display = 'none';
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

async function initStripeForTarifs() {
    const user = getStoredUser();
    if (!user || !selectedPack) return;

    const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    
    try {
        if (isLocalTest) {
            // En local, on ne peut pas utiliser Stripe (pas de fonctions Netlify)
            console.log('Mode local détecté - Stripe désactivé');
            const number = document.getElementById('card-number-tarifs');
            const exp = document.getElementById('card-expiry-tarifs');
            const cvc = document.getElementById('card-cvc-tarifs');
            if (number) {
                number.innerHTML = '<input type="text" class="mock-card-input" placeholder="1234 1234 1234 1234" inputmode="numeric" autocomplete="cc-number">';
            }
            if (exp) {
                exp.innerHTML = '<input type="text" class="mock-card-input" placeholder="MM / AA" inputmode="numeric" autocomplete="cc-exp">';
            }
            if (cvc) {
                cvc.innerHTML = '<input type="text" class="mock-card-input" placeholder="CVC" inputmode="numeric" autocomplete="cc-csc">';
            }
            return;
        }

        // 1) Init Stripe (once)
        if (!stripeTarifs) {
            const response = await fetch('/.netlify/functions/stripe-config');
            const data = await response.json();
            const publishableKey = data.publishableKey;
            if (!publishableKey) {
                throw new Error('Clé Stripe introuvable');
            }
            stripeTarifs = Stripe(publishableKey);
        }

        // 2) Mount split Card Elements (compact UI)
        if (!elementsTarifs) {
            elementsTarifs = stripeTarifs.elements();
        }

        if (cardNumberElementTarifs) {
            try { cardNumberElementTarifs.unmount(); } catch { /* noop */ }
            cardNumberElementTarifs = null;
        }
        if (cardExpiryElementTarifs) {
            try { cardExpiryElementTarifs.unmount(); } catch { /* noop */ }
            cardExpiryElementTarifs = null;
        }
        if (cardCvcElementTarifs) {
            try { cardCvcElementTarifs.unmount(); } catch { /* noop */ }
            cardCvcElementTarifs = null;
        }

        const baseStyle = {
            fontSize: '16px',
            color: '#111827',
            '::placeholder': { color: '#9ca3af' }
        };

        cardNumberElementTarifs = elementsTarifs.create('cardNumber', { style: { base: baseStyle } });
        cardExpiryElementTarifs = elementsTarifs.create('cardExpiry', { style: { base: baseStyle } });
        cardCvcElementTarifs = elementsTarifs.create('cardCvc', { style: { base: baseStyle } });

        cardNumberElementTarifs.mount('#card-number-tarifs');
        cardExpiryElementTarifs.mount('#card-expiry-tarifs');
        cardCvcElementTarifs.mount('#card-cvc-tarifs');

        const onChange = (event) => {
            const displayError = document.getElementById('card-errors-tarifs');
            displayError.textContent = event.error ? event.error.message : '';
        };
        cardNumberElementTarifs.on('change', onChange);
        cardExpiryElementTarifs.on('change', onChange);
        cardCvcElementTarifs.on('change', onChange);
    } catch (error) {
        console.error('Erreur initialisation Stripe:', error);
        const displayError = document.getElementById('card-errors-tarifs');
        if (displayError) displayError.textContent = 'Erreur chargement Stripe';
    }
}

async function processPayment() {
    if (!selectedPack) return;
    
    const user = getStoredUser();
    if (!user) {
        alert('Tu dois être connecté pour effectuer un paiement.');
        return;
    }

    const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    if (isLocalTest) {
        alert('Le paiement Stripe est disponible uniquement sur le site en ligne.');
        return;
    }
    
    const cardholderName = document.getElementById('cardholderNameTarifs').value.trim();
    if (!cardholderName) {
        alert('Merci de renseigner le nom du titulaire de la carte.');
        return;
    }

    const email = (user.email || '').trim();

    if (!stripeTarifs || !elementsTarifs || !cardNumberElementTarifs) {
        await initStripeForTarifs();
    }

    if (!stripeTarifs || !elementsTarifs || !cardNumberElementTarifs) {
        alert('Le paiement est indisponible pour le moment.');
        return;
    }
    
    const payButton = document.getElementById('payButton');
    const originalText = payButton.innerHTML;
    payButton.disabled = true;
    payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Paiement en cours...';
    
    try {
        const amountInCents = selectedPack.price * 100;

        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'eur',
                packId: selectedPack.id,
                packLabel: selectedPack.name,
                customerEmail: email || undefined,
                description: `Achat pack ${selectedPack.name} - Auto-École Breteuil`
            })
        });
        const { clientSecret, message } = await response.json();
        if (!clientSecret) {
            throw new Error(message || 'Impossible de créer le paiement');
        }

        const { error, paymentIntent } = await stripeTarifs.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumberElementTarifs,
                billing_details: {
                    name: cardholderName,
                    email: email || undefined
                }
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment successful
            localStorage.removeItem('pendingPack');
            
            // Mettre à jour hours_goal en DB si pack heures de conduite
            if (selectedPack.id && selectedPack.id.startsWith('heure-conduite') && selectedPack.hours > 0) {
                try {
                    const user = getStoredUser();
                    if (user && user.email && window.supabaseClient) {
                        // Récupérer hours_goal actuel
                        const { data: userData } = await window.supabaseClient
                            .from('users')
                            .select('hours_goal')
                            .eq('email', user.email)
                            .maybeSingle();
                        
                        const currentGoal = (userData && userData.hours_goal) || 0;
                        const newGoal = currentGoal + selectedPack.hours;
                        
                        await window.supabaseClient
                            .from('users')
                            .update({ hours_goal: newGoal })
                            .eq('email', user.email);
                        
                        console.log('✅ hours_goal mis à jour:', currentGoal, '→', newGoal);
                        
                        // Créer une notification d'inscription pour analytics
                        // Extraire le type de boîte depuis le pack ID (heure-conduite-manual ou heure-conduite-auto)
                        const transmissionType = selectedPack.id.includes('manual') ? 'manual' : 'auto';
                        
                        await window.supabaseClient
                            .from('inscription_notifications')
                            .insert({
                                user_email: user.email,
                                user_name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
                                pack: selectedPack.id,
                                hours_purchased: selectedPack.hours,
                                amount_paid: selectedPack.price,
                                transmission_type: transmissionType
                            });
                        
                        console.log('✅ Notification heures de conduite créée');
                    }
                } catch (e) {
                    console.error('Erreur mise à jour hours_goal:', e);
                }
            }
            
            alert('✅ Paiement réussi ! Ton pack ' + selectedPack.name + ' est maintenant actif.');
            closeModal();
            window.location.href = 'espace-eleve.html';
        } else if (paymentIntent && paymentIntent.status) {
            alert('Paiement: ' + paymentIntent.status);
        }
    } catch (error) {
        console.error('Erreur paiement:', error);
        alert('❌ Erreur: ' + error.message);
    } finally {
        payButton.disabled = false;
        payButton.innerHTML = originalText;
    }
}

// ===== FAQ ACCORDION =====
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faq => {
                faq.classList.remove('active');
                faq.querySelector('.faq-answer').style.maxHeight = null;
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
});

// Add styles for FAQ and Modal
const style = document.createElement('style');
style.textContent = `
    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 1rem;
    }
    
    .modal-content {
        background: white;
        border-radius: var(--radius-xl);
        padding: 2rem;
        max-width: 500px;
        width: 100%;
        position: relative;
        text-align: center;
        box-shadow: var(--shadow-xl);
        animation: modalSlideIn 0.3s ease;
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-light);
        transition: color 0.2s;
    }
    
    .modal-close:hover {
        color: var(--text-dark);
    }
    
    .modal-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
    }
    
    .modal-icon.success {
        background: linear-gradient(135deg, var(--success-color), #34d399);
    }
    
    .modal-content h2 {
        margin-bottom: 0.5rem;
        color: var(--text-dark);
    }
    
    .modal-content p {
        color: var(--text-light);
        margin-bottom: 1rem;
    }
    
    .modal-pack-price {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 1.5rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .modal-actions a {
        flex: 1;
        min-width: 150px;
    }
    
    .payment-form {
        text-align: left;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
    }
    
    .payment-form h3 {
        margin-bottom: 1rem;
        font-size: 1rem;
        color: var(--text-dark);
    }
    
    .stripe-card-element {
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
    }
    
    .stripe-card-errors {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        min-height: 1.25rem;
    }
    
    .payment-form .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-dark);
    }
    
    .payment-form .form-group input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 1rem;
    }
    
    .payment-form .form-group input:focus {
        outline: none;
        border-color: var(--primary-color);
    }
    
    .payment-secure {
        text-align: center;
        margin-top: 1rem;
        font-size: 0.875rem;
        color: var(--text-light);
    }
    
    .payment-secure i {
        color: var(--success-color);
    }
    
    /* Checkout Form Styles (Stripe-like) */
    .checkout-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-dark);
        margin-bottom: 0.25rem;
        text-align: left;
    }
    
    .checkout-pack {
        color: var(--text-light);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        text-align: left;
    }
    
    .checkout-pack strong {
        color: var(--primary-color);
    }
    
    .checkout-form {
        text-align: left;
    }
    
    .checkout-field {
        margin-bottom: 1rem;
    }
    
    .checkout-field label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 0.5rem;
    }
    
    .checkout-field input,
    .checkout-field select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1rem;
        background: white;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    
    .checkout-field input:focus,
    .checkout-field select:focus {
        outline: none;
        border-color: #0570de;
        box-shadow: 0 0 0 3px rgba(5, 112, 222, 0.15);
    }
    
    .checkout-field input::placeholder {
        color: #9ca3af;
    }
    
    .card-info-box {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
    }
    
    .card-info-box .stripe-card-element {
        padding: 0.75rem 1rem;
        border: none;
    }

    /* Split Stripe elements (card number / expiry / cvc) */
    .stripe-split-card {
        display: grid;
        gap: 0.5rem;
    }

    .stripe-split-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        border-top: 1px solid #f1f5f9;
        padding-top: 0.5rem;
    }

    .stripe-split-card .stripe-card-element {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        background: #fff;
    }

    .stripe-split-card .stripe-card-element:focus-within {
        border-color: #0570de;
        box-shadow: 0 0 0 3px rgba(5, 112, 222, 0.15);
    }

    /* Local UI fallback (mock Stripe fields) */
    .mock-card-input {
        width: 100%;
        border: none;
        font-size: 1rem;
        padding: 0.35rem 0;
        background: transparent;
    }

    .mock-card-input:focus {
        outline: none;
    }
    
    .checkout-pay-btn {
        width: 100%;
        padding: 1rem;
        margin-top: 1.5rem;
        background: #0570de;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .checkout-pay-btn:hover {
        background: #0058b8;
    }
    
    .checkout-pay-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
    }
    
    #modalLogged .payment-secure {
        text-align: center;
        margin-top: 1rem;
        font-size: 0.8rem;
        color: #6b7280;
    }
    
    .page-hero {
        background: linear-gradient(135deg, var(--secondary-color), var(--secondary-dark));
        color: white;
        padding: 150px 0 80px;
        text-align: center;
    }
    
    .page-hero h1 {
        color: white;
        margin-bottom: var(--spacing-sm);
    }
    
    .page-hero p {
        font-size: 1.25rem;
        opacity: 0.9;
    }
    
    .services-section {
        background: var(--bg-light);
    }
    
    .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-lg);
    }
    
    .service-card {
        background: white;
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        text-align: center;
        transition: all var(--transition-base);
    }
    
    .service-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }
    
    .service-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-md);
        background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
    }
    
    .service-card h3 {
        margin-bottom: var(--spacing-sm);
        color: var(--text-dark);
    }
    
    .service-price {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: var(--spacing-sm);
    }
    
    .service-card p {
        color: var(--text-light);
    }
    
    .payment-section {
        background: white;
    }
    
    .payment-options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
    }
    
    .payment-card {
        background: var(--bg-light);
        padding: var(--spacing-xl);
        border-radius: var(--radius-xl);
        text-align: center;
    }
    
    .payment-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-md);
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: var(--primary-color);
        box-shadow: var(--shadow-md);
    }
    
    .payment-card h3 {
        margin-bottom: var(--spacing-sm);
        color: var(--text-dark);
    }
    
    .payment-card p {
        color: var(--text-light);
        line-height: 1.6;
    }
    
    .faq-section {
        background: var(--bg-light);
    }
    
    .faq-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .faq-item {
        background: white;
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-base);
    }
    
    .faq-item:hover {
        box-shadow: var(--shadow-md);
    }
    
    .faq-question {
        padding: var(--spacing-lg);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
    }
    
    .faq-question h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-dark);
    }
    
    .faq-question i {
        color: var(--primary-color);
        transition: transform var(--transition-base);
    }
    
    .faq-item.active .faq-question i {
        transform: rotate(180deg);
    }
    
    .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height var(--transition-base);
    }
    
    .faq-answer p {
        padding: 0 var(--spacing-lg) var(--spacing-lg);
        color: var(--text-light);
        line-height: 1.6;
    }
    
    @media (max-width: 768px) {
        .page-hero {
            padding: 120px 0 60px;
        }
        
        .services-grid,
        .payment-options-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
