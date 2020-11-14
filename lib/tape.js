'use strict';

const consoleMap = { log: 'verbose', info: 0, debug: 0, warn: 0, error: 0 };
const modLog = (content) => { return utilitas.modLog(content, __filename); };
const getLogger = async () => { return (await init()).logger; };
// https://github.com/winstonjs/winston#logging-levels
const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
// Do something after the connection to the Papertrail server is established
const handleConnect = (data) => { return silent || modLog(data); };
// Handle, report, or silently ignore connection errors and failures
const handleError = (err) => { process.stdout.write(`${err.message}\n`); };

let winston, papertrail, papertrailConnection,
    papertrailTransport, logger, silent;

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

const end = () => {
    releaseConsole();
    setImmediate(() => { return logger && logger.close(); })
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    if (options) {
        silent = options.silent;
        winston = require('winston');
        papertrail = require('winston-3-papertrail');
        papertrailConnection = new papertrail.PapertrailConnection(options);
        papertrailConnection.on('error', handleError);
        papertrailConnection.on('connect', handleConnect);
        papertrailTransport = new papertrail.PapertrailTransport(
            papertrailConnection, Object.assign({
                program: (await utilitas.which()).name,
            }, options)
        );
        logger = new winston.createLogger({
            transports: [papertrailTransport]
        });
        options.noHook || hookConsole();
    }
    utilitas.assert(logger, 'Logger client has not been initialized.', 501);
    return {
        winston, papertrail, papertrailConnection, papertrailTransport, logger
    };
};

module.exports = {
    init,
    getLogger,
    end,
};

const utilitas = require('./utilitas');
