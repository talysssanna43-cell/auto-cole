const https = require('https');

exports.handler = async function(event, context) {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, customerEmail, customerName, packLabel, installments } = JSON.parse(event.body);
        
        console.log('📦 Alma request body:', { amount, customerEmail, customerName, packLabel, installments });
        
        if (!amount || !customerEmail) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing required fields: amount and customerEmail required' })
            };
        }

        const apiKey = process.env.ALMA_API_KEY;
        if (!apiKey) {
            console.error('❌ ALMA_API_KEY not set in environment variables');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Configuration serveur manquante (ALMA_API_KEY)' })
            };
        }
        
        const siteOrigin = event.headers.origin || event.headers.referer?.replace(/\/[^/]*$/, '') || 'https://auto-ecole-breteuil.fr';
        const baseUrl = siteOrigin.replace(/\/$/, '');
        
        const firstName = customerName ? customerName.split(' ')[0] : '';
        const lastName = customerName ? customerName.split(' ').slice(1).join(' ') : '';
        
        // Créer le paiement Alma
        const paymentData = {
            payment: {
                purchase_amount: Math.round(amount * 100), // Alma utilise les centimes
                installments_count: installments || 3,
                return_url: `${baseUrl}/inscription.html?alma_status=success`,
                customer_cancel_url: `${baseUrl}/inscription.html?alma_status=error`,
                ipn_callback_url: `${baseUrl}/.netlify/functions/alma-webhook`,
                locale: 'fr',
                customer: {
                    email: customerEmail,
                    first_name: firstName,
                    last_name: lastName
                },
                custom_data: {
                    pack_label: packLabel || 'Pack Auto-École'
                }
            }
        };

        console.log('📤 Alma API payload:', JSON.stringify(paymentData));
        
        const response = await makeAlmaRequest('/v1/payments', 'POST', apiKey, paymentData);
        
        console.log('✅ Alma API response:', JSON.stringify(response).substring(0, 500));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                paymentId: response.id,
                url: response.url
            })
        };
    } catch (error) {
        console.error('❌ Erreur création paiement Alma:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
                error: error.message || 'Erreur lors de la création du paiement'
            })
        };
    }
};

function makeAlmaRequest(path, method, apiKey, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.getalma.eu',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Authorization': `Alma-Auth ${apiKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Alma API error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}
