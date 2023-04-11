// @todo: New text of the message, 1-4096 characters after entities parsing

import {
    countKeys, ensureArray, ensureString, humanReadableBoolean, ignoreErrFunc,
    insensitiveCompare, insensitiveHas, log as _log, need, parseJson,
    prettyJson, splitArgs, trim, which,
} from './utilitas.mjs';

import { distill } from './web.mjs';
import { fakeUuid } from './uoid.mjs';
import { get } from './shot.mjs';
import { isPrimary, on, report } from './callosum.mjs';
import { join } from 'path';
import { parseArgs as _parseArgs } from 'node:util';
import { readdirSync } from 'fs';
import { utilitas } from '../index.mjs';

const _NEED = ['telegraf']; // 👇 https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
const [PRIVATE_LIMIT, GROUP_LIMIT] = [60 / 60, 60 / 20].map(x => x * 1000);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const normalizeKey = (chatId) => `${HALBOT}_SESSION_${chatId}`;
const lines = (arr, sep = '\n') => arr.join(sep);
const lines2 = arr => lines(arr, '\n\n');
const uList = arr => lines(arr.map(x => `- ${x}`));
const oList = arr => lines(arr.map((v, k) => `${k + 1}. ${v}`));
const map = obj => uList(Object.entries(obj).map(([k, v]) => `${k}: ${v}`));
const json = obj => lines(['```json', prettyJson(obj, jsonOptions), '```']);

const [ // https://limits.tginfo.me/en
    BOT_SEND, provider, HELLO, GROUP, PRIVATE, CHANNEL, MENTION, CALLBACK_LIMIT,
    API_ROOT, BUFFER, sampleRateHertz, jsonOptions, signals, sessions, HALBOT,
    COMMAND_REGEXP, MESSAGE_LENGTH_LIMIT, MESSAGE_SOFT_LIMIT, COMMAND_LENGTH,
    COMMAND_LIMIT, COMMAND_DESCRIPTION_LENGTH, bot_command, EMOJI_SPEECH,
    EMOJI_LOOK, EMOJI_BOT,
] = [
        'BOT_SEND', 'TELEGRAM', 'Hello!', 'group', 'private', 'channel',
        'mention', 30, 'https://api.telegram.org/', 'BUFFER',
        { sampleRateHertz: 48000 }, { code: true, extraCodeBlock: 1 },
        ['SIGINT', 'SIGTERM'], {}, 'HALBOT',
        /^.*\/([a-z0-9_]+)(@([a-z0-9_]*))?\ ?(.*)$/sig, 4096, 4000, 32, 100, 256,
        'bot_command', '🗣️', '👀', '🤖', '',
    ];

const [BUFFER_ENCODE] = [{ encode: BUFFER }];

const KNOWN_UPDATE_TYPES = [
    'message', 'callback_query', 'channel_post', 'edited_message',
    'my_chat_member'
];

