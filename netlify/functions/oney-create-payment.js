const https = require('https');

const oneyMerchantId = process.env.ONEY_MERCHANT_ID;
const oneyApiKey = process.env.ONEY_API_KEY;
const oneyApiSecret = process.env.ONEY_API_SECRET;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async function handler(event) {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ ok: true })
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Méthode non autorisée' })
        };
    }

    // Vérifier que les clés Oney sont configurées
    if (!oneyMerchantId || !oneyApiKey || !oneyApiSecret) {
        console.error('❌ Clés Oney manquantes dans les variables d\'environnement');
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Configuration Oney incomplète. Veuillez contacter l\'administrateur.',
                error: 'ONEY_CONFIG_MISSING'
            })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (error) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Corps de requête invalide.' })
        };
    }

    const { 
        amount, 
        customerEmail, 
        customerName, 
        customerPhone,
        packLabel, 
        installments, // 2, 3 ou 4
        packId
    } = payload;

    console.log('📦 Oney payment request:', { 
        amount, 
        customerEmail, 
        customerName, 
        packLabel, 
        installments 
    });

    // Validation des paramètres
    if (!amount || !customerEmail || !customerName || !installments) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Paramètres manquants (amount, customerEmail, customerName, installments)' 
            })
        };
    }

    // Vérifier que le nombre de mensualités est valide
    if (![2, 3, 4].includes(installments)) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Le nombre de mensualités doit être 2, 3 ou 4' 
            })
        };
    }

    // Vérifier le montant minimum (100€ généralement pour Oney)
    if (amount < 100) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Le montant minimum pour le paiement fractionné est de 100€' 
            })
        };
    }

    const baseUrl = event.headers.origin || 'https://autoecolebreteuil.com';

    try {
        // Préparer les données pour l'API Oney
        // Note: Cette structure est un exemple et devra être adaptée selon la documentation Oney
        const oneyPaymentData = {
            merchant_guid: oneyMerchantId,
            purchase: {
                amount: Math.round(amount * 100), // Montant en centimes
                currency: 'EUR',
                installments_count: installments,
                label: packLabel || 'Forfait Auto-École Breteuil'
            },
            customer: {
                email: customerEmail,
                first_name: customerName.split(' ')[0] || customerName,
                last_name: customerName.split(' ').slice(1).join(' ') || '',
                phone: customerPhone || ''
            },
            urls: {
                success: `${baseUrl}/inscription.html?oney_status=success&pack=${packId}`,
                failure: `${baseUrl}/inscription.html?oney_status=error`,
                cancel: `${baseUrl}/inscription.html?oney_status=cancel`,
                notification: `${baseUrl}/.netlify/functions/oney-webhook`
            },
            metadata: {
                pack_id: packId,
                pack_label: packLabel,
                customer_email: customerEmail
            }
        };

        console.log('🔄 Envoi de la requête à Oney API...');

        // TODO: Remplacer par l'appel réel à l'API Oney
        // Cette partie devra être complétée avec l'endpoint exact de Oney
        // et la méthode d'authentification (Basic Auth, Bearer Token, etc.)
        
        // Exemple de structure (à adapter selon la doc Oney):
        /*
        const oneyResponse = await fetch('https://api.oney.fr/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${oneyApiKey}`,
                'X-Oney-Merchant-Id': oneyMerchantId
            },
            body: JSON.stringify(oneyPaymentData)
        });

        const oneyData = await oneyResponse.json();
        */

        // Pour l'instant, retourner une réponse de test
        console.log('⚠️ MODE TEST: L\'intégration Oney nécessite les clés API réelles');
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Configuration Oney en attente',
                test_mode: true,
                instructions: 'Veuillez configurer les clés API Oney dans Netlify',
                payment_data: oneyPaymentData,
                next_steps: [
                    '1. Créer un compte Oney Professionnel sur https://www.oney.fr/professionnels',
                    '2. Obtenir les clés API (Merchant ID, API Key, API Secret)',
                    '3. Configurer les variables d\'environnement dans Netlify',
                    '4. Compléter l\'intégration avec l\'endpoint API Oney réel'
                ]
            })
        };

    } catch (error) {
        console.error('❌ Erreur Oney:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                message: 'Erreur lors de la création du paiement Oney',
                error: error.message 
            })
        };
    }
};
