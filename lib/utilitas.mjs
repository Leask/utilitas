import { default as color } from './color.mjs';
import * as storage from './storage.mjs';
import path from 'path';

const fileURLToPath = (await import('url')).fileURLToPath
    || (url => new URL('', url).pathname);
const invalidTime = 'Invalid time.';
const inBrowser = () => { try { return window; } catch (e) { } };
const getDateByUnixTimestamp = (timestamp) => new Date(~~timestamp * 1000);
const getUnixTimestampByDate = (date) => Math.round(date.getTime() / 1000);
const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));
const getRandomIndexInArray = (array) => getRandomInt((array || []).length);
const getRandomItemInArray = (array) => array[getRandomIndexInArray(array)];
const extError = (err, status, opt = {}) => Object.assign(err, { status }, opt);
const newError = (msg, status, opt) => extError(new Error(msg), status, opt);
const throwError = (msg, status, opt) => { throw newError(msg, status, opt); };

const _tryOpts = {
    interval: 1000 * 1, maxTry: 10, log: false, error: 'Operation failed.',
    verify: async (err, res) => { return !err; },
};

const __ = (meta) => {
    assert(meta?.url, 'Invalid `import.meta`.', 500);
    const __filename = fileURLToPath(meta.url);
    const __dirname = path.dirname(__filename);
    return { __filename, __dirname };
};

const { __filename } = __(import.meta);

const clone = (any) => {
    let resp = any;                       // typeof Object === 'function' || etc
    switch (getType(any)) {
        case 'Object':                    // Object instance of Object
            resp = {};
            for (let i in any) { resp[i] = clone(any[i]); }
            break;
        case 'Array':                     // Object instance of Array
            resp = [];
            any.map(x => { resp.push(clone(x)); });
    }
    return resp;
};

const distill = (any, strict) => {
    let [resp, rs] = [any, null];
    switch (getType(any)) {
        case 'Object':
            resp = {};
            for (let i in any) {
                isSet((rs = distill(any[i], strict)), strict) && (resp[i] = rs);
            }
            resp = Object.keys(resp).length ? resp : undefined;
            break;
        case 'Array':
            resp = [];
            any.map(x => {
                isSet((x = distill(x, strict)), strict) && resp.push(x);
            });
            resp = resp.length ? resp : undefined;
    }
    return resp;
};

const mapKeys = (any, map, strict, path) => {
    let [resp, func] = [any, map];
    if (isObject(map)) { func = (key) => { return map[key]; } }
    assertFunction(func);
    switch (getType(any)) {
        case 'Object':
            resp = {};
            for (let i in any) {
                const newKey = func(i, any[i], path || []);
                assert(!strict || newKey, `Error maping key: '${i}'.`, 400);
                resp[newKey || i] = mapKeys(
                    any[i], func, strict, [...path || [], i]
                );
            }
            break;
        case 'Array':
            resp = [];
            any.map((x, i) => {
                resp.push(mapKeys(x, func, strict, [...path || [], i]));
            });
    }
    return resp;
};

const ensureInt = (any, options) => {
    options = options || {};
    let int = parseInt(any);
    int = isNaN(int) ? 0 : int;
    int = isSet(options.min, true) && int < options.min ? options.min : int;
    int = isSet(options.max, true) && int > options.max ? options.max : int;
    return options.pad > 0 ? String(int).padStart(options.pad, '0') : int;
};

const ensureArray = (array) => {
    return isSet(array, true) ? (Array.isArray(array) ? array : [array]) : []
};

const rawEnsureString = (any, options) => {
    if (isObject(any)) { return JSON.stringify(any); }
    else if (isDate(any)) { return any.toISOString(); }
    else if (isError(any)) { return options?.trace ? any.stack : any.message; }
    return String(any ?? '');
};

