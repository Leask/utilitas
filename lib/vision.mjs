import { getApiKeyCredentials } from './encryption.mjs';
import get from './shot.mjs';

import {
    convert, deleteOnCloud, downloadFromCloud, getIdByGs, uploadToCloud,
} from './storage.mjs';

import {
    ensureArray, ignoreErrFunc, log as _log, need, throwError, trim, timeout,
} from './utilitas.mjs';

const _NEED = ['@google-cloud/vision', 'tesseract.js'];
const [BASE64, BUFFER, FILE, DEFAULT_LANG] = ['BASE64', 'BUFFER', 'FILE', 'eng'];
const ceil = num => num.toFixed(4);
const errorMessage = 'Invalid image data.';
const getTextFromBatch = bt => bt.responses.map(p => p.fullTextAnnotation.text);
const DOCUMENT_TEXT_DETECTION = 'DOCUMENT_TEXT_DETECTION';
const features = [{ type: DOCUMENT_TEXT_DETECTION }];
const mimeType = 'application/pdf';
const pages = [1, 2, 3, 4, 5]; // max 5 pages limit for batchAnnotateFiles API
const log = content => _log(content, import.meta.url);

let client;

const init = async (options) => {
    if (options) {
        if (options?.credentials || options?.apiKey) {
            const vision = (await need('@google-cloud/vision')).default;
            client = new vision.ImageAnnotatorClient(options?.apiKey ? {
                sslCreds: await getApiKeyCredentials(options)
            } : options);
        } else { await checkTesseract({ assert: true }); }
    }
    assert(
        client || await checkTesseract(),
        'Vision API client has not been initialized.', 501
    );
    return client;
};

const checkTesseract = async (options) => {
    const result = !!(await ignoreErrFunc(() => need('tesseract.js')));
    options?.assert && assert(result, 'Tesseract API is not available.', 500);
    return result;
};

const ocrImageGoogle = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    const content = await convert(image, {
        input: options?.input, expected: FILE, errorMessage,
    });
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

// https://github.com/naptha/tesseract.js#tesseractjs
// https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md
const ocrImageTesseract = async (image, options) => {
    const [content, lang, { createWorker }] = [
        await convert(image, { input: options?.input, expected: BUFFER, errorMessage }),
        ensureArray(options?.lang || DEFAULT_LANG).join('+'),
        await need('tesseract.js')
    ];
    const worker = await createWorker({ logger: m => options?.log && log(m) });
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    options?.parameters && await worker.setParameters(options.parameters);
    const resp = await worker.recognize(content, options);
    await worker.terminate();
    return options?.raw ? resp : resp.data.text;
};

const ocrImage = async (image, options) => {
    let engine;
    if (client) { engine = ocrImageGoogle; }
    else if (await checkTesseract()) { engine = ocrImageTesseract; }
    else { throwError('Vision engine has not been initialized.', 500); }
    return await engine(image, options);
};

const annotateImage = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    const content = await convert(image, {
        input: options?.input, expected: BASE64, errorMessage,
    });
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
    const content = await convert(image, {
        input: options?.input, expected: BASE64, errorMessage,
    });
    let result = await client.batchAnnotateFiles({
        requests: [{ inputConfig: { mimeType, content }, features, pages }],
    });
    return options?.raw ? result : getTextFromBatch(result[0].responses[0]);
};

const readAll = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    const result = {};
    result.upload = await uploadToCloud(image, {
        gzip: false, prefix: options?.prefix || '_vision', ...options || {},
    });
    const uri = result.upload?.gs;
    const destination = `${uri}_result/`;
    const resultId = getIdByGs(destination);
    result.clear = await deleteOnCloud(resultId);
    result.submit = await client.asyncBatchAnnotateFiles({
        requests: [{
            inputConfig: { mimeType, gcsSource: { uri } },
            outputConfig: { gcsDestination: { uri: destination } }, features,
        }],
    });
    result.response = await result.submit[0].promise();
    result.result = await downloadFromCloud(resultId, { expected: 'JSON' });
    options?.keep || (result.cleanup = await Promise.all(
        [getIdByGs(uri), resultId].map(deleteOnCloud)
    ));
    return options?.raw ? result : Object.keys(result.result).map(
        f => getTextFromBatch(result.result[f])
    ).flat();
};

export {
    _NEED,
    annotateImage,
    init,
    ocrImage,
    ocrImageGoogle,
    ocrImageTesseract,
    read,
    readAll,
    see,
};
