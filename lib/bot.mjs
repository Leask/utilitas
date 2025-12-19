import { insensitiveCompare, log as _log, need } from './utilitas.mjs';
import { isPrimary, on, report } from './callosum.mjs';

const _NEED = ['telegraf'];
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const lines = (arr, sep = '\n') => arr.join(sep);
const sendMd = (cId, cnt, opt) => send(cId, cnt, { parse_mode, ...opt || {} });

const [ // https://limits.tginfo.me/en
    BOT_SEND, provider, signals, MESSAGE_LENGTH_LIMIT, EMOJI_THINKING,
    PARSE_MODE_MD, PARSE_MODE_MD_V2, BOT, EMOJI_WARNING,
] = [
        'BOT_SEND', 'TELEGRAM', ['SIGINT', 'SIGTERM'], parseInt(4096 * 0.93),   // ~= 3800
        '💬', 'Markdown', 'MarkdownV2', '🤖', '⚠️',
    ];

const parse_mode = PARSE_MODE_MD;

let bot;

const send = async (chatId, content, options) => {
    try {
        return (await init()).telegram.sendMessage(chatId, content, options);
    } catch (err) { log(err); }
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
            bot.botInfo = await bot.telegram.getMe();
            log(`Initialized: ${BOT}${bot.botInfo.first_name} @${bot.botInfo.username} #${bot.botInfo.id}`);
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


export default init;
export {
    _NEED,
    BOT,
    EMOJI_THINKING,
    EMOJI_WARNING,
    MESSAGE_LENGTH_LIMIT,
    PARSE_MODE_MD_V2,
    PARSE_MODE_MD,
    end,
    init,
    lines,
    parse_mode,
    send,
    sendMd,
};
