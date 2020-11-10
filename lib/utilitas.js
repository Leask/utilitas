'use strict';

Object.values = Object.values || ((obj) => {
    return Object.keys(obj).map((key) => {
        return obj[key];
    });
});

const clone = (variable) => {
    let variableNew = variable;           // typeof Object === 'function' || etc
    switch (getType(variable)) {
        case 'Object':                    // Object instance of Object
            variableNew = {};
            for (let i in variable) {
                variableNew[i] = clone(variable[i]);
            }
            break;
        case 'Array':                     // Object instance of Array
            variableNew = [];
            for (let j in variable) {
                variableNew.push(clone(variable[j]));
            }
    }
    return variableNew;
};

const ensureArray = (array) => {
    return array ? (Array.isArray(array) ? array : [array]) : []
};

const rawEnsureString = (str) => {
    return String(str || '');
};

const ensureString = (str, options) => {
    options = options || {};
    str = rawEnsureString(str);
    if (options.case) {
        switch (rawEnsureString(options.case).trim()) {
            case 'UP':
                str = str.toUpperCase();
                break;
            case 'LOW':
                str = str.toLowerCase();
                break;
            default:
                throwError(`Invalid case option: '${options.case}'.`, 500);
        }
    }
    return str;
};

const trim = (str, options) => {
    return ensureString(str, options).trim();
};

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
};

const getRandomIndexInArray = (array) => {
    return getRandomInt((array || []).length);
};

const getRandomItemInArray = (array) => {
    return array[getRandomIndexInArray(array)];
};

const getConfigFromStringOrArray = (config) => {
    return Array.isArray(config) ? getRandomItemInArray(config) : config;
};

const getType = (object) => {
    return typeof object === 'undefined' ? 'Undefined'
        : Object.prototype.toString.call(object).replace(
            /^\[[^\ ]*\ (.*)\]$/, '$1'
        );
};

const is = (object, type) => {
    return getType(object) === type;
};

const isBoolean = (object) => {
    return is(object, 'Boolean');
};

const isBuffer = (object) => {
    return is(object, 'Uint8Array');
};

const isDate = (object, strict) => {
    return is(object, 'Date') ? (
        strict ? object.toTimeString().toLowerCase() !== 'invalid date' : true
    ) : false;
};

const isObject = (object) => {
    return is(object, 'Object');
};

const isError = (object) => {
    return is(object, 'Error');
};

const isFunction = (object) => {
    return is(object, 'Function');
};

const isString = (object) => {
    return is(object, 'String');
};

const isUndefined = (object) => {
    return is(object, 'Undefined');
};

const isSet = (object) => {
    return !isUndefined(object);
};

const verifyUuid = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid
    );
};

// https://github.com/validatorjs/validator.js
const verifyUrl = (url) => {
    const str = String(url || '');
    const reg = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?'
        + ':(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d'
        + '|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a'
        + '-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u0'
        + '0a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-'
        + '\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    return str.length < 2083 && new RegExp(reg, 'i').test(str);
};

const verifyEmail = (email) => {
    return /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(
        email
    );
};

const verifyPhone = (phone) => {
    return /^\+?[0-9]{4,}$/.test(phone);
};

const assembleUrl = (url, componens) => {
    let args = [];
    for (let i in componens || []) {
        ensureArray(componens[i]).map(x => {
            args.push(`${i}=${encodeURIComponent(x)}`);
        });
    }
    return `${url}${args.length ? `?${args.join('&')}` : ''}`;
};

const assembleApiUrl = (host, path, args) => {
    return assembleUrl(`${host}/${path}`, args);
};

const prettyJson = (object) => {
    return JSON.stringify(object, null, 2);
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const asyncTimeout = async (pms, timeout, err) => {
    let timer = null;
    let race = Promise.race([pms, new Promise((_, reject) => {
        timer = setTimeout((
        ) => { reject(new Error(err || 'Timed out.')); }, timeout);
    })]);
    const result = await race;
    try { clearTimeout(timer) } catch (err) { }
    return result;
};

const convertBase = (ipt, from, to) => {
    return parseInt(ipt || 0, from).toString(to);
};

const convertFrom16to10 = (ipt) => {
    return parseInt(convertBase(ipt, 16, 10));
};

const encode = (object, isBuf, encoding) => {
    return (isBuf ? object : Buffer.from(object)).toString(encoding);
};

const decode = (string, toBuf, encoding) => {
    const buf = Buffer.from(string, encoding);
    return toBuf ? buf : buf.toString('utf8');
};

const base64Encode = (object, isBuf) => {
    return encode(object, isBuf, 'base64');
};

const base64Decode = (string, toBuf) => {
    return decode(string, toBuf, 'base64');
};

const hexEncode = (object, isBuf) => {
    return encode(object, isBuf, 'hex');
};

const hexDecode = (string, toBuf) => {
    return decode(string, toBuf, 'hex');
};

const base64Pack = (object) => {
    return base64Encode(JSON.stringify(object));
};

const base64Unpack = (string) => {
    return JSON.parse(base64Decode(string));
};

// https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
const byteToHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};

