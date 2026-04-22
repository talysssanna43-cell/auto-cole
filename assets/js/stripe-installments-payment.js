// Fonction pour traiter le paiement en plusieurs fois via Stripe
async function processStripeInstallmentsPayment(formData) {
    const feedback = document.getElementById('installmentsPaymentFeedback');
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    feedback.className = 'payment-feedback processing';
    feedback.textContent = 'Traitement du paiement en cours...';
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Paiement en cours...';
    
    try {
        const selectedPack = document.querySelector('input[name="pack"]:checked');
        const packName = selectedPack.value;
        const basePrice = packPrices[packName];
        
        // Récupérer le nombre de mensualités et calculer le montant avec frais
        const installments = parseInt(document.getElementById('installmentsCount')?.value || '3');
        const feeRates = {
            2: 1.0432,  // +4.32%
            3: 1.0456,  // +4.56%
            4: 1.0576   // +5.76%
        };
        const feeRate = feeRates[installments] || 1.0456;
        const totalWithFees = Math.round(basePrice * feeRate);
        const amountInCents = totalWithFees * 100;
        
        const paymentIntentResponse = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amountInCents,
                currency: 'eur',
                packId: packName,
                packLabel: selectedPack.parentElement.querySelector('h3').textContent,
                customerEmail: formData.email,
                description: `Inscription Auto-École - ${selectedPack.parentElement.querySelector('h3').textContent} (${installments}x)`,
                installments: installments
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
                amount_eur: totalWithFees,
                pack_id: packName,
                pack_label: selectedPack.parentElement.querySelector('h3').textContent,
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
