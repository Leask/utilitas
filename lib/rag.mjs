import { BASE64, convert } from './storage.mjs';
import { countTokens, trimText } from './alan.mjs';
import { ensureArray, ensureString, need } from './utilitas.mjs';

const _NEED = ['openai', '@google-cloud/discoveryengine'];
const embeddingClients = {};
const rerankerClients = {};

const [
    OPENAI, GOOGLE, OPENROUTER, JINA,
    GOOGLE_DEFAULT_LOCATION, GOOGLE_RERANK_CONFIG_ID,
    OPENAI_MODEL_EMBED_SMALL,
    OPENAI_MODEL_EMBED_LARGE,
    GOOGLE_MODEL_GEMINI_EMBED,
    JINA_MODEL_V_4,
    GOOGLE_MODEL_SEMANTIC_RANKER,
    JINA_MODEL_RERANKER_M0,
] = [
        'OPENAI', 'GOOGLE', 'OPENROUTER', 'JINA',
        'global', 'default_ranking_config',
        'text-embedding-3-small', // dim: 1536
        'text-embedding-3-large', // dim: 3072
        'gemini-embedding-001', // dim: 768(default), 1536, or 3072(google default)
        'jina-embeddings-v4', // dim: 256‑2048
        'semantic-ranker-default@latest',
        'jina-reranker-m0',
    ];

const PROVIDER_BASE_URL = {
    [OPENROUTER]: 'https://openrouter.ai/api/v1',
    [JINA]: 'https://api.jina.ai/v1/',
};

const DEFAULT_EMBEDDING_MODELS = {
    [OPENAI]: OPENAI_MODEL_EMBED_SMALL,
    [OPENROUTER]: GOOGLE_MODEL_GEMINI_EMBED,
    [JINA]: JINA_MODEL_V_4,
};

const DEFAULT_RERANKER_MODELS = {
    [GOOGLE]: GOOGLE_MODEL_SEMANTIC_RANKER,
    [JINA]: JINA_MODEL_RERANKER_M0,
};

const MODEL_CONFIG = {
    [OPENAI_MODEL_EMBED_SMALL]: {
        source: 'openai', image: false, maxTokens: 8192,
    },
    [OPENAI_MODEL_EMBED_LARGE]: {
        source: 'openai', image: false, maxTokens: 8192,
    },
    [GOOGLE_MODEL_GEMINI_EMBED]: {
        source: 'google', image: false, maxTokens: 2048,
        options: { dimensions: 768 },
    },
    // Token calculation may be incorrect because its limitation applies to the
    // entire request rather than individual entries.
    // https://jina.ai/embeddings
    [JINA_MODEL_V_4]: {
        source: 'jina', image: true, maxTokens: 8192, recordsLimit: 512,
        options: {
            task: 'text-matching', // 'retrieval.query', 'retrieval.passage'
            dimensions: 768, // normalized: true, by default DONT submit
            truncate: true, // late_chunking: true, by default DONT submit
            embedding_type: 'float',
        },
    },
    [GOOGLE_MODEL_SEMANTIC_RANKER]: {
        source: 'google', image: false, maxTokens: 1024, recordsLimit: 200,
        options: { ignoreRecordDetailsInResponse: true },
    },
    [JINA_MODEL_RERANKER_M0]: {
        source: 'jina', image: true, maxTokens: 1024, recordsLimit: 200,
        options: { return_documents: false },
    },
};

const ensureEmbeddingProvider = (options) => {
    options.provider = ensureString(options?.provider, { case: 'UP' });
    assert(
        DEFAULT_EMBEDDING_MODELS?.[options.provider],
        'Embedding provider is required.', 400
    );
    return options.provider;
};

const ensureRerankerProvider = (options) => {
    options.provider = ensureString(options?.provider, { case: 'UP' });
    assert(
        DEFAULT_RERANKER_MODELS?.[options.provider],
        'Reranker provider is required.', 400
    );
    return options.provider;
};

const ensureApiKey = (options) => {
    assert(options?.apiKey, 'API key is required.', 400);
    return options.apiKey;
};

const ensureGoogleCredentials = (options) => {
    assert(options?.googleCredentials, 'Google credentials are required.', 400);
    assert(options?.projectId, 'Google project ID is required.', 400);
    return options;
};

const getEmbeddingClient = (provider) => {
    provider = ensureString(provider, { case: 'UP' })
        || Object.keys(embeddingClients || {})[0];
    assert(provider, 'No embedding provider has been initialized.', 500);
    return { ...embeddingClients?.[provider], provider };
};

const getRerankerClient = (provider) => {
    provider = ensureString(provider, { case: 'UP' })
        || Object.keys(rerankerClients || {})[0];
    assert(provider, 'No reranker provider has been initialized.', 500);
    return { ...rerankerClients?.[provider], provider };
};

const initEmbedding = async (options = {}) => {
    if (options?.debug) {
        (await need('node:util')).inspect.defaultOptions.depth = null;
        options.logLevel = 'debug';
    }
    ensureApiKey(options);
    const provider = ensureEmbeddingProvider(options);
    const OpenAI = await need('openai');
    const baseURL = options?.baseURL || PROVIDER_BASE_URL[provider];
    const model = options?.model || DEFAULT_EMBEDDING_MODELS[provider];
    embeddingClients[provider] = {
        client: new OpenAI({ ...options, baseURL }),
        model, source: MODEL_CONFIG[model]?.source,
    };
    return getEmbeddingClient(provider);
};

