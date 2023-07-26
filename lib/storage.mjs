import {
    base64Decode, base64Encode, ensureString, extract, ignoreErrFunc, mergeAtoB,
    need, throwError, trim, voidFunc, which,
} from './utilitas.mjs';

import { basename, extname, join } from 'path';
import { constants as consts, promises as fs, readSync } from 'fs';
import { defaultAlgorithm, hash } from './encryption.mjs';
import { fileTypeFromBuffer } from 'file-type';
import { homedir, tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const _NEED = ['mime-types'];
const mapFilename = (name) => join(name.substr(0, 2), name.substr(2, 2));

const [NULL, BASE64, BUFFER, FILE, encoding, BINARY, mode, dirMode]
    = ['NULL', 'BASE64', 'BUFFER', 'FILE', 'utf8', 'binary', '0644', '0755'];

const [encodeBase64, encodeBinary, encodeNull]
    = [{ encoding: BASE64 }, { encoding: BINARY }, { encoding: NULL }];

const readFile = async (name, options) => await fs.readFile(
    name, options?.encoding === NULL ? null : (options?.encoding || encoding)
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
        encoding: _encoding, suffix: options?.suffix,
    });
};

const convert = async (any, options) => {
    assert(any, options?.errorMessage || 'Invalid input.', 400);
    const [input, expected] = [
        (Buffer.isBuffer(any) || ArrayBuffer.isArrayBuffer(any)) ? BUFFER : options?.input,
        options?.expected || BUFFER
    ].map(x => ensureString(x, { case: 'UP' }));
    let [oriFile, meta] = [input === FILE ? any : null, null];
    oriFile && (meta = await assertPath(any, 'F', 'R'));
    if (input !== expected) {
        switch (`${input}-${expected}`) {
            case `${BASE64}-${BUFFER}`: any = base64Decode(any, true); break;
            case `${BASE64}-${FILE}`: any = base64Decode(any, true);
            case `${BUFFER}-${FILE}`: any = await outputFile(any, options); break;
            case `${BUFFER}-${BASE64}`: any = base64Encode(any, true); break;
            case `${FILE}-${BUFFER}`: any = await readFile(any, encodeNull); break;
            case `${FILE}-${BASE64}`: any = await readFile(any, encodeBase64); break;
            default: throwError('Invalid input or expected format.', 400);
        }
    }
    oriFile && expected !== FILE && options?.cleanup && await tryRm(ori, options);
    return options?.meta ? { meta, content: any } : any;
};

const analyzeFile = async (any, options) => {
    const { meta, content } = await convert(any, { meta: 1, ...options || {} });
    const hash_algorithm = options?.hashAlgorithm || defaultAlgorithm;
    const _hash = hash(content, hash_algorithm);
    const filename = options?.filename || (meta ? basename(any) : null) || hash;
    const lookup = (await ignoreErrFunc(() => need('mime-types')))?.lookup || voidFunc;
    return {
        content, extname: extname(filename).replace(/^\.|\.$/g, ''),
        filename, hash_algorithm, hash: _hash,
        mime: extract(await fileTypeFromBuffer(content), 'mime') || lookup(filename) || 'application/octet-stream',
        size: content.length,
    };
};

const sliceFile = async (any, options) => {
    const [file, sliceSize, slices, hash_algorithm] = [
        await analyzeFile(any, options),
        options?.sliceSize || (1000 * 1000 * 1.44), [],
        options?.hashAlgorithm || defaultAlgorithm,
    ];
    while (sliceSize * slices.length < file.content.length) {
        const index = sliceSize * slices.length;
        slices.push(file.content.slice(index, index + sliceSize));
    }
    delete file.content;
    return {
        ...file, slices: slices.map((x, i) => ({
            index: i, content: x, hash: hash(x, hash_algorithm)
        }))
    };
};

const tryRm = async (path, options) => await ignoreErrFunc(async () => {
    await assertPath(path, 'F', 'W');  // Ensure file exist, writable, not a dir
    await fs.unlink(path);
}, options);

export {
    _NEED,
    analyzeFile,
    assertPath,
    convert,
    encodeBase64DataURL,
    exists,
    getConfig,
    getConfigFilename,
    getTempPath,
    handleError,
    isTextFile,
    legalFilename,
    mapFilename,
    readFile,
    readJson,
    setConfig,
    sliceFile,
    touchPath,
    tryRm,
    writeFile,
    writeJson,
    writeTempFile,
};
