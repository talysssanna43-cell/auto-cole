// Fonction pour traiter le paiement en plusieurs fois via Stripe
async function processStripeInstallmentsPayment(formData, documents = {}) {
    const feedback = document.getElementById('installmentsPaymentFeedback');
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    feedback.className = 'payment-feedback processing';
    feedback.textContent = 'Traitement du paiement en cours...';
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Paiement en cours...';
    
    try {
        const selectedPack = document.querySelector('input[name="pack"]:checked');
        const purchase = window.getSelectedPurchaseDetails();
        if (!selectedPack || !purchase || !Number.isInteger(purchase.amountCents)) {
            throw new Error('Le tarif du forfait est indisponible.');
        }
        
        // Récupérer le nombre de mensualités et calculer le montant avec frais de 3%
        const installments = parseInt(document.getElementById('installmentsCount')?.value || '3');
        if (![2, 3].includes(installments)) {
            throw new Error('Choisis un paiement en 2 ou 3 fois.');
        }
        if (!document.getElementById('installmentsMandate')?.checked) {
            throw new Error('L autorisation de prelevement est requise.');
        }
        const amountInCents = Math.round(purchase.amountCents * 1.03);
        
        const paymentIntentResponse = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'registration',
                amount: amountInCents,
                currency: 'eur',
                packId: purchase.packId,
                packLabel: purchase.packLabel,
                hours: purchase.hours,
                transmission: purchase.transmission,
                customerEmail: formData.email,
                description: `Inscription Auto-École - ${selectedPack.parentElement.querySelector('h3').textContent} (${installments}x)`,
                installments: installments,
                installmentConsent: document.getElementById('installmentsMandate')?.checked === true,
                registration: {
                    prenom: formData.prenom,
                    nom: formData.nom,
                    email: formData.email,
                    telephone: formData.telephone,
                    password: formData.password,
                    dateNaissance: formData.dateNaissance,
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
        
        const cardholderName = document.getElementById('installmentsCardholderName').value.trim();
        
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: window.installmentsCardNumberElement,
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
                amount_eur: amountInCents / 100,
                pack_id: purchase.packId,
                pack_label: purchase.packLabel,
                installments_count: installments
            };
        } else {
            throw new Error('Le paiement n\'a pas été confirmé');
        }
    } catch (error) {
        console.error('Erreur paiement Stripe installments:', error);
        feedback.className = 'payment-feedback error';
        feedback.textContent = `❌ Erreur : ${error.message}`;
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return null;
    }
}

// Rendre la fonction disponible globalement
window.processStripeInstallmentsPayment = processStripeInstallmentsPayment;
