const { handleOptions, response } = require('./http');

function disabledPaymentProvider(event) {
    const options = handleOptions(event);
    if (options) return options;
    return response(410, {
        ok: false,
        error: 'PAYMENT_PROVIDER_DISABLED',
        message: 'Ce moyen de paiement n’est pas disponible. Utilise le paiement sécurisé par Stripe.'
    });
}

module.exports = { disabledPaymentProvider };
