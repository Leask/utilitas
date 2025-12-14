import { insensitiveCompare, log as _log, need, trim } from './utilitas.mjs';
import { isPrimary, on, report } from './callosum.mjs';

const _NEED = ['telegraf'];
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const lines = (arr, sep = '\n') => arr.join(sep);
const sendMd = (cId, cnt, opt) => send(cId, cnt, { parse_mode, ...opt || {} });

const [ // https://limits.tginfo.me/en
    BOT_SEND, provider, signals, MESSAGE_LENGTH_LIMIT, EMOJI_THINKING,
    PARSE_MODE_MD, BOT
] = [
        'BOT_SEND', 'TELEGRAM', ['SIGINT', 'SIGTERM'], parseInt(4096 * 0.95),
        '💬', 'Markdown', '🤖',
    ];

const parse_mode = PARSE_MODE_MD;

let bot;

const paging = (message, options) => {
    options?.onProgress
        && (message = message?.length ? `${message} █` : EMOJI_THINKING)
    const [pages, page, size] = [[], [], ~~options?.size || MESSAGE_LENGTH_LIMIT];
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
        if ((!cat && lines(page).length + n > size)) {
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
    EMOJI_THINKING,
    MESSAGE_LENGTH_LIMIT,
    end,
    init,
    lines,
    paging,
    parse_mode,
    send,
    sendMd,
};
