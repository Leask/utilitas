import { ensureString } from './utilitas.mjs';
import crypto from 'crypto';
import fs from 'fs';

const defaultAlgorithm = 'sha256';
const random = (length) => crypto.randomBytes(length);
const sha256 = (string) => hash(string);
const sha256File = async (filename) => await hashFile(filename);

const getSortedQueryString = (obj) => {
    const params = new URLSearchParams();
    Object.keys(obj).sort().map(k => params.append(k, ensureString(obj[k])));
    return params.toString(); // @Leask: Will be shorted in string order.
};

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hash = (string, algorithm = defaultAlgorithm) =>
    crypto.createHash(algorithm).update(string).digest('hex');

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hashFile = (filename, algorithm = defaultAlgorithm) => new Promise(
    (resolve) => {
        const hash = crypto.createHash(algorithm);
        fs.createReadStream(filename)
            .on('data', data => hash.update(data))
            .on('end', () => resolve(hash.digest('hex')));
    }
);

const randomString = (length = 128, encoding = 'HEX') => {
    let byteLength = Math.ceil(~~length / 2);
    byteLength = byteLength > 0 ? byteLength : 1;
    return random(byteLength).toString(encoding).substring(0, length);
};

const digestObject = (object, algorithm) => hash(
    getSortedQueryString(object), algorithm
);

const hexToBigInt = (hex) => {
    hex = `0x${ensureString(hex || '0').replace(/^0x/ig, '')}`;
    return BigInt(hex, 16).toString(10);
};

export {
    defaultAlgorithm,
    digestObject,
    getSortedQueryString,
    hash,
    hashFile,
    hexToBigInt,
    random,
    randomString,
    sha256,
    sha256File,
};
