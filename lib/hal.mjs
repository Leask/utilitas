import { ensureString, renderText, throwError } from "./utilitas.mjs";

const _NEED = ['@waylaidwanderer/chatgpt-api'];

const init = async (options) => {
    const sessions = {};
    let provider, engine, client;
    switch ((provider = ensureString(options?.provider, { case: 'UP' }))) {
        case 'BING':
            // https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/demos/use-bing-client.js
            engine = (await import('@waylaidwanderer/chatgpt-api')).BingAIClient;
            client = new engine(options?.clientOptions);
            break;
        case 'CHATGPT':
            // https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/demos/use-client.js
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
    const send = async (message, options) => {
        const _session = options?.session || '_';
        sessions[_session] = await client.sendMessage(message, {
            conversationSignature: sessions?.[_session]?.conversationSignature,
            conversationId: sessions?.[_session]?.conversationId,
            clientId: sessions?.[_session]?.clientId,
            invocationId: sessions?.[_session]?.invocationId,
            ...options || {},
        });
        sessions[_session].responseRendered = renderText(
            sessions[_session].response
        );
        const cards = sessions[_session]?.details?.adaptiveCards || [];
        if (cards.length) {
            sessions[_session].responseRendered += `\n\n***\nLearn more:\n`;
            sessions[_session].responseRendered += cards[0].body[0].text.split('\n\n')[0];
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
    return { engine, client, send };
};

export default init;
export {
    _NEED,
    init,
};
