import {
    ensureArray, insensitiveCompare, insensitiveHas, log as _log, need,
    prettyJson,
} from './utilitas.mjs';

import { isPrimary, on } from './callosum.mjs';
import { join } from 'path';
import { readdirSync } from 'fs';

const _NEED = ['telegraf']
const signals = ['SIGINT', 'SIGTERM'];
const [BOT_SEND, provider] = ['BOT_SEND', 'TELEGRAM'];
const cmpOpt = { w: true };
const iCmp = (strA, strB) => insensitiveCompare(strA, strB, cmpOpt);
const iHas = (list, str) => insensitiveHas(list, str, cmpOpt);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async (options) => bot && bot.stop(options?.signal);

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

const subconscious = [{
    run: true, name: 'subconscious', func: async (bot) => {
        bot.use(async (ctx, next) => {
            log(`Updated: ${ctx.update.update_id}`);
            process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
            if (ctx.update.message) { ctx.type = 'message'; }
            else if (ctx.update.edited_message) { ctx.type = 'edited_message'; }
            else { log(`Unsupported update type.`); }
            switch (ctx.type) {
                case 'message': case 'edited_message':
                    ctx.chatId = ctx.update[ctx.type].chat.id;
                    ctx.text = ctx.update[ctx.type].text;
                    break;
            }
            await next();
        });
    },
}, {
    run: true, name: 'laws', func: async (bot) => {
        bot.use(async (ctx, next) => {
            [...questions, {
                q: ['/echo'], a: prettyJson(ctx.update, { code: true })
            }].map(s => s.q.map(
                x => iCmp(x, ctx.text) && (ctx.end = ctx.reply(s.a))
            ));
            await next();
        });
    },
}, {
    run: true, name: 'authenticate', func: async (bot) => {
        bot.private && bot.use(async (ctx, next) => {
            if (ctx.end) { return await next(); }
            if (bot.magicWord && iHas(bot.magicWord, ctx.text)) {
                bot.private.add(String(ctx.chatId));
                ctx.reply('😸 You are now allowed to talk to me.');
                ctx.text = 'Hello!';
            }
            if (!iHas(bot.private, ctx.chatId)) {
                ctx.end = ctx.reply('😿 Sorry, I am not allowed to talk to strangers.');
            }
            await next();
        });
    },
}, {
    run: true, name: 'ai', func: async (bot) => {
        bot.ai && bot.use(async (ctx, next) => {
            if (ctx.end || !ctx.text) { return await next(); }
            for (let name in bot.ai) {
                Array.isArray(bot.ai) && (name = null);
                (async () => {
                    let resp;
                    try {
                        resp = (await bot.ai[name].send(
                            ctx.text, { session: ctx.chatId }
                        )).responseRendered;
                    } catch (err) { resp = `[ERROR] ${err.message}`; log(err); }
                    ctx.reply(`${name ? `🤖️ ${name}:\n\n` : ''}${resp}\n\n---`);
                })();
            }
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
            bot = new Telegraf(options?.botToken);
            bot.private = options?.private && new Set(options.private);
            bot.magicWord = options?.magicWord && new Set(options.magicWord);
            bot.ai = options?.ai; // Should be an array of a map of AIs.
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
