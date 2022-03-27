// Object
Object.values = Object.values || ((obj) => {
    return Object.keys(obj).map((key) => {
        return obj[key];
    });
});

// RegExp
RegExp.escape = RegExp.escape || ((str) => { //$& means the whole matched string
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions

// Assert
import { default as asst } from 'assert';
const _assert = asst || ((val, msg) => { if (!val) { throw new Error(msg); } });
const _extErr = (err, status, opt = {}) => Object.assign(err, { status }, opt);
globalThis.assert = (value, message, status, options) => {
    try { return _assert(value, message); }
    catch (error) { throw _extErr(error, status, options); }
};
for (let i in _assert || {}) { assert[i] = _assert[i]; }

// Buffer
globalThis.Buffer || (globalThis.Buffer = (await import('buffer/index.js')).Buffer);

// Fetch
globalThis.fetch || (globalThis.fetch = (await import('node-fetch')).default);

// Is
const _is = (type, value) => value.constructor === type;
[Boolean, Error, Function, Number, Object, String].map(type => {
    type[`is${type.name}`] = (value) => _is(type, value);
});
Date.isDate = (value, strict) => {
    return _is(Date, value) ? (
        strict ? value.toTimeString().toLowerCase() !== 'invalid date' : true
    ) : false;
};

export default {};
