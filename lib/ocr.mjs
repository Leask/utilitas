import {
    ensureString, log as _log, need, throwError,
} from './utilitas.mjs';
import { convert, BASE64 } from './storage.mjs';

const _NEED = ['@google/genai'];
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const [GOOGLE, MISTRAL_OCR_MODEL] = ['GOOGLE', 'mistral-ocr-2505'];
const assert = (condition, message, status, options) => {
    if (!condition) { throwError(message, status, options); }
};

const clients = {};

const init = async (options) => {
    assert(options?.apiKey, 'API key is required.');
    const provider = ensureString(options?.provider || GOOGLE, { case: 'UP' });
    switch (provider) {
        case GOOGLE:
            const { GoogleGenAI } = await need('@google/genai');
            const client = new GoogleGenAI({ vertexai: false, ...options });
            clients[provider] = { gen: client };
            break;
        default:
            throw new Error('Invalid provider.');
    }
    return clients;
};

const recognize = async (file, options) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GOOGLE]) { provider = GOOGLE; }
    const client = clients?.[provider];
    assert(client, 'No available OCR provider.');

    const fileData = await convert(file, { expected: BASE64, ...options || {} });

    switch (provider) {
        case GOOGLE:
            const modelId = options?.model || MISTRAL_OCR_MODEL;
            const resp = await client.gen.models.generateContent({
                model: modelId,
                contents: [
                    {
                        parts: [
                            {
                                inlineData: {
                                    mimeType: 'application/pdf',
                                    data: fileData
                                }
                            },
                            { text: options?.prompt || "Transcribe the document." }
                        ]
                    }
                ],
                config: options?.config
            });

            const parts = resp?.candidates?.[0]?.content?.parts || [];
            let text = '';
            const images = [];

            for (const part of parts) {
                if (part.text) {
                    text += part.text;
                }
                if (part.inlineData) {
                    images.push({
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data
                    });
                }
            }

            return { text, images };

        default:
            throw new Error('Invalid provider.');
    }
};

export default init;
export {
    _NEED,
    init,
    recognize,
};
