import {
    ensureString, log as _log, renderText as _renderText, throwError
} from "./utilitas.mjs";

const _NEED = ['@waylaidwanderer/chatgpt-api'];
const [BING, CHATGPT] = ['BING', 'CHATGPT'];
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 1, ...o || {} });
const log = (content) => _log(content, import.meta.url);

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
    const send = async (message, options) => {
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
                message, { ...objSession, ...options || {} }
            );
        } catch (err) {
            // @todo: when this happens, just reset hal? not all the project?
            log(err);
            clear(_session);
            throwError(err?.message || err, 500);
        }
        sessions[_session].responseRendered = renderText(
            sessions[_session].response
        );
        const cards = (
            sessions[_session]?.details?.adaptiveCards || []
        )[0]?.body[0].text.split('\n\n').slice(0, -1);
        if (cards?.length) {
            sessions[_session].responseRendered += `\n\n***\nLearn more:\n${cards[0]}`;
        }
        const sources = sessions[_session]?.details?.sourceAttributions || [];
        if (sources.length) {
            sessions[_session].responseRendered += `\n\n***\nSource:`;
        }
        for (let i in sources) {
            sessions[_session].responseRendered
                += `\n${~~i + 1}. [${sources[i].providerDisplayName}](${sources[i].seeMoreUrl})`;
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
