import { convert } from './storage.mjs';
import { ensureString, need } from './utilitas.mjs';

const _NEED = [
    'OpenAI',
];

const [BASE64] = ['BASE64'];

let client;

const init = async (options) => {
    if (options?.apiKey) {
        const OpenAI = await need('openai');
        const openai = new OpenAI(options);
        client = openai.images;
    }
    assert(client, 'Image API client has not been initialized.', 501);
    return client;
};

const generate = async (prompt, options) => {
    assert(client, 'Image API client has not been initialized.', 500);
    prompt = ensureString(prompt);
    assert(
        prompt.length <= 4000, 'Prompt must be less than 4000 characters.', 400
    );
    const resp = await client.generate({
        prompt, model: 'dall-e-3', n: 1, quality: 'hd',
        response_format: 'b64_json', // or 'url'
        size: '1792x1024', // 1024x1024, 1792x1024, or 1024x1792
        style: 'vivid', // or 'natural'
        // user: '',
        ...options?.params || {},
    });
    return options?.raw ? resp : await convert(
        resp?.data?.[0]?.b64_json, { input: BASE64, ...options || {} }
    );
};

export default init;
export {
    _NEED,
    generate,
    init,
};
