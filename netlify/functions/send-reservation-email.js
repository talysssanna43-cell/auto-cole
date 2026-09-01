const { handleOptions, response } = require('./_lib/http');

// Reservation messages are sent only by verified server-side workflows.
// This endpoint previously allowed any visitor to send arbitrary emails.
exports.handler = async (event) => {
    const options = handleOptions(event);
    if (options) return options;
    return response(410, { ok: false, error: 'ENDPOINT_DISABLED' });
};
