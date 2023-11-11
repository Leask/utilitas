import {
    ensureArray, ensureInt, ensureString, insensitiveCompare, log as _log,
    renderCode,
} from './utilitas.mjs';

import { default as color } from './color.mjs';
import { end as _end, loop } from './event.mjs';
import { isPrimary, on, report } from './callosum.mjs';
import { MESSAGE_SOFT_LIMIT, sendMd } from './bot.mjs';

const consoleMap = ['log', 'info', 'debug', 'warn', 'error'];
const trace = { trace: true };
const [TAPE, BOT, TAPE_SEND] = ['TAPE', 'BOT', 'TAPE_SEND'];
const [defBufCycle, maxBufCycle] = [10, 100];
const stdout = message => process.stdout.write(`${message}\n`);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const getSndSize = arr => getSendTxt(arr).length;
const getBufSize = () => MESSAGE_SOFT_LIMIT * bufferCycle;
const nextLen = () => botBuffer?.[0]?.[1] || '';
const stringify = any => ensureString(any, trace);
const packLine = text => `\`\`\`Log\n${text || ''}\n\`\`\``;
const AVAILABLE_LENGTH = MESSAGE_SOFT_LIMIT - (packLine('') + '000 | ').length;

let botBuffer, bufferCycle, chatIds, extLog, tarLevel;

const getSendTxt = arr => {
    const text = renderCode(arr.map(x => x[1]).join('\n'));
    return text.length ? packLine(text) : '';
};

const hookConsole = (redirect) => {
    for (let tar of consoleMap) {
        const bakTar = `_${tar}`;
        console[bakTar] = console[tar];
        console[tar] = function() {
            redirect || console[bakTar].apply(console, arguments);
            const str = color.strip(
                [...arguments].map(stringify).join(' ')
            ).split('\n').filter(x => x.length).join('\n').split('');
            while (str.length) {
                const message = str.splice(0, AVAILABLE_LENGTH).join('').trim();
                message.length && extLog?.(tar, message);
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

const addChatId = (id) =>
    chatIds && id && !chatIds.includes(id) ? chatIds.push(id) : null;

const removeChatId = (id) =>
    chatIds && id && chatIds.includes(id) ? delete chatIds[id] : false;

const sync = async () => {
    let [f, n] = [[], ''];
    while ((n = nextLen()).length && getSndSize([...f, n]) <= MESSAGE_SOFT_LIMIT) {
        f.push(botBuffer.shift())
    }
    if (!(f = getSendTxt(f)).length) { return; };
    for (let id of chatIds) {
        try { await sendMd(id, f); } catch (err) { stdout(err.message); }
    }
};

const rawLog = (level, message) => {
    if (tarLevel !== 'verbose' && level === 'log') { return; }
    if (isPrimary) {
        (botBuffer = botBuffer || []).push([level, message]);
        while (getSndSize(botBuffer) > getBufSize()) { botBuffer.shift(); }
    } else { report(TAPE_SEND, [level, message]); }
};

// use options.level = 'verbose' to send console.log logs
const init = async (options) => {
    if (options) {
        assert(
            insensitiveCompare(options?.provider, BOT),
            `Invalid tape provider: '${options?.provider}'.`, 501
        );
        assert(
            (chatIds = ensureArray(options?.chatId)).length,
            'ChatId is required.', 501
        );
        tarLevel = options?.level;
        bufferCycle = ensureInt(
            options?.bufferCycle || defBufCycle, { min: 1, max: maxBufCycle }
        );
        if (isPrimary) {
            !options?.silent && log(
                `Sending logs via bot, chatId: ${chatIds.join(', ')}.`
            );
            await loop(
                sync, ~~options?.interval || 5, ~~options?.tout || 10,
                ~~options?.delay, TAPE, { silent: true }
            );
            on(TAPE_SEND, (data) => rawLog(...data || []));
        }
        extLog = rawLog;
        options.noHook || hookConsole(options.redirect);
    }
    assert(extLog, 'Tape has not been initialized.', 501);
    return extLog;
};

const end = async () => {
    releaseConsole();
    setTimeout(async () => {
        await _end(TAPE);
        botBuffer = undefined;
        bufferCycle = undefined;
        chatIds = undefined;
        extLog = undefined;
        tarLevel = undefined;
        log('Terminated.');
    }, 1000);
};

export default init;
export {
    addChatId,
    end,
    init,
    removeChatId,
};
