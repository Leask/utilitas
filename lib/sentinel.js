'use strict';

const log = (str, opts) => { return utilitas.modLog(str, __filename, opts); };

let sentry = null;

const init = async (options) => {
    if (options) {
        sentry = require('@sentry/node');
        sentry.init(options);
        if (!options.silent) { log(`Initialized, dsn: ${options.dsn} .`); }
    }
    utilitas.assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

module.exports = {
    init,
};

const utilitas = require('./utilitas');
