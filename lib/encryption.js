'use strict';

const getSortedQueryString = (object) => {
    const sorted = {};
    Object.keys(object).sort().map(key => { sorted[key] = object[key]; });
    return qs.stringify(sorted);
};

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hash = (string, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(string).digest('hex');
};

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hashFile = (filename, algorithm = 'sha256') => new Promise((resolve) => {
    const hash = crypto.createHash(algorithm);
    fs.createReadStream(filename)
        .on('data', data => hash.update(data))
        .on('end', () => resolve(hash.digest('hex')));
});

const sha256 = (string) => {
    return hash(string);
};

const sha256File = async (filename) => {
    return await hashFile(filename);
};

const random = (length) => {
    return crypto.randomBytes(length);
};

const randomString = (length = 128, encoding = 'HEX') => {
    let byteLength = Math.ceil(~~length / 2);
    byteLength = byteLength > 0 ? byteLength : 1;
    return random(byteLength).toString(encoding).substr(0, length);
};

const digestObject = (object, algorithm) => {
    return hash(getSortedQueryString(object), algorithm);
};

module.exports = {
    digestObject,
    getSortedQueryString,
    hash,
    hashFile,
    random,
    randomString,
    sha256,
    sha256File,
};

const crypto = require('crypto');
const fs = require('fs');
const qs = require('qs');
