'use strict';

const encoding = 'utf8';

const readJson = async (filename, options) => {
    options = options || {};
    let data = {};
    try {
        data = JSON.parse(await fs.promises.readFile(
            filename, options.encoding || encoding
        ));
    } catch (e) { }
    return data;
};

const writeJson = async (filename, data, option) => {
    option = option || {};
    const json = JSON.stringify(
        data || {}, option.replacer || null, option.space || 4
    );
    return await fs.promises.writeFile(
        filename, json, option.encoding || encoding
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
    ), `.${(await utilitas.which()).name}.json`);
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
    const { filename, config } = await getConfig(options);
    return await writeJson(
        filename, utilitas.mergeAtoB(data, config), options
    );
};

module.exports = {
    assertPath,
    getConfig,
    getConfigFilename,
    readJson,
    setConfig,
    writeJson,
}

const utilitas = require('./utilitas');
const path = require('path');
const os = require('os');
const fs = require('fs');
