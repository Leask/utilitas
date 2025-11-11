import {
    ensureArray,
    ensureString,
    need,
} from './utilitas.mjs';
import { countTokens } from './alan.mjs';

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
        'text-embedding-3-small', // dim: 1536
        'text-embedding-3-large', // dim: 3072
        'google/gemini-embedding-001', // dim: 768, 1536, or 3072(default)
    ];
const OPENROUTER_API = 'https://openrouter.ai/api/v1';
const DEFAULT_MODELS = {
    [OPENAI]: OPENAI_MODEL_EMBED_SMALL,
    [OPENROUTER]: OPENROUTER_MODEL_GEMINI_EMBED,
};
const MAX_TOKENS = {
    [OPENAI_MODEL_EMBED_SMALL]: 8192,
    [OPENAI_MODEL_EMBED_LARGE]: 8192,
    [OPENROUTER_MODEL_GEMINI_EMBED]: 20000,
};
const ELLIPSIS = '...';
const buildTextWithEllipsis = (txt, trim) => `${txt}${(trim ? ELLIPSIS : '')}`;

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
    const { client, model: selectedModel } = getClient(options?.provider);
    const model = ensureString(options?.model) || selectedModel;
    const multiple = Array.isArray(input);
    input = ensureArray(input);
    assert(input.length, 'Input is required.', 400);
    input = await Promise.all(input.map(
        text => trimTextToLimit(text, MAX_TOKENS[model])
    ));
    const resp = await client.embeddings.create({
        model, input, ...options?.requestOptions || {},
    });
    print(JSON.stringify(input));
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
