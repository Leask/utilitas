import { isPrimary } from './callosum.mjs';
import { log as _log } from './utilitas.mjs';

const log = (content) => _log(content, import.meta.url);

let sentry;

const integrations = (integrations) => integrations.filter(x => {
    if (x.name === 'OnUnhandledRejection') { x._options.mode = 'strict'; }
    return x;
});

const init = async (options) => {
    if (options) {
        sentry = await import('@sentry/node');
        sentry.init(Object.assign({ integrations }, options));
        isPrimary && !options.silent && log(`Initialized, dsn: ${options.dsn} .`);
    }
    assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

export default init;
export {
    init,
};
