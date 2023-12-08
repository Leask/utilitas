import {
    base64Decode, base64Encode, ensureString, extract, ignoreErrFunc,
    log as _log, mergeAtoB, need, throwError, trim, voidFunc, which,
} from './utilitas.mjs';

import { basename, extname, join } from 'path';
import { constants as consts, createReadStream, promises as fs, readSync } from 'fs';
import { defaultAlgorithm, hash } from './encryption.mjs';
import { deflate as __zip, unzip as __unzip } from 'zlib';
import { fileTypeFromBuffer } from 'file-type';
import { homedir, tmpdir } from 'os';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const _NEED = ['mime-types', '@google-cloud/storage'];
const errorMessage = 'Invalid file.';
const defaultMetadata = { cacheControl: 'public, max-age=31536000' };
const getGcUrlByBucket = bucket => `https://storage.cloud.google.com/${bucket}`;
const getGsById = id => `gs://${id}`.replace(/[\/][^\/]*$/, '');
const getIdByGs = gs => gs.replace(/^gs:\/\/[^/]*\/(.*)$/, '$1');
const mapFilename = name => join(name.substr(0, 2), name.substr(2, 2));
const [_zip, _unzip] = [__zip, __unzip].map(promisify);
const log = content => _log(content, import.meta.url);

const [NULL, BASE64, BUFFER, FILE, STREAM, TEXT, _JSON, encoding, BINARY, mode, dirMode]
    = ['NULL', 'BASE64', 'BUFFER', 'FILE', 'STREAM', 'TEXT', 'JSON', 'utf8', 'binary', '0644', '0755'];

const [encodeBase64, encodeBinary, encodeNull]
    = [{ encoding: BASE64 }, { encoding: BINARY }, { encoding: NULL }];

let [client, bucket, url] = [null, null, null];

const readFile = async (name, options) => await fs.readFile(
    name, ['NULL', 'BUFFER'].includes(
        ensureString(options?.encoding, { case: 'UP' })
    ) ? null : (options?.encoding || encoding)
);

const writeFile = async (filename, data, options) => await fs.writeFile(
    filename, data, options?.encoding || encoding
);

const writeJson = async (filename, data, options) => await writeFile(
    filename, stringify(data, options), options
);

const handleError = (err, opts) => {
    if (opts?.throw) { throw err; } else if (opts?.log) { console.log(err); }
};

const stringify = (data, opts) =>
    JSON.stringify(data || {}, opts?.replacer || null, opts?.space || 4);

const readJson = async (filename, options) => {
    let data = {};
    try { data = JSON.parse(await readFile(filename, options)); }
    catch (e) { handleError(e, options); }
    return data;
};

const getTempPath = (options) => join(
    tmpdir(), options?.sub || '', options?.seed ? hash(options.seed) : ''
);

const writeTempFile = async (data, options) => {
    let { filename, encoding: _encoding, mode: _mode, prefix, suffix, hashName }
        = options || {};
    filename = (prefix || '') + (
        filename ? (hashName ? hash(filename) : filename) : uuidv4()
    ) + (suffix ? `.${suffix}` : '');
    if (String(_encoding).toUpperCase() === 'JSON') {
        data = stringify(data, options); _encoding = null;
    }
    const filepath = getTempPath({ sub: filename });
    await writeFile(filepath, data, { encoding: _encoding || encoding });
    await fs.chmod(filepath, _mode || mode);
    return filepath;
};

const assertPath = async (path, type, mode, msg, code, options) => {
    var [code, b, E, s, err] = [code || 500, 'Path is not', m => err = msg || m];
    try { s = await fs.stat(path); }
    catch (e) { throwError(msg || e.message, code, options); }
    switch (String(type || '').toUpperCase()) {
        case '*': case '': break;
        case 'F': s.isFile() || E(`${b} a file: '${path}'.`); break;
        case 'D': s.isDirectory() || E(`${b} a directory: '${path}'.`); break;
        default: E(`Unsupported path type: '${type}'.`);
    }
    assert(!err, err, code, options);
    try {
        switch (String(mode || '').toUpperCase()) {
            case '*': case '': break;
            case 'R': await fs.access(path, consts.R_OK); break;
            case 'W': await fs.access(path, consts.R_OK | consts.W_OK); break;
            default: E(`Unsupported access mode: '${mode}'.`);
        };
    } catch (e) { E(e.message); }
    assert(!err, err, code, options);
    return s;
};

