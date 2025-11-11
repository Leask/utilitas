import { before, test } from 'node:test';
import assert from 'node:assert/strict';

import config from '../config.json' with { type: 'json' };
import init, { embedding } from '../lib/embedding.mjs';

const { openrouter_key: openRouterKey } = config || {};
const skipReason = !openRouterKey && 'openrouter_key is missing in config.json';

if (!skipReason) {
    before(async () => {
        await init({ provider: 'OPENROUTER', apiKey: openRouterKey });
    });
}

test('embedding string with openrouter', { skip: skipReason }, async () => {
    const vector = await embedding('utilitas embedding via openrouter', {
        provider: 'OPENROUTER',
    });
    assert(Array.isArray(vector), 'openrouter embedding should be an array');
    assert(vector.length > 0, 'embedding vector should not be empty');
    assert(typeof vector[0] === 'number', 'embedding values should be numbers');
});
