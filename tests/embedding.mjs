import { before, test } from 'node:test';
import assert from 'node:assert/strict';

import config from '../config.json' with { type: 'json' };
import init, { embedding } from '../lib/embedding.mjs';

const providers = [
    {
        provider: 'OPENAI',
        label: 'openai',
        apiKey: config?.openai_key,
        keyName: 'openai_key',
    },
    {
        provider: 'OPENROUTER',
        label: 'openrouter',
        apiKey: config?.openrouter_key,
        keyName: 'openrouter_key',
    },
    {
        provider: 'JINA',
        label: 'jina',
        apiKey: config?.jina_key,
        keyName: 'jina_key',
    },
];

for (const providerConfig of providers) {
    const {
        provider, label, apiKey, keyName,
    } = providerConfig;
    const skipReason = !apiKey && `${keyName} is missing in config.json`;
    if (!skipReason) {
        before(async () => {
            await init({ provider, apiKey });
        });
    }

    test(`embedding string with ${label}`, { skip: skipReason }, async () => {
        const vector = await embedding(`utilitas embedding via ${label}`, {
            provider,
        });
        assert(Array.isArray(vector), `${label} embedding should be an array`);
        assert(vector.length > 0, 'embedding vector should not be empty');
        assert(typeof vector[0] === 'number', 'embedding values should be numbers');
    });
}
