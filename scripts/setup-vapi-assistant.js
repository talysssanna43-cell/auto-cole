const fetch = require('node-fetch');
const { buildAssistantConfig } = require('./vapi-assistant-config');

const apiBase = process.env.VAPI_API_BASE_URL || 'https://api.vapi.ai';
const apiKey = process.env.VAPI_PRIVATE_KEY;
const assistantId = process.env.VAPI_ASSISTANT_ID;

async function request(path, options) {
    const response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
    }
    return body;
}

async function main() {
    if (!apiKey) {
        throw new Error('VAPI_PRIVATE_KEY is required. Keep it in Netlify/local env only.');
    }

    const config = buildAssistantConfig();
    const assistant = assistantId
        ? await request(`/assistant/${assistantId}`, { method: 'PATCH', body: JSON.stringify(config) })
        : await request('/assistant', { method: 'POST', body: JSON.stringify(config) });

    console.log(JSON.stringify({
        assistantId: assistant.id,
        name: assistant.name,
        webhookUrl: config.server.url,
        updated: Boolean(assistantId)
    }, null, 2));
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
