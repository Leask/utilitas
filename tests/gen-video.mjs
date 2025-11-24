import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import * as utilitas from '../index.mjs';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const GOOGLE_KEY = config?.google_genai_key;
const skipReason = !GOOGLE_KEY && 'google_genai_key is missing from config.json';

if (!skipReason) {
    before(async () => {
        await utilitas.gen.init({
            apiKey: GOOGLE_KEY,
            provider: 'GOOGLE',
        });
    });
}

test('gen video', { skip: skipReason, timeout: 1000 * 60 * 10 }, async () => {
    const response = await utilitas.gen.video('a cat eating', {
        expected: 'BUFFER',
    });
    assert.ok(Array.isArray(response), 'Response should be an array');
    assert.ok(response.length > 0, 'Should return at least one video');
    assert.ok(response[0].data, 'Video data should be present');
    assert.ok(Buffer.isBuffer(response[0].data), 'Video data should be a Buffer');
});
