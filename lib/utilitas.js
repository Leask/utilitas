'use strict';

const clone = (variable) => {
    let variableNew = variable;           // typeof Object === 'function' || etc
    switch (Object.prototype.toString.call(variable)) {
        case '[object Object]':           // Object instance of Object
            variableNew = {};
            for (let i in variable) {
                variableNew[i] = clone(variable[i]);
            }
            break;
        case '[object Array]':            // Object instance of Array
            variableNew = [];
            for (i in variable) {
                variableNew.push(clone(variable[i]));
            }
    }
    return variableNew;
};

const ensureArray = (array) => {
    return array ? (Array.isArray(array) ? array : [array]) : []
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

const prettyJson = (object) => {
    return JSON.stringify(object, null, 2);
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const asyncTimeout = async (pms, timeout, err) => {
    let timer = null;
    let race = Promise.race([pms, new Promise((_, reject) => {
        timer = setTimeout(() => { reject(new Error(err || 'Timed out.')); }, timeout);
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

const base64Encode = (object, isBuf) => {
    return (isBuf ? object : Buffer.from(object)).toString('base64');
};

const base64Decode = (string, toBuf) => {
    const buf = Buffer.from(string, 'base64');
    return toBuf ? buf : buf.toString('utf8');
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

// const bufferToHex = (buffer) => {
//     return buffer.toString('hex');
// };

// const hexToBuffer = (hex) => {
//     return Buffer.from(hex, 'hex');
// };

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

const getKeyByValue = (object, value) => {
    for (let i in object || {}) {
        if (value === object[i]) {
            return i;
        }
    }
};

const basename = (filename) => {
    return path.basename(String(filename
        || __filename)).replace(/\.[^\.]*$/, '').trim();
};

const modLog = (content, filename) => {
    const isErr = isError(content);
    const args = [`[${basename(filename).toUpperCase(
    )}]${isErr ? '' : (' ' + content)}`];
    if (isErr) { args.push(content); }
    return console.log.apply(null, args);
};

const which = (pack) => {
    pack = pack || `${process.env.PWD}/package.json`;
    let data = {};
    try { data = JSON.parse(fs.readFileSync(pack, 'utf8')); } catch (e) { }
    data.name = data.name || path.basename(process.env.PWD) || '';
    data.version = data.version || '';
    data.title = `${data.name}${data.version ? (' v' + data.version) : ''}`;
    return data;
};

const mergeAtoB = (a = {}, b = {}) => {
    for (let i in a) { if (!isUndefined(a[i])) { b[i] = a[i]; } }
    return b;
};

module.exports = {
    arrayEqual,
    assembleUrl,
    assert,
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
    getConfigFromStringOrArray,
    getKeyByValue,
    getRandomIndexInArray,
    getRandomInt,
    getRandomItemInArray,
    getShortestInArray,
    getType,
    is,
    isBoolean,
    isBuffer,
    isDate,
    isError,
    isFunction,
    isObject,
    isString,
    isUndefined,
    mergeAtoB,
    modLog,
    prettyJson,
    throwError,
    timeout,
    verifyEmail,
    verifyPhone,
    verifyUrl,
    verifyUuid,
    which,
};

const path = require('path');
const fs = require('fs');
