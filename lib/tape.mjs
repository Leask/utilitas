import * as utilitas from './utilitas.mjs';

// https://github.com/winstonjs/winston#logging-levels
// const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
// Handle, report, or silently ignore connection errors and failures
const handleError = (err) => { process.stdout.write(`${err.message}\n`); };
const consoleMap = { log: 'verbose', info: 0, debug: 0, warn: 0, error: 0 };
const modLog = (content) => { return utilitas.modLog(content, 'tape'); };
const getLogger = async () => { return (await init()).logger; };
const [providerDefault, providerPapertrail] = ['RSYSLOG', 'PAPERTRAIL'];
// why keeping providerPapertrail ?

let winston, papertrail, papertrailConnection,
    papertrailTransport, logger, silent, provider;

// Do something after the connection to the Papertrail server is established
const handleConnect = (data) => {
    return silent || modLog(data.replace('Papertrail', provider.toLowerCase()));
};

const hookConsole = () => {
    for (let act in consoleMap) {
        const tar = consoleMap[act] || act;
        const bakAct = `_${act}`;
        console[bakAct] = console[act];
        console[act] = function() {
            const str = [...arguments].map(utilitas.ensureString).join(' ');
            // process.stdout.write(`SEND ${tar}: ${str}\n`);
            logger && logger.log(tar, str);
            console[bakAct].apply(console, arguments);
        };
    }
};

const releaseConsole = () => {
    for (let act in consoleMap) {
        const bakAct = `_${act}`;
        if (!console[bakAct]) { continue; }
        console[act] = console[bakAct];
        delete console[bakAct];
    }
};

const getDefaultOptions = async (provider, options) => {
    const result = { program: (await utilitas.which()).name };
    switch (provider) {
        case providerDefault:
            result.disableTls = true;
            result.logFormat = (level, message) => {
                return message.replace(/\u001b\[\d+m/g, '');
            }
    }
    return Object.assign(result, options || {});
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    if (options) {
        silent = !!options.silent;
        provider = utilitas.ensureString(
            options.provider, { case: 'UP' }
        ) || providerDefault;
        options = await getDefaultOptions(provider, options);
        winston = await import('winston');
        papertrail = await import('winston-papertrail-mproved');
        papertrailConnection = new papertrail.PapertrailConnection(options);
        papertrailConnection.on('error', handleError);
        papertrailConnection.on('connect', handleConnect);
        papertrailTransport = new papertrail.PapertrailTransport(
            papertrailConnection, options
        );
        logger = new winston.createLogger({
            transports: [papertrailTransport],
        });
        options.noHook || hookConsole();
    }
    utilitas.assert(logger, 'Logger client has not been initialized.', 501);
    return {
        winston, papertrail, papertrailConnection, papertrailTransport, logger
    };
};

const end = async () => {
    releaseConsole();
    setTimeout(() => {
        logger && logger.end();
        modLog('Terminated.');
    }, 1000);
};

export {
    end,
    getLogger,
    init,
};