const ensureString = (str, options) => {
    str = rawEnsureString(str, options);
    if (options?.case) {
        switch (rawEnsureString(options?.case).trim().toUpperCase()) {
            case 'UP':
                str = str.toUpperCase();
                break;
            case 'LOW':
                str = str.toLowerCase();
                break;
            case 'CAP': // capitalize
                str = `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
                break;
            default:
                throwError(`Invalid case option: '${options?.case}'.`, 500);
        }
    }
    options?.trim && (str = str.trim());
    return str;
};

const trim = (str, options) => {
    return ensureString(str, { trim: true, ...options || {} });
};

const ensureDate = (dt, options) => {
    dt && assertDate(dt = new Date(dt), options?.message);
    if (!dt && options?.required) { return throwError(invalidTime, 400); }
    else if (!dt) { return null; }
    else if (options?.asTimestamp) { return dt.getTime(); }
    else if (options?.asUnixtime) { return getUnixTimestampByDate(dt); }
    return dt;
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

const isNull = (object) => {
    return is(object, 'Null');
};

const isSet = (object, strict) => {
    return !isUndefined(object) && (strict ? !isNull(object) : true);
};

const verifyUuid = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid
    );
};

// https://github.com/validatorjs/validator.js
const verifyUrl = (url) => {
    const str = String(url ?? '');
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

const prettyJson = (object, options) => {
    options = options || {};
    const resp = JSON.stringify(object, null, 2);
    if (options.log) { console.log(resp); }
    return resp;
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

const parseJson = (any, fallback = {}) => {
    try { return JSON.parse(any); } catch (e) { return fallback; }
};

const extract = function() {
    let r = null;
    for (let i = 0; i < arguments.length; i++) {
        if (i) { r = r?.[arguments[i]] ?? null; } else { r = arguments[i]; }
    }
    return r;
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

const assertDate = (
    time, message = invalidTime, status = 400, options = {}
) => {
    return assert(isDate(time, true), message, status, options);
};

const assertFunction = (
    func, message = 'Invalid Function.', status = 400, options = {}
) => {
    return assert(isFunction(func), message, status, options);
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
        ?? __filename)).replace(/\.[^\.]*$/, '').trim();
};

const modLog = (content, filename, options) => {
    options = options || [];
    const isErr = isError(content);
    content = isObject(content) ? JSON.stringify(content) : content;
    const strTime = options.time ? ` ${(isDate(
        options.time, true
    ) ? options.time : new Date()).toISOString()}` : '';
    const args = ['['
        + color.red(basename(filename).toUpperCase()) + color.yellow(strTime)
        + ']' + (isErr ? '' : ` ${content}`)];
    if (isErr) { args.push(content); }
    return console.info.apply(null, args);
};

const which = async (pack) => {
    const pwd = process.cwd();
    pack = pack || path.join(pwd, 'package.json');
    const data = isObject(pack) ? pack : await storage.readJson(pack);
    data.name = data.name || path.basename(pwd) || '';
    data.versionNormalized = parseVersion(data.version = data.version || '');
    data.title = `${data.name}${data.version ? (' v' + data.version) : ''}`;
    data.userAgent = `${data.name}${data.version ? `/${data.version}` : ''}`;
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
    options = { case: 'UP', ...options || {} };
    let [cmpA, cmpB] = [strA, strB].map(str => {
        str = trim(str, options);
        options.w && (str = str.replace(/[^\w]*/gi, ''));
        return str;
    });
    return cmpA === cmpB;
};

const makeStringByLength = (string, length) => {
    string = String(string ?? '')[0] ?? '';
    length = parseInt(length) || 0;
    let result = '';
    while (string && length && result.length < length) {
        result += string;
    }
    return result;
};

const rotate = (any, step, opts) => {
    let i = false;
    switch (getType(any)) {
        case 'String': any = ensureString(any, opts).split(''); i = true; break;
        case 'Array': break;
        default: throwError('The object can only be a string or array.', 400);
    }
    step = ~~step - any.length * Math.floor(~~step / any.length);
    any.push.apply(any, any.splice(0, step));
    return i ? any.join('') : any;
};

const toExponential = (x, f) => {
    return Number.parseFloat(x).toExponential(f);
};

const humanReadableBoolean = (any) => {
    return [
        'OK', 'OKEY', 'YES', 'AYE', 'ROGER', 'TRUE', '✓', '1', '10-4', 'RIGHTO',
        'RIGHT', 'GOOD', 'YUP', 'YEP', 'YUPPERS', 'YEPPERS', 'JA', 'SURE', 'DO',
        'GREAT', 'COOL',
    ].includes(ensureString(any, { case: 'UP' }));
};

const parseVersion = (verstr) => {
    verstr = ensureString(verstr, { case: 'UP' });
    const [rules, result, s] = [{
        version: [
            [/^[^\.\d]*([\.\d]+).*$/i, '$1']
        ],
        build: [
            [/^[^\.\d]*[\.\d]+.*\-([0-9a-z]*).*/i, '$1'],
            [/^[^\.\d]*[\.\d]+.*\(([0-9a-z]*)\).*/i, '$1'],
        ],
        channel: [
            'INTERNAL', 'DEV', 'ALPHA', 'TESTING',
            'STAGING', 'BETA', 'PRODUCTION', 'STABLE',
        ],
    }, { normalized: 0 }, 5];
    for (let i in rules) {
        let resp = '';
        for (let j in rules[i]) {
            const [reg, cth] = Array.isArray(rules[i][j])
                ? [rules[i][j][0], rules[i][j][1]]
                : [new RegExp(`^.*(${rules[i][j]}).*$`, 'i'), '$1'];
            if (reg.test(verstr)) { resp = verstr.replace(reg, cth); break; }
        }
        result[i] = resp;
    }
    if (result.version) {
        const ver = result.version.split('.');
        while (ver.length < s) { ver.push(0); }
        while (ver.length) {
            result.normalized += Math.pow(10, (s - ver.length) * 5) * ver.pop();
        }
    }
    return result;
};

const matchVersion = (curVer, tgtVer) => {
    const [cV, tV] = [parseVersion(curVer), parseVersion(tgtVer)];
    return cV.normalized >= tV.normalized;
};

const fullLengthLog = (string, options) => {
    options = options || {};
    string = String(string ?? '');
    const maxLength = ensureInt(options.maxLength) || process.stdout.columns;
    const pad = options.padding ?? '=';
    if (string.length + 4 > maxLength) {
        const full = makeStringByLength(pad, maxLength);
        console.log(`${full} \n${string} \n${full} `);
    } else {
        string = string ? ` ${string} ` : '';
        const lLen = Math.floor((maxLength - string.length) / 2);
        const rLen = maxLength - lLen - string.length;
        console.log(`${makeStringByLength(pad,
            lLen)}${string}${makeStringByLength(pad, rLen)}`);
    }
    return { string, maxLength };
};

const renderCode = (code, options) => {
    let i = 0;
    const strCode = ensureString(code, options);
    const arrCode = strCode.length ? strCode.split('\n') : [];
    const bits = String(arrCode.length).length;
    const s = options?.separator ?? '|';
    return arrCode.map(x => `${String(++i).padStart(bits, '0')}${s}${x}`).join('\n');
};

const range = (from, to, options) => {
    options = options || {};
    options.base = ensureInt(options.base, { min: 0 });
    options.step = ensureInt(options.step, { min: 1 });
    [from, to] = [ensureInt(from), ensureInt(to)];
    const [d, resp] = [from <= to ? 1 : -1, []];
    for (let i = from; d > 0 ? i <= to : i >= to; i += options.step * d) {
        if (options.noBoundary && (i === from || i === to)) { continue; }
        resp.push(options.base + i);
    }
    return resp;
};

const shiftTime = (diff, baseTime) => {
    return new Date((baseTime ?? new Date()).getTime() + diff);
};

const checkInterval = (itv, sed) => {
    return !((Math.round(Date.now() / 1000) + ensureInt(sed)) % ensureInt(itv));
};

const ignoreErrFunc = async (func, options) => {
    try { return await func(); } catch (e) { options?.log && console.error(e); }
};

const tryUntil = async (fnTry, options) => {
    options = { ..._tryOpts, ...options || {} };
    let [curTry, result, err] = [0, null, null];
    do {
        try {
            assert(await options.verify((err = null), (result = await fnTry())), options.error);
        } catch (e) {
            (err = e) && options?.log && console.error(e);
            await timeout(options.interval);
        }
    } while (++curTry < options.maxTry && err)
    err && throwError(err, 500);
    return result;
};

const split = (str, options) => {
    return trim(str, options).split(
        options?.separator ?? /[,|;\ \t\n]+/
    ).map(x => x.trim()).filter(x => x.length);
};

// https://www.unicode.org/Public/13.0.0/ucd/emoji/emoji-data.txt
// https://stackoverflow.com/questions/10992921/how-to-remove-emoji-code-using-javascript
// https://twitter.com/_cxa/status/1384304473493831681?s=20
// /[^\p{L}\p{N}\p{P}\p{Z}{\^\$}]/gu
// /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
const purgeEmoji = (any, replace = '') => {
    return rawEnsureString(any).replace(
        /(?!\d)(?!\*)[\p{Emoji_Modifier}\p{Emoji_Component}\p{Extended_Pictographic}]/ug,
        replace
    );
};

export {
    __,
    arrayEqual,
    assembleApiUrl,
    assembleUrl,
    assertDate,
    assertEmail,
    assertFunction,
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
    checkInterval,
    clone,
    convertBase,
    convertFrom16to10,
    distill,
    ensureArray,
    ensureDate,
    ensureInt,
    ensureString,
    extError,
    extract,
    fileURLToPath,
    fullLengthLog,
    getConfigFromStringOrArray,
    getDateByUnixTimestamp,
    getKeyByValue,
    getRandomIndexInArray,
    getRandomInt,
    getRandomItemInArray,
    getShortestInArray,
    getType,
    getUnixTimestampByDate,
    hexDecode,
    hexEncode,
    humanReadableBoolean,
    ignoreErrFunc,
    inBrowser,
    insensitiveCompare,
    is,
    isBoolean,
    isBuffer,
    isDate,
    isError,
    isFunction,
    isNull,
    isObject,
    isSet,
    isString,
    isUndefined,
    makeStringByLength,
    mapKeys,
    matchVersion,
    mergeAtoB,
    modLog,
    newError,
    parseJson,
    parseVersion,
    prettyJson,
    purgeEmoji,
    range,
    renderCode,
    rotate,
    shiftTime,
    split,
    throwError,
    timeout,
    toExponential,
    trim,
    tryUntil,
    uniqueArray,
    verifyEmail,
    verifyPhone,
    verifyUrl,
    verifyUuid,
    which,
};
