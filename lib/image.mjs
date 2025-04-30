import { ensureString, need, throwError } from './utilitas.mjs';
import { MIME_PNG, convert } from './storage.mjs';

const _NEED = ['OpenAI'];

const [
    clients, OPENAI, GEMINI, BASE64, BUFFER, ERROR_GENERATING, IMAGEN_MODEL,
    OPENAI_MODEL,
] = [
        {}, 'OPENAI', 'GEMINI', 'BASE64', 'BUFFER', 'Error generating image.',
        'imagen-3.0-generate-002', 'gpt-image-1',
    ];

const init = async (options) => {
    assert(options?.apiKey, 'API key is required.');
    const provider = ensureString(options?.provider, { case: 'UP' });
    switch (provider) {
        case OPENAI:
            const OpenAI = await need('openai');
            const openai = new OpenAI(options);
            clients[provider] = openai.images;
            break;
        case GEMINI:
            clients[provider] = { apiKey: options.apiKey };
            break;
        default:
            throw new Error('Invalid provider.');
    }
    return clients;
};

const extractImage = async (data, options) => await convert(
    data, { input: BASE64, suffix: 'png', ...options || {} }
);

const generate = async (prompt, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GEMINI]) { provider = GEMINI; }
    if (!provider && clients?.[OPENAI]) { provider = OPENAI; }
    const client = clients?.[provider];
    const n = options?.n || 4;
    assert(client, 'No available image generation provider.');
    prompt = ensureString(prompt);
    assert(prompt.length <= 4000,
        'Prompt must be less than 4000 characters.', 400);
    options = {
        ...options || {},
        expected: ensureString(options?.expected || BUFFER, { case: 'LOW' }),
    };
    switch (provider) {
        case OPENAI:
            try { // https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1
                var resp = await client.generate({
                    prompt, model: OPENAI_MODEL, n, quality: 'high',
                    size: '1536x1024', moderation: 'low',
                    // 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait), auto (default)
                    // background: 'transparent',
                    ...options?.params || {},
                });
            } catch (err) { throwError(err?.message || ERROR_GENERATING); }
            if (!options?.raw) {
                resp.data = await Promise.all(resp.data.map(async x => ({
                    caption: `🎨 by ${OPENAI_MODEL}`,
                    data: await extractImage(x.b64_json, options),
                    mimeType: MIME_PNG,
                })));
            }
            return resp?.data;
        case GEMINI:
            var resp = await (await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/'
                + `${IMAGEN_MODEL}:predict?key=${client.apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }], parameters: {
                        sampleCount: n, aspectRatio: '16:9',
                        ...options?.params || {},
                    }, // "1:1" (default), "3:4", "4:3", "9:16", and "16:9"
                })
            })).json();
            assert(!resp?.error, resp?.error?.message || ERROR_GENERATING);
            if (!options?.raw) {
                resp = await Promise.all((resp?.predictions || []).map(
                    async x => ({
                        caption: `🎨 by ${IMAGEN_MODEL}`,
                        data: await extractImage(x.bytesBase64Encoded, options),
                        mimeType: x.mimeType,
                    })
                ));
            }
            return resp;
        default:
            throw new Error('Invalid provider.');
    }
};

export default init;
export {
    _NEED,
    generate,
    init,
};
