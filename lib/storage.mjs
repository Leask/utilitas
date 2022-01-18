import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import ini from 'ini';
import os from 'os';
import path from 'path';
import utilitas from './utilitas.mjs';

const [encoding, mode] = ['utf8', '0644'];

const handleError = (err, opts) => {
    if (opts?.throw) { throw err; } else if (opts?.log) { console.log(err); }
};

const stringify = (data, opts) => {
    return JSON.stringify(data || {}, opts?.replacer || null, opts?.space || 4);
};

const writeTempFile = async (data, options) => {
    let { filename, encoding: ec, mode: md, prefix, suffix: s } = options || {};
    filename = `${prefix || ''}${filename || uuidv4()}${s ? `.${s}` : ''}`;
    if (String(ec).toUpperCase() === 'JSON') {
        data = stringify(data, options); ec = null;
    }
    const filepath = path.join(os.tmpdir(), filename);
    await fs.promises.writeFile(filepath, data, ec || encoding);
    await fs.promises.chmod(filepath, md || mode);
    return filepath;
};

const readJson = async (filename, options) => {
    let data = {};
    try {
        data = JSON.parse(await fs.promises.readFile(
            filename, options?.encoding || encoding
        ));
    } catch (e) { handleError(e, options); }
    return data;
};

const writeJson = async (filename, data, options) => {
    return await fs.promises.writeFile(
        filename, stringify(data, options), options?.encoding || encoding
    );
};

const readIni = async (filename, options) => {
    let data = {};
    try {
        data = ini.parse(await fs.promises.readFile(
            filename, options?.encoding || encoding
        ), options);
    } catch (e) { handleError(e, options); }
    return data;
};

const writeIni = async (filename, data, options) => {
    const strIni = ini.stringify(data || {}, options);
    return await fs.promises.writeFile(
        filename, strIni, options?.encoding || encoding
    );
};

const assertPath = async (path, type, mode, message, status = 500, options = {}) => {
    let [stat, typeErr, modeErr] = [null, null, null];
    try { stat = await fs.promises.stat(path); } catch (err) {
        utilitas.throwError(message || err.message, status, options);
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
    utilitas.assert(!typeErr, typeErr, status, options);
    try {
        switch (String(mode || '').toUpperCase()) {
            case '*': case '':
                break;
            case 'R':
                fs.promises.access(path, fs.constants.R_OK);
                break;
            case 'W':
                fs.promises.access(path, fs.constants.R_OK | fs.constants.W_OK);
                break;
            default:
                modeErr = message || `Unsupported access mode: '${mode}'.`;
        };
    } catch (err) { modeErr = message || err.message; }
    utilitas.assert(!modeErr, modeErr, status, options);
    return stat;
};

const getConfigFilename = async (options) => {
    options = options || {};
    const file = options.config || path.join(os.homedir(
    ), `.${(await utilitas.which(options.pack)).name}.json`);
    utilitas.assert(file, 'Error getting config filename.', 500);
    return file;
};

const getConfig = async (options) => {
    const filename = await getConfigFilename(options);
    const config = await readJson(filename);
    return { filename, config };
};

const setConfig = async (data, options) => {
    data = data || {};
    utilitas.assert(Object.keys(data).length, 'Empty config.', 400);
    let [filename, config] = [null, {}];
    if (options.overwrite) {
        filename = await getConfigFilename(options);
    } else {
        const { filename: curFile, config: curConf } = await getConfig(options);
        filename = curFile;
        config = curConf;
    }
    await writeJson(filename, utilitas.mergeAtoB(
        data, config, { mergeUndefined: true }
    ), options);
    return { filename, config };
};

const encodeBase64DataURL = (mime, buffer) => {
    utilitas.assert(mime = utilitas.trim(mime), 'MIME type is required.', 400);
    utilitas.assert(utilitas.isBuffer(buffer), 'Data buffer is required.', 400);
    const encoding = 'base64';
    return `data:${mime};${encoding},${buffer.toString(encoding)}`;
};

// https://stackoverflow.com/questions/42210199/remove-illegal-characters-from-a-file-name-but-leave-spaces
const legalFilename = (filename) => {
    utilitas.assert((filename = utilitas.ensureString(filename).replace(
        /(\W+)/gi, '-'
    ).replace(/^-*|-*$/g, '').trim()), 'Invalid filename.', 400);
    return filename;
};

const exists = async (fp) => {
    utilitas.assert((fp = utilitas.ensureString(fp)), 'Path is required.', 400);
    try { return await fs.promises.stat(fp); } catch (_) { return null; }
};

export default {
    assertPath,
    encodeBase64DataURL,
    exists,
    getConfig,
    getConfigFilename,
    legalFilename,
    readIni,
    readJson,
    setConfig,
    writeIni,
    writeJson,
    writeTempFile,
};
