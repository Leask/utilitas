import { before, test } from 'node:test';
import assert from 'node:assert/strict';

import config from '../config.json' with { type: 'json' };
import init, { embedding } from '../lib/embedding.mjs';

const { openai_key: openAiKey } = config || {};
assert(openAiKey, 'openai_key is required in config.json for embedding tests.');

before(async () => {
    await init({ provider: 'OPENAI', apiKey: openAiKey });
});

test('embedding returns a single vector for one input', async () => {
    const vector = await embedding('utilitas embedding smoke test');
    assert(Array.isArray(vector), 'single embedding should be an array');
    assert(vector.length > 0, 'embedding vector should not be empty');
    assert(typeof vector[0] === 'number', 'embedding values should be numbers');
});

test('embedding returns multiple vectors for batch input', async () => {
    const payload = [
        'utilitas embedding smoke test',
        'utilitas embedding smoke test batch',
    ];
    const vectors = await embedding(payload);
    assert(Array.isArray(vectors), 'batch response should be an array');
    assert.strictEqual(vectors.length, payload.length);
    assert(vectors.every(vec => Array.isArray(vec) && vec.length > 0));
});
