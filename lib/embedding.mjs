import { convert } from './storage.mjs';
import { countTokens } from './alan.mjs';
import { ensureArray, ensureString, need } from './utilitas.mjs';

const _NEED = ['openai'];
const clients = {};
const ELLIPSIS = '...';
const buildTextWithEllipsis = (txt, trim) => `${txt}${(trim ? ELLIPSIS : '')}`;

const [
    OPENAI,
    OPENROUTER,
    JINA,
    OPENAI_MODEL_EMBED_SMALL,
    OPENAI_MODEL_EMBED_LARGE,
    GOOGLE_MODEL_GEMINI_EMBED,
    JINA_MODEL_CLIP,
] = [
        'OPENAI',
        'OPENROUTER',
        'JINA',
        'text-embedding-3-small', // dim: 1536
        'text-embedding-3-large', // dim: 3072
        'gemini-embedding-001', // dim: 768, 1536, or 3072(default)
        'jina-clip-v2', // dim: 1024
    ];

const PROVIDER_BASE_URL = {
    [OPENROUTER]: 'https://openrouter.ai/api/v1',
    [JINA]: 'https://api.jina.ai/v1/',
};

const DEFAULT_MODELS = {
    [OPENAI]: OPENAI_MODEL_EMBED_SMALL,
    [OPENROUTER]: GOOGLE_MODEL_GEMINI_EMBED,
    [JINA]: JINA_MODEL_CLIP,
};

const MODEL_CONFIG = {
    [OPENAI_MODEL_EMBED_SMALL]: { source: 'openai', maxTokens: 8192 },
    [OPENAI_MODEL_EMBED_LARGE]: { source: 'openai', maxTokens: 8192 },
    [GOOGLE_MODEL_GEMINI_EMBED]: { source: 'google', maxTokens: 20000 },
    [JINA_MODEL_CLIP]: {
        maxTokens: 8192,
        image: true,
        options: {
            task: 'retrieval.query',
            dimensions: 1024,
            normalized: true,
            embedding_type: 'float',
        },
    },
};

const ensureProvider = (options) => {
    options.provider = ensureString(options?.provider, { case: 'UP' });
    assert(
        DEFAULT_MODELS?.[options.provider], 'Provider is required.', 400
    );
    return options.provider;
};

const ensureApiKey = (options) => {
    assert(options?.apiKey, 'API key is required.', 400);
    return options.apiKey;
};

const trimTextToLimit = async (text, limit = Infinity) => {
    text = ensureString(text, { trim: true });
    let trimmed = false;
    let lastCheck = null;
    while ((lastCheck = await countTokens(
        buildTextWithEllipsis(text, trimmed), { fast: true }
    )) > limit) {
        text = text.split(' ').slice(
            0, -Math.ceil((Math.abs(lastCheck - limit) / 10))
        ).join(' ').trimEnd();
        trimmed = true;
    }
    return buildTextWithEllipsis(text, trimmed);
};

const getClient = (provider) => {
    provider = ensureString(provider, { case: 'UP' })
        || Object.keys(clients || {})[0];
    assert(provider, 'No embedding provider has been initialized.', 500);
    return { ...clients?.[provider], provider };
};

const init = async (options = {}) => {
    ensureApiKey(options);
    const provider = ensureProvider(options);
    const OpenAI = await need('openai');
    const baseURL = options?.baseURL || PROVIDER_BASE_URL[provider];
    const model = options?.model || DEFAULT_MODELS[provider];
    clients[provider] = {
        client: new OpenAI({ ...options, baseURL }),
        model, source: MODEL_CONFIG[model]?.source,
    };
    return getClient(provider);
};

const embedding = async (input, options = {}) => {
    let [{ client, model: selectedModel, provider, source }, resp]
        = [getClient(options?.provider), null];
    const model = options?.model || selectedModel;
    const multiple = Array.isArray(input);
    input = await Promise.all(ensureArray(input).map(async x => {
        x = Object.isObject(x) ? x : { text: x };
        assert(
            Object.keys(x).length == 1,
            'Only one type of input is allowed at a time.', 400
        );
        if (x.text) {
            x.text = await trimTextToLimit(
                x.text, MODEL_CONFIG[model]?.maxTokens
            );
        } else if (x.image) {
            assert(
                MODEL_CONFIG[model]?.image,
                `Model ${model} does not support image embeddings.`, 400
            );
            if (options?.input) {
                x.image = await convert(
                    x.image, { ...options, expected: 'base64' }
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
    }
    assert(resp?.data?.length, 'No embeddings returned.', 500);
    if (options?.raw) { return resp; }
    const vectors = resp.data.map(x => x.embedding);
    return multiple ? vectors : vectors[0];
};

export default init;
export {
    _NEED,
    embedding,
    init,
};
