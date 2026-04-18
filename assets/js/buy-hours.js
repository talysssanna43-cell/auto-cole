// Configuration des prix par type de boîte
const PRICE_PER_HOUR = {
    manual: 45,      // Boîte manuelle (45€/h)
    automatic: 50    // Boîte automatique (50€/h)
};

// Fonction pour acheter des heures supplémentaires avec Checkout Session dynamique
window.buyAdditionalHours = async function(quantity, totalAmount, gearboxType = 'manual') {
    console.log('🟢 buyAdditionalHours appelée avec:', { quantity, totalAmount, gearboxType });
    
    try {
        // Vérifier que l'utilisateur est connecté
        console.log('🔍 Vérification dashboardState:', dashboardState);
        const user = dashboardState?.user;
        
        if (!user || !user.email) {
            console.error('❌ Utilisateur non connecté ou dashboardState manquant');
            alert('❌ Erreur : Vous devez être connecté pour acheter des heures.\n\nVeuillez vous reconnecter.');
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        
        // Sauvegarder les infos pour après le paiement
        sessionStorage.setItem('pendingHoursPurchase', JSON.stringify({
            quantity: quantity,
            userEmail: user.email,
            gearboxType: gearboxType,
            timestamp: Date.now()
        }));
        console.log('💾 Infos sauvegardées dans sessionStorage');
        
        // Créer une Checkout Session Stripe dynamique
        const pricePerHour = PRICE_PER_HOUR[gearboxType];
        console.log('💰 Prix par heure:', pricePerHour);
        
        console.log('📡 Appel API Stripe...');
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
        
        console.log('📥 Réponse Stripe reçue:', response.status);
        const data = await response.json();
        console.log('📦 Données:', data);
        
        if (!data.url) {
            throw new Error(data.message || 'Impossible de créer la session de paiement');
        }
        
        console.log('✅ URL Stripe obtenue:', data.url);
        
        // Fermer le modal
        if (typeof closeBuyHoursModal === 'function') {
            closeBuyHoursModal();
        }
        
        // Rediriger vers Stripe Checkout
        console.log('🔄 Redirection vers Stripe...');
        window.location.href = data.url;
        
    } catch (err) {
        console.error('❌ Erreur achat heures:', err);
        alert(`❌ Une erreur est survenue:\n\n${err.message}\n\nVeuillez réessayer ou contacter le support.`);
        throw err;
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
