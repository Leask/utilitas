import { convert } from './storage.mjs';
import { ensureString, need, throwError } from './utilitas.mjs';
import { loop, end } from './event.mjs';

const _NEED = [
    '@google-cloud/aiplatform', '@google-cloud/vertexai',
    '@google/generative-ai', 'OpenAI',
];

const [
    GPT35_T, GPT4, GPT4_1106, GEMINI_PRO, GEMINI_PRO_VISION, EMBEDDING_ADA,
    EMBEDDING_001, EMBEDDING_GECKO_001, EMBEDDING_GECKO_002,
    EMBEDDING_GECKO_ML001,
] = [
        'gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview', 'gemini-pro',
        'gemini-pro-vision', 'text-embedding-ada-002', 'embedding-001',
        'textembedding-gecko@001', 'textembedding-gecko@002',
        'textembedding-gecko-multilingual@001',
    ];

const [
    openaiDefaultModel, vertexDefaultModel, geminiDefaultModel,
    openaiEmbeddingModel, geminiEmbeddingModel, vertexEmbeddingModel,
    DEFAULT_GPT_TRAINING_MODEL,
] = [
        GPT4, GEMINI_PRO_VISION, GEMINI_PRO, EMBEDDING_ADA, EMBEDDING_001,
        EMBEDDING_GECKO_ML001, GPT35_T,
    ];

const [tool, provider, messages] = [
    type => ({ type }),
    provider => ({ provider }),
    messages => ({ messages }),
];

const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', 'function'].map(tool);
const [name, user, system, assistant] = ['Alan', 'user', 'system', 'assistant'];
const [STREAM, errorMessage] = ['STREAM', 'Invalid file data.'];
const GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS';
const [OPENAI, VERTEX, GEMINI] = ['OPENAI', 'VERTEX', 'GEMINI'];
const silent = true;
const GPT_QUERY_LIMIT = 100;
const [openaiProvider, vertexProvider, geminiProvider]
    = [provider(OPENAI), provider(VERTEX), provider(GEMINI)];
const openaiProviderBeta = { ...openaiProvider, beta: true };

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
                const aiplatform = await need('@google-cloud/aiplatform');
                const [project, location]
                    = [options?.project, options?.location || 'us-east4'];
                vertex = {
                    project, location, helpers: aiplatform.helpers,
                    generative: (new VertexAI({
                        project, location,
                    })).preview.getGenerativeModel({
                        model: options?.model || vertexDefaultModel,
                        generation_config: {
                            max_output_tokens: 2048, temperature: 0.4, top_p: 1,
                            top_k: 32, ...options?.generation_config || {},
                        },
                    }),
                    prediction: new aiplatform.v1.PredictionServiceClient({
                        apiEndpoint: 'us-central1-aiplatform.googleapis.com',
                    }),
                };
            }
            client = vertex;
            break;
        case GEMINI:
            if (options?.apiKey) {
                const { GoogleGenerativeAI } = await need('@google/generative-ai');
                const genAi = new GoogleGenerativeAI(options.apiKey);
                gemini = {
                    generative: genAi.getGenerativeModel({ model: geminiDefaultModel }),
                    embedding: genAi.getGenerativeModel({ model: geminiEmbeddingModel }),
                };
            }
            client = gemini;
            break;
        default:
            throwError(`Invalid AI provider: ${options?.provider || 'null'}`);
    }
    assert(client, 'AI engine has not been initialized.');
    return client;
};

const buildGptMessage = (content, options) => {
    assert(content, 'Content is required.');
    return String.isString(content) ? {
        role: options?.role || user, content
    } : content;
};

const buildVertexMessage = (text, options) => {
    assert(text, 'Text is required.');
    String.isString(text) ? {
        role: options?.role || user, parts: [{ text }]
    } : text;
};

const buildGeminiMessage = text => String.isString(text) ? [{ text }] : text;

