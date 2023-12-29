import { convert } from './storage.mjs';
import { create as createUoid } from './uoid.mjs';
import { loop, end } from './event.mjs';

import {
    ensureString, ignoreErrFunc, log as _log, need, renderText as _renderText,
    throwError, trim,
} from './utilitas.mjs';

const _NEED = [
    '@google-cloud/aiplatform', '@google-cloud/vertexai',
    '@google/generative-ai', 'js-tiktoken', 'OpenAI',
];

const [
    GPT_35_TURBO, GPT_35_TURBO_1106, GPT_4, GPT_4_1106, GPT_4_VISION,
    GEMINI_PRO, GEMINI_PRO_VISION, TEXT_EMBEDDING_ADA_002, EMBEDDING_001,
    EMBEDDING_GECKO_001, EMBEDDING_GECKO_002, EMBEDDING_GECKO_ML001, MISTRAL,
] = [
        'gpt-3.5-turbo', 'gpt-3.5-turbo-1106', 'gpt-4', 'gpt-4-1106',
        'gpt-4-1106-preview', 'gemini-pro', 'gemini-pro-vision',
        'text-embedding-ada-002', 'embedding-001', 'textembedding-gecko@001',
        'textembedding-gecko@002', 'textembedding-gecko-multilingual@001',
        'mistral',
    ];

const [tool, provider, messages, text] = [
    type => ({ type }), provider => ({ provider }),
    messages => ({ messages }), text => ({ text }),
];

const [name, user, system, assistant, MODEL]
    = ['Alan', 'user', 'system', 'assistant', 'model'];
const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', 'function'].map(tool);
const [NOT_INIT, INVALID_FILE]
    = ['AI engine has not been initialized.', 'Invalid file data.'];
const [silent, STREAM, instructions]
    = [true, 'STREAM', 'You are a helpful assistant.'];
const GOOGLE_APPLICATION_CREDENTIALS = 'GOOGLE_APPLICATION_CREDENTIALS';
const [tokenRatio, tokenSafeRatio, GPT_QUERY_LIMIT, minsOfDay]
    = [100 / 75, 1.1, 100, 60 * 24]; // https://platform.openai.com/tokenizer
const tokenSafe = count => Math.ceil(count * tokenSafeRatio);
const clients = {};
const LOG = { log: true };
const sessionType = `${name.toUpperCase()}-SESSION`;
const unifyProvider = options => unifyType(options?.provider, 'AI provider');
const unifyEngine = options => unifyType(options?.engine, 'AI engine');
const packResp = _text => [text(_text)];
const trimTailing = text => text.replace(/[\.\s]*$/, '');
const newSessionId = () => createUoid({ type: sessionType });
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 0, ...o || {} });
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const [png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv] = [
    'image/png', 'image/jpeg', 'video/mov', 'video/mpeg', 'video/mp4',
    'video/mpg', 'video/avi', 'video/wmv', 'video/mpegps', 'video/flv',
];

const [
    OPENAI, VERTEX, GEMINI, CHATGPT, ASSISTANT, OPENAI_EMBEDDING,
    GEMINI_EMEDDING, VERTEX_EMEDDING, OPENAI_TRAINING, OLLAMA,
] = [
        'OPENAI', 'VERTEX', 'GEMINI', 'CHATGPT', 'ASSISTANT',
        'OPENAI_EMBEDDING', 'GEMINI_EMEDDING', 'VERTEX_EMEDDING',
        'OPENAI_TRAINING', 'OLLAMA',
    ];

const DEFAULT_CHAT_ENGINE = CHATGPT;
const DEFAULT_MODELS = {
    [ASSISTANT]: GPT_35_TURBO,
    [CHATGPT]: GPT_35_TURBO,
    [GEMINI_EMEDDING]: EMBEDDING_001,
    [GEMINI]: GEMINI_PRO,
    [OLLAMA]: MISTRAL,
    [OPENAI_EMBEDDING]: TEXT_EMBEDDING_ADA_002,
    [OPENAI_TRAINING]: GPT_35_TURBO_1106,
    [VERTEX_EMEDDING]: EMBEDDING_GECKO_ML001,
    [VERTEX]: GEMINI_PRO_VISION,
};

