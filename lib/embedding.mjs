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
    OPENAI_MODEL_EMBED_SMALL,
    OPENAI_MODEL_EMBED_LARGE,
] = [
        'OPENAI',
        'text-embedding-3-small',
        'text-embedding-3-large',
    ];
const DEFAULT_MODEL = OPENAI_MODEL_EMBED_SMALL;

const pickProvider = (value) => ensureString(value || OPENAI, { case: 'UP' });
const resolveApiKey = (options) => ensureString(options?.apiKey);

const getClient = (requested) => {
    let provider = ensureString(requested || '', { case: 'UP' });
    if (!provider) {
        const firstProvider = Object.keys(clients || {})[0];
        assert(
            firstProvider,
            'No embedding provider has been initialized.',
            500
        );
        provider = firstProvider;
    }
    const entry = clients?.[provider];
    assert(entry?.client, 'Embedding provider has not been initialized.', 500);
    return { provider, ...entry };
};

const init = async (options = {}) => {
    const provider = pickProvider(options?.provider);
    const apiKey = resolveApiKey(options);
    assert(apiKey, 'API key is required.');
    switch (provider) {
        case OPENAI:
            const OpenAI = await need('openai');
            clients[provider] = {
                client: new OpenAI(options),
                model: ensureString(options?.model) || DEFAULT_MODEL,
            };
            break;
        default:
            throwError('Invalid provider.');
    }
    return getClient(provider);
};

const embedding = async (input, options = {}) => {
    const {
        provider: provided,
        raw,
        model,
        ...requestOptions
    } = options;
    const { client, provider, model: providerModel } = getClient(provided);
    const multiple = Array.isArray(input);
    const payload = ensureArray(input).map((item) => ensureString(item));
    assert(payload.length, 'Input is required.', 400);
    switch (provider) {
        case OPENAI:
            const response = await client.embeddings.create({
                ...requestOptions,
                model: ensureString(model) || providerModel,
                input: payload,
            });
            assert(response?.data?.length, 'No embeddings returned.', 500);
            if (raw) { return response; }
            const vectors = response.data.map(x => x.embedding);
            return multiple ? vectors : vectors[0];
        default:
            throwError('Invalid provider.');
    }
};

export default init;
export {
    _NEED,
    embedding,
    init,
};
