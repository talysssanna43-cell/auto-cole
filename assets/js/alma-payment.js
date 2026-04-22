// ===== ALMA PAYMENT INTEGRATION =====

async function processAlmaPayment(formData) {
    const feedback = document.getElementById('almaPaymentFeedback');
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation du paiement...';
        
        if (feedback) {
            feedback.className = 'payment-feedback';
            feedback.textContent = '';
        }
        
        const selectedPack = document.querySelector('input[name="pack"]:checked');
        if (!selectedPack) {
            throw new Error('Aucun pack sélectionné');
        }
        
        const packName = selectedPack.value;
        const packPrice = packPrices[packName] || 0;
        
        const installments = parseInt(document.getElementById('almaInstallments')?.value || '3');
        
        // Frais de 3% pour le paiement en plusieurs fois
        const feeRate = 1.03;  // +3%
        const totalWithFees = Math.round(packPrice * feeRate);
        
        // Mode test local : si on est en local, simuler le paiement
        const isLocalTest = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        
        if (isLocalTest) {
            console.log('Mode test local : paiement Alma simulé');
            if (feedback) {
                feedback.className = 'payment-feedback success';
                feedback.textContent = '✓ Mode test local - Paiement Alma simulé (déploie sur Netlify pour tester réellement)';
            }
            
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            return {
                alma_payment_id: 'test_' + Date.now(),
                amount_eur: totalWithFees,
                pack_id: packName,
                pack_label: selectedPack.parentElement.querySelector('h3').textContent,
                installments: installments
            };
        }
        
        // Créer le paiement Alma via la fonction Netlify
        const response = await fetch('/.netlify/functions/alma-create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: totalWithFees,
                customerEmail: formData.email,
                customerName: `${formData.prenom} ${formData.nom}`,
                packLabel: selectedPack.parentElement.querySelector('h3').textContent,
                installments: installments
            })
        });
        
        let result;
        try {
            result = await response.json();
        } catch (e) {
            const text = await response.text();
            console.error('Réponse Alma non-JSON:', text);
            throw new Error('Réponse invalide du serveur');
        }
        
        console.log('📦 Alma response:', response.status, result);
        
        if (!response.ok || !result.url) {
            throw new Error(result.error || 'Impossible de créer le paiement Alma');
        }
        
        if (feedback) {
            feedback.className = 'payment-feedback success';
            feedback.textContent = '✓ Redirection vers Alma pour finaliser le paiement...';
        }
        
        // Sauvegarder les données du formulaire dans localStorage pour les récupérer après le retour d'Alma
        localStorage.setItem('alma_pending_inscription', JSON.stringify({
            formData: formData,
            packName: packName,
            packPrice: totalWithFees,
            almaPaymentId: result.paymentId,
            timestamp: Date.now()
        }));
        
        // Rediriger vers Alma
        setTimeout(() => {
            window.location.href = result.url;
        }, 1000);
        
        return {
            alma_payment_id: result.paymentId,
            amount_eur: totalWithFees,
            pack_id: packName,
            pack_label: selectedPack.parentElement.querySelector('h3').textContent,
            installments: installments
        };
        
    } catch (error) {
        console.error('Erreur paiement Alma:', error);
        
        let userMessage = 'Erreur lors du paiement. Réessaie plus tard.';
        if (error.message && error.message.includes('merchant_cant_create_payments')) {
            userMessage = 'Le paiement en plusieurs fois n\'est pas encore disponible. Contacte l\'auto-école pour plus d\'informations ou choisis le paiement comptant.';
        } else if (error.message && error.message.includes('Configuration serveur')) {
            userMessage = 'Le paiement en plusieurs fois est temporairement indisponible. Choisis le paiement comptant.';
        }
        
        if (feedback) {
            feedback.className = 'payment-feedback error';
            feedback.textContent = '✗ ' + userMessage;
        }
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        return null;
    }
}

// Vérifier si on revient d'un paiement Alma
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const almaStatus = urlParams.get('alma_status');
    
    if (almaStatus === 'success') {
        // Récupérer les données sauvegardées
        const pendingData = localStorage.getItem('alma_pending_inscription');
        if (pendingData) {
            const data = JSON.parse(pendingData);
            console.log('✅ Retour Alma - Paiement réussi:', data.almaPaymentId);
            
            // Nettoyer le localStorage
            localStorage.removeItem('alma_pending_inscription');
            
            // Afficher un message de succès
            const feedback = document.getElementById('almaPaymentFeedback');
            if (feedback) {
                feedback.className = 'payment-feedback success';
                feedback.textContent = '✓ Paiement Alma confirmé ! Finalisation de ton inscription...';
            }
            
            // Continuer l'inscription avec les données sauvegardées
            // (cette partie sera gérée par le code existant)
        }
    } else if (almaStatus === 'error') {
        console.error('❌ Retour Alma - Paiement échoué');
        localStorage.removeItem('alma_pending_inscription');
        
        const feedback = document.getElementById('almaPaymentFeedback');
        if (feedback) {
            feedback.className = 'payment-feedback error';
            feedback.textContent = '✗ Le paiement Alma a échoué. Réessaie ou choisis un autre mode de paiement.';
        }
    }
});
