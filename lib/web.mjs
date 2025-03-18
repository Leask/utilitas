import { bignumber, divide, multiply } from 'mathjs';
import { fileTypeFromBuffer } from 'file-type';
import { join } from 'path';
import { promises as fs } from 'fs';
import { sha256 } from './encryption.mjs';

import {
    ensureInt, ensureString, extract, ignoreErrFunc, inBrowser, parseJson,
    parseVersion, throwError, which, assertSet, assembleUrl, need,
} from './utilitas.mjs';

import {
    MIME_JSON, MIME_TEXT, convert, encodeBase64DataURL, exists, mapFilename,
    readJson, touchPath, writeJson,
} from './storage.mjs';

const _NEED = ['jsdom', 'youtube-transcript', '@mozilla/readability'];
// https://stackoverflow.com/questions/19377262/regex-for-youtube-url
const YT_REGEXP = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i;
const isYoutubeUrl = url => (url || '').match(YT_REGEXP)?.[6];
const distillPage = async (url, op) => (await getParsedHtml(url, op))?.content;
const TMPDIR = process.env.TMPDIR ? join(process.env.TMPDIR, 'shot') : null;
const buf2utf = buf => buf.toString('utf8');
const [TEXT, _JSON, _PARSED] = ['TEXT', 'JSON', 'PARSED'];
const getJson = async (u, o) => await get(u, { encode: _JSON, ...o || {} });
const getParsedHtml = async (u, o) => await get(u, { encode: _PARSED, ...o || {} });
const checkSearch = () => googleApiKey || jinaApiKey;

let googleApiKey, googleCx, jinaApiKey;

const defFetchOpt = {
    redirect: 'follow', follow: 3, timeout: 1000 * 10, headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
            + 'AppleWebKit/605.1.15 (KHTML, like Gecko) '
            + 'Version/17.0 Safari/605.1.15',
    },
};

const getVersionOnNpm = async (packName) => {
    assert(packName, 'Package name is required.', 400);
    const url = `https://registry.npmjs.org/-/package/${packName}/dist-tags`;
    const rp = (await get(url, { encode: _JSON }))?.content;
    assert(rp, 'Error fetching package info.', 500);
    assert(rp !== 'Not Found' && rp.latest, 'Package not found.', 404);
    return parseVersion(rp.latest);
};

const checkVersion = async (pack) => {
    const objPack = await which(pack);
    const curVersion = objPack.versionNormalized;
    const newVersion = await getVersionOnNpm(objPack.name);
    return {
        name: objPack.name, curVersion, newVersion,
        updateAvailable: newVersion.normalized > curVersion.normalized,
    }
};

const getCurrentIp = async (options) => {
    const resp = await get(
        'https://ifconfig.me/all.json', { encode: _JSON, ...options || {} }
    );
    assert(resp?.content?.ip_addr, 'Error detecting IP address.', 500);
    return options?.raw ? resp : resp.content.ip_addr;
};

const getCurrentPosition = async () => {
    const url = 'https://geolocation-db.com/json/';
    const rp = await fetch(url).then(res => res.json());
    assert(rp, 'Network is unreachable.', 500);
    assert(rp.country_code, 'Error detecting geolocation.', 500);
    return rp;
};

