const test = require('node:test');
const assert = require('node:assert/strict');

process.env.VAPI_WEBHOOK_SECRET = 'test-secret';

const insertedRows = [];
const { handler } = require('../netlify/functions/vapi-webhook');

require.cache[require.resolve('../netlify/functions/_lib/auth')].exports.getSupabaseAdmin = () => ({
    from(table) {
        assert.equal(table, 'contact_requests');
        return {
            insert(row) {
                insertedRows.push(row);
                return Promise.resolve({ error: null });
            }
        };
    }
});

function post(body, headers = { 'x-vapi-secret': 'test-secret' }) {
    return handler({
        httpMethod: 'POST',
        headers,
        body: JSON.stringify(body)
    });
}

test('rejects requests with an invalid Vapi secret', async () => {
    const result = await post({ message: { type: 'tool-calls', toolCallList: [] } }, { 'x-vapi-secret': 'wrong' });
    assert.equal(result.statusCode, 401);
});

test('returns business info for Vapi tool calls', async () => {
    const result = await post({
        message: {
            type: 'tool-calls',
            toolCallList: [
                {
                    id: 'call-1',
                    name: 'get_business_info',
                    arguments: { topic: 'tarifs' }
                }
            ]
        }
    });

    assert.equal(result.statusCode, 200);
    const body = JSON.parse(result.body);
    assert.equal(body.results[0].toolCallId, 'call-1');
    assert.match(body.results[0].result, /Auto-Ecole Breteuil/);
});

test('stores a callback request from collect_lead', async () => {
    const result = await post({
        message: {
            type: 'tool-calls',
            call: { id: 'vapi-call-123' },
            toolCallList: [
                {
                    id: 'call-2',
                    name: 'collect_lead',
                    arguments: {
                        prenom: 'Test',
                        nom: 'Dupont',
                        telephone: '06 12 34 56 78',
                        sujet: 'inscription',
                        motif: 'Souhaite des infos sur le permis B automatique'
                    }
                }
            ]
        }
    });

    assert.equal(result.statusCode, 200);
    assert.equal(insertedRows.at(-1).prenom, 'Test');
    assert.equal(insertedRows.at(-1).sujet, 'inscription');
    assert.equal(insertedRows.at(-1).telephone, '06 12 34 56 78');
});
