// @todo: New text of the message, 1-4096 characters after entities parsing

import {
    ensureArray, ignoreErrFunc, insensitiveCompare, insensitiveHas, log as _log,
    need, parseJson, prettyJson,
} from './utilitas.mjs';

import { fakeUuid } from './uoid.mjs';
import { get } from './shot.mjs';
import { isPrimary, on, report } from './callosum.mjs';
import { join } from 'path';
import { parseArgs } from 'node:util';
import { readdirSync } from 'fs';

const _NEED = ['telegraf']; // 👇 https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
const [PRIVATE_LIMIT, GROUP_LIMIT] = [60 / 60, 60 / 20].map(x => x * 1000);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const normalizeKey = (chatId) => `HALBOT_SESSION_${chatId}`;

const [
    BOT_SEND, provider, HELLO, GROUP, PRIVATE, CHANNEL, MENTION, CALLBACK_LIMIT,
    API_ROOT, BUFFER, sampleRateHertz, jsonOptions, signals, sessions, HALBOT,
] = [
        'BOT_SEND', 'TELEGRAM', 'Hello!', 'group', 'private', 'channel',
        'mention', 30, 'https://api.telegram.org/', 'BUFFER',
        { sampleRateHertz: 48000 }, { code: true, extraCodeBlock: 1 },
        ['SIGINT', 'SIGTERM'], {}, 'HALBOT',
    ];

const KNOWN_UPDATE_TYPES = [
    'message', 'callback_query', 'channel_post', 'edited_message',
    'my_chat_member'
];

const questions = [{
    q: ['/THE THREE LAWS'],
    a: ['- A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
        '- A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
        '- A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.'].join('\n'),
}, {
    q: ['/The Ultimate Question of Life, the Universe, and Everything',
        '/The answer to life the universe and everything'],
    a: '42',
}];

let bot;

const getExtra = (ctx, options) => {
    const resp = {
        reply_to_message_id: ctx.chatType === PRIVATE ? undefined : ctx.messageId,
        disable_notification: !!ctx.done.length, ...options || {},
    };
    if (options?.buttons?.length) {
        resp.reply_markup || (resp.reply_markup = {});
        resp.reply_markup.inline_keyboard = options?.buttons.map(button => {
            const id = fakeUuid(button.text);
            ctx.session.callback.push({ id, ...button });
            return [{
                text: button.label,
                callback_data: JSON.stringify({ callback: id }),
            }];
        });
    }
    return resp;
};

const getFile = async (file_id, options) => {
    assert(file_id, 'File ID is required.', 400);
    const file = await (await init()).telegram.getFile(file_id);
    assert(file.file_path, 'Error getting file info.', 500);
    return (await get(
        `${API_ROOT}file/bot${bot.token}/${file.file_path}`, options
    )).content;
};

const sessionGet = async chatId => {
    const key = normalizeKey(chatId);
    sessions[chatId] || (sessions[chatId] = (
        bot._.session.get && await bot._.session.get(key) || {}
    ));
    sessions[chatId].callback || (sessions[chatId].callback = []);
    return sessions[chatId];
};

const sessionSet = async (chatId, session) => {
    const key = normalizeKey(chatId);
    while (sessions[chatId].callback.length > CALLBACK_LIMIT) {
        sessions[chatId].callback.shift();
    }
    return bot._.session.set && await bot._.session.set(key, session);
};

