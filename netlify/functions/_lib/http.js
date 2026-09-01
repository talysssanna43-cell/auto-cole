const DEFAULT_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS'
};

function response(statusCode, body, extraHeaders = {}) {
    return {
        statusCode,
        headers: { ...DEFAULT_HEADERS, ...extraHeaders },
        body: JSON.stringify(body)
    };
}

function handleOptions(event) {
    if (event.httpMethod !== 'OPTIONS') return null;
    return response(204, { ok: true });
}

function parseJsonBody(event) {
    try {
        return JSON.parse(event.body || '{}');
    } catch (error) {
        return null;
    }
}

module.exports = {
    handleOptions,
    parseJsonBody,
    response
};
