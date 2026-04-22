exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const payload = JSON.parse(event.body);
        
        console.log('Alma webhook reçu:', payload);
        
        // Vérifier le statut du paiement
        if (payload.payment && payload.payment.state === 'paid') {
            console.log('Paiement Alma confirmé:', payload.payment.id);
            
            // Ici tu peux ajouter la logique pour mettre à jour Supabase
            // Par exemple, marquer l'inscription comme payée
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ received: true })
        };
    } catch (error) {
        console.error('Erreur webhook Alma:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
