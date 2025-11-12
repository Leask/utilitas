import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import config from '../config.json' with { type: 'json' };
import init, { embedding } from '../lib/embedding.mjs';

const sampleImage = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'test.jpg',
);

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

const buildPayload = (label) => {
    if (label === 'jina') {
        return {
            input: [
                { text: `utilitas embedding via ${label}` },
                { image: sampleImage },
            ],
            options: { input: 'FILE' },
            isBatch: true,
        };
    }
    return {
        input: `utilitas embedding via ${label}`,
        options: {},
        isBatch: false,
    };
};

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

    test(`embedding string or images with ${label}`, { skip: skipReason }, async () => {
        const { input, options, isBatch } = buildPayload(label);
        const vector = await embedding(input, { provider, ...options });
        if (isBatch) {
            assert(Array.isArray(vector), `${label} embedding should return an array`);
            assert(vector.length === input.length,
                'batch embedding should return one vector per input');
            vector.forEach((row, index) => {
                assert(Array.isArray(row),
                    `${label} embedding[${index}] should be an array`);
                assert(row.length > 0,
                    `${label} embedding[${index}] should not be empty`);
                assert(typeof row[0] === 'number',
                    `${label} embedding values should be numbers`);
            });
        } else {
            assert(Array.isArray(vector), `${label} embedding should be an array`);
            assert(vector.length > 0, 'embedding vector should not be empty');
            assert(typeof vector[0] === 'number', 'embedding values should be numbers');
        }
    });
}
