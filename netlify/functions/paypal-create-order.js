// Fonction Netlify pour créer une commande PayPal avec paiement en plusieurs fois
const fetch = require('node-fetch');

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Obtenir un token d'accès PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { amount, description, userEmail, userName } = JSON.parse(event.body);

    if (!amount || amount < 30) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Le montant minimum est de 30€ pour le paiement en plusieurs fois' }),
      };
    }

    // Obtenir le token d'accès
    const accessToken = await getPayPalAccessToken();

    // Créer la commande PayPal
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: description || 'Inscription Auto-École Breteuil',
          amount: {
            currency_code: 'EUR',
            value: amount.toFixed(2),
          },
          payee: {
            email_address: userEmail || '',
          },
          custom_id: userName || '',
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'Auto-École Breteuil',
              locale: 'fr-FR',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${process.env.URL || 'http://localhost:8080'}/payment-success.html`,
              cancel_url: `${process.env.URL || 'http://localhost:8080'}/payment-cancel.html`,
            },
          },
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal error:', orderData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Erreur lors de la création de la commande PayPal', details: orderData }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId: orderData.id,
        approveLink: orderData.links.find(link => link.rel === 'approve')?.href,
      }),
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
