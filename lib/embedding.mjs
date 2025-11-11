import {
    ensureArray,
    ensureString,
    need,
    throwError,
} from './utilitas.mjs';

const _NEED = ['openai'];
const clients = {};
const [
    OPENAI,
    OPENROUTER,
    OPENAI_MODEL_EMBED_SMALL,
    OPENAI_MODEL_EMBED_LARGE,
    OPENROUTER_MODEL_GEMINI_EMBED,
] = [
        'OPENAI',
        'OPENROUTER',
        'text-embedding-3-small',
        'text-embedding-3-large',
        'google/gemini-embedding-001',
    ];
const OPENROUTER_API = 'https://openrouter.ai/api/v1';
const DEFAULT_MODELS = {
    [OPENAI]: OPENAI_MODEL_EMBED_SMALL,
    [OPENROUTER]: OPENROUTER_MODEL_GEMINI_EMBED,
};

const ensureProvider = (options) => {
    options.provider = ensureString(options?.provider, { case: 'UP' });
    assert(
        DEFAULT_MODELS?.[options.provider], 'Provider is required.', 400
    );
    return options.provider;
};

const ensureApiKey = (options) => {
    options.apiKey = ensureString(options?.apiKey);
    assert(options.apiKey, 'API key is required.', 400);
    return options.apiKey;
};

const getClient = (provider) => {
    provider = ensureString(provider || '', { case: 'UP' })
        || Object.keys(clients || {})[0];
    assert(provider, 'No embedding provider has been initialized.', 500);
    return { ...clients?.[provider], provider };
};

const init = async (options = {}) => {
    ensureApiKey(options);
    const provider = ensureProvider(options);
    const OpenAI = await need('openai');
    clients[provider] = {
        client: new OpenAI({
            ...options, baseURL: options?.baseURL
                || (provider === OPENROUTER ? OPENROUTER_API : undefined),
        }),
        model: ensureString(options?.model || DEFAULT_MODELS[provider]),
    };
    return getClient(provider);
};

const embedding = async (input, options = {}) => {
    const { client, model } = getClient(options?.provider);
    const multiple = Array.isArray(input);
    const payload = ensureArray(input).map((item) => ensureString(item));
    assert(payload.length, 'Input is required.', 400);
    const response = await client.embeddings.create({
        model: ensureString(options?.model) || model,
        input: payload,
        ...options?.requestOptions || {},
    });
    assert(response?.data?.length, 'No embeddings returned.', 500);
    if (options?.raw) { return response; }
    const vectors = response.data.map(x => x.embedding);
    return multiple ? vectors : vectors[0];
};

export default init;
export {
    _NEED,
    embedding,
    init,
};
