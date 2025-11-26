import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes as random,
} from 'crypto';

import { createReadStream } from 'fs';
import { base64Decode, base64Encode, ensureString, hexEncode, need } from './utilitas.mjs';
import { networkInterfaces } from 'os';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    '@google-cloud/vision',
    'google-gax',
];

const defaultAlgorithm = 'sha256';
const defaultEncryption = 'aes-256-gcm';
const uniqueString = (any) => hash(ensureString(any || networkInterfaces()));
const md5 = string => hash(string, 'md5');
const _pkKey = (k, buf) => k && String.isString(k) ? k : base64Encode(buf, 1);
const _upkKey = k => k ? (Buffer.isBuffer(k) ? k : base64Decode(k, 1)) : null;

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

// Default 256-bit key: (256 / 8 = 32) bytes * 8 bits/byte = 256 bits
const aesCreateKey = (options) => {
    const key = _upkKey(options?.key) || random((options?.length || 256) / 8);
    return { buffer: key, base64: _pkKey(options?.key, key) };
};

// The initialization vector(default be 12 bytes)
const aesCreateIv = (options) => {
    const iv = _upkKey(options?.iv) || random(16);
    return { buffer: iv, base64: _pkKey(options?.iv, iv) };
};

const _aesDecodeAuthTag = (options) => {
    const authTag = _upkKey(options?.authTag);
    return { buffer: authTag, base64: _pkKey(options?.authTag, authTag) };
};

// https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
const aesEncrypt = (any, options) => {
    assert(any, 'Invalid input.', 400);
    any = Buffer.isBuffer(any) ? any : Buffer.from(any);
    const [key, iv] = [aesCreateKey, aesCreateIv].map(x => x(options));
    const cipher = createCipheriv(defaultEncryption, key.buffer, iv.buffer);
    const output = ensureString(options?.expected || 'BASE64', { case: 'UP' });
    let encrypted = Buffer.concat([cipher.update(any), cipher.final()]);
    switch (output) {
        case '': case 'BASE64': encrypted = base64Encode(encrypted); break;
        case 'BUFFER': break;
        case 'HEX': encrypted = hexEncode(encrypted); break;
        default: throwError('Unsupported output type.', 400);
    }
    return {
        key: key.base64, iv: iv.base64, encrypted, encryption: defaultEncryption,
        authTag: base64Encode(cipher.getAuthTag(), true),
    };
};

const aesDecrypt = (any, options) => {
    assert(any, 'Invalid input.', 400);
    any = Buffer.isBuffer(any) ? any : base64Decode(any, true);
    const [key, iv, authTag]
        = [aesCreateKey, aesCreateIv, _aesDecodeAuthTag].map(x => x(options));
    const decipher = createDecipheriv(defaultEncryption, key.buffer, iv.buffer);
    const output = ensureString(options?.expected || 'TEXT', { case: 'UP' });
    decipher.setAuthTag(authTag.buffer);
    let decrypted = Buffer.concat([decipher.update(any), decipher.final()]);
    switch (output) {
        case '': case 'TEXT': decrypted = decrypted.toString(); break;
        case 'BASE64': decrypted = base64Encode(decrypted); break;
        case 'BUFFER': break;
        case 'HEX': decrypted = hexEncode(decrypted); break;
        default: throwError('Unsupported output type.', 400);
    }
    return decrypted;
};

const getGoogleApiKeyCredentials = async (options) => {
    // Included in @google-cloud/vision, @google-cloud/speech and @google-cloud/text-to-speech
    const { GoogleAuth, grpc } = await need('google-gax');
    const authClient = new GoogleAuth().fromAPIKey(options?.apiKey);
    return grpc.credentials.combineChannelCredentials(
        grpc.credentials.createSsl(),
        grpc.credentials.createFromGoogleCredential(authClient)
    );
};

const getGoogleAuthByCredentials = async (keyFilename) => {
    const { GoogleAuth } = await need('google-gax');
    return (new GoogleAuth({
        keyFilename, scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })).getClient();
};

const getGoogleAuthTokenByAuth = async (auth) => {
    const resp = await auth.getAccessToken();
    const token = resp?.token || null;
    assert(token, 'Failed to get Google API token.');
    return token;
}

export {
    _NEED,
    aesCreateIv,
    aesCreateKey,
    aesDecrypt,
    aesEncrypt,
    defaultAlgorithm,
    defaultEncryption,
    digestObject,
    getGoogleApiKeyCredentials,
    getGoogleAuthByCredentials,
    getGoogleAuthTokenByAuth,
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
