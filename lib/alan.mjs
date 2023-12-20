import { ensureString, need, throwError } from './utilitas.mjs';
import { convert } from './storage.mjs';

const _NEED = ['OpenAI', '@google-cloud/vertexai', '@google/generative-ai'];
const [name, user] = ['Alan', 'user'];
const [STREAM, role, errorMessage] = ['STREAM', user, 'Invalid file data.'];
const GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS';
const [tool, provider] = [type => ({ type }), provider => ({ provider })];
const [OPENAI, VERTEX, GEMINI] = ['OPENAI', 'VERTEX', 'GEMINI'];
const [GPT4, GPT4_1106, GEMINI_PRO, GEMINI_PRO_VISION]
    = ['gpt-4', 'gpt-4-1106-preview', 'gemini-pro', 'gemini-pro-vision'];
const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', 'function'].map(tool);
const [openaiProvider, vertexProvider, geminiProvider]
    = [provider(OPENAI), provider(VERTEX), provider(GEMINI)];
const openaiProviderBeta = { ...openaiProvider, beta: true };
const [openaiDefaultModel, vertexDefaultModel, geminiDefaultModel]
    = [GPT4, GEMINI_PRO_VISION, GEMINI_PRO];

let openai, vertex, gemini;

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
        case VERTEX:
            if (options?.credentials) {
                process.env[GOOGLE_APPLICATION_CREDENTIALS] = options.credentials;
                const { VertexAI } = await need('@google-cloud/vertexai');
                const vertexAi = new VertexAI({
                    project: options?.project,
                    location: options?.location || 'us-east4',
                });
                vertex = vertexAi.preview.getGenerativeModel({
                    model: options?.model || vertexDefaultModel,
                    generation_config: {
                        max_output_tokens: 2048, temperature: 0.4, top_p: 1,
                        top_k: 32, ...options?.generation_config || {},
                    },
                });
            }
            client = vertex;
            break;
        case GEMINI:
            if (options?.apiKey) {
                const { GoogleGenerativeAI } = await need('@google/generative-ai');
                const genAi = new GoogleGenerativeAI(options.apiKey);
                gemini = genAi.getGenerativeModel({ model: geminiDefaultModel });
            }
            client = gemini;
            break;
        default:
            throwError(`Invalid AI provider: ${options?.provider || 'null'}`);
    }
    assert(client, 'AI engine has not been initialized.');
    return client;
};

const buildGptMessage = content =>
    String.isString(content) ? { role, content } : content;

const buildVertexMessage = text =>
    String.isString(text) ? { role, parts: [{ text }] } : text;

const buildGeminiMessage = text => String.isString(text) ? [{ text }] : text;