const isTextFile = async (file, options) => {
    const isBuf = Buffer.isBuffer(file);
    let [f, bytes, res] = [isBuf ? file : await fs.open(file, 'r'), null, true];
    for (let i = 0; i < (~~options?.length || 1000); i++) {
        let buf = Buffer.alloc(1);
        if (isBuf) { buf[0] = f[i]; bytes = i < f.length ? 1 : 0; }
        else { bytes = readSync(f.fd, buf, 0, 1, i); }
        if (bytes === 0) { break; } else if (
            bytes === 1 && buf.toString().charCodeAt() === 0
        ) { res = false; break; }
    }
    isBuf || f?.close()
    return res;
};

const getConfigFilename = async (options) => {
    options = options || {};
    const file = options.config || join(homedir(
    ), `.${(await which(options.pack)).name}.json`);
    assert(file, 'Error getting config filename.', 500);
    return file;
};

const getConfig = async (options) => {
    const filename = await getConfigFilename(options);
    const config = await readJson(filename);
    return { filename, config };
};

const setConfig = async (data, options) => {
    data = data || {};
    assert(Object.keys(data).length, 'Empty config.', 400);
    let [filename, config] = [null, {}];
    if (options?.overwrite) {
        filename = await getConfigFilename(options);
    } else {
        const { filename: curFile, config: curConf } = await getConfig(options);
        filename = curFile;
        config = curConf;
    }
    await writeJson(filename, mergeAtoB(
        data, config, { mergeUndefined: true }
    ), options);
    return { filename, config };
};

const touchPath = async (path, options) => {
    await fs.mkdir(path, { recursive: true });
    await fs.chmod(path, options?.permissions || dirMode);
    return await fs.stat(path);
};

const encodeBase64DataURL = (mime, buffer) => {
    assert((mime = trim(mime)), 'MIME type is required.', 400);
    assert(Buffer.isBuffer(buffer), 'Data buffer is required.', 400);
    return `data:${mime};${BASE64},${buffer.toString(BASE64)}`;
};

// https://stackoverflow.com/questions/42210199/remove-illegal-characters-from-a-file-name-but-leave-spaces
const legalFilename = (filename) => {
    assert((filename = ensureString(filename).replace(
        /(\W+)/gi, '-'
    ).replace(/^-*|-*$/g, '').trim()), 'Invalid filename.', 400);
    return filename;
};

const exists = async (filename) => {
    assert((filename = ensureString(filename)), 'Path is required.', 400);
    try { return await fs.stat(filename); } catch (_) { return null; }
};

const outputFile = async (buffer, options) => {
    const _encoding = options?.encoding || BINARY;
    if (options?.file) {
        await writeFile(options?.file, buffer, _encoding);
        return options?.file;
    }
    return await writeTempFile(buffer, {
        filename: options?.filename,
        encoding: _encoding, suffix: options?.suffix,
    });
};

const zip = async (any, options) => {
    assert(any, 'Invalid input.', 400);
    return await convert(await _zip(
        Buffer.isBuffer(any) ? any : Buffer.from(any), options
    ), options);
};

const unzip = async (any, options) => {
    assert(any, 'Invalid input.', 400);
    return await convert(await _unzip(
        Buffer.isBuffer(any) ? any : base64Decode(any, true), options
    ), options);
};

