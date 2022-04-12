import { createHash, randomBytes as random } from 'crypto';
import { createReadStream } from 'fs';
import { ensureString } from './utilitas.mjs';

const defaultAlgorithm = 'sha256';

const getSortedQueryString = (obj) => {
    const params = new URLSearchParams();
    Object.keys(obj).sort().map(k => params.append(k, ensureString(obj[k])));
    return params.toString(); // @Leask: Will be shorted in string order.
};

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hash = (string, algorithm = defaultAlgorithm) =>
    createHash(algorithm).update(string).digest('hex');

// algorithm = 'sha1', 'md5', 'sha256', 'sha512'...
const hashFile = (filename, algorithm = defaultAlgorithm) => new Promise(
    (resolve) => {
        const hash = createHash(algorithm);
        createReadStream(filename)
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
    hash as sha256,
    hash,
    hashFile,
    hashFile as sha256File,
    hexToBigInt,
    random,
    randomString,
};
