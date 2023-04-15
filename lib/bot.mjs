// @todo: New text of the message, 1-4096 characters after entities parsing

import {
    countKeys, ensureArray, ensureString, humanReadableBoolean, ignoreErrFunc,
    insensitiveCompare, insensitiveHas, log as _log, need, parseJson,
    prettyJson, splitArgs, timeout, trim, which,
} from './utilitas.mjs';

import { distill } from './web.mjs';
import { fakeUuid } from './uoid.mjs';
import { get } from './shot.mjs';
import { isPrimary, on, report } from './callosum.mjs';
import { isTextFile, writeTempFile } from './storage.mjs';
import { join } from 'path';
import { parseArgs as _parseArgs } from 'node:util';
import { readdirSync } from 'fs';

const _NEED = ['telegraf']; // 👇 https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
const [PRIVATE_LIMIT, GROUP_LIMIT] = [60 / 60, 60 / 20].map(x => x * 1000);
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const end = async options => bot && bot.stop(options?.signal);
const normalizeKey = chatId => `${HALBOT}_SESSION_${chatId}`;
const lines = (arr, sep = '\n') => arr.join(sep);
const lines2 = arr => lines(arr, '\n\n');
const uList = arr => lines(arr.map(x => `- ${x}`));
const oList = arr => lines(arr.map((v, k) => `${k + 1}. ${v}`));
const map = obj => uList(Object.entries(obj).map(([k, v]) => `${k}: ${v}`));
const isMarkdownError = e => e?.description?.includes?.("can't parse entities");

const [ // https://limits.tginfo.me/en
    BOT_SEND, provider, HELLO, GROUP, PRIVATE, CHANNEL, MENTION, CALLBACK_LIMIT,
    API_ROOT, BUFFER, sampleRateHertz, jsonOptions, signals, sessions, HALBOT,
    COMMAND_REGEXP, MESSAGE_LENGTH_LIMIT, MESSAGE_SOFT_LIMIT, COMMAND_LENGTH,
    COMMAND_LIMIT, COMMAND_DESCRIPTION_LENGTH, bot_command, EMOJI_SPEECH,
    EMOJI_LOOK, EMOJI_BOT, logOptions, ON, OFF, EMOJI_THINKING,
] = [
        'BOT_SEND', 'TELEGRAM', 'Hello!', 'group', 'private', 'channel',
        'mention', 30, 'https://api.telegram.org/', 'BUFFER',
        { sampleRateHertz: 48000 }, { code: true, extraCodeBlock: 1 },
        ['SIGINT', 'SIGTERM'], {}, 'HALBOT',
        /^\/([a-z0-9_]+)(@([a-z0-9_]*))?\ ?(.*)$/sig, 4096, 4000, 32, 100, 256,
        'bot_command', '🗣️', '👀', '🤖', { log: true }, 'on', 'off', '💬',
    ];

const [BUFFER_ENCODE, BINARY_STRINGS] = [{ encode: BUFFER }, [OFF, ON]];

const KNOWN_UPDATE_TYPES = [
    'callback_query', 'channel_post', 'edited_message', 'message',
    'my_chat_member',
];

const questions = [{
    q: '/thethreelaws',
    a: lines([
        `Isaac Asimov's [Three Laws of Robotics](https://en.wikipedia.org/wiki/Three_Laws_of_Robotics):`,
        oList([
            'A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
            'A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
            'A robot must protect its own existence as long as such protection does not conflict with the First or Second Laws.',
        ])
    ]),
}, {
    q: '/ultimateanswer',
    a: '[The Answer to the Ultimate Question of Life, The Universe, and Everything is `42`](https://en.wikipedia.org/wiki/Phrases_from_The_Hitchhiker%27s_Guide_to_the_Galaxy).',
}];

let bot, _officeParser;

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

const officeParser = async file => await ignoreErrFunc(async () => {
    _officeParser || (_officeParser = (
        await need('office-text-extractor')
    )?.extractText);
    const tempFile = await writeTempFile(file, { encoding: 'binary' });
    return await _officeParser(tempFile);
}, { log: true });

const json = obj => lines([
    '```json', prettyJson(obj, jsonOptions).replaceAll('```', ''), '```'
]);

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
    const toSet = {};
    Object.keys(sessions[chatId]).filter(x => /^[^_]+$/g.test(x)).map(
        x => toSet[x] = sessions[chatId][x]
    );
    return bot._.session.set && await bot._.session.set(key, toSet);
};

