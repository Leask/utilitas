import {
    convert, deleteOnCloud, downloadFromCloud, getIdByGs, uploadToCloud,
} from './storage.mjs';

import {
    ensureArray, ensureString, ignoreErrFunc, log as _log, need, throwError,
    trim,
} from './utilitas.mjs';

import { v4 as uuidv4 } from 'uuid';
import { getApiKeyCredentials } from './encryption.mjs';
import fs from 'node:fs';
import path from 'node:path';

const _NEED = [
    '@google-cloud/vision', 'office-text-extractor', 'pdfjs-dist',
    'tesseract.js',
];

const [BASE64, BUFFER, FILE, DEFAULT_LANG] = ['BASE64', 'BUFFER', 'FILE', 'eng'];
const ceil = num => num.toFixed(4);
const errorMessage = 'Invalid input data.';
const getTextFromBatch = b => b.responses.map(p => p?.fullTextAnnotation?.text || '');
const DOCUMENT_TEXT_DETECTION = 'DOCUMENT_TEXT_DETECTION';
const features = [{ type: DOCUMENT_TEXT_DETECTION }];
const mimeType = 'application/pdf';
const pages = [1, 2, 3, 4, 5]; // max 5 pages limit for batchAnnotateFiles API
const log = content => _log(content, import.meta.url);

let client, officeParser, xlsx;

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

const parseOfficeFile = async (source, options) => {
    let [OTE, XLSX, opts] = ['office-text-extractor', 'xlsx', {
        input: options?.input, errorMessage,
    }];
    switch (ensureString(options?.lib || OTE, { case: 'LOW' })) {
        case OTE:
            officeParser || (officeParser = (
                await need(OTE)
            ).getTextExtractor());
            const input = await convert(source, { ...opts, expected: BUFFER });
            return await officeParser.extractText({
                input, type: BUFFER.toLowerCase(),
            });
        case XLSX:
            // https://docs.sheetjs.com/docs/getting-started/installation/nodejs
            xlsx || ((xlsx = await need(XLSX)) && xlsx.set_fs(fs));
            const { content, cleanup } = await convert(source, {
                ...opts, expected: FILE, withCleanupFunc: true
            });
            const resp = await xlsx.readFile(content);
            await cleanup();
            if (options?.raw) { return resp; }
            const [result, formatter] = [[], `sheet_to_${ensureString(
                options?.format || 'txt', { case: 'low' }
            )}`]; // csv, txt, json, html, formulae, row_object_array
            assert(xlsx.utils[formatter], `Invalid formatter: ${formatter}.`)
            for (let name in resp.Sheets) {
                result.push({
                    name, data: xlsx.utils[formatter](resp.Sheets[name]),
                });
            }
            return result;
        default:
            throwError('Invalid extractor.');
    }
};

const checkTesseract = async (options) => {
    const result = !!(await ignoreErrFunc(() => need('tesseract.js')));
    options?.assert && assert(result, 'Tesseract API is not available.', 500);
    return result;
};

const ocrImageGoogle = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    const { content, cleanup } = await convert(image, {
        input: options?.input, expected: FILE, errorMessage,
        withCleanupFunc: true,
    });
    const [response] = await client.textDetection(content);
    await cleanup();
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
    if (options?.allPages) {
        assert(options?.input === FILE, 'Only file input is supported.', 400);
        if ((await getPdfInfo(image)).numPages > pages.length) {
            return await readAll(image, options);
        }
    }
    const content = await convert(image, {
        input: options?.input, expected: BASE64, errorMessage,
    });
    const result = await client.batchAnnotateFiles({
        requests: [{ inputConfig: { mimeType, content }, features, pages }],
    });
    return options?.raw ? result : getTextFromBatch(result[0].responses[0]);
};

const readAll = async (image, options) => {
    assert(client, 'Vision API has not been initialized.', 500);
    const result = {};
    result.upload = await uploadToCloud(image, {
        destination: path.join(options?.prefix || '_vision', `${uuidv4()}.pdf`),
        ...options || {},
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

const getPdfPage = async (doc, pageNum) => {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const result = {
        pageNum: pageNum,
        width: viewport.width,
        height: viewport.height,
        content: (await page.getTextContent()).items.map(x => x.str).join(' '),
    };
    page.cleanup();
    return result
};

const getPdfPages = async (doc) => {
    const result = [];
    for (let i = 1; i <= doc.numPages; i++) { result.push(getPdfPage(doc, i)); }
    return await Promise.all(result);
};

// https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs
const getPdfInfo = async (file, options) => {
    const { getDocument } = await need('pdfjs-dist');
    const doc = await getDocument(file).promise;
    const data = await doc.getMetadata();
    const result = {
        numPages: doc.numPages,
        info: data.info,
        metadata: { ...data.metadata?.getAll() },
        pages: options?.withPages ? await getPdfPages(doc) : null,
    };
    return result;
};

export {
    _NEED,
    annotateImage,
    getPdfInfo,
    getPdfPage,
    getPdfPages,
    init,
    ocrImage,
    ocrImageGoogle,
    ocrImageTesseract,
    parseOfficeFile,
    read,
    readAll,
    see,
};
