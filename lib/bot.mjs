import {
    ensureArray, insensitiveCompare, log as _log, need
} from './utilitas.mjs';

import { isPrimary, on } from './callosum.mjs';
import { join } from 'path';
import { readdirSync } from 'fs';

const _NEED = ['telegraf']
const signals = ['SIGINT', 'SIGTERM'];
const [BOT_SEND, provider] = ['BOT_SEND', 'TELEGRAM'];
const iCmp = (strA, strB) => ~~insensitiveCompare(strA, strB, { w: true });
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
        'The answer to life the universe and everything'],
    a: '42',
}];

const handleText = async (ctx, next) => {
    let key;
    if (ctx.update.message) { key = 'message'; }
    else if (ctx.update.edited_message) { key = 'edited_message'; }
    questions.map(s => {
        s.q.map(x => iCmp(x, ctx.update[key].text) && ctx.reply(s.a))
    });
    if (bot.private && !bot.private.has(ctx.update[key].chat.id)) {
        ctx.reply('Sorry, I am not allowed to talk to strangers.');
        return await next();
    }
    for (let name in bot.ai || []) {
        Array.isArray(bot.ai) && (name = null);
        (async () => {
            let resp;
            try {
                resp = (await bot.ai[name].send(
                    ctx.update[key].text, { session: ctx.update[key].chat.id }
                )).responseRendered;
            } catch (err) { resp = err.message; log(err); }
            ctx.reply(`${name ? `🤖️ ${name}: ` : ''}${resp}\n\n---`);
        })();
    }
    next && await next();
};

const subconscious = {
    run: true, name: 'subconscious', func: async (bot) => {
        bot.use(async (ctx, next) => {
            log(`Updated: ${ctx.update.update_id}`);
            process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
            ctx.update.edited_message && await handleText(ctx);
            await next();
        });
        bot.on('text', handleText);
    },
};

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
            bot.private = options?.private && new Set(options?.private);
            bot.ai = options?.ai; // Should be an array of a map of AIs.
            const [mods, pmsTrain] = [[{
                ...subconscious, run: !options?.silent
            }, ...ensureArray(options?.skill)], []];
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