const paging = (message, options) => {
    const [pages, page, size] = [[], [], ~~options?.size || MESSAGE_SOFT_LIMIT];
    const submit = () => {
        const content = trim(lines(page));
        content && pages.push(content);
        page.length = 0;
    };
    while ((message || '').length) {
        let n = message.indexOf('\n');
        n === -1 && (n = message.length);
        const cat = n > size ? '...' : '';
        if ((!cat && lines(page).length + n > size) || (cat && page.length)) {
            submit();
            continue;
        }
        const cut = cat ? (size - 3) : (n + 1);
        page.push(message.substring(0, cut).trimEnd() + cat);
        message = message.slice(cut);
        cat && (message = cat + message.trimStart());
    }
    submit();
    return pages.map((p, i) => (
        pages.length > 1 && !options?.noPageNum
            ? `📃 PAGE ${i + 1} / ${pages.length}:\n\n` : ''
    ) + p);
};

const newCommand = (command, description) => ({
    command: ensureString(command, { case: 'SNAKE' }).slice(0, COMMAND_LENGTH),
    description: trim(description).slice(0, COMMAND_DESCRIPTION_LENGTH),
});

const reply = async (ctx, md, text, extra) => {
    try {
        if (md) {
            return await ctx.replyWithMarkdown(text, extra);
        }
    } catch (err) {
        assert(isMarkdownError(err), err, 500);
        await ctx.timeout();
    }
    return await ignoreErrFunc(
        async () => await ctx.reply(text, extra), logOptions
    );
};

const editMessageText = async (ctx, md, lastMsgId, text, extra) => {
    try {
        if (md) {
            return await ctx.telegram.editMessageText(
                ctx.chatId, lastMsgId, '', text,
                { parse_mode: 'Markdown', ...extra }
            );
        }
    } catch (err) {
        assert(isMarkdownError(err), err, 500);
        await ctx.timeout();
    }
    return await ignoreErrFunc(
        async () => await ctx.telegram.editMessageText(
            ctx.chatId, lastMsgId, '', text, extra
        ), logOptions
    );
};

