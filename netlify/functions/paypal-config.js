// Fonction Netlify pour récupérer la configuration PayPal publique
exports.legacyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Retourner uniquement le Client ID (public)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientId: process.env.PAYPAL_CLIENT_ID,
        mode: process.env.PAYPAL_MODE || 'sandbox',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Stripe is the only supported payment workflow.
exports.handler = async function retiredPayPalConfig() {
  return {
    statusCode: 410,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ error: 'PAYMENT_METHOD_RETIRED' }),
  };
};
