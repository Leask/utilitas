import { ensureString, need } from './utilitas.mjs';

const _NEED = [
    'OpenAI',
];

const [name] = ['HAL 9000'];

let client;

const init = async (options) => {
    if (options?.apiKey) {
        const OpenAI = await need('openai');
        const openai = new OpenAI(options);
        client = openai.beta;
    }
    assert(client, 'Assistant API client has not been initialized.', 501);
    return client;
};

const createAssistant = async (options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    // https://platform.openai.com/docs/api-reference/assistants/createAssistant
    return await client.assistants.create({
        model: 'gpt-4', name, instructions: 'You are a helpful assistant.',
        tools: [
            { type: 'code_interpreter' },
            // { type: 'retrieval' },
            // { type: 'function' },
        ], ...options?.params || {},
        // description: null, file_ids: [], metadata: {},
    });
};

const listAssistant = async (options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    return (await client.assistants.list({
        order: 'asc', limit: '100', ...options?.params || {},
    })).data;
};

const ensureAssistant = async (options) => {
    const list = await listAssistant(options);
    return list.find(x => x.name === name) || await createAssistant(options);
};

const createThread = async (options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    // https://platform.openai.com/docs/api-reference/threads/createThread
    return await client.threads.create(options);
};

const getThread = async (threadId) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    assert(threadId, 'Thread ID is required.', 400)
    // https://platform.openai.com/docs/api-reference/threads/getThread
    return await client.threads.retrieve(threadId);
};

const ensureThread = async (options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    return await (options?.threadId
        ? getThread(options?.threadId)
        : createThread(options?.params)
    );
};

const createMessage = async (threadId, message, options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    // https://platform.openai.com/docs/api-reference/messages/createMessage
    return await client.threads.messages.create(threadId, message);
};

const listMessages = async (threadId, options) => {
    assert(client, 'Assistant API client has not been initialized.', 500);
    // https://platform.openai.com/docs/api-reference/messages/listMessages
    return JSON.stringify((await client.threads.messages.list(
        threadId, { limit: 1, ...options?.params || {} }
    )).data[0], null, 2);
};

const run = async (assistantId, threadId, options) => {
    return await client.threads.runs.create(
        threadId,
        { assistant_id: assistantId }
    );
};

const getRun = async (threadId, runId) => {
    return await client.threads.runs.retrieve(
        threadId,
        runId
    );
};

export default init;
export {
    _NEED,
    createAssistant,
    ensureAssistant,
    createMessage,
    ensureThread,
    getThread,
    listMessages,
    init,
    listAssistant,
    run,
    getRun,
};
