const { response } = require('./http');

function isNetlifyScheduledInvocation(event) {
    const headers = event?.headers || {};
    const value = headers['x-nf-event'] || headers['X-Nf-Event'] || '';
    return String(value).toLowerCase() === 'schedule';
}

function requireScheduledInvocation(event) {
    return isNetlifyScheduledInvocation(event)
        ? null
        : response(404, { ok: false, error: 'NOT_FOUND' });
}

module.exports = { requireScheduledInvocation };
