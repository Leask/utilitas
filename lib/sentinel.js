'use strict';

const log = (str, opts) => { return utilitas.modLog(str, 'sentinel', opts); };

let sentry = null;

const integrations = (integrations) => {
    return integrations.filter(x => {
        if (x.name === 'OnUnhandledRejection') { x._options.mode = 'strict'; }
        return x;
    });
};

const init = async (options) => {
    if (options) {
        sentry = require('@sentry/node');
        sentry.init(Object.assign({ integrations }, options));
        if (!options.silent) { log(`Initialized, dsn: ${options.dsn} .`); }
    }
    utilitas.assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

module.exports = {
    init,
};

const utilitas = require('./utilitas');
