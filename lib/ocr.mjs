import { ensureString, need } from './utilitas.mjs';
import { convert, BASE64 } from './storage.mjs';

const _NEED = ['@google/genai'];
const [GOOGLE, MISTRAL_OCR_MODEL] = ['GOOGLE', 'publishers/mistralai/models/mistral-ocr-2505'];
const clients = {};

const prompt = `You are an OCR (Optical Character Recognition) model that extracts text from images and documents. Your task is to accurately transcribe the text content from the provided files, preserving formatting where possible. Respond with the extracted text only, without any additional commentary or information. Retain all essential information. Remove secondary elements like headers, footers, watermarks, and page textures. Ensure the returned document is clean, well-organized, and highly readable. Use Markdown for rich text formatting. Use LaTeX for all formulas, subscripts, representations of formulas, and special symbols in mathematics and chemistry, enclosed by "$" symbols.`;

const init = async (options) => {
    const provider = ensureString(options?.provider || GOOGLE, { case: 'UP' });
    switch (provider) {
        case GOOGLE:
            assert(
                options.credentials && options.project,
                'Google credentials and project must not be set.'
            );
            process.env.GOOGLE_APPLICATION_CREDENTIALS = options.credentials;
            const { GoogleGenAI } = await need('@google/genai');
            clients[provider] = {
                client: new GoogleGenAI({
                    vertexai: true,
                    project: options.project,
                    location: options.location || 'us-central1',
                }),
                model: options?.model || MISTRAL_OCR_MODEL
            };
            break;
        default:
            throw new Error('Invalid provider.');
    }
    return clients;
};

const recognize = async (file, options = {}) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GOOGLE]) { provider = GOOGLE; }
    let { client, model } = clients?.[provider] || {};
    assert(client, 'No available OCR provider.');
    model = options?.model || model;
    const fileData = await convert(file, { ...options, expected: BASE64 });
    switch (provider) {
        case GOOGLE:
            const resp = await client.models.rawPredict({
                model, contents: [{
                    parts: [{
                        inlineData: {
                            mimeType: 'application/pdf', data: fileData,
                        }
                    }, { text: options?.prompt || prompt }]
                }], config: options?.config
                // { role: 'user', parts: [{ text: 'Perform OCR on this image:', inlineData: { mimeType: 'image/jpeg', data: imageData } }] }

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
