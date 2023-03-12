// @todo: New text of the message, 1-4096 characters after entities parsing

import {
    ensureArray, ignoreErrFunc, insensitiveCompare, insensitiveHas, log as _log,
    need, prettyJson,
} from './utilitas.mjs';

import { get } from './shot.mjs';
import { isPrimary, on } from './callosum.mjs';
import { join } from 'path';
import { readdirSync } from 'fs';

const _NEED = ['telegraf']
const PRIVATE_LIMIT = 60 / 60 * 1000; // https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
const GROUP_LIMIT = 60 / 20 * 1000; // 👆
const API_ROOT = 'https://api.telegram.org/';
const signals = ['SIGINT', 'SIGTERM'];
const [cmpOpt, sessions] = [{ w: true }, {}];
const iCmp = (strA, strB) => insensitiveCompare(strA, strB, cmpOpt);
const iHas = (list, str) => insensitiveHas(list, str, cmpOpt);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async (options) => bot && bot.stop(options?.signal);
const [BOT_SEND, provider, HELLO, GROUP, PRIVATE, CHANNEL, MENTION]
    = ['BOT_SEND', 'TELEGRAM', 'Hello!', 'group', 'private', 'channel', 'mention'];
const getTranslatePrompt = (lang) => // https://github.com/yetone/bob-plugin-openai-translator/blob/main/src/main.js
    'You are a translation engine that can only translate text and cannot interpret it.'
    + ` Translate the following text into ${lang}: `;
const getPolishPrompt = () => // https://github.com/yetone/bob-plugin-openai-polisher/blob/main/src/main.js
    'Revise the following text to make them more clear, concise, and coherent.'
    + ' Please note that you need to list the changes and briefly explain why: ';

let bot;

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

const getFile = async (file_id, options) => {
    assert(file_id, 'File ID is required.', 400);
    const file = await (await init()).telegram.getFile(file_id);
    assert(file.file_path, 'Error getting file info.', 500);
    return (await get(
        `${API_ROOT}file/bot${bot.token}/${file.file_path}`, options
    )).content;
};