const questions = [{
    q: ['/THE_THREE_LAWS'],
    a: oList([
        'A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
        'A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
        'A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.',
    ]),
}, {
    q: ['/The_Ultimate_Question_of_Life_the_Universe_and_Everything',
        '/The_answer_to_life_the_universe_and_everything'],
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
    sessions[chatId].config || (sessions[chatId].config = {});
    return sessions[chatId];
};

const sessionSet = async chatId => {
    const key = normalizeKey(chatId);
    while (sessions[chatId]?.callback?.length > CALLBACK_LIMIT) {
        sessions[chatId].callback.shift();
    }
    return bot._.session.set && await bot._.session.set(key, sessions[chatId]);
};

const paging = message => {
    const [pages, getLength, submit] = [[], () => lines(page).length, () => {
        if (page.length) { pages.push(page); page = []; }
    }];
    let page = [];
    (message || '').split('\n').map(line => {
        (getLength() + (line = line.trim()).length >= MESSAGE_SOFT_LIMIT)
            ? submit() : page.push(line);
    });
    submit()
    return pages.map((p, i) => (
        pages.length > 1 ? `📃 PAGE ${i + 1} / ${pages.length}:\n\n` : ''
    ) + lines(p).trim());
};

const newCommand = (command, description) => ({
    command: ensureString(command, { case: 'SNAKE' }).slice(0, COMMAND_LENGTH),
    description: trim(description).slice(0, COMMAND_DESCRIPTION_LENGTH),
});

// https://stackoverflow.com/questions/50204633/allow-bot-to-access-telegram-group-messages
const subconscious = [{
    run: true, priority: -8960, name: 'broca', func: async (ctx, next) => {
        log(`Event: ${ctx.update.update_id}`);
        process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
        ctx.done = [];
        ctx.collected = [];
        ctx.hello = str => ctx.collect(
            str || ctx.session.config?.hello || bot._.hello
        );
        ctx.collect = (content, type) => type ? ctx.collected.push(
            { type, content }
        ) : (ctx.text = content);
        ctx.ok = async (message, options) => {
            const md = options?.md;
            const extra = getExtra(ctx, options);
            if (options?.onProgress && !ctx.done.length) {                      // progress, 1st, reply text
                ctx.done.push(await ctx.reply(message, extra));
            } else if (options?.onProgress) {                                   // progress, ongoing, edit text
                ctx.done.push(await ctx.telegram.editMessageText(
                    ctx.chatId, ctx.done[0].message_id, '', message, extra
                ));
            } else if (ctx.done.length && !options?.paging) {                   // final, has progress. edit markdown
                ctx.done.push(await ctx.telegram.editMessageText(
                    ctx.chatId, ctx.done[0].message_id, '', message,
                    { ...md ? { parse_mode: 'Markdown' } : {}, ...extra }
                ));
            } else {                                                            // final, never progress, reply markdown
                ctx.done.push(await ctx[
                    md ? 'replyWithMarkdown' : 'reply'
                ](message, extra));
            }
            return ctx.done;
        };
        ctx.paging = async (message, options) => {
            const pages = paging(message);
            for (let i in pages) {
                ctx.done.push(await ctx.ok(
                    pages[i], { ...options, paging: true }
                ));
                (i < pages.length - 1) && (await utilitas.timeout(ctx.limit));
            }
            return ctx.done;
        };
        ctx.er = async (m, opts) => {
            log(m);
            return await ctx.ok(m?.message || m, opts);
        };
        ctx.complete = async (options) => await ctx.ok('☑️', options);
        ctx.json = async (obj, options) => await ctx.ok(json(obj), options);
        ctx.list = async (list, options) => await ctx.ok(uList(list), options);
        ctx.map = async (obj, options) => await ctx.ok(map(obj), options);
        ctx.audio = async (source, options) => ctx.done.push(
            await ctx.replyWithAudio({ source }, getExtra(ctx, options))
        );
        ctx.speech = async (text, options) => await ctx.audio(
            await ctx._.speech.tts(text, { output: 'file' }), options
        );
        await next();
        // https://limits.tginfo.me/en
        ctx.chatId && await bot.telegram.setMyCommands([
            ...ctx._.cmds, ...Object.keys(ctx.session.prompts || {}).map(
                command => newCommand(command, ctx.session.prompts[command])
            )
        ].slice(0, COMMAND_LIMIT), { scope: { type: 'chat', chat_id: ctx.chatId } });
        ctx.done.length || log('INFO: No suitable response.');
    },
}, {
    run: true, priority: -8950, name: 'subconscious', func: async (ctx, next) => {
        for (let t of KNOWN_UPDATE_TYPES) {
            if (ctx.update[t]) { ctx.msg = ctx.update[ctx.type = t]; break; }
        }
        if (ctx.type === 'callback_query') { ctx.msg = ctx.msg.message; }
        else if (ctx.type === 'my_chat_member') {
            log(
                'Group member status changed: '
                + ctx.msg.new_chat_member.user.id + ' => '
                + ctx.msg.new_chat_member.status
            );
            if (ctx.msg.new_chat_member.user.id !== ctx.botInfo.id
                || ctx.msg.new_chat_member.status === 'left') { return }
            else { ctx.hello(); }
        } else if (!ctx.type) { return log(`Unsupported update type.`); }
        ctx._ = bot._;
        ctx.chatId = ctx.msg.chat.id;
        ctx.chatType = ctx.msg.chat.type;
        ctx.messageId = ctx.msg.message_id;
        ctx.msg.text && ctx.collect(ctx.msg.text);
        ctx.session = await sessionGet(ctx.chatId);
        ctx.limit = ctx.chatType === PRIVATE ? PRIVATE_LIMIT : GROUP_LIMIT;
        if (ctx.chatType !== PRIVATE && (ctx.msg.entities || []).some(e => {
            let target;
            switch (e.type) {
                case MENTION:
                    target = ctx.text.substr(~~e.offset + 1, ~~e.length - 1);
                    break;
                case bot_command:
                    target = ctx.text.substr(~~e.offset, ~~e.length).split('@')[1];
                    break;
            }
            return target === ctx.botInfo.username;
        })) { ctx.chatType = MENTION; }
        if ((ctx.text || ctx.msg.voice || ctx.msg.poll || ctx.msg.data
            || ctx.msg.document || ctx.msg.photo) && ctx.messageId) {
            await next();
        }
        await sessionSet(ctx.chatId);
    },
}, {
    run: true, priority: -8940, name: 'laws', func: async (ctx, next) => {
        const qsts = [...questions, {
            q: ['/echo'], a: json({ update: ctx.update, session: ctx.session }),
        }];
        for (let s of qsts) {
            for (let x of s.q) {
                if (insensitiveCompare(x, ctx.text)) {
                    return await s.a.length > MESSAGE_SOFT_LIMIT
                        ? ctx.paging(s.a) : ctx.ok(s.a, { md: true });
                }
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
            ctx.hello();
            return await next();
        }
        if (insensitiveHas(ctx._.private, ctx.chatId)                           // auth by chatId
            || (ctx?.from && insensitiveHas(ctx._.private, ctx.from.id))) {     // auth by userId
            return await next();
        }
        if (ctx.chatType !== PRIVATE && (                                       // 1 of the group admins is in whitelist
            await ctx.telegram.getChatAdministrators(ctx.chatId)
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
    run: true, priority: -8920, name: 'speech-to-text', func: async (ctx, next) => {
        if (ctx._.speech?.stt && ctx.msg.voice?.mime_type === 'audio/ogg') {
            await ctx.ok(EMOJI_SPEECH);
            try {
                const file = await getFile(ctx.msg.voice.file_id, BUFFER_ENCODE);
                const resp = await ignoreErrFunc(
                    async () => await ctx._.speech?.stt(
                        file, { config: sampleRateHertz }
                    ), { log: true }
                ) || ' ';
                log(`STT: '${resp}'`);
                ctx.collect(resp);
            } catch (err) { return await ctx.er(err); }
        }
        await next();
    },
}, {
    run: true, priority: -8910, name: 'callback', func: async (ctx, next) => {
        if (ctx.type === 'callback_query') {
            const data = parseJson(ctx.update[ctx.type].data);
            const cb = ctx.session.callback.filter(x => x.id == data?.callback)[0];
            if (cb?.text) {
                log(`Callback: ${cb.text}`);
                ctx.collect(cb.text);
            } else {
                return await ctx.er(
                    `Command is invalid or expired: ${ctx.msg.data}`
                );
            }
        }
        await next();
    },
}, {
    run: true, priority: -8900, name: 'poll', func: async (ctx, next) => {
        ctx.msg.poll && ctx.collect(lines([
            'Question:', ctx.msg.poll.question, '',
            'Options:', oList(ctx.msg.poll.options.map(x => x.text)),
        ]));
        await next();
    },
}, {
    run: true, priority: -8890, name: 'web', func: async (ctx, next) => {
        if (ctx.msg?.entities?.some(ent => ent.type === 'url')) {
            await ctx.ok(EMOJI_LOOK);
            for (let ent of ctx.msg?.entities) {
                if (ent.type !== 'url') { continue; }
                const content = await ignoreErrFunc(async () => (
                    await distill(ctx.text.substr(ent.offset, ent.length))
                )?.summary);
                content && ctx.collect(content, 'URL');
            }
        }
        await next();
    },
}, {
    run: true, priority: -8880, name: 'vision', func: async (ctx, next) => {
        let fileId, type, file_name, mime_type, ocrFunc;
        if ('application/pdf' === ctx.msg.document?.mime_type) {
            ocrFunc = ctx._.vision?.read;
            fileId = ctx.msg.document.file_id;
            file_name = ctx.msg.document.file_name;
            mime_type = ctx.msg.document.mime_type;
            type = 'DOCUMENT';
        } else if (/^image\/.*$/ig.test(ctx.msg.document?.mime_type)) {
            ocrFunc = ctx._.vision?.see;
            fileId = ctx.msg.document.file_id;
            file_name = ctx.msg.document.file_name;
            mime_type = ctx.msg.document.mime_type;
            type = 'IMAGE';
        } else if (ctx.msg.photo) {
            ocrFunc = ctx._.vision?.see;
            fileId = ctx.msg.photo[ctx.msg.photo.length - 1]?.file_id;
            mime_type = 'image';
            type = 'PHOTO';
        }
        if (fileId && ocrFunc) {
            await ctx.ok(EMOJI_LOOK);
            try {
                const file = await getFile(fileId, BUFFER_ENCODE);
                const content = trim(ensureArray(
                    await ignoreErrFunc(async () => await ocrFunc(
                        file, BUFFER_ENCODE
                    ), { log: true })
                ).filter(x => x).join('\n'));
                if (content) {
                    ctx.collect(ctx.msg.caption || '');
                    content && ctx.collect(lines([
                        '---', ...file_name ? [`file_name: ${file_name}`] : [],
                        `mime_type: ${mime_type}`, `type: ${type}`, '---',
                        content
                    ]), 'VISION');
                }
            } catch (err) { return await ctx.er(err); }
        }
        await next();
    },
}, {
    run: true, priority: -8870, name: 'commands', func: async (ctx, next) => {
        for (let ent of ctx.msg?.entities || []) {
            if (ent.type !== bot_command) { continue; }
            const rawCmd = ctx.text.substr(ent.offset, ent.length);
            if (!COMMAND_REGEXP.test(rawCmd)) { continue; }
            const cmd = trim(rawCmd.replace(
                COMMAND_REGEXP, '$1'
            ), { case: 'LOW' });
            ctx.cmd = { cmd, args: ctx.text.substr(ent.offset + ent.length + 1) };
            break;
        }
        if (!ctx.cmd && COMMAND_REGEXP.test(ctx.text)) {
            ctx.cmd = { // this will faild if command includes urls
                cmd: ctx.text.replace(COMMAND_REGEXP, '$1'),
                args: ctx.text.replace(COMMAND_REGEXP, '$4'),
            };
        }
        ctx.cmd && log(`Command: ${JSON.stringify(ctx.cmd)}`);
        await next();
    },
}, {
    run: true, priority: -8860, name: 'help', func: async (ctx, next) => {
        const help = ctx._.info ? [ctx._.info] : [];
        for (let i in ctx._.skills) {
            const _help = [];
            if (ctx._.skills[i].help) {
                _help.push(ctx._.skills[i].help);
            }
            if (countKeys(ctx._.skills[i].cmds)) {
                _help.push(lines([
                    '_🪄 Commands:_',
                    ...Object.keys(ctx._.skills[i].cmds).map(
                        x => `- /${x}: ${ctx._.skills[i].cmds[x]}`
                    ),
                ]));
            }
            if (countKeys(ctx._.skills[i].args)) {
                _help.push(lines([
                    '_⚙️ Options:_',
                    ...Object.keys(ctx._.skills[i].args).map(x => {
                        const _arg = ctx._.skills[i].args[x];
                        return `- \`${x}\`` + (_arg.short ? `(${_arg.short})` : '')
                            + `, ${_arg.type}(${_arg.default ?? 'N/A'})`
                            + (_arg.desc ? `: ${_arg.desc}` : '');
                    })
                ]));
            }
            _help.length && help.push(lines([`*${i.toUpperCase()}*`, ..._help]));
        }
        await ctx.ok(lines2(help), { md: true });
    }, help: lines([
        'Basic syntax of this document:',
        'Scheme for commands: /`COMMAND`: `DESCRIPTION`',
        'Scheme for options: `OPTION`(`SHORT`), `TYPE`(`DEFAULT`): `DESCRIPTION`',
    ]), cmds: {
        help: 'Show help message.',
        echo: 'Show debug message.',
    },
}, {
    run: true, priority: -8850, name: 'configuration', func: async (ctx, next) => {
        switch (ctx.cmd.cmd) {
            case 'set':
                try {
                    const _config = {
                        ...ctx.session.config = {
                            ...ctx.session.config,
                            ...ctx.config = parseArgs(ctx.cmd.args),
                        }
                    };
                    assert(countKeys(ctx.config), 'No option matched.');
                    Object.keys(ctx.config).map(
                        x => _config[x] = `${_config[x]} <-- SET`
                    );
                    await ctx.map(_config);
                } catch (err) {
                    await ctx.ok(err.message || err);
                }
                break;
            case 'reset':
                ctx.session.config = ctx.config = {};
                await ctx.complete();
                break;
            case 'factory':
                sessions[ctx.chatId] = {}; // ctx.session = {}; will not work, because it's a reference.
                await ctx.complete();
                break;
        }
    }, help: lines([
        'Configure the bot by UNIX/Linux CLI style.',
        '/reset only erase `session.config`.',
        '/factory will erase the whole `session`.',
    ]), cmds: {
        set: 'Usage: /set --`OPTION` `VALUE` -`SHORT`',
        reset: 'Reset all configurations.',
        factory: 'Factory reset all memory areas.',
    },
}, {
    run: true, priority: 8950, name: 'text-to-speech', func: async (ctx, next) => {
        if (!ctx._.speech?.tts || !ctx.tts || (ctx.session.config?.tts === false)) {
            return await next();
        }
        await ctx.speech(ctx.tts);
        await next();
    }, help: lines([
        'When enabled, the bot will speak out the answer if available.',
        'Example 1: /set --tts on',
        'Example 2: /set --tts off',
    ]), args: {
        tts: {
            type: 'string', short: 't', default: 'on',
            desc: '`(on, off)` Enable/Disable TTS.',
            validate: humanReadableBoolean,
        },
    },
}];

const train = (bot, module, options) => {
    if (!module.run) { return; }
    assert(module?.func, 'Skill function is required.', 500);
    bot._.skills[module.name || (module.name = uuidv4())] = {
        args: module.args || {},
        cmds: module.cmds || {},
        help: module.help || '',
    };
    bot._.args = { ...bot._.args, ...module.args || {} };
    Object.keys(module.cmds || {}).map(
        command => bot._.cmds.push(newCommand(command, module.cmds[command]))
    );
    log(`Training: ${module.name} (${module.priority})`, { force: true });
    return bot.use(countKeys(module.cmds) ? async (ctx, next) => {
        for (let c in module.cmds) {
            if (insensitiveCompare(ctx.cmd?.cmd, c)) {
                return await module.func(ctx, next);
            }
        }
        return next();
    } : module.func);
};

const parseArgs = args => {
    const { values, tokens } = _parseArgs({
        args: splitArgs((args || '').replaceAll('—', '--')),
        options: bot._.args, tokens: true
    });
    const result = {};
    tokens.map(x => result[x.name] = bot._.args[x.name]?.validate
        ? bot._.args[x.name].validate(values[x.name])
        : values[x.name]);
    return result;
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
                cmds: [...options?.cmds || []],
                hello: options?.hello || HELLO,
                help: { ...options?.help || {} },
                homeGroup: options?.homeGroup,
                info: options?.info || `*${EMOJI_BOT} ${(await which())?.title}*`,
                magicWord: options?.magicWord && new Set(options.magicWord),
                private: options?.private && new Set(options.private),
                session: { get: options?.session?.get, set: options?.session?.set },
                speech: options?.speech,
                vision: options?.vision,
                skills: { ...options?.skills || {} },
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
                module => train(bot, module, options)
            );
            assert(mods.length, 'Invalid skill set.', 501);
            parseArgs(); // Validate args options.
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
    COMMAND_DESCRIPTION_LENGTH,
    COMMAND_LENGTH,
    COMMAND_LIMIT,
    EMOJI_BOT,
    EMOJI_SPEECH,
    GROUP_LIMIT,
    MESSAGE_LENGTH_LIMIT,
    PRIVATE_LIMIT,
    end,
    init,
    lines,
    lines2,
    map,
    newCommand,
    oList,
    paging,
    send,
    uList,
};