const getShortestInArray = (arr) => {
    let [idx, len] = [0, -1];
    for (let i in arr) {
        if (len === -1 || len > arr[i].length) {
            idx = i;
            len = arr[i].length;
        }
    }
    return idx;
};

const arrayEqual = (arrA, arrB) => {
    if (!Array.isArray(arrA) || !Array.isArray(arrB)) { return false; }
    arrA.sort();
    arrB.sort();
    return arrA.join(',') === arrB.join(',');
};

const throwError = (message, status, options = {}) => {
    throw Object.assign(new Error(message), { status }, options);
};

const assert = (value, message, status, options) => {
    return value || throwError(message, status, options);
};

const assertEmail = (
    email, message = 'Invalid email.', status = 400, options = {}
) => {
    return assert(verifyEmail(email), message, status, options);
};

const assertUuid = (
    uuid, message = 'Invalid UUID.', status = 400, options = {}
) => {
    return assert(verifyUuid(uuid), message, status, options);
};

const assertUrl = (
    url, message = 'Invalid URL.', status = 400, options = {}
) => {
    return assert(verifyUrl(url), message, status, options);
};

const assertSet = (
    value, message = 'Undefined value.', status = 400, options = {}
) => {
    return assert(isSet(value), message, status, options);
};

const getKeyByValue = (object, value) => {
    for (let i in object || {}) {
        if (value === object[i]) {
            return i;
        }
    }
};

const uniqueArray = (arr) => {
    return [...new Set(ensureArray(arr))];
};

const basename = (filename) => {
    return path.basename(String(filename
        || __filename)).replace(/\.[^\.]*$/, '').trim();
};

const modLog = (content, filename, options) => {
    options = options || [];
    const isErr = isError(content);
    const args = ['['
        + colors.red(basename(filename).toUpperCase())
        + colors.yellow(options.time ? ` ${new Date().toISOString()}` : '')
        + ']' + (isErr ? '' : ` ${content}`)];
    if (isErr) { args.push(content); }
    return console.log.apply(null, args);
};

const which = async (pack) => {
    pack = pack || `${process.env.PWD}/package.json`;
    const data = await storage.readJson(pack);
    data.name = data.name || path.basename(process.env.PWD) || '';
    data.version = data.version || '';
    data.title = `${data.name}${data.version ? (' v' + data.version) : ''}`;
    return data;
};

const mergeAtoB = (objA, objB, options) => {
    options = options || {};
    objA = objA || {};
    objB = objB || {};
    for (let i in objA) {
        if (isUndefined(objA[i])) {
            if (options.mergeUndefined) { delete objB[i]; }
        } else {
            objB[i] = objA[i];
        }
    }
    return objB;
};

const insensitiveCompare = (strA, strB, options) => {
    options = options || {};
    options.case = options.case || 'UP';
    return trim(strA, options) === trim(strB, options);
};

module.exports = {
    arrayEqual,
    assembleApiUrl,
    assembleUrl,
    assert,
    assertEmail,
    assertSet,
    assertUrl,
    assertUuid,
    asyncTimeout,
    base64Decode,
    base64Encode,
    base64Pack,
    base64Unpack,
    basename,
    byteToHexString,
    clone,
    convertBase,
    convertFrom16to10,
    ensureArray,
    ensureString,
    getConfigFromStringOrArray,
    getKeyByValue,
    getRandomIndexInArray,
    getRandomInt,
    getRandomItemInArray,
    getShortestInArray,
    getType,
    hexDecode,
    hexEncode,
    insensitiveCompare,
    is,
    isBoolean,
    isBuffer,
    isDate,
    isError,
    isFunction,
    isObject,
    isSet,
    isString,
    isUndefined,
    mergeAtoB,
    modLog,
    prettyJson,
    throwError,
    timeout,
    trim,
    uniqueArray,
    verifyEmail,
    verifyPhone,
    verifyUrl,
    verifyUuid,
    which,
};

const storage = require('./storage');
const colors = require('colors/safe');
const path = require('path');
