import { convert } from './storage.mjs';
import { ensureString, need } from './utilitas.mjs';

const _NEED = [
    'OpenAI',
];

const [BASE64, BUFFER] = ['BASE64', 'BUFFER'];

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
    options = {
        ...options || {},
        expected: ensureString(options?.expected || BUFFER, { case: 'LOW' }),
    };
    const asUrl = options.expected === 'url';
    const resp = await client.generate({
        prompt, model: 'dall-e-3', n: 1, quality: 'hd',
        response_format: asUrl ? 'url' : 'b64_json',
        size: '1792x1024', // 1024x1024, 1792x1024, or 1024x1792
        style: 'vivid', // or 'natural'
        // user: '',
        ...options?.params || {},
    });
    if (!options?.raw && !asUrl) {
        resp.data = await Promise.all(resp.data.map(async x => ({
            revised_prompt: x.revised_prompt, [options.expected]: await convert(
                x.b64_json, { input: BASE64, ...options || {} }
            )
        })));
    }
    return resp?.data;
};

export default init;
export {
    _NEED,
    generate,
    init,
};
