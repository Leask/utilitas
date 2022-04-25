import { assertUrl, basename, rotate } from './utilitas.mjs';
import { hash, hexToBigInt, randomString } from './encryption.mjs';
import { v1 as uuidv1, v5 as uuidv5 } from 'uuid';
import manifest from './manifest.mjs';

// https://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
const uuidRegTxt = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const compactUuid = str => str.replace(/\-/ig, '');
const uuidToBigInt = str => hexToBigInt(compactUuid(str));
const bigIntToUuid = bI => expandUuid(BigInt(bI).toString(16).padStart(32, '0'));
const fakeUuid = any => expandUuid(hash(any ?? randomString(), 'md5'));

const expandUuid = str => str.replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5'
);

const getTimestampFromUuid = (uuid) => uuid ? Number((BigInt(
    String(uuid).replace(/^.*(.{8})-(.{4})-.(.{3})-.{4}-.{12}.*$/, '0x$3$2$1')
) - 122192928000000000n) / 10000n) : 0;

const create = (options) => {
    options = Object.assign({ file: import.meta.url, id: uuidv1() }, options || {});
    options.type = options.type || basename(options.file);
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
    assertUrl(url = url || manifest.homepage);
    return uuidv5(url, uuidv5.URL);
};

const rotateUuid = (any, step, options) => {
    any = rotate(any, step, { case: 'UP', ...options || {} });
    assert(any, 'Invalid reference.', 400);
    return uuidv5(any, getRfcUrlNamespaceUuid(options?.url));
};

export default create;
export {
    bigIntToUuid,
    compactUuid,
    create,
    expandUuid,
    fakeUuid,
    getRfcUrlNamespaceUuid,
    getTimestampFromUuid,
    rotateUuid,
    uuidRegTxt,
    uuidToBigInt,
};
