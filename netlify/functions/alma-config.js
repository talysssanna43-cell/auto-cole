exports.legacyHandler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            apiKey: process.env.ALMA_API_KEY
        })
    };
};

// Stripe is the only supported payment workflow.
exports.handler = async function retiredAlmaConfig() {
    return {
        statusCode: 410,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'PAYMENT_METHOD_RETIRED' })
    };
};