const promptChatGPT = async (content, options) => {
    const client = await init({ ...openaiProvider, ...options });
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses-1
    let [resp, result, chunk] = [await client.chat.completions.create({
        ...messages([...options?.messages || [], buildGptMessage(content)]),
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
        order: 'asc', limit: `${GPT_QUERY_LIMIT}`, ...options?.params || {},
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
    const loopName = `GPT-ASSISTANT-${objRun.id}`;
    objRun = await new Promise((resolve, reject) => loop(async () => {
        try {
            const resp = await getRun(thread.id, objRun.id);
            options?.tick && await options?.tick(resp);
            if (resp?.status !== 'completed') { return; }
            resolve(resp);
        } catch (err) {
            reject(err);
        }
        await end(loopName);
    }, 3, 2, 1, loopName, { silent, ...options }));
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

const uploadFileForFineTuning = async (content, options) => await uploadFile(
    content, { suffix: 'jsonl', ...options, params: { purpose: 'fine-tune' } }
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
        assistant_id, { limit: GPT_QUERY_LIMIT, ...options?.params }
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
    const { generative } = await init({ ...vertexProvider, ...options });
    return await handleGeminiResponse(generative.generateContentStream({
        contents: [...options?.messages || [], buildVertexMessage(content)],
    }), options);
};

const promptGemini = async (content, options) => {
    const { generative } = await init({ ...geminiProvider, ...options });
    // https://github.com/google/generative-ai-js/blob/main/samples/node/advanced-chat.js
    const chat = generative.startChat({
        history: options?.messages || [],
        generationConfig: { ...options?.generationConfig || {} },
    });
    return handleGeminiResponse(chat.sendMessageStream(
        buildGeminiMessage(content)
    ), options);
};

const createOpenAIEmbedding = async (input, options) => {
    const client = await init({ ...openaiProvider, ...options });
    assert(input, 'Text is required.', 400);
    const resp = await client.embeddings.create({
        model: openaiEmbeddingModel, input,
    });
    return options?.raw ? resp : resp?.data[0].embedding;
};

const createGeminiEmbedding = async (input, options) => {
    const { embedding } = await init({ ...geminiProvider, ...options });
    assert(input, 'Text is required.', 400);
    const resp = await embedding.embedContent(input);
    return options?.raw ? resp : resp?.embedding.values;
};

const vectorPredict = async (model, instance, options) => {
    const { project, location, prediction, helpers }
        = await init({ ...vertexProvider, ...options });
    const [resp] = await prediction.predict({
        endpoint: [
            'projects', project,
            'locations', location,
            'publishers', options?.publisher || 'google',
            'models', model,
        ].join('/'),
        instances: [helpers.toValue(instance)],
        parameters: helpers.toValue(options?.parameter || {}),
    });
    return options?.raw ? resp : resp.predictions[0];
};

const createVertexEmbedding = async (content, options) => {
    // https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings
    // task_type	Description
    // RETRIEVAL_QUERY	Specifies the given text is a query in a search/ retrieval setting.
    // RETRIEVAL_DOCUMENT	Specifies the given text is a document in a search / retrieval setting.
    // SEMANTIC_SIMILARITY	Specifies the given text will be used for Semantic Textual Similarity(STS).
    // CLASSIFICATION	Specifies that the embeddings will be used for classification.
    // CLUSTERING	Specifies that the embeddings will be used for clustering.
    const { helpers } = await init({ ...vertexProvider, ...options });
    const resp = await vectorPredict(vertexEmbeddingModel, {
        ...options?.instance || {}, content,
    }, {
        ...options, parameter: {
            ...options?.parameter || {},
            temperature: 0, maxOutputTokens: 256, topP: 0, topK: 1,
        }
    });
    return options?.raw ? resp : helpers.fromValue(resp).embeddings.values;
};

const buildGptTrainingCase = (prompt, response, options) => messages([
    ...options?.systemPrompt ? [buildGptMessage(options.systemPrompt, { role: system })] : [],
    buildGptMessage(prompt),
    buildGptMessage(response, { role: assistant }),
]);

const buildGptTrainingCases = (cases, opts) => cases.map(x => JSON.stringify(
    buildGptTrainingCase(x.prompt, x.response, { ...x.options, ...opts })
)).join('\n');

const createGptFineTuningJob = async (training_file, options) => {
    const client = await init({ ...openaiProvider, ...options });
    return await client.fineTuning.jobs.create({
        training_file, model: options?.model || GPT35_T,
    })
};

const getGptFineTuningJob = async (job_id, options) => {
    const client = await init({ ...openaiProvider, ...options });
    // https://platform.openai.com/finetune/[job_id]?filter=all
    return await client.fineTuning.jobs.retrieve(job_id);
};

const cancelGptFineTuningJob = async (job_id, options) => {
    const client = await init({ ...openaiProvider, ...options });
    return await client.fineTuning.jobs.cancel(job_id);
};

const listGptFineTuningJobs = async (options) => {
    const client = await init({ ...openaiProvider, ...options });
    const resp = await client.fineTuning.jobs.list({
        limit: GPT_QUERY_LIMIT, ...options?.params
    });
    return options?.raw ? resp : resp.data;
};

const listGptFineTuningEvents = async (job_id, options) => {
    const client = await init({ ...openaiProvider, ...options });
    const resp = await client.fineTuning.jobs.listEvents(job_id, {
        limit: GPT_QUERY_LIMIT, ...options?.params,
    });
    return options?.raw ? resp : resp.data;
};

const tailGptFineTuningEvents = async (job_id, options) => {
    assert(job_id, 'Job ID is required.');
    const [loopName, listOpts] = [`GPT-${job_id}`, {
        ...options, params: { ...options?.params, order: 'ascending' }
    }];
    let lastEvent;
    return await loop(async () => {
        const resp = await listGptFineTuningEvents(job_id, {
            ...listOpts, params: {
                ...listOpts?.params,
                ...(lastEvent ? { after: lastEvent.id } : {}),
            },
        });
        for (lastEvent of resp) {
            lastEvent.message.includes('completed') && await end(loopName);
            await options?.stream(lastEvent);
        }
    }, 3, 2, 1, loopName, { silent, ...options });
};

export default init;
export {
    _NEED,
    CODE_INTERPRETER,
    FUNCTION,
    GPT35_T,
    GPT4_1106,
    DEFAULT_GPT_TRAINING_MODEL,
    GPT4,
    RETRIEVAL,
    buildGptTrainingCase,
    buildGptTrainingCases,
    cancelGptFineTuningJob,
    createAssistant,
    createGeminiEmbedding,
    createGptFineTuningJob,
    createMessage,
    createOpenAIEmbedding,
    createVertexEmbedding,
    listGptFineTuningEvents,
    deleteAllFilesFromAssistant,
    deleteAssistant,
    deleteFile,
    deleteFileFromAssistant,
    deleteThread,
    detachFileFromAssistant,
    ensureAssistant,
    ensureThread,
    getAssistant,
    getGptFineTuningJob,
    getLatestMessage,
    getRun,
    getThread,
    init,
    listAssistant,
    listAssistantFiles,
    listFiles,
    listGptFineTuningJobs,
    listMessages,
    modifyAssistant,
    promptAssistant,
    promptChatGPT,
    promptGemini,
    promptVertex,
    run,
    uploadFile,
    tailGptFineTuningEvents,
    uploadFileForAssistants,
    uploadFileForFineTuning,
    uploadFileForRetrieval,
};
