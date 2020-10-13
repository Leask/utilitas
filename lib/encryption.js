'use strict';

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const sha256 = (string, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(string).digest('hex');
};

const sha256File = (filename, algorithm = 'sha256') => new Promise((rslv) => {
    const hash = crypto.createHash(algorithm);
    fs.createReadStream(filename)
        .on('data', data => hash.update(data))
        .on('end', () => rslv(hash.digest('hex')));
});

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
    sha256File,
};

const crypto = require('crypto');
const fs = require('fs');
