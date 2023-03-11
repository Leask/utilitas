import {
    ensureString, insensitiveCompare, log as _log, renderText as _renderText,
    throwError, verifyUrl,
} from "./utilitas.mjs";

const _NEED = ['@waylaidwanderer/chatgpt-api'];
const [BING, CHATGPT] = ['BING', 'CHATGPT'];
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 1, ...o || {} });
const log = (content) => _log(content, import.meta.url);
const iCmp = (strA, strB) => insensitiveCompare(strA, strB, { w: true });
const link = (text, url) => `[${text}](${url})`;
const li = (id, text, url) => `\n${id}. ` + (url ? link(text, url) : text);

const init = async (options) => {
    let sessions = {};
    let provider, engine, client;
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
                modelOptions: {
                    model: 'gpt-3.5-turbo',
                    ...options?.clientOptions?.modelOptions || {}
                }, ...options?.clientOptions || {}
            }, options?.cacheOptions);
            break;
        default:
            throwError('Invalid AI provider.', 500);
    }
    client.provider = provider;
    const send = async (message, options, onProgress) => {
        const _session = options?.session || '_';
        const objSession = { parentMessageId: sessions?.[_session]?.messageId };
        switch (client.provider) {
            case BING:
                Object.assign(objSession, {
                    toneStyle: 'balanced', // or creative, precise
                    jailbreakConversationId: sessions?.[_session]?.jailbreakConversationId || true,
                });
                break;
            case CHATGPT:
                Object.assign(objSession, {
                    conversationId: sessions?.[_session]?.conversationId,
                });
                break;
        }
        try {
            sessions[_session] = await client.sendMessage(
                message, { ...objSession, ...options || {}, onProgress }
            );
        } catch (err) {
            // @todo: when this happens, just reset hal? not all the project?
            log(err);
            clear(_session);
            throwError(err?.message || err, 500);
        }
        sessions[_session].responseRendered = renderText(sessions[_session].response);
        // @todo: support spokenText with google tts api
        sessions[_session].spokenText = sessions[_session]?.details?.spokenText || sessions[_session].response;
        const sources = sessions[_session]?.details?.sourceAttributions || [];
        if (sources.length) {
            sessions[_session].responseRendered += `\n\nSource:`;
            for (let i in sources) {
                const idx = ~~i + 1;
                sessions[_session].responseRendered
                    = sessions[_session].responseRendered.replaceAll(`[^${idx}^]`, link(`(${idx})`, sources[i].seeMoreUrl))
                    + li(idx, sources[i].providerDisplayName, sources[i].seeMoreUrl);
            }
        }
        const cards = (
            sessions[_session]?.details?.adaptiveCards || []
        )[0]?.body[0].text.split('\n\n')[0].split('\n').map(line => {
            const matchReg = /^\[\d*\]:\ ([^\ ]*)\ "(.*)"$/ig;
            return {
                providerDisplayName: line.replace(matchReg, '$2'),
                seeMoreUrl: line.replace(matchReg, '$1'),
            };
        }).filter(card => {
            for (let src of sources) {
                if (iCmp(src.seeMoreUrl, card.seeMoreUrl)) { return false; }
            }
            return card.providerDisplayName && verifyUrl(card.seeMoreUrl);
        });
        if (cards?.length) {
            sessions[_session].responseRendered += `\n\nLearn more:`;
            for (let i in cards) {
                sessions[_session].responseRendered += li(~~i + 1, cards[i].providerDisplayName, cards[i].seeMoreUrl);
            }
        }
        if (sessions[_session]?.details?.suggestedResponses?.length) {
            sessions[_session].responseRendered += `\n\nSuggested responses:`;
            sessions[_session].details.suggestedResponses.map((s, i) =>
                sessions[_session].responseRendered += li(~~i + 1, s.text)
            );
        }
        return sessions[_session];
    };
    const clear = (key) => key ? (delete sessions[key]) : (sessions = {});
    return { engine, client, send, clear };
};

export default init;
export {
    _NEED,
    init,
};
