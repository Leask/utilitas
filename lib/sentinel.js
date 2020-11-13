'use strict';

const log = (str, opts) => { return utilitas.modLog(str, __filename, opts); };

let sentry = null;

const init = (sentryOpts, options) => {
    options = options || {};
    if (!sentry) {
        sentry = require('@sentry/node');
        sentry.init(sentryOpts);
        Object.assign(result, { sentry });
        if (!options.silent) { log(`Initialized, dsn: ${sentryOpts.dsn} .`); }
    }
    return sentry;
};

module.exports = {
    init,
};

const utilitas = require('./utilitas');
