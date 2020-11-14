'use strict';

const log = (str, opts) => { return utilitas.modLog(str, __filename, opts); };

let sentry = null;

const init = async (options) => {
    options = options || {};
    if (!sentry) {
        sentry = require('@sentry/node');
        sentry.init(options);
        if (!options.silent) { log(`Initialized, dsn: ${options.dsn} .`); }
    }
    return sentry;
};

module.exports = {
    init,
};

const utilitas = require('./utilitas');