const chatConfig = {
    sessions: new Map(), engines: {}, systemPrompt: instructions,
};

// https://platform.openai.com/docs/models/continuous-model-upgrades
// https://platform.openai.com/account/limits // Tier 2
// https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
// https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
const MODELS = {
    [GPT_35_TURBO]: {
        contextWindow: 4096,
        tokenLimitsTPM: 160000,
        requestLimitsRPM: 5000,
        trainingData: 'Sep 2021',
    },
    [GPT_35_TURBO_1106]: {
        contextWindow: 16385,
        maxOutputTokens: 4096,
        tokenLimitsTPM: 160000,
        requestLimitsRPM: 5000,
        trainingData: 'Sep 2021',
    },
    [GPT_4]: { // gpt-4-0613
        contextWindow: 8192,
        tokenLimitsTPM: 80000,
        requestLimitsRPM: 5000,
        trainingData: 'Sep 2021',
    },
    [GPT_4_1106]: {
        contextWindow: 128000,
        maxOutputTokens: 4096,
        tokenLimitsTPM: 300000,
        tokenLimitsTPD: 5000000,
        requestLimitsRPM: 5000,
        trainingData: 'Apr 2023',
    },
    [GPT_4_VISION]: {
        contextWindow: 128000,
        maxOutputTokens: 4096,
        tokenLimitsTPM: 40000,
        requestLimitsRPM: 120,
        requestLimitsRPD: 1500,
        trainingData: 'Apr 2023',
    },
    [GEMINI_PRO]: {
        contextWindow: 32760,
        maxOutputTokens: 8192,
        trainingData: 'Feb 2023',
    },
    [GEMINI_PRO_VISION]: {
        contextWindow: 16384,
        maxOutputTokens: 2048,
        maxImageSize: Infinity,
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        maxImagePerPrompt: 16,
        maxVideoLength: 60 * 2,
        trainingData: 'Feb 2023',
        supportedMimeTypes: [
            png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv,
        ],
    },
    [MISTRAL]: {
        contextWindow: 128000,
        tokenLimitsTPM: Infinity,
        requestLimitsRPM: Infinity,
    },
    [TEXT_EMBEDDING_ADA_002]: {
        contextWindow: 5000000,
        requestLimitsRPM: 5000,
        trainingData: 'Oct 2019',
    },
};

for (const n in MODELS) {
    MODELS[n]['name'] = n;
    if ([TEXT_EMBEDDING_ADA_002].includes(n)) { continue; }
    MODELS[n].maxOutputTokens = MODELS[n].maxOutputTokens
        || Math.ceil(MODELS[n].contextWindow * 0.4);
    MODELS[n].maxInputTokens = MODELS[n].maxInputTokens
        || (MODELS[n].contextWindow - MODELS[n].maxOutputTokens);
    MODELS[n].tokenLimitsTPD = MODELS[n].tokenLimitsTPD
        || (MODELS[n].tokenLimitsTPM * minsOfDay);
    MODELS[n].requestLimitsRPD = MODELS[n].requestLimitsRPD
        || (MODELS[n].requestLimitsRPM * minsOfDay);
    MODELS[n].requestCapacityRPM = Math.ceil(Math.min(
        MODELS[n].tokenLimitsTPM / MODELS[n].maxInputTokens,
        MODELS[n].requestLimitsRPM, MODELS[n].requestLimitsRPD / minsOfDay
    ));
}

const unifyType = (type, name) => {
    const TYPE = ensureString(type, { case: 'UP' });
    assert(TYPE, `${name} is required.`);
    return TYPE;
};

