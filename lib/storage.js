'use strict';

const readJson = async (path) => {
    let data = {};
    try {
        data = JSON.parse(await fs.promises.readFile(path, 'utf8'));
    } catch (e) { }
    return data;
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

module.exports = {
    readJson,
    assertPath,
}

const utilitas = require('./utilitas');
const fs = require('fs');
