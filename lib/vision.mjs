import {
    base64Decode, base64Encode, ensureString, need, throwError, trim
} from './utilitas.mjs';

import { getApiKeyCredentials } from './encryption.mjs';
import { readFile, writeTempFile } from './storage.mjs';

const _NEED = ['@google-cloud/vision'];
const [BUFFER, BASE64, FILE] = ['BUFFER', 'BASE64', 'FILE'];
const ceil = num => num.toFixed(4);

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
        case BUFFER: case '': content = await writeTempFile(image, { encoding: 'binary' }); break;
        case FILE: content = image; break;
        default: throwError('Invalid input format.', 400);
    }
    const [response] = await client.textDetection(content);
    let detections = response.textAnnotations;
    if (!options?.raw && detections[0]) {
        detections = {
            description: detections[0].description,
            score: detections[0].score,
            vertices: detections[0].boundingPoly.vertices,
        };
    }
    return detections;
};

const annotateImage = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    assert(image, 'Image data is required.', 400);
    let content;
    switch (ensureString(options?.input, { case: 'UP' })) {
        case BUFFER: case '': content = base64Encode(image, true); break;
        case BASE64: content = image; break;
        case FILE: content = await readFile(image, { encoding: BASE64 }); break;
        default: throwError('Invalid input format.', 400);
    }
    const [response] = await client.objectLocalization({ image: { content } });
    let objects = response.localizedObjectAnnotations;
    if (!options?.raw) {
        objects = objects.map(x => ({
            description: x.name,
            score: x.score,
            vertices: x.boundingPoly.normalizedVertices,
        }));
    }
    return objects;
};

const see = async (image, options) => {
    const [text, objects] = await Promise.all([
        ocrImage(image, options), annotateImage(image, options),
    ]);
    let result = { text, objects };
    if (!options?.raw) {
        result = [];
        if (text?.description) {
            result.push('text:', text.description);
        }
        if (objects.length) {
            result.push('', 'objects:', ...objects.map(x => [
                `- ${x.description}`, `score: ${ceil(x.score)}`,
                `vertices: ${x.vertices.map(
                    l => `(${ceil(l.x)}, ${ceil(l.y)})`
                ).join(' ')}`,
            ].join('\n')));
        }
        result = trim(result.join('\n'));
    }
    return result;
};

export {
    _NEED,
    init,
    ocrImage,
    annotateImage,
    see,
};
