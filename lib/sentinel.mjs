import { log as uLog } from './utilitas.mjs';

const log = (content) => uLog(content, import.meta.url);

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
    assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

export default init;
export {
    init,
};
