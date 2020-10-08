'use strict';

const sha256 = (string) => {
    return crypto.createHash('sha256').update(string).digest('hex');
};

const random = (length) => {
    return crypto.randomBytes(length);
};

const randomString = (length = 128, encoding = 'HEX') => {
    let byteLength = Math.ceil(~~length / 2);
    byteLength = byteLength > 0 ? byteLength : 1;
    return random(byteLength).toString(encoding).substr(0, length);
};

module.exports = {
    random,
    randomString,
    sha256,
};

const crypto = require('crypto');