// https://stackoverflow.com/questions/50204633/allow-bot-to-access-telegram-group-messages
const subconscious = [{
    run: true, name: 'subconscious', func: async (bot) => {
        bot.use(async (ctx, next) => {
            log(`Updated: ${ctx.update.update_id}`);
            process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
            if (ctx.update.message) { ctx.type = 'message'; }
            else if (ctx.update.edited_message) { ctx.type = 'edited_message'; }
            else if (ctx.update.channel_post) { ctx.type = 'channel_post'; }
            else if (ctx.update.my_chat_member) { ctx.type = 'my_chat_member'; }
            else { log(`Unsupported update type.`); }
            switch (ctx.type) {
                case 'message': case 'edited_message': case 'channel_post':
                    ctx.chatId = ctx.update[ctx.type].chat.id;
                    ctx.chatType = ctx.update[ctx.type].chat.type;
                    ctx.end = !(ctx.text = ctx.update[ctx.type].text) && !ctx.update[ctx.type].voice;
                    ctx.messageId = ctx.update[ctx.type].message_id;
                    if ((ctx.update[ctx.type].entities || []).some(
                        e => e.type === MENTION && ctx.text.substr(
                            ~~e.offset + 1, ~~e.length - 1
                        ) === bot.botInfo.username
                    )) {
                        if (!~~ctx.update[ctx.type].entities[0].offset) {
                            ctx.text = ctx.text.substr(
                                ~~ctx.update[ctx.type].entities[0].length + 1
                            );
                        }
                        ctx.chatType = MENTION;
                    }
                    break;
                case 'my_chat_member':
                    ctx.text = HELLO;
                    break;
                default:
                    ctx.end = true;
            }
            const getExtra = (options) => ({
                reply_to_message_id: ctx.chatType === PRIVATE ? undefined : ctx.messageId,
                disable_notification: !!ctx.done.length,
                ...options || {},
            });
            ctx.done = [];
            ctx.ok = async (message, options) => {
                const extra = getExtra(options);
                if (options?.onProgress && !ctx.done.length) {                  // progress, 1st, reply text
                    ctx.done.push(await ctx.reply(message, extra));
                } else if (options?.onProgress) {                               // progress, ongoing, edit text
                    ctx.done.push(await bot.telegram.editMessageText(
                        ctx.chatId, ctx.done[0].message_id, '', message, extra
                    ));
                } else if (ctx.done.length) {                                   // final, has progress. edit markdown
                    ctx.done.push(await bot.telegram.editMessageText(
                        ctx.chatId, ctx.done[0].message_id, '', message,
                        { parse_mode: 'Markdown', ...extra }
                    ));
                } else {                                                        // final, never progress, reply markdown
                    ctx.done.push(await ctx.replyWithMarkdown(message, extra));
                }
                return ctx.done;
            };
            ctx.audio = async (source, options) => ctx.done.push(
                await ctx.replyWithAudio({ source }, getExtra(options))
            );
            ctx.speech = async (text, options) => await ctx.audio(
                await bot.speech.tts(text, { output: 'file' }), options
            );
            await next();
        });
    },
}, {
    run: true, name: 'laws', func: async (bot) => {
        bot.use(async (ctx, next) => {
            const qsts = [...questions, {
                q: ['/echo'], a: [
                    '\\`\\`\\`json', '```json',
                    prettyJson(ctx.update, { code: true, extraCodeBlock: 1 }),
                    '```', '\\`\\`\\`'
                ].join('\n'),
            }];
            for (let s of qsts) {
                for (let x of s.q) {
                    if (iCmp(x, ctx.text)) {
                        ctx.end = await ctx.ok(s.a);
                        break;
                    }
                }
                if (ctx.end) { break; }
            }
            await next();
        });
    },
}, {
    run: true, name: 'authenticate', func: async (bot) => {
        bot.private && bot.use(async (ctx, next) => {
            if ((ctx.end || (ctx.end = !iHas(bot.chatType, ctx.chatType)))) {
                return await next();
            }
            if (bot.magicWord && iHas(bot.magicWord, ctx.text)) {
                bot.private.add(String(ctx.chatId));
                await ctx.ok('😸 You are now allowed to talk to me.');
                ctx.text = HELLO;
                return await next();
            }
            if (iHas(bot.private, ctx.chatId)
                || (ctx?.from && iHas(bot.private, ctx.from.id))) {
                return await next();
            }
            if (ctx.chatType !== PRIVATE && (
                await bot.telegram.getChatAdministrators(ctx.chatId)
            ).map(x => x.user.id).some(a => iHas(bot.private, a))) {
                return await next();
            }
            if (bot.homeGroup && iHas(['creator', 'administrator', 'member'], ( // 'left'
                await ignoreErrFunc(async () => await bot.telegram.getChatMember(bot.homeGroup, ctx.from.id))
            )?.status)) {
                return await next();
            }
            if (bot.auth && await bot.auth(ctx)) {
                return await next();
            }
            ctx.end = await ctx.ok('😿 Sorry, I am not allowed to talk to strangers.');
            await next();
        });
    },
}, {
    run: true, name: 'stt', func: async (bot) => {
        bot.speech?.stt && bot.use(async (ctx, next) => {
            if (ctx.message?.voice?.mime_type === 'audio/ogg') {
                try {
                    ctx.stt = await bot.speech?.stt(await getFile(
                        ctx.message.voice.file_id, { encode: 'BUFFER' }
                    ), { config: { sampleRateHertz: 48000 } });
                    ctx.text = [ctx.text, ctx.stt].filter(x => x).join('\n\n');
                    ctx.text || (ctx.text = ' ');
                } catch (err) {
                    ctx.end = await ctx.ok(`[ERROR] ${err?.message || err}`);
                    log(err);
                }
            }
            await next();
        });
    },
}, {
    run: true, name: 'ai', func: async (bot) => {
        bot.ai && bot.use(async (ctx, next) => {
            if (ctx.end || !ctx.text) { return await next(); }
            sessions[ctx.chatId] || (sessions[ctx.chatId] = {});
            sessions[ctx.chatId].ai || (sessions[ctx.chatId].ai = new Set());
            const [msgs, tts, onProgress, pms, matchReg]
                = [{}, {}, { onProgress: true }, [], /^\/([^\ ]*)(.*)$/ig];
            let [lastMsg, lastSent, firstBot] = ['', 0, null];
            const packMsg = (options) => {
                const packed = [...ctx.stt ? [`😸 You: ${ctx.stt}`] : []];
                const source = options?.tts ? tts : msgs;
                for (let name of sessions[ctx.chatId].ai.size ? sessions[ctx.chatId].ai : [firstBot]) {
                    packed.push([
                        ...sessions[ctx.chatId].ai.size > 1 || name !== firstBot || ctx.stt ? [`🤖️ ${name}:`] : [],
                        options?.onProgress ? (
                            source[name] ? `${source[name].trim()} |` : '...'
                        ) : (source[name] || ''),
                    ].join('\n\n'));
                }
                return packed.join('\n\n---\n\n');
            };
            const ok = async (options) => {
                const [curTime, curMsg] = [Date.now(), packMsg(options)];
                if (options?.onProgress && (curTime - lastSent < (
                    ctx.chatType === PRIVATE ? PRIVATE_LIMIT : GROUP_LIMIT
                ) || lastMsg === curMsg)) { return; }
                [lastSent, lastMsg] = [curTime, curMsg];
                return await ctx.ok(curMsg, options);
            }
            const curAi = new Set();
            const cmd = ctx.text.split('\n')?.[0]?.replace(matchReg, '$1');
            for (let name in bot.ai) {
                firstBot || (firstBot = name);
                (iCmp(cmd, name) || cmd === '*') && curAi.add(name);
            }
            switch (cmd) {
                case '2en': ctx.text = ctx.text.replace('/2en ', getTranslatePrompt('English')); break;
                case '2zh': ctx.text = ctx.text.replace('/2zh', getTranslatePrompt('Traditional Chinese')); break;
                case '2zht': ctx.text = ctx.text.replace('/2zht', getTranslatePrompt('Traditional Chinese')); break;
                case '2zhs': ctx.text = ctx.text.replace('/2zhs', getTranslatePrompt('Simplified Chinese')); break;
                case '2fr': ctx.text = ctx.text.replace('/2fr', getTranslatePrompt('French')); break;
                case 'p': ctx.text = ctx.text.replace('/p', getPolishPrompt()); break;
            }
            curAi.size && (sessions[ctx.chatId].ai = curAi);
            sessions[ctx.chatId].ai.size
                && (ctx.text = ctx.text.replace(matchReg, '$2').trim() || HELLO);
            await ok(onProgress);
            for (let name of sessions[ctx.chatId].ai.size ? sessions[ctx.chatId].ai : [firstBot]) {
                if (iCmp('/clear', ctx.text)) {
                    bot.ai[name].clear(ctx.chatId);
                    ctx.text = HELLO;
                }
                pms.push((async () => {
                    try {
                        const resp = await bot.ai[name].send(
                            ctx.text, { session: ctx.chatId },
                            tkn => {
                                msgs[name] = `${(msgs[name] || '')}${tkn}`;
                                ok(onProgress);
                            }
                        );
                        msgs[name] = resp.responseRendered;
                        tts[name] = resp.spokenText;
                    } catch (err) {
                        msgs[name] = `[ERROR] ${err?.message || err}`;
                        tts[name] = msgs[name];
                        log(err);
                    }
                })());
            }
            await Promise.all(pms);
            await ok();
            ctx.tts = packMsg({ tts: true });
            await next();
        });
    },
}, {
    run: true, name: 'tts', func: async (bot) => {
        bot.speech?.tts && bot.use(async (ctx, next) => {
            if (ctx.end || !ctx.tts) { return await next(); }
            await ctx.speech(ctx.tts);
            await next();
        });
    },
}, {
    run: true, name: 'closure', func: async (bot) => {
        bot.use(async (ctx, next) => {
            ctx.done?.length || log('Missing response.');
            await next();
        });
    },
}];