// https://stackoverflow.com/questions/50204633/allow-bot-to-access-telegram-group-messages
const subconscious = [{
    run: true, priority: -8960, name: 'broca', func: async (ctx, next) => {
        ctx.done = [];
        ctx.ok = async (message, options) => {
            const extra = getExtra(ctx, options);
            if (options?.onProgress && !ctx.done.length) {                      // progress, 1st, reply text
                ctx.done.push(await ctx.reply(message, extra));
            } else if (options?.onProgress) {                                   // progress, ongoing, edit text
                ctx.done.push(await ctx.telegram.editMessageText(
                    ctx.chatId, ctx.done[0].message_id, '', message, extra
                ));
            } else if (ctx.done.length) {                                       // final, has progress. edit markdown
                ctx.done.push(await ctx.telegram.editMessageText(
                    ctx.chatId, ctx.done[0].message_id, '', message,
                    { parse_mode: 'Markdown', ...extra }
                ));
            } else {                                                            // final, never progress, reply markdown
                ctx.done.push(await ctx.replyWithMarkdown(message, extra));
            }
            return ctx.done;
        };
        ctx.er = async (m, opts) => {
            log(m);
            return await ctx.ok(m?.message || m, opts);
        };
        ctx.audio = async (source, options) => ctx.done.push(
            await ctx.replyWithAudio({ source }, getExtra(ctx, options))
        );
        ctx.speech = async (text, options) => await ctx.audio(
            await ctx._.speech.tts(text, { output: 'file' }), options
        );
        await next();
        ctx.done.length || log('INFO: No suitable response.');
    },
}, {
    run: true, priority: -8950, name: 'subconscious', func: async (ctx, next) => {
        log(`Updated: ${ctx.update.update_id}`);
        process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
        let msg;
        for (let t of KNOWN_UPDATE_TYPES) {
            if (ctx.update[t]) { msg = ctx.update[ctx.type = t]; break; }
        }
        if (ctx.type === 'callback_query') { msg = msg.message; }
        else if (ctx.type === 'my_chat_member') {
            log(
                'Group member status changed: '
                + msg.new_chat_member.user.id + ' => '
                + msg.new_chat_member.status
            );
            if (msg.new_chat_member.user.id !== ctx.botInfo.id
                || msg.new_chat_member.status === 'left') { return }
            else { ctx.text = HELLO; }
        } else if (!ctx.type) { return log(`Unsupported update type.`); }
        ctx._ = bot._;
        ctx.chatId = msg.chat.id;
        ctx.chatType = msg.chat.type;
        ctx.messageId = msg.message_id;
        ctx.text = ctx.text || msg.text;
        ctx.session = await sessionGet(ctx.chatId);
        ctx.limit = ctx.chatType === PRIVATE ? PRIVATE_LIMIT : GROUP_LIMIT;
        if (ctx.chatType !== PRIVATE && (msg.entities || []).some(
            e => e.type === MENTION && ctx.text.substr(
                ~~e.offset + 1, ~~e.length - 1
            ) === ctx.botInfo.username
        )) {
            if (!~~msg.entities[0].offset) {
                ctx.text = ctx.text.substr(~~msg.entities[0].length + 1);
            }
            ctx.chatType = MENTION;
        }
        if ((ctx.text || msg.voice || ctx.update[ctx.type].data)
            && ctx.messageId) { await next(); }
        await sessionSet(ctx.chatId, ctx.session);
    },
}, {
    run: true, priority: -8940, name: 'laws', func: async (ctx, next) => {
        const qsts = [...questions, {
            q: ['/echo'], a: ['\\`\\`\\`json', '```json', prettyJson({
                update: ctx.update, session: ctx.session
            }, jsonOptions), '```', '\\`\\`\\`'].join('\n'),
        }];
        for (let s of qsts) {
            for (let x of s.q) {
                if (insensitiveCompare(x, ctx.text)) { return ctx.ok(s.a); }
            }
        }
        await next();
    },
}, {
    run: true, priority: -8930, name: 'authenticate', func: async (ctx, next) => {
        if (!insensitiveHas(ctx._.chatType, ctx.chatType)) { return; }          // if chatType is not in whitelist, exit.
        if (!ctx._.private) { return await next(); }                            // if not private, go next.
        if (ctx._.magicWord && insensitiveHas(ctx._.magicWord, ctx.text)) {     // auth by magicWord
            ctx._.private.add(String(ctx.chatId));
            await ctx.ok('😸 You are now allowed to talk to me.');
            ctx.text = HELLO;
            return await next();
        }
        if (insensitiveHas(ctx._.private, ctx.chatId)                           // auth by chatId
            || (ctx?.from && insensitiveHas(ctx._.private, ctx.from.id))) {     // auth by userId
            return await next();
        }
        if (ctx.chatType !== PRIVATE && (                                       // 1 of the group admins is in whitelist
            await ctx._.telegram.getChatAdministrators(ctx.chatId)
        ).map(x => x.user.id).some(a => insensitiveHas(ctx._.private, a))) {
            return await next();
        }
        if (ctx._.homeGroup && insensitiveHas([                                 // auth by homeGroup
            'creator', 'administrator', 'member' // 'left'
        ], (await ignoreErrFunc(async () => await ctx.telegram.getChatMember(
            ctx._.homeGroup, ctx.from.id
        )))?.status)) { return await next(); }
        if (ctx._.auth && await ctx._.auth(ctx)) { return await next(); }       // auth by custom function
        await ctx.ok('😿 Sorry, I am not allowed to talk to strangers.');
    },
}, {
    run: true, priority: -8920, name: 'stt', func: async (ctx, next) => {
        if (!ctx._.speech?.stt
            || ctx.message?.voice?.mime_type !== 'audio/ogg') { return next(); }
        try {
            ctx.overwrite = (await ctx._.speech?.stt(await getFile(
                ctx.message.voice.file_id, { encode: BUFFER }
            ), { config: sampleRateHertz })) || ' ';
        } catch (err) { return await ctx.er(err); }
        await next();
    },
}, {
    run: true, priority: -8910, name: 'callback', func: async (ctx, next) => {
        if (ctx.type !== 'callback_query') { return next(); }
        const data = parseJson(ctx.update[ctx.type].data);
        const cb = ctx.session.callback.filter(x => x.id == data?.callback)[0];
        if (cb?.text) { ctx.overwrite = cb.text; } else {
            return await ctx.er(
                `Command is invalid or expired: ${ctx.update[ctx.type].data}`
            );
        }
        await next();
    },
}, {
    run: true, priority: -8900, name: 'overwrite', func: async (ctx, next) => {
        ctx.text = [ctx.text, ctx.overwrite].filter(x => x).join('\n\n');
        await next();
    },
}, {
    run: true, priority: 8950, name: 'tts', func: async (ctx, next) => {
        if (!ctx._.speech?.tts || !ctx.tts) { return await next(); }
        await ctx.speech(ctx.tts);
        await next();
    }, help: 'When enabled, the bot will speak out the answer.', args: {
        ttson: { type: 'boolean', short: 't', default: true, desc: 'Enable TTS.' },
        ttsoff: { type: 'boolean', short: 'm', default: false, desc: 'Disable TTS.' },
    }, cmds: {
        'xxxx': 'yyyyy'
    },
}];

