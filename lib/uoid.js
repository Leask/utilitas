'use strict';

const getTimestampFromUuid = (uuid) => {
    return uuid ? Math.ceil((utilitas.convertFrom16to10(
        String(uuid).replace(/^.*(.{8})-(.{4})-.(.{3})-.{4}-.{12}.*$/, '$3$2$1')
    ) - 122192928000000000) / 10000) : 0;
};

const create = (options) => {
    options = Object.assign({ file: __filename, id: uuidv1() }, options || {});
    options.type = options.type || utilitas.basename(options.file);
    if ((options.security = ~~options.security) === 1) {
        options.security = 128;
    }
    let id = options.id;
    if (options.security) {
        id += `-${encryption.randomString(options.security - id.length - 1)}`;
    }
    return `${options.type.toUpperCase()}|${id}`;
};

module.exports = {
    create,
    getTimestampFromUuid,
};

const encryption = require('./encryption');
const utilitas = require('./utilitas');
const uuidv1 = require('uuid').v1;
