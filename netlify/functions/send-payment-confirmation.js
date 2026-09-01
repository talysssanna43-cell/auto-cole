// Payment confirmation emails are sent only by payment-processing.js after
// a Stripe webhook has verified the payment. This public endpoint is retired.
exports.handler = async () => ({
    statusCode: 410,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ ok: false, error: 'ENDPOINT_RETIRED' })
});
