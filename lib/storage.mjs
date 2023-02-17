import { constants as consts, promises as fs, readSync } from 'fs';
import { ensureString, mergeAtoB, throwError, trim, which } from './utilitas.mjs';
import { hash } from './encryption.mjs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { parse as iniParse, stringify as iniStringify } from 'ini';
import { v4 as uuidv4 } from 'uuid';

const [encoding, mode, dirMode] = ['utf8', '0644', '0755'];
const mapFilename = (name) => join(name.substr(0, 2), name.substr(2, 2));
const readFile = (name, opts) => fs.readFile(name, opts?.encoding || encoding);
const writeFile = (f, data, o) => fs.writeFile(f, data, o?.encoding || encoding);
const writeJson = (f, data, opts) => writeFile(f, stringify(data, opts), opts);
const writeIni = (f, data, o) => writeFile(f, iniStringify(data || {}, o), o);

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

const readIni = async (filename, options) => {
    let data = {};
    try { data = iniParse(await readFile(filename, options), options); }
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

const isTextFile = async (filename, options) => {
    let [fh, result] = [await fs.open(filename, 'r'), true];
    for (let i = 0; i < (~~options?.length || 1000); i++) {
        const buf = Buffer.alloc(1);
        const bytes = readSync(fh.fd, buf, 0, 1, i);
        if (bytes === 0) { break; } else if (
            bytes === 1 && buf.toString().charCodeAt() === 0
        ) { result = false; break; }
    }
    fh.close()
    return result;
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
    const encoding = 'base64';
    return `data:${mime};${encoding},${buffer.toString(encoding)}`;
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

export {
    assertPath,
    encodeBase64DataURL,
    exists,
    getConfig,
    getConfigFilename,
    getTempPath,
    isTextFile,
    legalFilename,
    mapFilename,
    readFile,
    readIni,
    readJson,
    setConfig,
    touchPath,
    writeFile,
    writeIni,
    writeJson,
    writeTempFile,
};
