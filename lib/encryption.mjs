import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes as random,
} from 'crypto';

import { createReadStream } from 'fs';
import { base64Decode, base64Encode, ensureString, need } from './utilitas.mjs';
import { networkInterfaces } from 'os';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    '@google-cloud/vision',
]

const defaultAlgorithm = 'sha256';
const defaultEncryption = 'aes-256-gcm';
const uniqueString = (any) => hash(ensureString(any || networkInterfaces()));
const md5 = string => hash(string, 'md5');

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

const getApiKeyCredentials = async (options) => {
    // Included in @google-cloud/vision, @google-cloud/speech and @google-cloud/text-to-speech
    const { GoogleAuth, grpc } = await need('google-gax');
    const authClient = new GoogleAuth().fromAPIKey(options?.apiKey);
    return grpc.credentials.combineChannelCredentials(
        grpc.credentials.createSsl(),
        grpc.credentials.createFromGoogleCredential(authClient)
    );
};

// Default 256-bit key: (256 / 8 = 32) bytes * 8 bits/byte = 256 bits
const aesCreateKey = (options) => {
    const key = options?.key
        ? base64Decode(options.key, true)
        : random((options?.length || 256) / 8);
    return { buffer: key, hex: options?.key || base64Encode(key, true) };
};

// The initialization vector(default be 12 bytes)
const aesCreateIv = (options) => {
    const iv = options?.iv ? base64Decode(options.iv, true) : random(16);
    return { buffer: iv, hex: options?.iv || base64Encode(iv, true) };
};

const _aesDecodeAuthTag = (options) => ({
    buffer: base64Decode(options?.authTag, true), hex: options?.authTag,
});

// https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
const aesEncrypt = (any, options) => {
    assert(any, 'Invalid input.', 400);
    any = Buffer.isBuffer(any) ? any : Buffer.from(any);
    const [key, iv] = [aesCreateKey, aesCreateIv].map(x => x(options));
    const cipher = createCipheriv(defaultEncryption, key.buffer, iv.buffer);
    const output = options?.expected || 'base64';
    const encrypted = cipher.update(any, null, output) + cipher.final(output);
    return {
        key: key.hex, iv: iv.hex, encrypted, encryption: defaultEncryption,
        authTag: base64Encode(cipher.getAuthTag(), true),
    };
};

const aesDecrypt = (any, options) => {
    assert(any, 'Invalid input.', 400);
    any = Buffer.isBuffer(any) ? any : base64Decode(any, true);
    const [key, iv, authTag]
        = [aesCreateKey, aesCreateIv, _aesDecodeAuthTag].map(x => x(options));
    const decipher = createDecipheriv(defaultEncryption, key.buffer, iv.buffer);
    decipher.setAuthTag(authTag.buffer);
    return decipher.update(any, null, options?.expected || 'utf8');
};

export {
    _NEED,
    aesCreateIv,
    aesCreateKey,
    aesDecrypt,
    aesEncrypt,
    defaultAlgorithm,
    defaultEncryption,
    digestObject,
    getApiKeyCredentials,
    getSortedQueryString,
    hash as sha256,
    hash,
    hashFile as sha256File,
    hashFile,
    hexToBigInt,
    md5,
    random,
    randomString,
    uniqueString,
};
