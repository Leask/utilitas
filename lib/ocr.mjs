import { ensureString, need } from './utilitas.mjs';
import { convert, BASE64, DATAURL } from './storage.mjs';

import {
    getGoogleAuthByCredentials, getGoogleAuthTokenByAuth,
} from './encryption.mjs';

const _NEED = [];
const [GOOGLE, MISTRAL_OCR_MODEL] = ['GOOGLE', 'mistral-ocr-2505'];
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
            clients[provider] = {
                auth: await getGoogleAuthByCredentials(options.credentials),
                project: options?.project,
                region: options?.region || 'us-central1',
                model: options?.model || MISTRAL_OCR_MODEL,
            };
            break;
        default:
            throw new Error('Invalid provider.');
    }
    return clients;
};


const recognize = async (file, options = {}) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GOOGLE]) {
        provider = GOOGLE;
    } else if (!provider && Object.keys(clients).length) {
        provider = Object.keys(clients)[0];
    }
    const client = clients?.[provider];
    assert(client, 'No available OCR provider.');
    const model = options?.model || client.model;
    const document_url = await convert(file, { ...options, expected: DATAURL });
    switch (provider) {
        case GOOGLE:
            const key = await getGoogleAuthTokenByAuth(client.auth);
            return await (await fetch(
                `https://${client.region}-aiplatform.googleapis.com/v1/`
                + `projects/${client.project}/locations/${client.region}/`
                + `publishers/mistralai/models/${model}:rawPredict`, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                }, body: JSON.stringify({
                    model, include_image_base64: true,
                    document: { type: 'document_url', document_url },
                })
            })).json();
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