const embed = async (input, options = {}) => {
    let [{ client, model: selectedModel, provider, source }, resp]
        = [getEmbeddingClient(options?.provider), null];
    const model = options?.model || selectedModel;
    const multiple = Array.isArray(input);
    input = await Promise.all(ensureArray(input).map(async x => {
        x = Object.isObject(x) ? x : { text: x };
        assert(
            Object.keys(x).length == 1,
            'Only one type of input is allowed at a time.', 400
        );
        if (x.text) {
            x.text = await trimText(x.text, MODEL_CONFIG[model]?.maxTokens);
        } else if (x.image) {
            assert(
                MODEL_CONFIG[model]?.image,
                `Model ${model} does not support image embeddings.`, 400
            );
            if (options?.input) {
                x.image = await convert(
                    x.image, { ...options, expected: BASE64 }
                );
            }
        }
        return x;
    }));
    MODEL_CONFIG[model]?.image || (input = input.map(x => x.text));
    assert(input.length, 'Input is required.', 400);
    const body = {
        model, input, ...MODEL_CONFIG[model]?.options || {},
        ...options?.requestOptions || {},
    };
    switch (provider) {
        case JINA:
            resp = await client.post('/embeddings', { body });
            break;
        case OPENROUTER:
            source = options?.source || source
                || MODEL_CONFIG[body.model]?.source;
            body.model = `${source ? `${source}/` : ''}${body.model}`;
        case OPENAI:
            resp = await client.embeddings.create(body);
            break;
        default:
            throw new Error(`Unsupported embedding provider: ${provider}`);
    }
    assert(resp?.data?.length, 'No embeddings returned.', 500);
    if (options?.raw) { return resp; }
    const vectors = resp.data.map(x => x.embedding);
    return multiple ? vectors : vectors[0];
};

const initReranker = async (options = {}) => {
    const provider = ensureRerankerProvider(options);
    const model = options?.model || DEFAULT_RERANKER_MODELS[provider];
    switch (provider) {
        case GOOGLE:
            ensureGoogleCredentials(options);
            const { RankServiceClient } = await need(
                '@google-cloud/discoveryengine', { raw: true }
            );
            const location = options?.location || GOOGLE_DEFAULT_LOCATION;
            const clientOptions = {
                ...location ? { apiEndpoint: `${location}-discoveryengine.googleapis.com` } : {},
                ...options?.apiEndpoint ? { apiEndpoint: options.apiEndpoint } : {},
                keyFilename: options.googleCredentials,
            };
            const client = new RankServiceClient(clientOptions);
            rerankerClients[provider] = {
                client, model, rankingConfigPath: client.rankingConfigPath(
                    options.projectId, location,
                    options?.rerankerConfigId || GOOGLE_RERANK_CONFIG_ID
                ),
            };
            break;
        case JINA:
            const OpenAI = await need('openai');
            const baseURL = options?.baseURL || PROVIDER_BASE_URL[provider];
            rerankerClients[provider] = {
                client: new OpenAI({ ...options, baseURL }),
                model, source: MODEL_CONFIG[model]?.source,
            };
            break;
        default:
            throw new Error(`Unsupported reranker provider: ${provider}`);
    }
    return getRerankerClient(provider);
};

const rerank = async (query, records, options = {}) => {
    assert(query, 'Query is required.', 400);
    assert(records?.length, 'Records are required.', 400);
    const { provider, model, client, rankingConfigPath }
        = getRerankerClient(options?.provider);
    records = records.map((content, id) => Object.isObject(content)
        ? content : { id: String(id), content }).slice(
            0, MODEL_CONFIG[model]?.recordsLimit || records.length
        );
    const maxTokens = MODEL_CONFIG[model]?.maxTokens || Infinity;
    let result;
    for (let i in records) {
        records[i].title = await trimText(records[i]?.title || '', maxTokens);
        const titleTokens = await countTokens(records[i].title);
        const availableTokens = maxTokens - titleTokens;
        records[i].content = availableTokens > 0 ? await trimText(
            records[i].content, availableTokens
        ) : '';
        records[i].image = records[i].image ? await convert(records[i].image, {
            ...options, expected: BASE64,
        }) : undefined;
    }
    switch (provider) {
        case GOOGLE:
            var body = {
                model, query, rankingConfig: rankingConfigPath,
                records, topN: ~~options?.topN || records.length,
                ...MODEL_CONFIG[model]?.options || {},
                ...options?.requestOptions || {},
            };
            result = (await client.rank(body))?.[0]?.records;
            options?.raw || (result = result.map(x => ({
                index: ~~x.id, score: x.score,
            })));
            break;
        case JINA:
            records = records.map(x =>
                ((x.title || x.content) ? { text: [x.title, x.content].filter(x => x).join('\n') } : null)
                || (x.image ? { image: x.image } : null)
            ).filter(x => x);
            assert(records.length, 'No valid records found.', 400);
            var body = {
                model, query, documents: records,
                ...MODEL_CONFIG[model]?.options || {},
                ...options?.requestOptions || {},
            };
            result = (await client.post('/rerank', { body }))?.results;
            options?.raw || (result = result.map(x => ({
                index: ~~(x.index), score: x.relevance_score,
            })));
            break;
        default:
            throw new Error(`Unsupported reranker provider: ${provider}`);
    }
    result.sort((a, b) => b.score - a.score);
    return result || [];
};

export {
    _NEED,
    embed,
    initEmbedding,
    initReranker,
    rerank,
};
