import * as utilitas from './utilitas.mjs';

const log = (str, opts) => { return utilitas.modLog(str, 'sentinel', opts); };

let sentry;

const integrations = (integrations) => {
    return integrations.filter(x => {
        if (x.name === 'OnUnhandledRejection') { x._options.mode = 'strict'; }
        return x;
    });
};

const init = async (options) => {
    if (options) {
        sentry = await import('@sentry/node');
        sentry.init(Object.assign({ integrations }, options));
        if (!options.silent) { log(`Initialized, dsn: ${options.dsn} .`); }
    }
    utilitas.assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

export {
    init,
};
