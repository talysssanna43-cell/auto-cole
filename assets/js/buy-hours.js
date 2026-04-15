// Configuration des prix par type de boîte
const PRICE_PER_HOUR = {
    manual: 45,      // Boîte manuelle (45€/h)
    automatic: 50    // Boîte automatique (50€/h)
};

// Fonction pour acheter des heures supplémentaires avec Checkout Session dynamique
window.buyAdditionalHours = async function(quantity, totalAmount, gearboxType = 'manual') {
    try {
        const user = dashboardState?.user;
        
        if (!user || !user.email) {
            alert('Erreur : utilisateur non connecté');
            return;
        }
        
        // Sauvegarder les infos pour après le paiement
        sessionStorage.setItem('pendingHoursPurchase', JSON.stringify({
            quantity: quantity,
            userEmail: user.email,
            gearboxType: gearboxType,
            timestamp: Date.now()
        }));
        
        // Créer une Checkout Session Stripe dynamique
        const pricePerHour = PRICE_PER_HOUR[gearboxType];
        
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantity: quantity,
                pricePerHour: pricePerHour,
                gearboxType: gearboxType,
                customerEmail: user.email
            })
        });
        
        const { url, message } = await response.json();
        
        if (!url) {
            throw new Error(message || 'Impossible de créer la session de paiement');
        }
        
        // Fermer le modal
        closeBuyHoursModal();
        
        // Rediriger vers Stripe Checkout
        window.location.href = url;
        
    } catch (err) {
        console.error('Erreur achat heures:', err);
        alert('❌ Une erreur est survenue. Veuillez réessayer.');
    }
};

// Vérifier si on revient d'un paiement réussi
window.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    
    if (paymentSuccess === 'true') {
        const pendingPurchase = sessionStorage.getItem('pendingHoursPurchase');
        
        if (pendingPurchase) {
            const purchase = JSON.parse(pendingPurchase);
            
            // Mettre à jour hours_goal dans la base de données
            const currentGoal = dashboardState?.hoursGoal || 0;
            const newGoal = currentGoal + purchase.quantity;
            
            const { error } = await window.supabaseClient
                .from('users')
                .update({ hours_goal: newGoal })
                .eq('email', purchase.userEmail);
            
            if (!error) {
                // Nettoyer le sessionStorage
                sessionStorage.removeItem('pendingHoursPurchase');
                
                // Afficher un message de succès
                alert(`✅ Paiement réussi !\n\n${purchase.quantity} heure(s) ajoutée(s) à votre forfait.\n\nNouveau total : ${newGoal}h`);
                
                // Recharger les statistiques
                if (window.loadUserData) {
                    await window.loadUserData();
                }
                
                // Mettre à jour l'affichage
                if (window.renderStats) {
                    window.renderStats();
                }
                
                // Nettoyer l'URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    } else if (paymentSuccess === 'false') {
        alert('❌ Le paiement a été annulé ou a échoué.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
