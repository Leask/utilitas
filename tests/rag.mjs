import * as horizon from '../lib/horizon.mjs';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}
import { embed, initEmbedding, initReranker, rerank } from '../lib/rag.mjs';

const sampleImage = fileURLToPath(new URL('test.jpg', import.meta.url));

const embeddingProviders = [
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
];

const buildEmbedPayload = (label) => {
    return {
        input: `utilitas embedding via ${label}`,
        options: {},
    };
};

for (const providerConfig of embeddingProviders) {
    const {
        provider, label, apiKey, keyName,
    } = providerConfig;
    const skipReason = !apiKey && `${keyName} is missing in config.json`;
    if (!skipReason) {
        before(async () => { await initEmbedding({ provider, apiKey }) });
    }

    test(`embedding with ${label}`, { skip: skipReason }, async () => {
        const { input, options } = buildEmbedPayload(label);
        const vector = await embed(input, { provider, ...options });
        assert(Array.isArray(vector), `${label} embedding should return an array`);
        assert(vector.length > 0, 'embedding vector should not be empty');
        assert(typeof vector[0] === 'number', 'embedding values should be numbers');
    });
}

const openrouterSkipReason = !config?.openrouter_key
    && 'openrouter_key is missing in config.json';

test('embedding image with openrouter', { skip: openrouterSkipReason }, async () => {
    await initEmbedding({
        provider: 'OPENROUTER',
        apiKey: config.openrouter_key,
    });
    const vector = await embed(
        { image: sampleImage },
        { provider: 'OPENROUTER', input: 'FILE' },
    );
    assert(Array.isArray(vector), 'openrouter image embedding should be an array');
    assert(vector.length > 0, 'image embedding vector should not be empty');
    assert(typeof vector[0] === 'number', 'image embedding values should be numbers');
});

const rerankProviders = [
    {
        provider: 'GOOGLE',
        label: 'google',
        creds: config?.google_credentials,
        proj: config?.google_project,
        keyName: 'google_credentials & google_project',
    },
    {
        provider: 'JINA',
        label: 'jina',
        apiKey: config?.jina_key,
        keyName: 'jina_key',
    },
];

const buildRerankPayload = (label) => {
    if (label === 'jina') {
        return {
            provider: 'JINA',
            query: "What is the capital of France?",
            documents: [
                "The capital of Germany is Berlin.",
                "Paris is the capital of France.",
                "The capital of Italy is Rome.",
                "France is a country in Europe.",
            ],
            options: {},
        };
    }
    return {
        provider: 'GOOGLE',
        query: "What is the capital of France?",
        documents: [
            "The capital of Germany is Berlin.",
            "Paris is the capital of France.",
            "The capital of Italy is Rome.",
            "France is a country in Europe.",
        ],
        options: {},
    };
};

for (const providerConfig of rerankProviders) {
    const {
        provider, label, creds, proj, apiKey, keyName,
    } = providerConfig;
    let skipReason;
    if (provider === 'GOOGLE') {
        skipReason = (!creds || !proj) && `${keyName} is missing in config.json`;
        if (!skipReason) {
            before(async () => {
                await initReranker({
                    provider, credentials: creds, projectId: proj
                });
            });
        }
    } else if (provider === 'JINA') {
        skipReason = !apiKey && `${keyName} is missing in config.json`;
        if (!skipReason) {
            before(async () => {
                await initReranker({ provider, apiKey });
            });
        }
    }

    test(`reranking with ${label}`, { skip: skipReason }, async () => {
        const { provider, query, documents, options } = buildRerankPayload(label);
        const results = await rerank(query, documents, { provider, ...options });
        assert(Array.isArray(results), `${label} reranking should return an array`);
        assert(results.length > 0, `${label} reranking results should not be empty`);
        // Check structure
        const first = results[0];
        assert(first.hasOwnProperty('index'), 'result should have index');
        assert(first.hasOwnProperty('score'), 'result should have score');
        // Verify sorting (descending score)
        for (let i = 0; i < results.length - 1; i++) {
            assert(results[i].score >= results[i + 1].score, 'results should be sorted by score descending');
        }
    });
}