const promptChatGPT = async (content, options) => {
    const client = await init({ ...openaiProvider, ...options });
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses-1
    let [resp, result, chunk] = [await client.chat.completions.create({
        messages: [...options?.messages || [], buildGptMessage(content)],
        model: options?.model || openaiDefaultModel, stream: !!options?.stream,
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
        model: GPT4_1106, name,
        instructions: 'You are a helpful assistant.',
        tools: [CODE_INTERPRETER, RETRIEVAL], // 'FUNCTION'
        ...options?.params || {},
        // description: null, file_ids: [], metadata: {},
    });
};

const getAssistant = async (assistantId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.assistants.retrieve(assistantId);
};

const modifyAssistant = async (assistantId, assistant, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.assistants.update(assistantId, assistant);
};

const deleteAssistant = async (assistantId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    const cleanup = await deleteAllFilesFromAssistant(assistantId, options);
    const respDel = await client.assistants.del(assistantId);
    return { cleanup, delete: respDel };
};

const listAssistant = async (options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return (await client.assistants.list({
        order: 'asc', limit: '100', ...options?.params || {},
    })).data;
};

const ensureAssistant = async opts => {
    if (opts?.assistantId) { return await getAssistant(opts?.assistantId); }
    const list = await listAssistant(opts);
    return list.find(x => x.name === name) || await createAssistant(opts);
};

const createThread = async (options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/threads/createThread
    return await client.threads.create({ ...options?.params || {} });
};

const getThread = async (threadId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/threads/getThread
    return await client.threads.retrieve(threadId);
};

const deleteThread = async (threadId, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.threads.del(threadId);
};

const ensureThread = async options => await (
    options?.threadId ? getThread(options?.threadId) : createThread(options)
);

const createMessage = async (threadId, content, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    // https://platform.openai.com/docs/api-reference/messages/createMessage
    return await client.threads.messages.create(threadId, buildGptMessage(content));
};

const listMessages = async (threadId, o) => {
    const client = await init({ ...openaiProviderBeta, ...o });
    // https://platform.openai.com/docs/api-reference/messages/listMessages
    return await client.threads.messages.list(threadId, { ...o?.params || {} });
};

const getLatestMessage = async (threadId, options) => (
    await listMessages(threadId, { ...options, params: { limit: 1 } })
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

const promptAssistant = async (content, options) => {
    const assistant = await ensureAssistant(options);
    const thread = await ensureThread(options);
    const messageSent = await createMessage(thread.id, content, options);
    let objRun = await run(assistant.id, thread.id, options);
    objRun = await new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
            try {
                const resp = await getRun(thread.id, objRun.id);
                options?.tick && await options?.tick(resp);
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
    const threadDeleted = options?.deleteThread ? await deleteThread(thread.id) : null;
    return {
        assistant, thread, messageSent, run: objRun, messageReceived,
        threadDeleted, response: messageReceived.content[0].text.value,
    };
};

const uploadFile = async (input, options) => {
    const client = await init({ ...openaiProvider, ...options });
    const { content: file, cleanup } = await convert(input, {
        input: options?.input, ...options || {}, expected: STREAM, errorMessage,
        suffix: options?.suffix,
        withCleanupFunc: true,
    });
    const resp = await client.files.create({ file, ...options?.params || {} });
    await cleanup();
    return resp;
};

const uploadFileForAssistants = async (content, options) => await uploadFile(
    content, { ...options, params: { purpose: 'assistants' } }
);

const attachFileToAssistant = async (assistantId, file_id, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.assistants.files.create(assistantId, { file_id });
};

const detachFileFromAssistant = async (assistantId, file_id, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    return await client.assistants.files.del(assistantId, file_id);
};

const deleteFileFromAssistant = async (assistantId, file_id, options) => {
    const detach = await detachFileFromAssistant(assistantId, file_id, options);
    const respDel = await deleteFile(file_id, options);
    return { detach, delete: respDel };
};

const deleteAllFilesFromAssistant = async (assistantId, options) => {
    const files = await listAssistantFiles(assistantId, options);
    const delPms = [];
    for (const file of files) {
        delPms.push(deleteFileFromAssistant(assistantId, file.id, options));
    }
    return await Promise.all(delPms);
};

const uploadFileForRetrieval = async (assistantId, content, options) => {
    const file = await uploadFileForAssistants(content, options);
    return await attachFileToAssistant(assistantId, file.id, options);
};

const listFiles = async (options) => {
    const client = await init({ ...openaiProvider, ...options });
    const files = [];
    const list = await client.files.list(options?.params || {});
    for await (const file of list) { files.push(file); }
    return files;
};

const deleteFile = async (file_id, options) => {
    const client = await init({ ...openaiProvider, ...options });
    return await client.files.del(file_id);
};

const listAssistantFiles = async (assistant_id, options) => {
    const client = await init({ ...openaiProviderBeta, ...options });
    const resp = await client.assistants.files.list(
        assistant_id, { limit: 100, ...options?.params }
    );
    return options?.raw ? resp : resp.data;
};

const handleGeminiResponse = async (resp, options) => {
    const _resp = await resp;
    if (options?.stream) {
        for await (const chunk of _resp.stream) {
            await options.stream(
                options?.raw ? chunk : chunk.candidates[0].content.parts
            );
        }
    }
    const result = await _resp.response;
    return options?.raw ? result : result.candidates[0].content.parts;
};

const promptVertex = async (content, options) => {
    const client = await init({ ...vertexProvider, ...options });
    return await handleGeminiResponse(client.generateContentStream({
        contents: [...options?.messages || [], buildVertexMessage(content)],
    }), options);
};

const promptGemini = async (content, options) => {
    const client = await init({ ...geminiProvider, ...options });
    // https://github.com/google/generative-ai-js/blob/main/samples/node/advanced-chat.js
    const chat = client.startChat({
        history: options?.messages || [],
        generationConfig: { ...options?.generationConfig || {} },
    });
    return handleGeminiResponse(chat.sendMessageStream(
        buildGeminiMessage(content)
    ), options);
};

export default init;
export {
    _NEED,
    CODE_INTERPRETER,
    FUNCTION,
    GPT4_1106,
    GPT4,
    RETRIEVAL,
    createAssistant,
    createMessage,
    deleteAllFilesFromAssistant,
    deleteAssistant,
    deleteFile,
    deleteFileFromAssistant,
    deleteThread,
    detachFileFromAssistant,
    ensureAssistant,
    ensureThread,
    getAssistant,
    getLatestMessage,
    getRun,
    getThread,
    init,
    listAssistant,
    listAssistantFiles,
    listFiles,
    listMessages,
    modifyAssistant,
    promptAssistant,
    promptChatGPT,
    promptGemini,
    promptVertex,
    run,
    uploadFile,
    uploadFileForAssistants,
    uploadFileForRetrieval,
};
