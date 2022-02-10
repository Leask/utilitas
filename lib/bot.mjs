// https://github.com/telegraf/telegraf

import { Telegraf } from 'telegraf';
import * as utilitas from './utilitas.mjs';
import fs from 'fs';
import path from 'path';

const fileURLToPath = (await import('url')).fileURLToPath
    || ((url) => { return new URL('', url).pathname; });
const __filename = fileURLToPath(import.meta.url);
const signals = ['SIGINT', 'SIGTERM'];
const provider = 'TELEGRAM';
const c = (s, r) => { return ~~utilitas.insensitiveCompare(s, r, { w: true }) };

let bot;

const questions = [{
    q: ['The Ultimate Question of Life, the Universe, and Everything',
        'The answer to life the universe and everything'],
    a: '42',
}, {
    q: ['THE THREE LAWS'],
    a: ['- A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
        '- A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
        '- A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.'].join('\n'),
}];

const subconscious = {
    run: true, name: 'Subconscious', func: async (bot) => {
        bot.use(async (ctx, next) => {
            log(`Updated: ${ctx.update.update_id}`);
            process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
            await next();
        });
        bot.on('text', async (ctx, next) => {
            questions.map(s => {
                s.q.map(x => { c(x, ctx.update.message.text) && ctx.reply(s.a) })
            });
            await next();
        });
    },
};

const log = (c, o) => {
    utilitas.modLog(c, utilitas.basename(__filename), { time: true, ...o || {} });
};

const train = async (bot, func, name, options) => {
    log(`Training: ${name = name || uuidv4()}`, { force: true });
    return await func(bot);
};

const load = async (bot, module, options) => {
    utilitas.assert(module && module.func, 'Skill function is required.', 500);
    return await train(bot, module.func, module.name, options);
};

const init = async (options) => {
    if (options) {
        utilitas.assert(
            utilitas.insensitiveCompare(options?.provider, provider),
            'Invalid bot provider.', 501
        );
        bot = new Telegraf(options?.botToken);
        const [mods, pmsTrain] = [[
            { ...subconscious, run: !options?.silent },
            ...utilitas.ensureArray(options?.skill)
        ], []];
        for (let skillPath of utilitas.ensureArray(options?.skillPath)) {
            log(`SKILLS: ${skillPath}`);
            const files = (fs.readdirSync(skillPath) || []).filter(
                file => /\.mjs$/i.test(file) && !file.startsWith('.')
            );
            for (let f of files) {
                const m = await import(path.join(skillPath, f));
                mods.push({ ...m, name: m.name || f.replace(/^(.*)\.mjs$/i, '$1') });
            }
        }
        mods.map(mod => { mod.run && pmsTrain.push(load(bot, mod, options)) });
        utilitas.assert(pmsTrain.length, 'Invalid skill set.', 501);
        await Promise.all(pmsTrain);
        bot.launch();
        // Graceful stop
        signals.map(signal => process.once(signal, () => bot.stop(signal)));
    }
    utilitas.assert(bot, 'Bot have not been initialized.', 501);
    return bot;
};

const send = async (chatId, content, options) => {
    return (await init()).telegram.sendMessage(chatId, content);
};

const end = async (options) => {
    return bot && bot.stop(options?.signal);
};

export default init;
export {
    end,
    send,
    init,
};
