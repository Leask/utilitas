import { randomString, hexToBigInt } from './encryption.mjs';
import * as utilitas from './utilitas.mjs';
import * as uuid from 'uuid';

const fileURLToPath = (await import('url')).fileURLToPath
    || ((url) => { return new URL('', url).pathname; });

const __filename = fileURLToPath(import.meta.url);
const uuidRegTxt = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const compactUuid = (uuid) => uuid.replace(/\-/ig, '');
const uuidToBigInt = (uuid) => hexToBigInt(compactUuid(uuid));
const bigIntToUuid = (i) => BigInt(i).toString(16).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

const getTimestampFromUuid = (uuid) => {
    return uuid ? Math.ceil((utilitas.convertFrom16to10(
        String(uuid).replace(/^.*(.{8})-(.{4})-.(.{3})-.{4}-.{12}.*$/, '$3$2$1')
    ) - 122192928000000000) / 10000) : 0;
};

const create = (options) => {
    options = Object.assign({ file: __filename, id: uuid.v1() }, options || {});
    options.type = options.type || utilitas.basename(options.file);
    if ((options.security = ~~options.security) === 1) {
        options.security = 128;
    }
    let id = options.id;
    if (options.security) {
        id += `-${randomString(options.security - id.length - 1)}`;
    }
    return `${options.type.toUpperCase()}|${id}`;
};

const getRfcUrlNamespaceUuid = (url) => {
    utilitas.assertUrl(url);
    return uuid.v5(url, uuid.v5.URL);
};

export default create;
export {
    bigIntToUuid,
    compactUuid,
    create,
    getRfcUrlNamespaceUuid,
    getTimestampFromUuid,
    uuidRegTxt,
    uuidToBigInt,
};