const init = async (options) => {
    const provider = unifyProvider(options);
    switch (provider) {
        case OPENAI:
            if (options?.apiKey) {
                const OpenAI = await need('openai');
                // const { getEncoding } = await need('js-tiktoken');
                const openai = new OpenAI(options);
                clients[provider] = {
                    client: openai, clientBeta: openai.beta,
                    // tokeniser: getEncoding(options?.tokenModel || 'cl100k_base'),
                    // countTokens: text => tokenSafe(
                    //     clients[provider].tokeniser.encode(text).length
                    // ),
                };
            }
            break;
        case VERTEX:
            if (options?.credentials) {
                process.env[GOOGLE_APPLICATION_CREDENTIALS] = options.credentials;
                const { VertexAI } = await need('@google-cloud/vertexai');
                const aiplatform = await need('@google-cloud/aiplatform');
                const [project, location] = [
                    options?.project,
                    options?.location || 'northamerica-northeast1', // 'us-east4'
                ];
                clients[provider] = {
                    project, location, helpers: aiplatform.helpers, // countTokens,
                    generative: (new VertexAI({
                        project, location,
                    })).preview.getGenerativeModel({
                        model: options?.model || DEFAULT_MODELS[VERTEX],
                        generation_config: {
                            // https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
                            // max_output_tokens: 2048, temperature: 0.4,
                            // top_p: 1, top_k: 32,
                            ...options?.generation_config || {},
                        },
                    }),
                    prediction: new aiplatform.v1.PredictionServiceClient({
                        apiEndpoint: 'us-central1-aiplatform.googleapis.com',
                    }),
                };
            }
            break;
        case GEMINI:
            if (options?.apiKey) {
                const { GoogleGenerativeAI } = await need('@google/generative-ai');
                const genAi = new GoogleGenerativeAI(options.apiKey);
                clients[provider] = {
                    generative: genAi.getGenerativeModel({
                        model: options?.model || DEFAULT_MODELS[GEMINI],
                    }),
                    embedding: genAi.getGenerativeModel({
                        model: DEFAULT_MODELS[GEMINI_EMEDDING],
                    }),
                    // countTokens,
                };
            }
            break;
        case OLLAMA:
            clients[provider] = {
                endpoint: options?.endpoint || 'http://localhost:11434',
            };
            break;
        default:
            throwError(`Invalid AI provider: ${options?.provider || 'null'}`);
    }
    assert(clients[provider], NOT_INIT);
    return clients[provider];
};

const countTokens = input => tokenSafe((
    String.isString(input) ? input : JSON.stringify(input)
).split(/[^a-z0-9]/i).length * tokenRatio);

const buildGptMessage = (content, options) => {
    assert(content, 'Content is required.');
    return String.isString(content) ? {
        role: options?.role || user, content
    } : content;
};

const buildVertexMessage = (text, options) => {
    assert(text, 'Text is required.');
    return String.isString(text) ? {
        role: options?.role || user, parts: [{ text }]
    } : text;
};

const buildGeminiMessage = text => String.isString(text) ? [{ text }] : text;

const [getOpenAIClient, getVertexClient, getGeminiClient, getOllamaClient]
    = [OPENAI, VERTEX, GEMINI, OLLAMA].map(
        x => async options => await init({ ...provider(x), ...options })
    );

const listOpenAIModels = async (options) => {
    const { client } = await getOpenAIClient(options);
    const resp = await client.models.list();
    return options?.raw ? resp : resp.data;
};

const packGptResp = (resp, options) => {
    if (options?.raw) { return resp; }
    else if (options?.simple) { return resp.choices[0].message.content; }
    return packResp(resp.choices[0].message.content);
};

const promptChatGPT = async (content, options) => {
    const { client } = await getOpenAIClient(options);
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses-1
    let [resp, result, chunk] = [await client.chat.completions.create({
        ...messages([...options?.messages || [], buildGptMessage(content)]),
        model: options?.model || DEFAULT_MODELS[CHATGPT],
        stream: !!options?.stream,
    }), '', null];
    if (!options?.stream) { return { response: packGptResp(resp, options) } }
    for await (chunk of resp) {
        chunk.choices[0].message = {
            content: result += chunk.choices[0]?.delta?.content || '',
        };
        await ignoreErrFunc(async () => await options?.stream?.(
            packGptResp(chunk, options)
        ), LOG);
    }
    return { response: packGptResp(chunk, options) };
};

