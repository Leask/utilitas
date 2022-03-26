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
const _extErr = (err, status, opt = {}) => Object.assign(err, { status }, opt);
const _assert = (await import('assert'))?.default
    || ((value, message) => { if (!value) { throw new Error(message); } });
globalThis.assert = (value, message, status, options) => {
    try { return _assert(value, message); }
    catch (error) { throw _extErr(error, status, options); }
};
for (let i in _assert || {}) { assert[i] = _assert[i]; }

// Buffer
globalThis.Buffer || (globalThis.Buffer = (await import('buffer/index.js')).Buffer);

// Fetch
globalThis.fetch || (globalThis.fetch = (await import('node-fetch')).default);

export default {};
