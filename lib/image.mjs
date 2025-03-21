import { ensureString, need } from './utilitas.mjs';
import { MIME_PNG, convert } from './storage.mjs';

const _NEED = ['OpenAI'];
const [OPENAI, GEMINI, BASE64, BUFFER]
    = ['OPENAI', 'GEMINI', 'BASE64', 'BUFFER'];
const clients = {};

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
    assert(client, 'No available image generation provider.');
    prompt = ensureString(prompt);
    assert(prompt.length <= 4000,
        'Prompt must be less than 4000 characters.', 400);
    switch (provider) {
        case OPENAI:
            options = {
                ...options || {},
                expected: ensureString(options?.expected || BUFFER, { case: 'LOW' }),
            };
            const asUrl = options.expected === 'url';
            var resp = await client.generate({
                prompt, model: 'dall-e-3', n: 1, quality: 'hd',
                response_format: asUrl ? 'url' : 'b64_json',
                size: '1792x1024', // 1024x1024, 1792x1024, or 1024x1792
                // style: 'vivid', // or 'natural'
                // user: '',
                ...options?.params || {},
            });
            if (!options?.raw && !asUrl) {
                resp.data = await Promise.all(resp.data.map(async x => ({
                    prompt: x.revised_prompt, mimeType: MIME_PNG,
                    data: await extractImage(x.b64_json, options),
                })));
            }
            return resp?.data;
        case GEMINI:
            options.expected === 'URL' && (options.expected = 'FILE');
            var resp = await (await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/'
                + `imagen-3.0-generate-002:predict?key=${client.apiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }], parameters: {
                        sampleCount: 4, aspectRatio: '16:9',
                        ...options?.params || {},
                    }, // "1:1" (default), "3:4", "4:3", "9:16", and "16:9"
                })
            })).json();
            if (!options?.raw) {
                resp = await Promise.all(resp?.predictions.map(async x => ({
                    mimeType: x.mimeType,
                    data: await extractImage(x.bytesBase64Encoded, options),
                })));
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
