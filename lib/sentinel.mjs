// https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#nextjs-sdk

import { isPrimary } from './callosum.mjs';
import { log as _log, need } from './utilitas.mjs';

const _NEED = ['@sentry/node', '@sentry/profiling-node'];
const log = (content) => _log(content, import.meta.url);

let sentry;

const init = async (options) => {
    if (options) {
        sentry = await need('@sentry/node');
        const integrations = [
            sentry.onUnhandledRejectionIntegration({ mode: 'strict' }),
            ...sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
            ...options?.integrations || [],
        ];
        try {
            // https://docs.sentry.io/platforms/node/profiling/
            const { nodeProfilingIntegration } = await need(
                '@sentry/profiling-node', { raw: true }
            );
            integrations.push(nodeProfilingIntegration());
        } catch (e) { log('Sentry Profiling is not available.'); }
        sentry.init({
            tracesSampleRate: 1.0, profilesSampleRate: 1.0,
            debug: globalThis.debug, ...options || {}, integrations,
        });
        isPrimary && !options.silent && log(`Initialized, dsn: ${options.dsn}.`);
    }
    assert(sentry, 'Sentry has not been initialized.', 501);
    return sentry;
};

export default init;
export {
    _NEED,
    init,
};

// Demo:
// (await utilitas.sentinel.init()).startSpan(
//     {
//         op: "rootSpan",
//         name: "My root span",
//     },
//     async () => {
//         // This function is the span's operation
//     }
// );
