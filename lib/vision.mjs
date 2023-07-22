import { getApiKeyCredentials } from './encryption.mjs';
import { input } from './storage.mjs';
import { need, trim } from './utilitas.mjs';

const _NEED = ['@google-cloud/vision'];
const [BASE64, FILE] = ['BASE64', 'FILE'];
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
    let content = await input(image, { input: options?.input, expected: FILE });
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
    let content = await input(image, { input: options?.input, expected: BASE64 });
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

const read = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    assert(image, 'File data is required.', 400);
    let content = await input(image, { input: options?.input, expected: BASE64 });
    const [response] = await client.batchAnnotateFiles({
        requests: [{
            inputConfig: { mimeType: 'application/pdf', content },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            pages: [1, 2, 3, 4, 5], // max 5 pages
        }],
    });
    let pages = response.responses[0].responses;
    options?.raw || (pages = pages.map(x => x.fullTextAnnotation.text));
    return pages;
};

export {
    _NEED,
    init,
    ocrImage,
    annotateImage,
    see,
    read,
};
