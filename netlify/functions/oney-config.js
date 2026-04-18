// Configuration publique Oney (sans exposer les secrets)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

exports.handler = async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ ok: true })
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Méthode non autorisée' })
        };
    }

    const oneyMerchantId = process.env.ONEY_MERCHANT_ID;
    const oneyConfigured = !!(oneyMerchantId && process.env.ONEY_API_KEY);

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            enabled: oneyConfigured,
            merchant_id: oneyMerchantId || null,
            installments_options: [2, 3, 4],
            min_amount: 100, // Montant minimum en euros
            max_amount: 3000, // Montant maximum en euros (à confirmer avec Oney)
            eligible_packs: [
                'aac',
                'supervisee',
                'accelere',
                'second-chance',
                'boite-auto',
                'zen',
                'am'
            ],
            excluded_packs: [
                'code', // Montant trop faible
                '20h'   // Achat à l'unité
            ]
        })
    };
};