const promptOllama = async (content, options) => {
    const { endpoint } = await getOllamaClient(options);
    // https://github.com/jmorganca/ollama/blob/main/examples/typescript-simplechat/client.ts
    const resp = await fetch(`${endpoint}/api/chat`, {
        method: 'POST', body: JSON.stringify({
            ...messages([...options?.messages || [], buildGptMessage(content)]),
            model: options?.model || DEFAULT_MODELS[OLLAMA],
        }),
    });
    const reader = resp.body?.getReader();
    reader || throwError('Failed to request Ollama API.');
    let [chunk, result] = [null, ''];
    while (true) {
        const { done, value } = await reader.read();
        if (done) { break; }
        const jsonl = trim(new TextDecoder().decode(value)).split('\n');
        for (const line of jsonl) {
            chunk = await ignoreErrFunc(() => JSON.parse(line));
            result += chunk.message?.content || '';
            chunk.done || await ignoreErrFunc(async () =>
                await options?.stream?.(
                    options?.raw ? chunk : packResp(result)
                ), LOG
            );
        }
    }
    return { response: options?.raw ? chunk : packResp(result) };
};

const createAssistant = async (options) => {
    const { clientBeta } = await getOpenAIClient(options);
    // https://platform.openai.com/docs/api-reference/assistants/createAssistant
    return await clientBeta.assistants.create({
        model: DEFAULT_MODELS[ASSISTANT], name, instructions,
        tools: [CODE_INTERPRETER, RETRIEVAL], // 'FUNCTION'
        ...options?.params || {},
        // description: null, file_ids: [], metadata: {},
    });
};

const getAssistant = async (assistantId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.assistants.retrieve(assistantId);
};

const modifyAssistant = async (assistantId, assistant, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.assistants.update(assistantId, assistant);
};

const deleteAssistant = async (assistantId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    const cleanup = await deleteAllFilesFromAssistant(assistantId, options);
    const respDel = await clientBeta.assistants.del(assistantId);
    return { cleanup, delete: respDel };
};

const listAssistant = async (options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return (await clientBeta.assistants.list({
        order: 'asc', limit: `${GPT_QUERY_LIMIT}`, ...options?.params || {},
    })).data;
};

const ensureAssistant = async opts => {
    if (opts?.assistantId) { return await getAssistant(opts?.assistantId); }
    const list = await listAssistant(opts);
    return list.find(x => x.name === name) || await createAssistant(opts);
};

const createThread = async (options) => {
    const { clientBeta } = await getOpenAIClient(options);
    // https://platform.openai.com/docs/api-reference/threads/createThread
    return await clientBeta.threads.create({ ...options?.params || {} });
};

const getThread = async (threadId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    // https://platform.openai.com/docs/api-reference/threads/getThread
    return await clientBeta.threads.retrieve(threadId);
};

const deleteThread = async (threadId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.threads.del(threadId);
};

const ensureThread = async options => await (
    options?.threadId ? getThread(options?.threadId) : createThread(options)
);

const createMessage = async (threadId, content, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    // https://platform.openai.com/docs/api-reference/messages/createMessage
    return await clientBeta.threads.messages.create(
        threadId, buildGptMessage(content)
    );
};

const listMessages = async (threadId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    // https://platform.openai.com/docs/api-reference/messages/listMessages
    return await clientBeta.threads.messages.list(
        threadId, { ...options?.params || {} }
    );
};

const getLatestMessage = async (threadId, options) => (await listMessages(
    threadId, { ...options, params: { ...options?.params || {}, limit: 1 } }
))?.data?.[0];

const run = async (assistantId, threadId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.threads.runs.create(
        threadId, { assistant_id: assistantId }
    );
};