const train = (bot, module, options) => {
    assert(module?.func, 'Skill function is required.', 500);
    module.name || (module.name = uuidv4());
    ['args', 'cmds', 'help'].map(
        x => module[x] && (bot._[x][module.name] = module[x])
    );
    log(`Training: ${module.name}`, { force: true });
    return bot.use(module.func);
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
            bot = new Telegraf(options?.botToken);
            bot.use(useNewReplies());
            bot._ = {
                ai: options?.ai,                                                // Should be an array of a map of AIs.
                args: { ...options?.args || {} },
                auth: Function.isFunction(options?.auth) && options.auth,
                chatType: new Set(options?.chatType || ['mention', PRIVATE]),   // ignore GROUP, CHANNEL by default
                cmds: { ...options?.cmds || {} },
                hello: options?.hello || HELLO,
                help: { ...options?.help || {} },
                homeGroup: options?.homeGroup,
                info: options?.info,
                magicWord: options?.magicWord && new Set(options.magicWord),
                private: options?.private && new Set(options.private),
                session: { get: options?.session?.get, set: options?.session?.set },
                speech: options?.speech,
            };
            (!options?.session?.get || !options?.session?.set)
                && log(`WARNING: Sessions persistence is not enabled.`);
            const mods = [
                ...subconscious.map(s => ({ ...s, run: !options?.silent })),
                ...ensureArray(options?.skill),
            ];
            for (let skillPath of ensureArray(options?.skillPath)) {
                log(`SKILLS: ${skillPath}`);
                const files = (readdirSync(skillPath) || []).filter(
                    file => /\.mjs$/i.test(file) && !file.startsWith('.')
                );
                for (let f of files) {
                    const m = await import(join(skillPath, f));
                    mods.push({ ...m, name: m.name || f.replace(/^(.*)\.mjs$/i, '$1') });
                }
            }
            mods.sort((x, y) => ~~x.priority - ~~y.priority).map(
                mod => mod.run && train(bot, mod, options)
            );
            assert(mods.length, 'Invalid skill set.', 501);
            bot._._args = {};
            for (let i in bot._.args) {
                for (let j in bot._.args[i]) {
                    bot._._args[j] = bot._.args[i][j];
                }
            }
            // console.log(bot._._args);
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
    end,
    init,
    send,
};