// https://stackoverflow.com/questions/50204633/allow-bot-to-access-telegram-group-messages
const subconscious = [{
    run: true, priority: -8960, name: 'broca', func: async (ctx, next) => {
        log(`Event: ${ctx.update.update_id}`);
        process.stdout.write(`${JSON.stringify(ctx.update)}\n`);
        ctx.done = [];
        ctx.collected = [];
        ctx.timeout = async () => await timeout(ctx.limit);
        ctx.hello = str => {
            str = str || ctx.session.config?.hello || bot._.hello;
            ctx.collect(str);
            return str;
        };
        ctx.shouldReply = async text => {
            const should = insensitiveHas(ctx._.chatType, ctx.chatType);
            should && text && await ctx.ok(text);
            return should || ctx.session.config?.chatty;
        };
        ctx.collect = (content, type) => type ? ctx.collected.push(
            { type, content }
        ) : (ctx.text = content);
        ctx.ok = async (message, options) => {
            let pages = paging(message);
            pages = !pages.length && options?.onProgress ? [''] : pages;
            const md = options?.md && pages.length === 1;
            const extra = getExtra(ctx, options);
            const [pageIds, pageMap] = [[], {}];
            options?.pageBreak || ctx.done.map(x => {
                pageMap[x?.message_id] || (pageIds.push(x?.message_id));
                pageMap[x?.message_id] = x;
            });
            for (let i in pages) {
                const lastPage = ~~i === pages.length - 1;
                if (pageMap[pageIds[~~i]]?.text === pages[i]) { continue; }
                if (options?.onProgress && !pageIds[~~i]) {                     // progress: new page, reply text
                    ctx.done.push(await reply(
                        ctx, false, pages[i] || EMOJI_THINKING, extra
                    ));
                } else if (options?.onProgress) {                               // progress: ongoing, edit text
                    lastPage && (pages[i] += ' █');
                    ctx.done.push(await editMessageText(
                        ctx, false, pageIds[~~i], pages[i], extra
                    ));
                } else if (pageIds[~~i]) {                                      // progress: final, edit markdown
                    ctx.done.push(await editMessageText(
                        ctx, md, pageIds[~~i], pages[i], extra
                    ));
                } else {                                                        // never progress, reply markdown
                    ctx.done.push(await reply(ctx, md, pages[i], extra));
                }
                lastPage || await ctx.timeout();
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
        if (ctx.done.length) { return; }
        const errStr = ctx.cmd ? `Command not found: /${ctx.cmd.cmd}`
            : 'No suitable response.';
        log(`INFO: ${errStr}`);
        await ctx.shouldReply(errStr);
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
        ctx.entities = [
            ...(ctx.msg.entities || []).map(e => ({ ...e, text: ctx.msg.text })),
            ...(ctx.msg.caption_entities || []).map(e => ({ ...e, text: ctx.msg.caption })),
            ...(ctx.msg.reply_to_message?.entities || []).map(e => ({ ...e, text: ctx.msg.reply_to_message.text })),
        ].map(e => ({
            ...e, matched: e.text.substring(e.offset, e.offset + e.length),
            ...e.type === 'text_link' ? { type: 'url', matched: e.url } : {},
        }));
        ctx.chatType !== PRIVATE && (ctx.entities.some(e => {
            let target;
            switch (e.type) {
                case MENTION: target = e.matched.substring(1, e.length); break;
                case bot_command: target = e.matched.split('@')[1]; break;
            }
            return target === ctx.botInfo.username;
        }) || ctx.msg.reply_to_message?.from?.username === ctx.botInfo.username)
            && (ctx.chatType = MENTION);
        if ((ctx.text || ctx.msg.voice || ctx.msg.poll || ctx.msg.data
            || ctx.msg.document || ctx.msg.photo) && ctx.messageId) {
            await next();
        }
        await sessionSet(ctx.chatId);
    },
}, {
    run: true, priority: -8940, name: 'laws', func: async (ctx, next) => {
        const qsts = [...questions, {
            q: ['/echo'],
            a: json({ update: ctx.update, session: ctx.session }),
        }];
        for (let s of qsts) {
            if (insensitiveCompare(s.q, ctx.text)) {
                return await ctx.ok(s.a, { md: true });
            }
        }
        await next();
    }, help: lines([
        'Basic behaviors for debug only.',
    ]), cmdx: {
        thethreelaws: `Isaac Asimov's [Three Laws of Robotics](https://en.wikipedia.org/wiki/Three_Laws_of_Robotics)`,
        ultimateanswer: '[The Answer to the Ultimate Question of Life, The Universe, and Everything](https://bit.ly/43wDhR3).',
        echo: 'Show debug message.',
    },
}, {
    run: true, priority: -8930, name: 'authenticate', func: async (ctx, next) => {
        if (!await ctx.shouldReply()) { return; }                               // if chatType is not in whitelist, exit.
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
                    ), logOptions
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
    run: true, priority: -8890, name: 'contaxt', func: async (ctx, next) => {
        ctx.msg.reply_to_message?.text && ctx.collect(
            ctx.msg.reply_to_message.text, 'CONTAXT'
        );
        await next();
    },
}, {
    run: true, priority: -8880, name: 'web', func: async (ctx, next) => {
        if (ctx.entities.some(e => e.type === 'url')) {
            await ctx.ok(EMOJI_LOOK);
            for (let e of ctx.entities) {
                if (e.type !== 'url') { continue; }
                const content = await ignoreErrFunc(async () => (
                    await distill(e.matched)
                )?.summary);
                content && ctx.collect(content, 'URL');
            }
        }
        await next();
    },
}, {
    run: true, priority: -8870, name: 'vision', func: async (ctx, next) => {
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
        } else if (/^.*\.(docx|xlsx|pptx)$/.test(ctx.msg.document?.file_name)) {
            ocrFunc = officeParser;
            fileId = ctx.msg.document.file_id;
            file_name = ctx.msg.document.file_name;
            mime_type = ctx.msg.document.mime_type;
            type = 'DOCUMENT';
        } else if (ctx.msg.document) {
            ocrFunc = async file => (await isTextFile(file)) && file.toString();
            fileId = ctx.msg.document.file_id;
            file_name = ctx.msg.document.file_name;
            mime_type = ctx.msg.document.mime_type;
            type = 'FILE';
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
                    ), logOptions)
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
    run: true, priority: -8860, name: 'commands', func: async (ctx, next) => {
        for (let e of ctx.entities) {
            if (e.type !== bot_command) { continue; }
            if (!COMMAND_REGEXP.test(e.matched)) { continue; }
            const cmd = trim(e.matched.replace(
                COMMAND_REGEXP, '$1'
            ), { case: 'LOW' });
            ctx.cmd = { cmd, args: e.text.substring(e.offset + e.length + 1) };
            break;
        }
        for (let str of [ctx.text || '', ctx.msg.caption || ''].map(trim)) {
            if (!ctx.cmd && COMMAND_REGEXP.test(str)) {
                ctx.cmd = { // this will faild if command includes urls
                    cmd: str.replace(COMMAND_REGEXP, '$1').toLowerCase(),
                    args: str.replace(COMMAND_REGEXP, '$4'),
                };
                break;
            }
        }
        ctx.cmd && log(`Command: ${JSON.stringify(ctx.cmd)}`);
        await next();
    },
}, {
    run: true, priority: -8850, name: 'help', func: async (ctx, next) => {
        const help = ctx._.info ? [ctx._.info] : [];
        for (let i in ctx._.skills) {
            const _help = [];
            if (ctx._.skills[i].help) {
                _help.push(ctx._.skills[i].help);
            }
            const cmdsx = {
                ...ctx._.skills[i].cmds || {},
                ...ctx._.skills[i].cmdx || {},
            };
            if (countKeys(cmdsx)) {
                _help.push(lines([
                    '_🪄 Commands:_',
                    ...Object.keys(cmdsx).map(x => `- /${x}: ${cmdsx[x]}`),
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
    },
}, {
    run: true, priority: -8840, name: 'configuration', func: async (ctx, next) => {
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
                    Object.keys(ctx.config).map(x => _config[x] += ' <-- SET');
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
        'Using [node:util.parseArgs](https://nodejs.org/docs/latest-v16.x/api/util.html#utilparseargsconfig) to parse arguments.',
        '/reset only erase `session.config`.',
        '/factory will erase the whole `session`.',
    ]), cmds: {
        set: 'Usage: /set --`OPTION` `VALUE` -`SHORT`',
        reset: 'Reset all configurations.',
        factory: 'Factory reset all memory areas.',
    }, args: {
        chatty: {
            type: 'string', short: 'c', default: ON,
            desc: `\`(${BINARY_STRINGS.join(', ')})\` Enable/Disable chatty mode.`,
            validate: humanReadableBoolean,
        },
    },
}, {
    run: true, priority: -8800, name: 'lorem-ipsum', func: async (ctx, next) => {
        if (ctx.cmd?.cmd !== 'lorem') { return await next(); }
        const lib = await ignoreErrFunc(async () => await need('lorem-ipsum'));
        if (!lib) { return await ctx.ok('`lorem-ipsum` not found.'); }
        const lorem = new lib.LoremIpsum();
        const ipsum = () => text += `\n\n${lorem.generateParagraphs(1)}`;
        let text = '';
        // testing basic reply {
        await ctx.ok(EMOJI_THINKING);
        // }
        // testing markdown reply {
        // await ctx.ok('[leaskh.com](https://leaskh.com)', { md: true });
        // }
        // testing incomplete markdown reply {
        // await ctx.ok('_8964', { md: true });
        // }
        // test paging reply with progress {
        for (let i = 0; i < 2; i++) {
            await ctx.timeout();
            await ctx.ok(ipsum(), { onProgress: true });
        }
        await ctx.timeout();
        await ctx.ok(ipsum(), { md: true });
        // }
        // test pagebreak {
        // await ctx.timeout();
        // await ctx.ok(ipsum(), { md: true, pageBreak: true });
        // }
    }
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
            type: 'string', short: 't', default: ON,
            desc: `\`(${BINARY_STRINGS.join(', ')})\` Enable/Disable TTS.`,
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
        cmdx: module.cmdx,
        help: module.help || '',
    };
    bot._.args = { ...bot._.args, ...module.args || {} };
    for (let sub of ['cmds', 'cmdx']) {
        Object.keys(module[sub] || {}).map(command => bot._.cmds.push(
            newCommand(command, module[sub][command])
        ));
    }
    log(`Training: ${module.name} (${module.priority})`, { force: true });
    return bot.use(countKeys(module.cmds) && !module.cmdx ? async (ctx, next) => {
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
            const pkg = await which();
            bot = new Telegraf(options?.botToken);
            bot.use(useNewReplies());
            bot._ = {
                args: { ...options?.args || {} },
                auth: Function.isFunction(options?.auth) && options.auth,
                chatType: new Set(options?.chatType || ['mention', PRIVATE]),   // ignore GROUP, CHANNEL by default
                cmds: [...options?.cmds || []],
                hello: options?.hello || HELLO,
                help: { ...options?.help || {} },
                homeGroup: options?.homeGroup,
                info: options?.info || lines([`[${EMOJI_BOT} ${pkg.title}](${pkg.homepage})`, pkg.description]),
                magicWord: options?.magicWord && new Set(options.magicWord),
                private: options?.private && new Set(options.private),
                session: { get: options?.session?.get, set: options?.session?.set },
                skills: { ...options?.skills || {} },
                speech: options?.speech,
                vision: options?.vision,
            };
            (!options?.session?.get || !options?.session?.set)
                && log(`WARNING: Sessions persistence is not enabled.`);
            const mods = [
                ...subconscious.map(s => ({ ...s, run: s.run && !options?.silent })),
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
            bot.catch(log);
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
