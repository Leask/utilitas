import { before, test } from 'node:test';
import assert from 'node:assert/strict';

import config from '../config.json' with { type: 'json' };
import init, { embedding } from '../lib/embedding.mjs';

const {
    openai_key: openAiKey,
    openrouter_key: openRouterKey,
} = config || {};
assert(openAiKey, 'openai_key is required in config.json for embedding tests.');

before(async () => {
    await init({ provider: 'OPENAI', apiKey: openAiKey });
});

test('embedding returns a vector', async () => {
    const vector = await embedding('utilitas embedding smoke test');
    assert(Array.isArray(vector), 'single embedding should be an array');
    assert(vector.length > 0, 'embedding vector should not be empty');
    assert(typeof vector[0] === 'number', 'embedding values should be numbers');
});

test('openrouter embedding returns a vector', {
    skip: !openRouterKey && 'openrouter_key is missing in config.json',
}, async () => {
    await init({ provider: 'OPENROUTER', apiKey: openRouterKey });
    const vector = await embedding('utilitas embedding via openrouter', {
        provider: 'OPENROUTER',
    });
    assert(Array.isArray(vector), 'openrouter embedding should be an array');
    assert(vector.length > 0, 'embedding vector should not be empty');
    assert(typeof vector[0] === 'number', 'embedding values should be numbers');
});
