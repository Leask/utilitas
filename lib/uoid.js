'use strict';

const getTimestampFromUuid = (uuid) => {
    return uuid ? Math.ceil((utilitas.convertFrom16to10(
        String(uuid).replace(/^(.{8})-(.{4})-.(.{3})-.{4}-.{12}$/, '$3$2$1')
    ) - 122192928000000000) / 10000) : 0;
};

const create = async (options) => {
    const opts = Object.assign({
        origin: `http://localhost`,
        type: path.parse(__filename).name,
        rawId: uuidv1(),
        version: (await utilitas.which()).version,
        algorithm: encryption.defaultAlgorithm,
    }, options || {});
    opts.origin = `${opts.origin.replace(/\/$/, '').toLowerCase()}`;
    opts.type = opts.type.toLowerCase();
    const base = new URL(`${opts.origin}/${opts.type}/`).href;
    utilitas.assertUrl(base);
    opts.padding = opts.padding
        || (opts.security ? encryption.randomString(128) : '');
    opts.id = `${base}${opts.rawId}${opts.padding ? `-${opts.padding}` : ''}`;
    opts.uriComponent = encodeURIComponent(opts.id);
    opts.base64 = utilitas.base64Encode(opts.id);
    opts.base64Url = base64url(opts.id);
    opts.hex = utilitas.hexEncode(opts.id);
    opts.hash = encryption.hash(opts.id, opts.algorithm);
    return opts;
};

const parse = (id, options) => {
    options = options || {};
    switch (utilitas.trim(options.encoding, { case: 'UP' })) {
        case 'URICOMPONENT':
            id = decodeURIComponent(id);
            break;
        case 'BASE64':
            id = utilitas.base64Decode(id);
            break;
        case 'BASE64URL':
            id = base64url.decode(id);
            break;
        case 'HEX':
            id = utilitas.hexDecode(id);
            break;
    }
    utilitas.assertUrl(id);
    const resp = {
        id,
        origin: id.replace(/^(.*:(\/\/)?[^\/]*)\/([^\/]*)\/([^\/]*).*$/, '$1'),
        rawId: id.replace(/^(.*:(\/\/)?[^\/]*)\/([^\/]*)\/([^\/]*).*$/, '$4'),
        type: id.replace(/^(.*:(\/\/)?[^\/]*)\/([^\/]*)\/([^\/]*).*$/, '$3'),
    };
    resp.createdAt = new Date(getTimestampFromUuid(
        resp.rawId.replace(/^.*(.{8}-.{4}-.{4}-.{4}-.{12}).*$/, '$1')
    ));
    return resp;
};

module.exports = {
    create,
    getTimestampFromUuid,
    parse,
};

const encryption = require('./encryption');
const base64url = require('base64url');
const utilitas = require('./utilitas');
const uuidv1 = require('uuid').v1;
const path = require('path');
