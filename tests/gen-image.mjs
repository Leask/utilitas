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
const OPENAI_KEY = config?.openai_key;

const skipReasonGoogle = !GOOGLE_KEY && 'google_genai_key is missing from config.json';
const skipReasonOpenAI = !OPENAI_KEY && 'openai_key is missing from config.json';

test('gen image gemini', { skip: skipReasonGoogle, timeout: 1000 * 60 * 5 }, async () => {
    await utilitas.gen.init({
        apiKey: GOOGLE_KEY,
        provider: 'GOOGLE',
    });
    const response = await utilitas.gen.image('a beautiful cat riding a rocket', {
        provider: 'GOOGLE',
        expected: 'BUFFER',
    });
    assert.ok(Array.isArray(response), 'Response should be an array');
    assert.ok(response.length > 0, 'Should return at least one image');
    assert.ok(response[0].data, 'Image data should be present');
    assert.ok(Buffer.isBuffer(response[0].data), 'Image data should be a Buffer');
});

test('gen image openai', { skip: skipReasonOpenAI, timeout: 1000 * 60 * 5 }, async () => {
    await utilitas.gen.init({
        apiKey: OPENAI_KEY,
        provider: 'OpenAI',
    });
    const response = await utilitas.gen.image('a beautiful cat riding a rocket', {
        provider: 'OpenAI',
        expected: 'BUFFER',
    });
    assert.ok(Array.isArray(response), 'Response should be an array');
    assert.ok(response.length > 0, 'Should return at least one image');
    assert.ok(response[0].data, 'Image data should be present');
    assert.ok(Buffer.isBuffer(response[0].data), 'Image data should be a Buffer');
});
