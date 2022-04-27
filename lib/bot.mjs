// https://github.com/telegraf/telegraf

import { ensureArray, insensitiveCompare, log as _log } from './utilitas.mjs';
import { join } from 'path';
import { readdirSync } from 'fs';
import { Telegraf } from 'telegraf';
import cluster from 'cluster';

const signals = ['SIGINT', 'SIGTERM'];
const [BOT_SEND, provider, MESSAGE] = ['BOT_SEND', 'TELEGRAM', 'message'];
const iCmp = (strA, strB) => ~~insensitiveCompare(strA, strB, { w: true });
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async (options) => bot && bot.stop(options?.signal);

let bot;

const questions = [{
    q: ['THE THREE LAWS'],
    a: ['- A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
        '- A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
        '- A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.'].join('\n'),
}, {
    q: ['The Ultimate Question of Life, the Universe, and Everything',
        'The answer to life the universe and everything'],
    a: '42',
}];

const subconscious = {
    run: true, name: 'subconscious', func: async (bot) => {
        bot.use(async (ctx, next) => {
            log(`Updated: ${ctx.update.update_id}`);
            process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
            await next();
        });
        bot.on('text', async (ctx, next) => {
            questions.map(s => {
                s.q.map(x => iCmp(x, ctx.update.message.text) && ctx.reply(s.a))
            });
            await next();
        });
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
        if (cluster.isPrimary) {
            bot = new Telegraf(options?.botToken);
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
            cluster.on(MESSAGE, (worker, msg) => eventHandler(msg));
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

const eventHandler = async (msg) => {
    switch (msg?.action) {
        case BOT_SEND: return await send(...msg?.data || []);
    }
};

export default init;
export {
    end,
    send,
    init,
};
