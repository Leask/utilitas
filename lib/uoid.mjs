import { assertUrl, basename, convertFrom16to10 } from './utilitas.mjs';
import { hexToBigInt, randomString } from './encryption.mjs';
import { v1 as uuidv1, v5 as uuidv5 } from 'uuid';

const uuidRegTxt = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const compactUuid = (str) => str.replace(/\-/ig, '');
const uuidToBigInt = (str) => hexToBigInt(compactUuid(str));

const bigIntToUuid = (bigInt) =>
    BigInt(bigInt).toString(16).padStart(32, '0').replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5'
    );

const getTimestampFromUuid = (uuid) => uuid ? Math.ceil((convertFrom16to10(
    String(uuid).replace(/^.*(.{8})-(.{4})-.(.{3})-.{4}-.{12}.*$/, '$3$2$1')
) - 122192928000000000) / 10000) : 0;

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
    assertUrl(url);
    return uuidv5(url, uuidv5.URL);
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
