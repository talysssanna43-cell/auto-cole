const buckets = new Map();

function getClientIp(event) {
    const forwarded = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || '';
    return String(forwarded).split(',')[0].trim() || String(event.headers['client-ip'] || event.headers['Client-Ip'] || 'unknown');
}

function consumeRateLimit(event, options = {}) {
    const windowMs = Number(options.windowMs || 60_000);
    const limit = Number(options.limit || 10);
    const scope = String(options.scope || 'request');
    const identifier = String(options.identifier || '').toLowerCase();
    const now = Date.now();
    const key = `${scope}:${getClientIp(event)}:${identifier}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
        buckets.set(key, { count: 1, expiresAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    bucket.count += 1;
    if (bucket.count <= limit) return { allowed: true, retryAfter: 0 };
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1000)) };
}

module.exports = { consumeRateLimit };
