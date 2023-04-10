import { base64Decode, ensureString, need, throwError } from './utilitas.mjs';
import { getApiKeyCredentials } from './encryption.mjs';
import { writeTempFile } from './storage.mjs';

const _NEED = ['@google-cloud/vision'];
const [BUFFER, BASE64, FILE, encoding]
    = ['BUFFER', 'BASE64', 'FILE', { encoding: 'binary' }];

let client;

const init = async (options) => {
    if (options) {
        assert(options?.apiKey, 'Google Cloud API Key is required.', 500);
        const sslCreds = await getApiKeyCredentials(options);
        const vision = (await need('@google-cloud/vision')).default;
        client = new vision.ImageAnnotatorClient({ sslCreds });
    }
    assert(client, 'Vision API client has not been initialized.', 501);
    return client;
};

const ocrImage = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    assert(image, 'Image data is required.', 400);
    let content;
    switch (ensureString(options?.input, { case: 'UP' })) {
        case BASE64: image = base64Decode(image, true);
        case BUFFER: case '': content = await writeTempFile(image, encoding); break;
        case FILE: content = image; break;
        default: throwError('Invalid input format.', 400);
    }
    const [response] = await client.textDetection(content);
    let detections = response.textAnnotations;
    options?.raw || (detections = detections.map(t => t.description).join(' '));
    return detections;
};

export {
    _NEED,
    init,
    ocrImage,
};
