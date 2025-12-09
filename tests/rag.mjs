import * as horizon from '../lib/horizon.mjs';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import path from 'node:path';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}
import { embed, initEmbedding, initReranker, rerank } from '../lib/rag.mjs';
const init = initEmbedding;

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
        const vector = await embed(input, { provider, ...options });
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

const rerankProviders = [
    {
        provider: 'GOOGLE',
        label: 'google',
        creds: config?.google_credentials,
        proj: config?.google_project,
        keyName: 'google_credentials & google_project',
    },
];

for (const providerConfig of rerankProviders) {
    const {
        provider, label, creds, proj, keyName,
    } = providerConfig;
    const skipReason = (!creds || !proj) && `${keyName} is missing in config.json`;

    if (!skipReason) {
        before(async () => {
            await initReranker({
                provider, googleCredentials: creds, projectId: proj
            });
        });
    }

    test(`reranking with ${label}`, { skip: skipReason }, async () => {
        const query = "What is the capital of France?";
        const documents = [
            "The capital of Germany is Berlin.",
            "Paris is the capital of France.",
            "The capital of Italy is Rome.",
            "France is a country in Europe."
        ];
        const results = await rerank(query, documents);
        assert(Array.isArray(results), `${label} reranking should return an array`);
        assert(results.length > 0, `${label} reranking results should not be empty`);
        if (results.length > 0) {
            // Check structure
            const first = results[0];
            assert(first.hasOwnProperty('score'), 'result should have score');
            assert(first.hasOwnProperty('content'), 'result should have content');
            // Verify sorting (descending score)
            for (let i = 0; i < results.length - 1; i++) {
                assert(results[i].score >= results[i + 1].score, 'results should be sorted by score descending');
            }
        }
    });
}
