import { ensureString, need, throwError } from './utilitas.mjs';

const _NEED = [
    'OpenAI',
];

const [OPENAI] = ['OPENAI'];
const [name] = ['Alan'];
const [user] = ['user'];
const [gpt4, gpt4_1106] = ['gpt-4', 'gpt-4-1106-preview'];
const openaiProvider = { provider: OPENAI };
const openaiProviderBeta = { ...openaiProvider, beta: true };
const openaiDefaultModel = gpt4;
const getMsg = cnt => String.isString(cnt) ? { role: user, content: cnt } : cnt;

let openai;

const init = async (options) => {
    const provider = ensureString(options?.provider, { case: 'UP' });
    let client
    switch (provider) {
        case OPENAI:
            if (options?.apiKey) {
                const OpenAI = await need('openai');
                openai = new OpenAI(options);
            }
            client = options?.beta ? openai?.beta : openai;
            break;
        default:
            throwError(`Invalid AI provider: ${options?.provider || 'null'}`);
    }
    assert(client, 'AI engine has not been initialized.');
    return client;
};

const complete = async (content, options) => {
    const client = await init({ ...openaiProvider, ...options });
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses-1
    let [resp, result, chunk] = [await client.chat.completions.create({
        messages: [...options?.messages || [], getMsg(content)],
        model: openaiDefaultModel, stream: !!options?.stream,
    }), '', null];
    if (!options?.stream) {
        return options?.raw ? resp : resp.choices[0].message.content;
    }
    for await (chunk of resp) {
        chunk.choices[0].content = (result += chunk.choices[0]?.delta?.content || '');
        await options?.stream(options?.raw ? chunk : chunk.choices[0].content);
    }
    return options?.raw ? chunk : result;
};

const createAssistant = async (options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/assistants/createAssistant
    return await client.assistants.create({
        model: gpt4_1106, name,
        instructions: 'You are a helpful assistant.',
        tools: [
            { type: 'code_interpreter' },
            { type: 'retrieval' },
            // { type: 'function' },
        ], ...options?.params || {},
        // description: null, file_ids: [], metadata: {},
    });
};

const listAssistant = async (options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return (await client.assistants.list({
        order: 'asc', limit: '100', ...options?.params || {},
    })).data;
};

const ensureAssistant = async (options) => {
    const list = await listAssistant(options);
    return list.find(x => x.name === name) || await createAssistant(options);
};

const createThread = async (options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/threads/createThread
    return await client.threads.create(options);
};

const getThread = async (threadId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    assert(threadId, 'Thread ID is required.', 400)
    // https://platform.openai.com/docs/api-reference/threads/getThread
    return await client.threads.retrieve(threadId);
};

const ensureThread = async opts => await (
    opts?.threadId ? getThread(opts?.threadId) : createThread(opts?.params)
);

const createMessage = async (threadId, content, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/messages/createMessage
    return await client.threads.messages.create(threadId, getMsg(content));
};

const listMessages = async (threadId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/messages/listMessages
    return await client.threads.messages.list(threadId, options);
};

const getLatestMessage = async (threadId, options) => (
    await listMessages(threadId, { limit: 1, ...options })
)?.data?.[0];

const run = async (assistantId, threadId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.threads.runs.create(
        threadId, { assistant_id: assistantId }
    );
};

const getRun = async (threadId, runId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.threads.runs.retrieve(threadId, runId);
};

const prompt = async (content, options) => {
    const assistant = await ensureAssistant(options);
    const thread = await ensureThread(options);
    const messageSent = await createMessage(thread.id, content, options);
    let objRun = await run(assistant.id, thread.id, options);
    objRun = await new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
            try {
                const resp = await getRun(thread.id, objRun.id);
                if (resp?.status === 'completed') {
                    clearInterval(timer);
                    resolve(resp);
                }
            } catch (err) {
                clearInterval(timer);
                reject(err);
            }
        }, 1000);
    });
    const messageReceived = await getLatestMessage(thread.id, options);
    return {
        assistant, thread, messageSent, run: objRun, messageReceived,
        response: messageReceived.content[0].text.value,
    };
};


export default init;
export {
    _NEED,
    complete,
    createAssistant,
    createMessage,
    ensureAssistant,
    ensureThread,
    getLatestMessage,
    getRun,
    getThread,
    init,
    listAssistant,
    listMessages,
    prompt,
    run,
};