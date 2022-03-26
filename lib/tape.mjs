import { default as color } from './color.mjs';
import * as bot from './bot.mjs';
import * as event from './event.mjs';
import * as utilitas from './utilitas.mjs';

const consoleMap = ['log', 'info', 'debug', 'warn', 'error'];
const trace = { trace: true };
const [TAPE, BOT, maxLength, defBufCycle, maxBufCycle] = ['TAPE', 'BOT', 4096, 10, 100];
const stdout = (message) => { return process.stdout.write(`${message}\n`); };
const modLog = (c, o) => { utilitas.modLog(c, TAPE, { time: true, ...o || {} }); };
const getSendTxt = (arr) => { return arr.map(x => x[1]).join('\n'); };
const getSndSize = (arr) => { return getSendTxt(arr).length; };
const getBufSize = () => { return maxLength * bufferCycle; };
const nextLen = () => { return botBuffer?.[0]?.[1].length || (maxLength + 1); };
const stringify = any => utilitas.ensureString(any, trace);

let botBuffer, bufferCycle, chatIds, log, tarLevel;

const hookConsole = () => {
    for (let tar of consoleMap) {
        const bakTar = `_${tar}`;
        console[bakTar] = console[tar];
        console[tar] = function() {
            console[bakTar].apply(console, arguments);
            const str = color.strip(
                [...arguments].map(stringify).join(' ')
            ).split('\n').filter(x => x.length).join('\n').split('');
            while (str.length) {
                const message = str.splice(0, maxLength).join('').trim();
                message.length && log?.(tar, message);
            }
        };
    }
};

const releaseConsole = () => {
    for (let tar of consoleMap) {
        const bakTar = `_${tar}`;
        if (!console[bakTar]) { continue; }
        console[tar] = console[bakTar];
        delete console[bakTar];
    }
};

const addChatId = (id) => {
    return chatIds && id && !chatIds.includes(id) ? chatIds.push(id) : null;
};

const removeChatId = (id) => {
    return chatIds && id && chatIds.includes(id) ? delete chatIds[id] : false;
};

const sync = async () => {
    let f = [];
    while (getSndSize(f) + nextLen() <= maxLength) { f.push(botBuffer.shift()) }
    if (!(f = getSendTxt(f)).length) { return; };
    for (let id of chatIds) {
        try { await bot.send(id, f); } catch (err) { stdout(err.message); }
    }
};

const rawLog = (level, message) => {
    if (tarLevel !== 'verbose' && level === 'log') { return; }
    (botBuffer = botBuffer || []).push([level, message]);
    while (getSndSize(botBuffer) > getBufSize()) { botBuffer.shift(); }
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    if (options) {
        assert(
            utilitas.insensitiveCompare(options?.provider, BOT),
            `Invalid tape provider: '${options?.provider}'.`, 501
        );
        assert(
            (chatIds = utilitas.ensureArray(options?.chatId)).length,
            'ChatId is required.', 501
        );
        tarLevel = options?.level;
        bufferCycle = utilitas.ensureInt(
            options?.bufferCycle || defBufCycle, { min: 1, max: maxBufCycle }
        );
        if (!options?.silent) {
            modLog(`Sending logs via bot, chatId: ${chatIds.join(', ')}.`);
        }
        log = rawLog;
        await event.loop(
            sync, ~~options?.interval || 5, ~~options?.tout || 10,
            ~~options?.delay, TAPE, { silent: true }
        );
        options.noHook || hookConsole();
    }
    assert(log, 'Tape has not been initialized.', 501);
    return log;
};

const end = async () => {
    releaseConsole();
    setTimeout(async () => {
        await event.end(TAPE);
        botBuffer = undefined;
        bufferCycle = undefined;
        chatIds = undefined;
        log = undefined;
        tarLevel = undefined;
        modLog('Terminated.');
    }, 1000);
};

export default init;
export {
    addChatId,
    end,
    init,
    removeChatId,
};