const train = async (bot, func, name, options) => {
    log(`Training: ${name = name || uuidv4()}`, { force: true });
    return await func(bot);
};

const load = async (bot, module, options) => {
    assert(module && module.func, 'Skill function is required.', 500);
    return await train(bot, module.func, module.name, options);
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
            bot.auth = Function.isFunction(options?.auth) && options.auth;
            bot.homeGroup = options?.homeGroup;
            bot.magicWord = options?.magicWord && new Set(options.magicWord);
            bot.private = options?.private && new Set(options.private);
            bot.ai = options?.ai; // Should be an array of a map of AIs.
            bot.speech = options?.speech;
            // ignore GROUP, CHANNEL by default
            bot.use(useNewReplies());
            bot.chatType = new Set(options?.chatType || ['mention', PRIVATE]);
            const [mods, pmsTrain] = [[
                ...subconscious.map(s => ({ ...s, run: !options?.silent })),
                ...ensureArray(options?.skill),
            ], []];
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
            mods.map(mod => { mod.run && pmsTrain.push(load(bot, mod, options)) });
            assert(pmsTrain.length, 'Invalid skill set.', 501);
            await Promise.all(pmsTrain);
            bot.launch();
            on(BOT_SEND, (data) => send(...data || []));
            // Graceful stop
            signals.map(signal => process.once(signal, () => bot.stop(signal)));
        } else {
            bot = {
                telegram: {
                    sendMessage: (...args) =>
                        process.send({ action: BOT_SEND, data: args })
                }
            };
        }
    }
    assert(bot, 'Bot have not been initialized.', 501);
    return bot;
};

const send = async (chatId, content, options) =>
    (await init()).telegram.sendMessage(chatId, content);

export default init;
export {
    _NEED,
    end,
    init,
    send,
};