const getRun = async (threadId, runId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.threads.runs.retrieve(threadId, runId);
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
            await ignoreErrFunc(async () => await options?.stream?.(
                options?.raw ? resp : packResp('')
            ), LOG);
            if (resp?.status !== 'completed') { return; }
            resolve(resp);
        } catch (err) {
            reject(err);
        }
        await end(loopName);
    }, 3, 2, 1, loopName, { silent, ...options }));
    const messageReceived = await getLatestMessage(thread.id, options);
    const threadDeleted = options?.deleteThread
        ? await deleteThread(thread.id) : null;
    return {
        assistant, thread, messageSent, run: objRun, messageReceived,
        threadDeleted, response: packResp(messageReceived.content[0].text.value),
    };
};

const uploadFile = async (input, options) => {
    const { client } = await getOpenAIClient(options);
    const { content: file, cleanup } = await convert(input, {
        input: options?.input, ...options || {}, expected: STREAM,
        errorMessage: INVALID_FILE, suffix: options?.suffix,
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
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.assistants.files.create(assistantId, { file_id });
};

const detachFileFromAssistant = async (assistantId, file_id, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.assistants.files.del(assistantId, file_id);
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
    const { client } = await getOpenAIClient(options);
    const files = [];
    const list = await client.files.list(options?.params || {});
    for await (const file of list) { files.push(file); }
    return files;
};

const deleteFile = async (file_id, options) => {
    const { client } = await getOpenAIClient(options);
    return await client.files.del(file_id);
};

const listAssistantFiles = async (assistant_id, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    const resp = await clientBeta.assistants.files.list(
        assistant_id, { limit: GPT_QUERY_LIMIT, ...options?.params }
    );
    return options?.raw ? resp : resp.data;
};

const handleGeminiResponse = async (resp, options) => {
    const _resp = await resp;
    if (options?.stream) {
        for await (const chunk of _resp.stream) {
            await ignoreErrFunc(async () => await options.stream(
                options?.raw ? chunk : chunk.candidates[0].content.parts
            ), LOG);
        }
    }
    const result = await _resp.response;
    return options?.raw ? result
        : { response: result.candidates[0].content.parts };
};

const promptVertex = async (content, options) => {
    const { generative } = await getVertexClient(options);
    return await handleGeminiResponse(generative.generateContentStream({
        contents: [...options?.messages || [], buildVertexMessage(content)],
    }), options);
};

const promptGemini = async (content, options) => {
    const { generative } = await getGeminiClient(options);
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
    const { client } = await getOpenAIClient(options);
    assert(input, 'Text is required.', 400);
    const resp = await client.embeddings.create({
        model: DEFAULT_MODELS[OPENAI_EMBEDDING], input,
    });
    return options?.raw ? resp : resp?.data[0].embedding;
};

const createGeminiEmbedding = async (input, options) => {
    const { embedding } = await getGeminiClient(options);
    assert(input, 'Text is required.', 400);
    const resp = await embedding.embedContent(input);
    return options?.raw ? resp : resp?.embedding.values;
};

const vectorPredict = async (model, instance, options) => {
    const { project, location, prediction, helpers }
        = await getVertexClient(options);
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
    const { helpers } = await getVertexClient(options);
    const resp = await vectorPredict(DEFAULT_MODELS[VERTEX_EMEDDING], {
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
    const { client } = await getOpenAIClient(options);
    return await client.fineTuning.jobs.create({
        training_file, model: options?.model || DEFAULT_MODELS[OPENAI_TRAINING],
    })
};

const getGptFineTuningJob = async (job_id, options) => {
    const { client } = await getOpenAIClient(options);
    // https://platform.openai.com/finetune/[job_id]?filter=all
    return await client.fineTuning.jobs.retrieve(job_id);
};

const cancelGptFineTuningJob = async (job_id, options) => {
    const { client } = await getOpenAIClient(options);
    return await client.fineTuning.jobs.cancel(job_id);
};

const listGptFineTuningJobs = async (options) => {
    const { client } = await getOpenAIClient(options);
    const resp = await client.fineTuning.jobs.list({
        limit: GPT_QUERY_LIMIT, ...options?.params
    });
    return options?.raw ? resp : resp.data;
};

const listGptFineTuningEvents = async (job_id, options) => {
    const { client } = await getOpenAIClient(options);
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

const initChat = async (options) => {
    options = {
        engines: options?.engines || { [DEFAULT_CHAT_ENGINE]: {} },
        ...options || {},
    };
    if (options?.sessions) {
        assert(
            options.sessions?.get && options.sessions?.set,
            'Invalid session storage provider.'
        );
        chatConfig.sessions = options.sessions;
    }
    options?.instructions && (chatConfig.systemPrompt = options.instructions);
    for (const i in options.engines) {
        const key = ensureString(i, { case: 'UP' });
        const model = DEFAULT_MODELS[key];
        assert(model, `Invalid chat model: '${i}'.`);
        chatConfig.engines[key] = options.engines[i];
        chatConfig.engines[key].model = chatConfig.engines[key].model || model;
        const mxPmpt = MODELS[chatConfig.engines[key].model].maxInputTokens / 2;
        let pmptTokens = 0;
        switch (key) {
            case ASSISTANT:
                chatConfig.engines[key].assistantId
                    = chatConfig.engines[key].assistantId
                    || (await ensureAssistant({
                        ...options, params: {
                            name, model: chatConfig.engines[key].model,
                            instructions: chatConfig.systemPrompt,
                            ...chatConfig.engines[key].params,
                        }
                    })).id;
                break;
            case CHATGPT: case GEMINI: case VERTEX: case OLLAMA:
                pmptTokens = countTokens([buildVertexMessage(
                    chatConfig.systemPrompt, { role: system }
                )]); // Use vertex instead of chatgpt because of the longer pack
                assert(
                    pmptTokens < mxPmpt,
                    `System prompt is too long: ${pmptTokens} / ${mxPmpt} tokens.`
                );
                break;
        }
    }
    return chatConfig;
};

const defaultSession = session => ({
    messages: [], systemPrompt: chatConfig.systemPrompt,
    threadId: null, ...session || {},
});

const assertSessionId = sessionId => {
    sessionId = ensureString(sessionId, { case: 'UP' });
    assert(sessionId, 'Session ID is required.');
    return sessionId;
};

const getSession = async (sessionId, options) => {
    sessionId = assertSessionId(sessionId);
    return defaultSession(await chatConfig.sessions.get(
        sessionId, options?.prompt, options
    ));
};

const setSession = async (sessionId, session, options) => {
    sessionId = assertSessionId(sessionId);
    return await chatConfig.sessions.set(sessionId, session, options);
};

const resetSession = async (sessionId, options) => {
    const session = {
        ...defaultSession(),
        ...options?.systemPrompt ? { systemPrompt: options.systemPrompt } : {},
    };
    return await setSession(sessionId, session);
};

const talk = async (input, options) => {
    const engine = unifyEngine({ engine: CHATGPT, ...options });
    assert(chatConfig.engines[engine], NOT_INIT);
    const model = options?.model || chatConfig.engines[engine].model;
    const MODEL = MODELS[model];
    const sessionId = options?.sessionId || newSessionId();
    const session = await getSession(sessionId, { engine, ...options });
    let [resp, sys, messages, msgBuilder] = [null, [], [], null];
    switch (engine) {
        case CHATGPT: case OLLAMA:
            sys.push(buildGptMessage(session.systemPrompt, { role: system }));
            msgBuilder = () => {
                messages = [];
                session.messages.map(x => {
                    messages.push(buildGptMessage(x.request, { role: user }));
                    messages.push(buildGptMessage(x.response, { role: assistant }));
                });
            };
            msgBuilder()
            break;
        case ASSISTANT:
            break;
        case GEMINI: case VERTEX:
            sys.push(buildVertexMessage(session.systemPrompt, { role: user }));
            msgBuilder = () => {
                messages = [];
                session.messages.map(x => {
                    messages.push(buildVertexMessage(x.request, { role: user }));
                    messages.push(buildVertexMessage(x.response, { role: MODEL }));
                });
            };
            msgBuilder()
            break;
        default:
            throwError(`Invalid AI engine: '${engine}'.`);
    }
    while (countTokens([
        ...sys, ...messages, buildVertexMessage(input, { role: user })
    ]) >= MODEL.maxInputTokens) {
        if (messages.length) {
            session.messages.shift();
            msgBuilder && msgBuilder();
        } else {
            input = trimTailing(trimTailing(input).slice(0, -1)) + '...';
        }
    }
    const chat = { request: input };
    log(`Prompt: ${JSON.stringify(input)}`);
    switch (engine) {
        case CHATGPT:
            resp = await promptChatGPT(input, { messages, model, ...options });
            break;
        case ASSISTANT:
            resp = await promptAssistant(input, {
                assistantId: chatConfig.engines[engine].assistantId,
                threadId: session.threadId, ...options,
            });
            session.threadId = resp.thread.id;
            break;
        case GEMINI:
            resp = await promptGemini(input, { messages, ...options });
            break;
        case VERTEX:
            resp = await promptVertex(input, { messages, ...options });
            break;
        case OLLAMA:
            resp = await promptOllama(input, { messages, model, ...options });
            break;
    }
    for (const _resp of resp.response) {
        if (_resp.text) {
            chat.response = _resp.text;
            break;
        }
    }
    chat?.request && chat?.response && session.messages.push(chat);
    await setSession(sessionId, session, options);
    const text = resp.response.filter(x => x.text).map(x => x.text).join('\n\n');
    log(`Response: ${JSON.stringify(resp.response)}`);
    return {
        sessionId, response: resp.response, text, rendered: renderText(text),
        spoken: renderText(text, { noCode: true }).replace(/\[\^\d\^\]/ig, ''),
    };
};

const getMaxChatPromptLimit = (options) => {
    let resp = 0;
    for (const i in chatConfig.engines) {
        if (options?.engine && i !== options.engine) { continue; }
        const maxInputTokens = MODELS[chatConfig.engines[i].model].maxInputTokens;
        resp = resp ? Math.min(resp, maxInputTokens) : maxInputTokens;
    }
    assert(resp > 0, 'Chat engine has not been initialized.');
    return resp;
};

export default init;
export {
    _NEED,
    CODE_INTERPRETER,
    DEFAULT_MODELS,
    EMBEDDING_001,
    EMBEDDING_GECKO_001,
    EMBEDDING_GECKO_002,
    EMBEDDING_GECKO_ML001,
    FUNCTION,
    GEMINI_PRO_VISION,
    GEMINI_PRO,
    GPT_35_TURBO_1106,
    GPT_35_TURBO,
    GPT_4_1106,
    GPT_4_VISION,
    GPT_4,
    MODELS,
    RETRIEVAL,
    TEXT_EMBEDDING_ADA_002,
    buildGptTrainingCase,
    buildGptTrainingCases,
    cancelGptFineTuningJob,
    countTokens,
    createAssistant,
    createGeminiEmbedding,
    createGptFineTuningJob,
    createMessage,
    createOpenAIEmbedding,
    createVertexEmbedding,
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
    getMaxChatPromptLimit,
    getRun,
    getThread,
    init,
    initChat,
    listAssistant,
    listAssistantFiles,
    listFiles,
    listGptFineTuningEvents,
    listGptFineTuningJobs,
    listMessages,
    listOpenAIModels,
    modifyAssistant,
    promptAssistant,
    promptChatGPT,
    promptGemini,
    promptOllama,
    promptVertex,
    resetSession,
    run,
    tailGptFineTuningEvents,
    talk,
    uploadFile,
    uploadFileForAssistants,
    uploadFileForFineTuning,
    uploadFileForRetrieval,
};
