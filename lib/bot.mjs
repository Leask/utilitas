import {
    log as _log, ignoreErrFunc, insensitiveCompare, need, trim,
} from './utilitas.mjs';

import { isPrimary, on, report } from './callosum.mjs';
import { BUFFER } from './storage.mjs';

const _NEED = ['telegraf'];
const [PRIVATE_LIMIT, GROUP_LIMIT] = [60 / 60, 60 / 20].map(x => x * 1000);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const lines = (arr, sep = '\n') => arr.join(sep);
const isMarkdownError = e => e?.description?.includes?.("can't parse entities");
const sendMd = (cId, cnt, opt) => send(cId, cnt, { parse_mode, ...opt || {} });

const [ // https://limits.tginfo.me/en
    BOT_SEND, provider, HELLO, GROUP, PRIVATE, CHANNEL, MENTION, CALLBACK_LIMIT,
    API_ROOT, jsonOptions, signals, sessions, HALBOT, COMMAND_REGEXP,
    MESSAGE_LENGTH_LIMIT, COMMAND_LENGTH, COMMAND_LIMIT,
    COMMAND_DESCRIPTION_LENGTH, bot_command, EMOJI_SPEECH, EMOJI_LOOK,
    EMOJI_BOT, logOptions, ON, OFF, EMOJI_THINKING, PARSE_MODE_MD,
    PARSE_MODE_MD_V2,
] = [
        'BOT_SEND', 'TELEGRAM', 'Hello!', 'group', 'private', 'channel',
        'mention', 30, 'https://api.telegram.org/',
        { code: true, extraCodeBlock: 1 }, ['SIGINT', 'SIGTERM'], {}, 'HALBOT',
        /^\/([a-z0-9_]+)(@([a-z0-9_]*))?\ ?(.*)$/sig, 4096, 32, 100, 256,
        'bot_command', '👂', '👀', '🤖', { log: true }, 'on', 'off', '💬',
        'Markdown', 'MarkdownV2',
    ];

const MESSAGE_SOFT_LIMIT = parseInt(MESSAGE_LENGTH_LIMIT * 0.95);
const parse_mode = PARSE_MODE_MD;
const [BINARY_STRINGS] = [{ encode: BUFFER }, [OFF, ON]];

let bot;

const paging = (message, options) => {
    options?.onProgress
        && (message = message?.length ? `${message} █` : EMOJI_THINKING)
    const [pages, page, size] = [[], [], ~~options?.size || MESSAGE_SOFT_LIMIT];
    const submit = () => {
        const content = trim(lines(page));
        content && pages.push(content + (codeMark ? '\n```' : ''));
        page.length = 0;
        if (codeMark) {
            message = codeMark + '\n' + message;
            codeMark = '';
        }
    };
    let codeMark = '';
    while ((message || '').length) {
        let n = message.indexOf('\n');
        n === -1 && (n = message.length);
        const cat = n > size ? '...' : '';
        if ((!cat && lines(page).length + n > size) || (cat && page.length)) {
            submit();
            continue;
        }
        const cut = cat ? (size - cat.length) : (n + 1);
        const line = message.substring(0, cut).trimEnd() + cat;
        page.push(line);
        /^```.{0,20}$/.test(line) && (codeMark = codeMark ? '' : line);
        message = message.slice(cut);
        cat && (message = cat + message.trimStart());
    }
    submit();
    return pages.map((p, i) => (
        pages.length > 1 && !options?.noPageNum
            ? `📃 PAGE ${i + 1} / ${pages.length}:\n\n` : ''
    ) + p);
};

const reply = async (ctx, md, text, extra) => {
    // if (ctx.type === 'inline_query') {
    //     return await ctx.answerInlineQuery([{}, {}]);
    // }
    if (md) {
        try {
            return await (extra?.reply_parameters?.message_id
                ? ctx.replyWithMarkdown(text, { parse_mode, ...extra })
                : ctx.sendMessage(text, { parse_mode, ...extra }));
        } catch (err) { // throwError('Error sending message.');
            isMarkdownError(err) || log(err);
            await ctx.timeout();
        }
    }
    return await ignoreErrFunc(
        async () => await (extra?.reply_parameters?.message_id
            ? ctx.reply(text, extra) : ctx.sendMessage(text, extra)
        ), logOptions
    );
};

const editMessageText = async (ctx, md, lastMsgId, text, extra) => {
    if (md) {
        try {
            return await ctx.telegram.editMessageText(
                ctx.chatId, lastMsgId, '', text, { parse_mode, ...extra }
            );
        } catch (err) { // throwError('Error editing message.');
            isMarkdownError(err) || log(err);
            await ctx.timeout();
        }
    }
    return await ignoreErrFunc(async () => await ctx.telegram.editMessageText(
        ctx.chatId, lastMsgId, '', text, extra
    ), logOptions);
};

const init = async (options) => {
    if (options) {
        assert(
            insensitiveCompare(options?.provider, provider),
            'Invalid bot provider.', 501
        );
        if (isPrimary) {
            // https://github.com/telegraf/telegraf
            const { Telegraf } = await need('telegraf', { raw: true });
            // https://github.com/telegraf/telegraf/issues/1736
            const { useNewReplies } = await need('telegraf/future', { raw: true });
            bot = new Telegraf(options?.botToken, { handlerTimeout: 1000 * 60 * 10 }); // 10 minutes
            bot.use(useNewReplies());
            bot.catch(console.error);
            bot.launch();
            on(BOT_SEND, data => send(...data || []));
            // Graceful stop
            signals.map(signal => process.once(signal, () => end({ signal })));
        } else {
            bot = {
                telegram: { sendMessage: (...args) => report(BOT_SEND, args) }
            };
        }
    }
    assert(bot, 'Bot have not been initialized.', 501);
    return bot;
};

const send = async (chatId, content, options) => {
    try { return (await init()).telegram.sendMessage(chatId, content, options); }
    catch (err) { log(err); }
};

export default init;
export {
    _NEED,
    BINARY_STRINGS,
    COMMAND_DESCRIPTION_LENGTH,
    COMMAND_LENGTH,
    COMMAND_LIMIT,
    EMOJI_BOT,
    EMOJI_SPEECH,
    EMOJI_THINKING,
    GROUP_LIMIT,
    HELLO,
    MESSAGE_LENGTH_LIMIT,
    MESSAGE_SOFT_LIMIT,
    PRIVATE_LIMIT,
    editMessageText,
    end,
    init,
    paging,
    reply,
    send,
    sendMd,
};
