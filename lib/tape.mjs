import * as bot from './bot.mjs';
import * as event from './event.mjs';
import * as utilitas from './utilitas.mjs';

// https://github.com/winstonjs/winston#logging-levels
// const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
// Handle, report, or silently ignore connection errors and failures
const handleError = (err) => { process.stdout.write(`${err.message}\n`); };
const consoleMap = { log: 'verbose', info: 0, debug: 0, warn: 0, error: 0 };
const TAPE = 'TAPE';
const modLog = (content) => { return utilitas.modLog(content, TAPE); };
const getLogger = async () => { return (await init()).logger; };
const [BOT, RSYSLOG, PAPERTRAIL] = ['BOT', 'RSYSLOG', 'PAPERTRAIL'];

let chatIds, tarLevel, botBuffer, logger, silent, provider;

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
            logger && logger.log(tar, str.replace(/\u001b\[\d+m/g, ''));
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
    switch (provider) { case RSYSLOG: result.disableTls = true; }
    // result.logFormat = (level, message) => { return message; }
    return Object.assign(result, options || {});
};

const sysLogInit = async (options) => {
    options = await getDefaultOptions(provider, options);
    const winston = await import('winston');
    const papertrail = await import('winston-papertrail-mproved');
    const papertrailConnection = new papertrail.PapertrailConnection(options);
    papertrailConnection.on('error', handleError);
    papertrailConnection.on('connect', handleConnect);
    const papertrailTransport = new papertrail.PapertrailTransport(
        papertrailConnection, options
    );
    logger = new winston.createLogger({ transports: [papertrailTransport] });
    return {
        logger,
        dependencies: { winston, papertrail, papertrailConnection, papertrailTransport },
    };
};

const addChatId = (id) => {
    return chatIds && id && !chatIds.includes(id) ? chatIds.push(id) : null;
};

const removeChatId = (id) => {
    return chatIds && id && chatIds.includes(id) ? delete chatIds[id] : false;
};

const botLoggerInit = async (options) => {
    chatIds = utilitas.ensureArray(options?.chatId);
    utilitas.assert(chatIds.length, 'ChatId is required.', 501);
    handleConnect(`Sending logs via bot, chatId: ${chatIds.join(', ')}.`);
    logger = botLogger;
    await event.loop(
        botLoggerSync, ~~options?.interval || 5, ~~options?.tout || 10,
        ~~options?.delay, TAPE, { silent: true }
    );
    return { logger, dependencies: { bot, event } };
};

const botLoggerSync = async () => {
    let f = (botBuffer?.length ? botBuffer.splice(0) : []).map(x => x[1]).join('\n');
    if (!f.length) { return; }
    for (let id of chatIds) {
        try { await bot.send(id, f); } catch (err) { handleError(err); }
    }
};

const botLogger = {
    log: (level, message) => {
        if (tarLevel !== 'verbose' && level === 'verbose') { return; }
        (botBuffer = botBuffer || []).push([level, message]);
    },
    end: () => { chatIds = null; botBuffer = null; event.end(TAPE); },
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    let result;
    if (options) {
        silent = !!options?.silent;
        tarLevel = options?.level;
        provider = utilitas.ensureString(options?.provider, { case: 'UP' });
        switch (provider) {
            case BOT:
                result = await botLoggerInit(options);
                break;
            case RSYSLOG:
            case PAPERTRAIL:
                result = await sysLogInit(options);
                break;
            default:
                utilitas.throwError(
                    `Invalid tape provider: '${options?.provider}'.`, 501
                );
        }
        options.noHook || hookConsole();
    }
    utilitas.assert(logger, 'Logger client has not been initialized.', 501);
    return result;
};

const end = async () => {
    releaseConsole();
    setTimeout(() => { logger?.end?.(); modLog('Terminated.'); }, 1000);
};

export default init;
export {
    addChatId,
    end,
    getLogger,
    init,
    removeChatId,
};
