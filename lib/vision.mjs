import {
    log as _log, ensureArray, ensureString, need, throwError,
} from './utilitas.mjs';

import {
    getGoogleAuthByCredentials, getGoogleAuthTokenByAuth,
} from './encryption.mjs';

import { convert, DATAURL, BUFFER, FILE } from './storage.mjs';
import fs from 'node:fs';

const _NEED = ['office-text-extractor', 'pdfjs-dist', 'tesseract.js'];
const clients = {};
const errorMessage = 'Invalid input data.';
const log = content => _log(content, import.meta.url);
const [DEFAULT_LANG, GOOGLE_MISTRAL, MISTRAL_OCR_MODEL]
    = ['eng', 'GOOGLE_MISTRAL', 'mistral-ocr-2505'];

const init = async (options) => {
    const provider = ensureString(options?.provider || GOOGLE_MISTRAL, { case: 'UP' });
    switch (provider) {
        case GOOGLE_MISTRAL:
            assert(
                options.credentials && options.project,
                'Google credentials and project must be set.'
            );
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

const parseOfficeFile = async (source, options) => {
    let [OTE, XLSX, opts] = ['office-text-extractor', 'xlsx', {
        input: options?.input, errorMessage,
    }];
    switch (ensureString(options?.lib || OTE, { case: 'LOW' })) {
        case OTE:
            const officeParser = (await need(OTE)).getTextExtractor();
            const input = await convert(source, { ...opts, expected: BUFFER });
            try {
                return await officeParser.extractText({
                    input, type: BUFFER.toLowerCase(),
                });
            } catch (err) {
                if (/application\/x\-cfb$/.test(err.message)) {
                    err.message += ` (https://github.com/gamemaker1/office-text-extractor/issues/10)`;
                }
                throwError(err.message);
            }
        case XLSX:
            // https://docs.sheetjs.com/docs/getting-started/installation/nodejs
            const xlsx = await need(XLSX)
            xlsx.set_fs(fs);
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

// https://github.com/naptha/tesseract.js#tesseractjs
// https://github.com/naptha/tesseract.js/blob/master/docs/image-format.md
const ocrImage = async (image, options) => {
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

const getPdfPage = async (doc, pages) => {
    let [min, max, multiple] = [1, doc.numPages, Array.isArray(pages)];
    if (!pages) {
        pages = [];
        for (let i = min; i <= max; i++) { pages.push(i); }
        multiple = true;
    }
    pages = ensureArray(pages).map(
        x => x >= min && x <= max ? ~~x : null
    ).filter(x => x);
    assert(pages.length, 'Invalid page numbers.');
    const result = await Promise.all(pages.map(p => (async p => {
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: 1.0 });
        const res = {
            pageNum: p, width: viewport.width, height: viewport.height,
            content: (await page.getTextContent()).items.map(x => x.str).join(' '),
        }
        page.cleanup();
        return res;
    })(p)));
    return multiple ? result : result[0];
};

// https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs
const getPdfInfo = async (file, options) => {
    const { getDocument } = await need('pdfjs-dist');
    const doc = await getDocument(file).promise;
    const data = await doc.getMetadata();
    const result = {
        info: data.info, metadata: { ...data.metadata?.getAll() },
        numPages: doc.numPages, ...options.withDoc ? { doc } : {},
        pages: options?.withPages ? await getPdfPage(doc) : null,
    };
    return result;
};

const ocr = async (file, options = {}) => {
    let provider = ensureString(options?.provider, { case: 'UP' });
    if (!provider && clients?.[GOOGLE_MISTRAL]) {
        provider = GOOGLE_MISTRAL;
    } else if (!provider && Object.keys(clients).length) {
        provider = Object.keys(clients)[0];
    }
    const client = clients?.[provider];
    assert(client, 'No available OCR provider.');
    const model = options?.model || client.model;
    const document_url = await convert(file, { ...options, expected: DATAURL });
    switch (provider) {
        case GOOGLE_MISTRAL:
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
    getPdfInfo,
    getPdfPage,
    init,
    ocr,
    ocrImage,
    parseOfficeFile,
};