const get = async (url, options) => {
    assert(url, 'URL is required.', 400);
    options = options || {};
    options.encode = ensureString(options.encode, { case: 'UP' });
    const urlHash = inBrowser() ? null : sha256(url);
    const tmp = urlHash ? (options.cache?.tmp || TMPDIR) : null;
    const base = tmp ? join(tmp, mapFilename(urlHash)) : null;
    const [cacheMeta, cacheCont] = base ? ['meta', 'content'].map(
        x => join(base, `${urlHash}.${x}`)
    ) : [];
    if (options?.fuzzy && await exists(cacheMeta) && await exists(cacheCont)) {
        return { cache: { meta: cacheMeta, content: cacheCont } };
    }
    const meta = options?.refresh || !base ? null : await readJson(cacheMeta);
    const cache = options?.refresh || !base ? null : await ignoreErrFunc(
        () => fs.readFile(cacheCont)
    );
    const headers = meta?.responseHeaders && cache ? {
        'cache-control': 'max-age=0',
        'if-modified-since': meta.responseHeaders['last-modified'] || '',
        'if-none-match': meta.responseHeaders['etag'] || '',
    } : {};
    let [timer, r, responseHeaders] = [null, null, {}];
    const fetchOptions = {
        ...defFetchOpt, headers: { ...defFetchOpt.headers, ...headers },
        ...options.fetch || {}
    };
    if (options.timeout) {
        const controller = new AbortController();
        fetchOptions.signal = controller.signal;
        timer = setTimeout(() => controller.abort(), options.timeout);
    }
    try { r = await fetch(url, fetchOptions); } catch (e) {
        throwError(e.message.includes('aborted') ? 'Timed out.' : e.message, 500);
    }
    timer && clearTimeout(timer);
    (r.status === 304) && (r.arrayBuffer = async () => cache);
    const [htpMime, buffer] = [r.headers.get('content-type'), Buffer.from(await r.arrayBuffer())];
    if (r.headers?.raw) { responseHeaders = r.headers.raw(); }
    else { for (const [k, v] of r.headers.entries()) { responseHeaders[k] = v; } }
    const bufMime = await ignoreErrFunc(async () => {
        extract(await fileTypeFromBuffer(buffer), 'mime');
    });
    const mimeType = bufMime || htpMime;
    const length = buffer.length;
    let content;
    if (!options?.fuzzy) {
        switch (options.encode) {
            case 'BUFFER':
                content = buffer;
                break;
            case 'BASE64':
                content = buffer.toString(options.encode);
                break;
            case 'BASE64_DATA_URL':
                content = await encodeBase64DataURL(mimeType, buffer);
                break;
            case _JSON:
                content = parseJson(buf2utf(buffer), null);
                break;
            case _PARSED:
                content = await distillHtml(buf2utf(buffer));
                break;
            default:
                assert(!options.encode, 'Invalid encoding.', 400);
            case 'TEXT':
                content = buf2utf(buffer);
        }
    }
    base && !cache && length && r.status === 200
        && await ignoreErrFunc(async () => {
            return {
                touch: await touchPath(base),
                content: await fs.writeFile(cacheCont, buffer),
                meta: await writeJson(cacheMeta, {
                    url, requestHeaders: headers, responseHeaders,
                }),
            };
        });
    return {
        statusCode: r.status, statusText: r.statusText, length, mimeType,
        content, headers: responseHeaders, response: r,
        cache: r.status >= 200 && r.status < 400 ? { meta: cacheMeta, content: cacheCont } : null,
    };
};

const initSearch = async (options = {}) => {
    assert(options.apiKey, 'API key is required.');
    switch (ensureString(options.provider, { case: 'UP' })) {
        case 'GOOGLE':
            assert(options.cx, 'CX is required for Google Search API.');
            [googleApiKey, googleCx] = [options.apiKey, options.cx];
            break;
        case 'JINA':
            jinaApiKey = options.apiKey;
            break;
        default:
            throwError(`Invalid search provider: "${options.provider}".`);
    }
    return async (query, opts) => await search(query, { ...options, ...opts });
};

const search = async (query, options = {}) => {
    assert(query, 'Query keyword is required.');
    let provider = ensureString(options.provider, { case: 'UP' });
    if (!provider && googleApiKey) { provider = 'GOOGLE'; }
    if (!provider && jinaApiKey) { provider = 'JINA'; }
    switch (provider) {
        case 'GOOGLE':
            var [key, cx, min, max] = [
                options?.apiKey || googleApiKey, options?.cx || googleCx, 1, 10
            ];
            assert(key, 'API key is required.');
            assert(cx, 'CX is required.');
            var [num, start] = [
                ensureInt(options?.num || max, { min, max }),
                ensureInt(options?.start || min, { min }),
            ];
            assert(start + num <= 100, 'Reached maximum search limit.');
            var url = 'https://www.googleapis.com/customsearch/v1'
                + `?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}`
                + `&q=${encodeURIComponent(query)}&num=${num}&start=${start}`
                + (options?.image ? `&searchType=image` : '');
            var resp = await get(url, { encode: _JSON, ...options || {} });
            return options?.raw ? resp.content : {
                totalResults: resp?.content?.searchInformation?.totalResults || 0,
                startIndex: resp?.content?.queries?.request?.[0]?.startIndex || 1,
                items: resp?.content?.items.map(x => ({
                    title: x.title, link: options?.image ? null : x.link,
                    snippet: x.snippet, image: (
                        options?.image ? x.link : x.pagemap?.cse_image?.[0]?.src
                    ) || null,
                })), provider,
            };
        case 'JINA':
            var [key, min, def, max] =
                [options?.apiKey || jinaApiKey, 1, 10, 20];
            assert(key, 'API key is required.');
            var [num, start] = [
                ensureInt(options?.num || def, { min, max }),
                ensureInt(options?.start || min, { min }),
            ];
            var url = `https://s.jina.ai/?q=${encodeURIComponent(query)}`
                + `&page=${encodeURIComponent(start - 1)}`
                + `&num=${encodeURIComponent(num)}`
            var resp = await get(url, {
                encode: options?.aiFriendly ? 'TEXT' : _JSON,
                fetch: {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Accept': options?.aiFriendly ? MIME_TEXT : MIME_JSON,
                        'X-Respond-With': 'no-content',
                        ...options?.aiFriendly ? {} : { 'X-With-Favicons': true },
                    }
                }, ...options || {},
            });
            if (options?.raw) { return resp; }
            if (options?.aiFriendly) { return resp?.content; }
            return {
                totalResults: 100, startIndex: start,
                items: (resp?.content?.data || []).map(x => ({
                    title: x.title, link: x.url,
                    snippet: x.description, image: x.favicon,
                })), provider,
            };
        default:
            throwError(`Invalid search provider: "${options.provider}".`);
    }
};

