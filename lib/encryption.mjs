import { createHash, randomBytes as random } from 'crypto';
import { createReadStream } from 'fs';
import { ensureString } from './utilitas.mjs';
import { need } from './utilitas.mjs';
import { networkInterfaces } from 'os';

const defaultAlgorithm = 'sha256';
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

export {
    defaultAlgorithm,
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
