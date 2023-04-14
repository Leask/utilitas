import {
    ensureString, insensitiveCompare, log as _log, renderText as _renderText,
    throwError, verifyUrl,
} from "./utilitas.mjs";

const _NEED = ['@waylaidwanderer/chatgpt-api'];
const [BING, CHATGPT] = ['BING', 'CHATGPT'];
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 1, ...o || {} });
const log = content => _log(content, import.meta.url);
const iCmp = (strA, strB) => insensitiveCompare(strA, strB, { w: true });
const link = (text, url) => `[${text}](${url})`;
const li = (id, text, url) => `\n${id}. ` + (url ? link(text, url) : text);
const cardReg = /^\[\d*\]:\ ([^\ ]*)\ "(.*)"$/ig;

const init = async options => {
    const clear = key => key ? (delete sessions[key]) : (sessions = {});
    const get = (k, s) => k ? (s ? sessions[k]?.[s] : sessions[k]) : sessions;
    const set = (k, s, v) => sessions[k][s] = v;
    let [sessions, provider, engine, client] = [{}];
    switch ((provider = ensureString(options?.provider, { case: 'UP' }))) {
        case BING:
            // https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/demos/use-bing-client.js
            engine = (await import('@waylaidwanderer/chatgpt-api')).BingAIClient;
            client = new engine(options?.clientOptions);
            break;
        case CHATGPT:
            // https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/demos/use-client.js
            // Throttled: Request is throttled.
            // https://github.com/waylaidwanderer/node-chatgpt-api/issues/96
            engine = (await import('@waylaidwanderer/chatgpt-api')).ChatGPTClient;
            client = new engine(options?.clientOptions?.apiKey, {
                keepNecessaryMessagesOnly: true,
                modelOptions: {
                    model: options?.model || 'gpt-3.5-turbo',
                    ...options?.clientOptions?.modelOptions || {}
                }, ...options?.clientOptions || {},
            }, options?.cacheOptions);
            break;
        default: throwError('Invalid AI provider.', 500);
    }
    client.provider = provider;
    const send = async (message, options, onProgress) => {
        const [sessionId, cur, upd, apd] = [
            options?.sessionId || '_',
            key => get(sessionId, key),
            (key, val) => set(sessionId, key, val),
            (key, val) => set(sessionId, key, cur(key) + val),
        ];
        options?.session && (sessions[sessionId] = options.session);
        const objSession = { parentMessageId: cur('messageId') };
        switch (client.provider) {
            case BING:
                Object.assign(objSession, {
                    toneStyle: options?.toneStyle || 'balanced', // or creative, precise
                    jailbreakConversationId: cur('jailbreakConversationId') || true,
                });
                break;
            case CHATGPT:
                Object.assign(objSession, { conversationId: cur('conversationId') });
                break;
        }
        log(`Prompt: ${message}`);
        try {
            sessions[sessionId] = await client.sendMessage(
                message, { ...objSession, ...options || {}, onProgress }
            );
        } catch (err) {
            // @todo: when this happens, just reset hal? not all the project?
            log(err);
            clear(sessionId);
            throwError(err?.message || err, 500);
        }
        upd('responseRendered', renderText(cur('response')));
        // We should use `cur('details')?.spokenText` but it's too short and infoless for now.
        upd('spokenText', renderText(cur('response'), { noCode: true }).replace(/\[\^\d\^\]/ig, ''));
        const sources = cur('details')?.sourceAttributions || [];
        if (sources.length) {
            apd('responseRendered', '\n\nSource:');
            for (let i in sources) {
                const idx = ~~i + 1;
                upd('responseRendered', cur('responseRendered').replaceAll(
                    `[^${idx}^]`, link(`(${idx})`, sources[i].seeMoreUrl)
                ) + li(idx, sources[i].providerDisplayName, sources[i].seeMoreUrl));
            }
        }
        const cards = (
            cur('details')?.adaptiveCards || []
        )[0]?.body[0].text.split('\n\n')[0].split('\n').map(line => ({
            providerDisplayName: line.replace(cardReg, '$2'),
            seeMoreUrl: line.replace(cardReg, '$1'),
        })).filter(card => {
            for (let src of sources) {
                if (iCmp(src.seeMoreUrl, card.seeMoreUrl)) { return false; }
            }
            return card.providerDisplayName && verifyUrl(card.seeMoreUrl);
        });
        if (cards?.length) {
            apd('responseRendered', '\n\nLearn more:');
            for (let i in cards) {
                apd('responseRendered', li(
                    ~~i + 1, cards[i].providerDisplayName, cards[i].seeMoreUrl
                ));
            }
        }
        upd(
            'suggestedResponses',
            cur('details')?.suggestedResponses?.map?.(s => s.text) || []
        );
        // console.log(JSON.stringify(cur()));
        return cur();
    };
    return { clear, client, engine, get, send };
};

export default init;
export {
    _NEED,
    init,
};