const distillHtml = async (input, options) => {
    const html = await convert(input, {
        input: TEXT, expected: TEXT, ...options || {},
    });
    const lib = await Promise.all([need('jsdom'), need('@mozilla/readability')]);
    const [JSDOM, Readability] = [lib[0].JSDOM, lib[1].Readability];
    const _doc = new JSDOM(html)?.window?.document;
    assert(_doc, 'Failed to parse HTML.', 500);
    const content = new Readability(_doc).parse();
    assert(content, 'Failed to distill HTML.', 500);
    if (!options?.raw) {
        content.textContent = content.textContent.trim(
        ).split('\n').map(x => x.trim());
        for (let i = content.textContent.length - 1; i >= 0; i--) {
            if ((i < content.textContent.length - 1)
                && content.textContent[i] === ''
                && content.textContent[i + 1] === '') {
                content.textContent.splice(i, 1);
            }
        }
        content.textContent = content.textContent.join('\n');
    }
    return {
        byline: content.byline, data: {}, html: content.html,
        lang: content.lang, provider: content.siteName,
        text: content.textContent, thumbnail: null,
        title: content.title, type: 'WEBPAGE',
    };
};

const assertYoutubeUrl = url => {
    const videoCode = isYoutubeUrl(url);
    assert(videoCode, 'Invalid YouTube URL.', 400);
    return videoCode;
};

const getYoutubeTranscript = async url => {
    const { YoutubeTranscript } = await need('youtube-transcript');
    const videoCode = assertYoutubeUrl(url);
    const transcript = await ignoreErrFunc(
        async () => await YoutubeTranscript.fetchTranscript(videoCode)
    );
    return transcript ? {
        transcript, transcript_text: transcript.map(x => x.text).join('\n'),
    } : null;
};

const getYoutubeMetadata = async url => {
    assertYoutubeUrl(url);
    const content = (await getJson(assembleUrl(
        'https://www.youtube.com/oembed', { url, format: 'json' }
    )))?.content;
    assert(content, 'Failed to get YouTube metadata.', 500);
    return content;
};

const distillYoutube = async url => {
    const [metadata, transcript] = await Promise.all([
        getYoutubeMetadata(url),
        getYoutubeTranscript(url),
    ]);
    const content = { ...metadata, ...transcript };
    return {
        byline: `${content.author_name} (${content.author_url})`,
        data: { transcript: content.transcript }, html: content.html,
        lang: null,
        provider: `${content.provider_name} (${content.provider_url})`,
        text: content.transcript_text, thumbnail: content.thumbnail_url,
        title: content.title, type: 'VIDEO',
    };
};

const distill = async url => {
    let content;
    if (/^http(s)?:\/\/pandas\.pydata\.org\/.*/ig.test(url)) {
        throwError('Issue: https://github.com/mozilla/readability/issues/801');
    } else if (isYoutubeUrl(url)) {
        content = await distillYoutube(url);
    } else {
        content = await distillPage(url);
    }
    return {
        content, summary: [
            '---',
            `title: ${content.title}`,
            `byline: ${content.byline}`,
            `provider: ${content.provider}`,
            `url: ${url}`,
            `type: ${content.type}`,
            '---',
            content.text,
        ].join('\n'),
    };
};

const _getRate = (rates, currency) => {
    const rate = rates[ensureString(currency || 'USD', { case: 'UP' })];
    assertSet(rate, `Unsupported currency: '${currency}'.`, 400);
    return bignumber(rate);
};

const getExchangeRate = async (to, from, amount) => {
    const data = {};
    ((await get(
        'https://api.mixin.one/external/fiats', { encode: 'JSON' }
    ))?.content?.data || []).map(x => data[x.code] = x.rate);
    assert(Object.keys(data).length, 'Error fetching exchange rates.', 500);
    if (!to) { return data; }
    [to, from] = [_getRate(data, to), _getRate(data, from)];
    const rate = divide(to, from);
    amount = multiply(bignumber(amount ?? 1), rate);
    return { rate, amount: amount.toString() };
};


export default get;
export {
    _NEED,
    assertYoutubeUrl,
    checkSearch,
    checkVersion,
    distill,
    distillHtml,
    distillPage,
    distillYoutube,
    get,
    getCurrentIp,
    getCurrentPosition,
    getExchangeRate,
    getJson,
    getParsedHtml,
    getVersionOnNpm,
    getYoutubeMetadata,
    getYoutubeTranscript,
    initSearch,
    isYoutubeUrl,
    search,
};
