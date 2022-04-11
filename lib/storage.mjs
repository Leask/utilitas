import { constants, promises as fs, readSync } from 'fs';
import { join } from 'path';
import { parse as iniParse, stringify as iniStringify } from 'ini';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

import {
    __, ensureString, mergeAtoB, throwError, trim, which
} from './utilitas.mjs';

const [encoding, mode, dirMode] = ['utf8', '0644', '0755'];
const mapFilename = (name) => join(name.substr(0, 2), name.substr(2, 2));
const relative = (url, sub) => join(__(url).__dirname, sub);

const handleError = (err, opts) => {
    if (opts?.throw) { throw err; } else if (opts?.log) { console.log(err); }
};

const stringify = (data, opts) => JSON.stringify(
    data || {}, opts?.replacer || null, opts?.space || 4
);

const readFile = async (filename, options) => await fs.readFile(
    filename, options?.encoding || encoding
);

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

const writeFile = async (name, data, opts) => await fs.writeFile(
    name, data, opts?.encoding || encoding
);

const writeTempFile = async (data, options) => {
    let { filename, encoding: ec, mode: md, prefix, suffix: s } = options || {};
    filename = `${prefix || ''}${filename || uuidv4()}${s ? `.${s}` : ''}`;
    if (String(ec).toUpperCase() === 'JSON') {
        data = stringify(data, options); ec = null;
    }
    const filepath = join(os.tmpdir(), filename);
    await writeFile(filepath, data, { encoding: ec || encoding });
    await fs.chmod(filepath, md || mode);
    return filepath;
};

const writeJson = async (name, data, options) => await writeFile(
    name, stringify(data, options), options
);

const writeIni = async (filename, data, options) => await writeFile(
    filename, iniStringify(data || {}, options), options
);

const assertPath = async (path, type, mode, message, status = 500, options = {}) => {
    let [stat, typeErr, modeErr] = [null, null, null];
    try { stat = await fs.stat(path); } catch (err) {
        throwError(message || err.message, status, options);
    }
    switch (String(type || '').toUpperCase()) {
        case '*': case '':
            break;
        case 'F':
            typeErr = stat.isFile()
                ? null : (message || `Path is not a file: '${path}'.`);
            break;
        case 'D':
            typeErr = stat.isDirectory()
                ? null : (message || `Path is not a directory: '${path}'.`);
            break;
        default:
            typeErr = message || `Unsupported path type: '${type}'.`;
    }
    assert(!typeErr, typeErr, status, options);
    try {
        switch (String(mode || '').toUpperCase()) {
            case '*': case '':
                break;
            case 'R':
                await fs.access(path, constants.R_OK);
                break;
            case 'W':
                await fs.access(path, constants.R_OK | constants.W_OK);
                break;
            default:
                modeErr = message || `Unsupported access mode: '${mode}'.`;
        };
    } catch (err) { modeErr = message || err.message; }
    assert(!modeErr, modeErr, status, options);
    return stat;
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
    const file = options.config || join(os.homedir(
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
    isTextFile,
    legalFilename,
    mapFilename,
    readFile,
    readIni,
    readJson,
    relative,
    setConfig,
    touchPath,
    writeFile,
    writeIni,
    writeJson,
    writeTempFile,
};