const convert = async (any, options) => {
    assert(any, options?.errorMessage || 'Invalid input.', 400);
    const result = {}
    const [input, expected] = [
        (Buffer.isBuffer(any) || ArrayBuffer.isArrayBuffer(any))
            ? BUFFER : options?.input, options?.expected || BUFFER
    ].map(x => ensureString(x, { case: 'UP' }));
    let [oriFile, meta, subExp] =
        [input === FILE ? any : null, null, expected];
    switch (expected) {
        case STREAM: subExp = FILE; break;
        case TEXT: case _JSON: subExp = BUFFER;
    }
    oriFile && (meta = await assertPath(any, 'F', 'R'));
    if (input !== subExp) {
        switch (`${input}-${subExp}`) {
            case `${BASE64}-${BUFFER}`: any = base64Decode(any, true); break;
            case `${BASE64}-${FILE}`: any = base64Decode(any, true);
            case `${BUFFER}-${FILE}`: any = await outputFile(any, options); break;
            case `${BUFFER}-${BASE64}`: any = base64Encode(any, true); break;
            case `${FILE}-${BUFFER}`: any = await readFile(any, encodeNull); break;
            case `${FILE}-${BASE64}`: any = await readFile(any, encodeBase64); break;
            default: throwError('Invalid input or expected format.', 400);
        }
    }
    switch (expected) {
        case STREAM: result.content = createReadStream(any); break;
        case TEXT: result.content = any.toString(); break;
        case _JSON: result.content = JSON.parse(any.toString()); break;
        default: result.content = any;
    }
    // use options.cleanup to remove original file
    oriFile && subExp !== FILE && options?.cleanup && await tryRm(ori, options);
    // use options.withCleanupFunc to get cleanup function to remove target file
    options?.withCleanupFunc && (
        result.cleanup = async (options) => {
            expected === STREAM && await ignoreErrFunc(result.content?.destroy);
            subExp === FILE && (
                options?.force || input !== FILE
            ) && await tryRm(any, options);
        }
    );
    // get file with meta data
    options?.meta && (result.meta = meta);
    // return
    return Object.keys(result).length === 1 ? result.content : result;
};

const analyzeFile = async (any, options) => {
    const { meta, content } = await convert(any, { meta: 1, ...options || {} });
    const hashAlgorithm = options?.hashAlgorithm || defaultAlgorithm;
    const _hash = hash(content, hashAlgorithm);
    const filename = options?.filename || (meta ? basename(any) : null) || hash;
    const lookup = (await ignoreErrFunc(() => need('mime-types')))?.lookup || voidFunc;
    return {
        content, extname: extname(filename).replace(/^\.|\.$/g, ''),
        filename, hashAlgorithm, hash: _hash,
        mime: extract(await fileTypeFromBuffer(content), 'mime') || lookup(filename) || 'application/octet-stream',
        size: content.length,
    };
};

const sliceFile = async (any, options) => {
    const [file, sliceSize, slices, hashAlgorithm] = [
        { ...await analyzeFile(any, options), compressed: null },
        options?.sliceSize || (1000 * 1000 * 1.44), [],
        options?.hashAlgorithm || defaultAlgorithm,
    ];
    if (options?.zip) {
        file.content = await zip(file.content, options);
        file.compressed = 'gzip';
    }
    while (sliceSize * slices.length < file.content.length) {
        const index = sliceSize * slices.length;
        slices.push(file.content.slice(index, index + sliceSize));
    }
    delete file.content;
    assert(slices.length, 'Empty slices.', 400);
    return {
        ...file, slices: slices.map((x, i) => ({
            content: x, hash: hash(x, hashAlgorithm)
        }))
    };
};

const mergeFile = async (data, options) => {
    assert(data?.slices?.length, 'Invalid slices.', 400);
    const [hashAlgorithm, content] = [data?.hashAlgorithm || defaultAlgorithm, []];
    for (let i in data?.slices) {
        const bufSlice = await convert(data.slices[i]?.content, {
            ...options || {}, expected: BUFFER
        });
        data.slices[i]?.hash && assert(
            data.slices[i].hash === hash(bufSlice, hashAlgorithm),
            `Invalid hash for slice ${i}.`, 400
        );;
        content.push(bufSlice);
    }
    let file = Buffer.concat(content);
    switch (ensureString(data?.compressed, { case: 'UP' })) {
        case '': break;
        case 'GZIP': file = await unzip(file, options); break;
        default: throwError('Unsupported compression.', 400);
    }
    data?.hash && assert(
        data.hash === hash(file, hashAlgorithm), 'Invalid file hash.', 400
    );
    return await convert(file, { ...options || {}, input: BUFFER });
};

const tryRm = async (path, options) => await ignoreErrFunc(async () => {
    await assertPath(path, 'F', 'W');  // Ensure file exist, writable, not a dir
    await fs.unlink(path);
}, options);

