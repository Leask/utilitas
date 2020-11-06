'use strict';

const getTimestampFromUuid = (uuid) => {
    return uuid ? Math.ceil((utilitas.convertFrom16to10(
        String(uuid).replace(/^.*(.{8})-(.{4})-.(.{3})-.{4}-.{12}.*$/, '$3$2$1')
    ) - 122192928000000000) / 10000) : 0;
};

const create = (options) => {
    options = Object.assign({
        type: path.parse(__filename).name,
        id: uuidv1(),
        security: false,
    }, options || {});
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
const base64url = require('base64url');
const utilitas = require('./utilitas');
const uuidv1 = require('uuid').v1;
const path = require('path');
