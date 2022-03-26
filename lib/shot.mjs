import { promises as fs } from 'fs';
import { sha256 } from './encryption.mjs';
import * as fileType from 'file-type';
import * as storage from './storage.mjs';
import * as utilitas from './utilitas.mjs';
import path from 'path';

const TMPDIR = process.env.TMPDIR ? path.join(process.env.TMPDIR, 'shot') : null;
const defFetchOpt = { redirect: 'follow', follow: 3, timeout: 1000 * 10 };
const buf2utf = buf => buf.toString('utf8');

const getVersionOnNpm = async (packName) => {
    assert(packName, 'Package name is required.', 400);
    const url = `https://registry.npmjs.org/-/package/${packName}/dist-tags`;
    const rp = (await get(url, { encode: 'JSON' }))?.content;
    assert(rp, 'Error fetching package info.', 500);
    assert(rp !== 'Not Found' && rp.latest, 'Package not found.', 404);
    return utilitas.parseVersion(rp.latest);
};

const checkVersion = async (pack) => {
    const objPack = await utilitas.which(pack);
    const curVersion = objPack.versionNormalized;
    const newVersion = await getVersionOnNpm(objPack.name);
    return {
        name: objPack.name, curVersion, newVersion,
        updateAvailable: newVersion.normalized > curVersion.normalized,
    }
};

const getCurrentIp = async (options) => {
    const resp = await get(
        'https://ifconfig.me/all.json', { encode: 'JSON', ...options || {} }
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
    options.encode = utilitas.ensureString(options.encode, { case: 'UP' });
    const urlHash = utilitas.inBrowser() ? null : sha256(url);
    const tmp = urlHash ? (options.cache?.tmp || TMPDIR) : null;
    const base = tmp ? path.join(tmp, storage.mapFilename(urlHash)) : null;
    const [cacheMeta, cacheCont] = base ? ['meta', 'content'].map(
        x => path.join(base, `${urlHash}.${x}`)
    ) : [];
    const meta = options?.refresh || !base ? null : await storage.readJson(cacheMeta);
    const cache = options?.refresh || !base ? null : await utilitas.ignoreErrFunc(
        async () => { return await fs.readFile(cacheCont); }
    );
    const headers = meta?.responseHeaders && cache ? {
        'cache-control': 'max-age=0',
        'if-modified-since': meta.responseHeaders['last-modified'],
        'if-none-match': meta.responseHeaders['etag'],
    } : {};
    let [timer, r, responseHeaders] = [null, null, {}];
    const fetchOptions = { ...defFetchOpt, headers, ...options.fetch || {} };
    if (options.timeout) {
        const controller = new AbortController();
        fetchOptions.signal = controller.signal;
        timer = setTimeout(() => { controller.abort(); }, options.timeout);
    }
    try { r = await fetch(url, fetchOptions); } catch (e) {
        utilitas.throwError(e.message.includes('aborted') ? 'Timed out.' : e.message, 500);
    }
    timer && clearTimeout(timer);
    (r.status === 304) && (r.arrayBuffer = async () => cache);
    const [htpMime, buffer] = [r.headers.get('content-type'), Buffer.from(await r.arrayBuffer())];
    if (r.headers?.raw) { responseHeaders = r.headers.raw(); }
    else { for (const [k, v] of r.headers.entries()) { responseHeaders[k] = v; } }
    const bufMime = await utilitas.ignoreErrFunc(async () => {
        utilitas.extract(await fileType.fileTypeFromBuffer(buffer), 'mime');
    });
    const mimeType = bufMime || htpMime;
    const length = buffer.length;
    let content;
    switch (options.encode) {
        case 'BUFFER':
            content = buffer;
            break;
        case 'BASE64':
            content = buffer.toString(options.encode);
            break;
        case 'BASE64_DATA_URL':
            content = storage.encodeBase64DataURL(mimeType, buffer);
            break;
        case 'JSON':
            try { content = JSON.parse(buf2utf(buffer)); } catch (e) { }
            break;
        case 'TEXT':
            content = buf2utf(buffer);
            break;
        default:
            assert(!options.encode, 'Invalid encoding.', 400);
            content = buf2utf(buffer);
    }
    base && !cache && length && r.status === 200
        && await utilitas.ignoreErrFunc(async () => {
            return {
                touch: await storage.touchPath(base),
                content: await fs.writeFile(cacheCont, buffer),
                meta: await storage.writeJson(cacheMeta, {
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

export default get;
export {
    checkVersion,
    get,
    getCurrentPosition,
    getCurrentIp,
    getVersionOnNpm,
};