const init = async (options) => {
    if (options) {
        const provider = ensureString(options?.provider, { case: 'UP' });
        switch (provider) {
            case 'GOOGLE':
                assert(
                    options?.credentials,
                    'Google Cloud credentials are required.', 400
                )
                assert(
                    (bucket = options?.bucket),
                    'Google Cloud Storage bucket is required.', 400
                );
                url = options?.url || getGcUrlByBucket(bucket);
                ~~process.env.FORKED === 1 && log(`GOOGLE CLOUD STORAGE: ${url}`);
                const { Storage } = await need(
                    '@google-cloud/storage', { raw: true }
                );
                client = new Storage(options).bucket(bucket);
                break;
            default:
                throwError('Invalid cloud storage provider.', 500);
        }
    }
    assert(client, 'Cloud storage has not been initialized.', 501);
    return { client, bucket, url };
};

const uploadToCloud = async (data, options) => {
    assert(client, 'Cloud storage has not been initialized.', 500);
    const { content, cleanup } = await convert(data, {
        input: options?.input, suffix: options?.suffix, ...options || {},
        expected: FILE, withCleanupFunc: true, errorMessage,
    });
    const raw = await client.upload(content, { // gzip: true will cause error
        gzip: false, destination: options?.destination || join(
            ...options?.prefix ? [options.prefix] : [], basename(content)
        ), metadata: defaultMetadata, ...options || {},
    });
    await cleanup();
    const result = options?.raw ? raw : raw[0].metadata;
    !options?.raw && result && (result.gs = getGsById(result?.id));
    return result;
};

const downloadFileFromCloud = async (path, options) => {
    assert(client, 'Cloud storage has not been initialized.', 500);
    const result = await client.file(path).download(options);
    return options?.raw ? result : await convert(
        result[0], { ...options || {}, input: BUFFER }
    );
};

const downloadFromCloud = async (path, options) => {
    assert(path, 'Path is required.', 400);
    const isFolder = path.endsWith('/');
    const paths = isFolder ? await lsOnCloud(path, { name: true }) : [path];
    const resp = await Promise.all(paths.map(
        x => downloadFileFromCloud(x, options)
    ));
    if (!isFolder) { return resp[0]; }
    const result = {};
    for (let i in paths) { result[paths[i]] = resp[i]; }
    return result;
};

const existsOnCloud = async (destination, options) => {
    assert(client, 'Cloud storage has not been initialized.', 500);
    const result = await client.file(destination).exists();
    return options?.raw ? result : (result[0] ? {} : null);
};

const lsOnCloud = async (prefix, options) => {
    assert(client, 'Cloud storage has not been initialized.', 500);
    let result = await client.getFiles({ prefix, ...options || {} });
    if (options?.raw) { return result; }
    result = (result[0] || []).map(x => x.metadata);
    if (options?.name) { result = result.map(x => x.name); }
    return result;
};

const deleteFileOnCloud = async (path, options) => {
    assert(client, 'Cloud storage has not been initialized.', 500);
    const result = await client.file(path).delete(options);
    return options?.raw ? result : result[0].toJSON();
};

const deleteOnCloud = async (path, options) => {
    assert(path, 'Path is required.', 400);
    const isFolder = path.endsWith('/');
    const paths = isFolder ? await lsOnCloud(path, { name: true }) : [path];
    const resp = await Promise.all(paths.map(
        x => deleteFileOnCloud(x, options)
    ));
    if (!isFolder) { return resp[0]; }
    const result = {};
    for (let i in paths) { result[paths[i]] = resp[i]; }
    return result;
};

export {
    _NEED,
    analyzeFile,
    assertPath,
    convert,
    deleteFileOnCloud,
    deleteOnCloud,
    downloadFileFromCloud,
    downloadFromCloud,
    encodeBase64DataURL,
    exists,
    existsOnCloud,
    getConfig,
    getConfigFilename,
    getGcUrlByBucket,
    getIdByGs,
    getTempPath,
    handleError,
    init,
    isTextFile,
    legalFilename,
    lsOnCloud,
    mapFilename,
    mergeFile,
    readFile,
    readJson,
    setConfig,
    sliceFile,
    touchPath,
    tryRm,
    unzip,
    uploadToCloud,
    writeFile,
    writeJson,
    writeTempFile,
    zip,
};
