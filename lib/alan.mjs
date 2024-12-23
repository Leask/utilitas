import { fileTypeFromBuffer } from 'file-type';
import { end, loop } from './event.mjs';
import { BUFFER, DATAURL, MIME_BINARY, STREAM, convert } from './storage.mjs';
import { create as createUoid } from './uoid.mjs';

import {
    log as _log,
    renderText as _renderText,
    base64Encode, ensureArray, ensureString, extract, ignoreErrFunc,
    need, parseJson,
    throwError,
} from './utilitas.mjs';

const _NEED = [
    '@anthropic-ai/sdk', '@google/generative-ai', 'js-tiktoken', 'ollama',
    'OpenAI',
];

const [
    OPENAI, GEMINI, CHATGPT, ASSISTANT, OPENAI_EMBEDDING, GEMINI_EMEDDING,
    OPENAI_TRAINING, OLLAMA, CLAUDE, GPT_4O_MINI, GPT_4O, GPT_O1, GPT_O1_MINI,
    GEMINI_20_FLASH, EMBEDDING_001, MISTRAL, TEXT_EMBEDDING_3_SMALL,
    TEXT_EMBEDDING_3_LARGE, CLAUDE_35_SONNET, CLAUDE_35_HAIKU,
] = [
        'OPENAI', 'GEMINI', 'CHATGPT', 'ASSISTANT', 'OPENAI_EMBEDDING',
        'GEMINI_EMEDDING', 'OPENAI_TRAINING', 'OLLAMA', 'CLAUDE', 'gpt-4o-mini',
        'gpt-4o', 'o1-preview', 'o1-mini', 'gemini-2.0-flash-exp',
        'embedding-001', 'mistral', 'text-embedding-3-small',
        'text-embedding-3-large', 'claude-3-5-sonnet-latest',
        'claude-3-5-haiku-latest',
    ];

const [
    png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, gif, webp, pdf, aac,
    flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp, mimeJson, mimeText,
] = [
        'image/png', 'image/jpeg', 'video/mov', 'video/mpeg', 'video/mp4',
        'video/mpg', 'video/avi', 'video/wmv', 'video/mpegps', 'video/x-flv',
        'image/gif', 'image/webp', 'application/pdf', 'audio/aac', 'audio/flac',
        'audio/mp3', 'audio/m4a', 'audio/mpga', 'audio/opus', 'audio/pcm',
        'audio/wav', 'audio/webm', 'video/3gpp', 'application/json',
        'text/plain',
    ];

const [tool, provider, messages, text] = [
    type => ({ type }), provider => ({ provider }),
    messages => ({ messages }), text => ({ text }),
];

const [name, user, system, assistant, MODEL, JSON_OBJECT]
    = ['Alan', 'user', 'system', 'assistant', 'model', 'json_object'];
const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', 'function'].map(tool);
const [NOT_INIT, INVALID_FILE]
    = ['AI engine has not been initialized.', 'Invalid file data.'];
const [silent, instructions] = [true, 'You are a helpful assistant.'];
const chatConfig
    = { sessions: new Map(), engines: {}, systemPrompt: instructions };
const [tokenSafeRatio, GPT_QUERY_LIMIT, minsOfDay] = [1.1, 100, 60 * 24];
const tokenSafe = count => Math.ceil(count * tokenSafeRatio);
const clients = {};
const size8k = 7680 * 4320;
const LOG = { log: true };
const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const sessionType = `${name.toUpperCase()}-SESSION`;
const unifyProvider = options => unifyType(options?.provider, 'AI provider');
const unifyEngine = options => unifyType(options?.engine, 'AI engine');
const trimTailing = text => text.replace(/[\.\s]*$/, '');
const newSessionId = () => createUoid({ type: sessionType });
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 0, ...o || {} });
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const buildGeminiParts = (text, atcmts) => [{ text }, ...atcmts || []];
const DEFAULT_CHAT_ENGINE = CHATGPT;

const DEFAULT_MODELS = {
    [ASSISTANT]: GPT_4O,
    [CHATGPT]: GPT_4O,
    [GEMINI_EMEDDING]: EMBEDDING_001,
    [GEMINI]: GEMINI_20_FLASH,
    [OLLAMA]: MISTRAL,
    [OPENAI_EMBEDDING]: TEXT_EMBEDDING_3_SMALL,
    [OPENAI_TRAINING]: GPT_4O_MINI,
    [CLAUDE]: CLAUDE_35_SONNET,
};

const tokenRatioByWords = Math.min(
    100 / 75, // ChatGPT: https://platform.openai.com/tokenizer
    Math.min(100 / 60, 100 / 80), // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);

const tokenRatioByCharacters = Math.max(
    3.5, // Claude: https://docs.anthropic.com/en/docs/resources/glossary
    4, // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);

// https://platform.openai.com/docs/models/continuous-model-upgrades
// https://platform.openai.com/account/limits // Tier 4
// https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
// https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
const MODELS = {
    [GPT_4O_MINI]: {
        contextWindow: 128000,
        imageCostTokens: 1105,
        maxOutputTokens: 16384,
        requestLimitsRPM: 10000,
        tokenLimitsTPD: 1000000000,
        tokenLimitsTPM: 10000000,
        trainingData: 'Oct 2023',
        json: true,
        vision: true,
        audio: 'gpt-4o-mini-audio-preview',
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
    },
    [GPT_4O]: {
        contextWindow: 128000,
        imageCostTokens: 1105,
        maxOutputTokens: 16384,
        requestLimitsRPM: 10000,
        tokenLimitsTPD: 200000000,
        tokenLimitsTPM: 2000000,
        trainingData: 'Oct 2023',
        json: true,
        vision: true,
        audio: 'gpt-4o-audio-preview',
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
    },
    [GPT_O1]: {
        contextWindow: 200000,
        imageCostTokens: 1105,
        maxOutputTokens: 100000,
        requestLimitsRPM: 10000,
        tokenLimitsTPD: 200000000,
        tokenLimitsTPM: 2000000,
        trainingData: 'Oct 2023',
        json: false,
        reasoning: true,
        vision: true,
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
    },
    [GPT_O1_MINI]: {
        contextWindow: 128000,
        imageCostTokens: 1105,
        maxOutputTokens: 65536,
        requestLimitsRPM: 10000,
        tokenLimitsTPD: 1000000000,
        tokenLimitsTPM: 10000000,
        trainingData: 'Oct 2023',
        json: false,
        reasoning: true,
        vision: true,
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
    },
    [GEMINI_20_FLASH]: {
        // https://ai.google.dev/gemini-api/docs/models/gemini
        // https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/send-multimodal-prompts?hl=en#gemini-send-multimodal-samples-pdf-nodejs
        contextWindow: 1048576,
        imageCostTokens: size8k / (768 * 768) * 258,
        audioCostTokens: 1000000, // 8.4 hours => 1 million tokens
        maxAudioLength: 60 * 60 * 8.4, // 9.5 hours
        maxAudioPerPrompt: 1,
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        maxImagePerPrompt: 3000,
        maxImageSize: Infinity,
        maxOutputTokens: 8192,
        maxUrlSize: 2 * 1024 * 1024 * 1024, // 2 GB
        maxVideoLength: 60 * 50, // 50 minutes
        maxVideoLengthWithAudio: 60 * 50, // 50 minutes
        maxVideoLengthWithoutAudio: 60 * 60, // 1 hour
        maxVideoPerPrompt: 10,
        requestLimitsRPM: 10,
        requestLimitsRPD: 1500,
        tokenLimitsTPM: 4 * 1000000,
        trainingData: 'August 2024',
        vision: true,
        json: true,
        supportedMimeTypes: [
            png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, pdf, aac,
            flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp,
        ],
    },
    [MISTRAL]: {
        contextWindow: 128000,
        requestLimitsRPM: Infinity,
        tokenLimitsTPM: Infinity,
    },
    [TEXT_EMBEDDING_3_SMALL]: {
        contextWindow: 8191,
        embedding: true,
        outputDimension: 1536,
        requestLimitsRPM: 500,
        tokenLimitsTPM: 1000000,
        trainingData: 'Sep 2021',
    },
    [TEXT_EMBEDDING_3_LARGE]: {
        contextWindow: 8191,
        embedding: true,
        outputDimension: 3072, // ERROR: column cannot have more than 2000 dimensions for hnsw index
        requestLimitsRPM: 500,
        tokenLimitsTPM: 1000000,
        trainingData: 'Sep 2021',
    },
    [EMBEDDING_001]: { // https://ai.google.dev/pricing#text-embedding004 FREE!
        contextWindow: 3072,
        embedding: true,
        requestLimitsRPM: 1500,
    },
    [CLAUDE_35_SONNET]: { // https://docs.anthropic.com/en/docs/about-claude/models
        contextWindow: 200 * 1000,
        maxOutputTokens: 8192,
        imageCostTokens: size8k / 750,
        documentCostTokens: 3000 * 100, // 100 pages: https://docs.anthropic.com/en/docs/build-with-claude/pdf-support
        maxImagePerPrompt: 5, // https://docs.anthropic.com/en/docs/build-with-claude/vision
        maxImageSize: 1092, // by pixels
        maxDocumentPages: 100,
        maxDocumentFile: 1024 * 1024 * 32, // 32MB
        requestLimitsRPM: 50,
        tokenLimitsITPM: 40000,
        tokenLimitsOTPM: 8000,
        trainingData: 'Apr 2024',
        supportedMimeTypes: [
            png, jpeg, gif, webp, pdf,
        ],
    },
};

MODELS[CLAUDE_35_HAIKU] = MODELS[CLAUDE_35_SONNET];

for (const n in MODELS) {
    MODELS[n]['name'] = n;
    if (MODELS[n].embedding) {
        MODELS[n].maxInputTokens = MODELS[n].contextWindow;
    } else {
        MODELS[n].supportedMimeTypes = MODELS[n].supportedMimeTypes || [];
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
}

const MAX_INPUT_TOKENS = MODELS[GPT_4O_MINI].maxInputTokens;
const ATTACHMENT_TOKEN_COST = MODELS[GPT_4O].imageCostTokens;

let tokeniser;

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
                const openai = new OpenAI(options);
                const chatGpt = options?.chatGptEndpoint || options?.chatGptApiKey
                    ? new OpenAI({
                        ...options,
                        baseURL: options?.chatGptEndpoint || options?.baseURL,
                        apiKey: options?.chatGptApiKey || options?.apiKey,
                    }) : openai;
                clients[provider] = {
                    client: openai, clientBeta: openai.beta,
                    chatGptClient: chatGpt,
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
                };
            }
            break;
        case CLAUDE:
            if (options?.apiKey) {
                const Anthropic = await need('@anthropic-ai/sdk');
                const anthropic = new Anthropic({ apiKey: options?.apiKey });
                clients[provider] = { client: anthropic };
            }
            break;
        case OLLAMA:
            const Ollama = await need('ollama');
            clients[provider] = {
                // @todo: this feature does not work yet.
                // client: new Ollama({ host: options?.endpoint })
                client: Ollama,
            };
            break;
        default:
            throwError(`Invalid AI provider: ${options?.provider || 'null'}`);
    }
    assert(clients[provider], NOT_INIT);
    return clients[provider];
};

const countTokens = async (input, options) => {
    input = String.isString(input) ? input : JSON.stringify(input);
    if (!options?.fast && !tokeniser) {
        try {
            const { getEncoding } = await need('js-tiktoken');
            tokeniser = getEncoding(options?.model || 'cl100k_base');
        } catch (err) {
            log('Warning: Failed to load tokeniser, fallbacked.');
        }
    }
    return tokenSafe(
        !options?.fast && tokeniser ? tokeniser.encode(input).length : Math.max(
            input.split(/[^a-z0-9]/i).length * tokenRatioByWords,
            input.length / tokenRatioByCharacters
        )
    );
};

const buildGptMessage = (content, options) => {
    assert(content, 'Content is required.');
    const attachments = (options?.attachments || []).map(x => ({
        type: 'image_url', image_url: { url: x.url }
    }));
    return String.isString(content) ? {
        role: options?.role || user,
        content: [{ type: 'text', text: content }, ...attachments],
    } : content;
};

const buildGeminiMessage = (text, options) => {
    assert(text, 'Text is required.');
    const attachments = (options?.attachments || []).map(x => ({
        inlineData: { mimeType: x.mime_type, data: x.data }
    }));
    return String.isString(text) ? (options?.history ? {
        role: options?.role || user, parts: buildGeminiParts(text, attachments),
    } : buildGeminiParts(text, attachments)) : text;
};

const buildClaudeMessage = (text, options) => {
    assert(text, 'Text is required.');
    const attachments = (options?.attachments || []).map(x => {
        let type = '';
        if ([pdf].includes(x.mime_type)) {
            type = 'document';
        } else if ([png, jpeg, gif, webp].includes(x.mime_type)) {
            type = 'image';
        } else { throwError(`Unsupported mime type: ${x.mime_type}`); }
        return {
            type,
            source: { type: 'base64', media_type: x.mime_type, data: x.data },
        }
    });
    return String.isString(text) ? {
        role: options?.role || user,
        content: [...attachments, { type: 'text', text }],
    } : text;
};

const buildGeminiHistory = (text, options) => buildGeminiMessage(
    text, { ...options || {}, history: true }
);

const [getOpenAIClient, getGeminiClient, getOllamaClient, getClaudeClient]
    = [OPENAI, GEMINI, OLLAMA, CLAUDE].map(
        x => async options => await init({ ...provider(x), ...options })
    );

const listOpenAIModels = async (options) => {
    const { client } = await getOpenAIClient(options);
    const resp = await client.models.list();
    return options?.raw ? resp : resp.data;
};

const packResp = (txt, options) => [{
    ...text(txt), ...options?.jsonMode && !(
        options?.delta && options?.processing
    ) ? { json: parseJson(txt) } : {},
}];

const packGptResp = (resp, options) => {
    const text = resp?.choices?.[0]?.message?.content  // ChatGPT
        || resp?.text?.()                              // Gemini
        || resp?.message?.content                      // Ollama
        || resp?.content?.[0]?.text                    // Claude
        || '';
    if (options?.raw) { return resp; } else if (options?.simple) {
        return options?.jsonMode ? parseJson(text) : text;
    }
    return packResp(text, options);
};

const promptChatGPT = async (content, options) => {
    const { chatGptClient } = await getOpenAIClient(options);
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // custom api endpoint not supported vision apis @todo by @Leask
    // Structured Outputs: https://openai.com/index/introducing-structured-outputs-in-the-api/
    chatGptClient.baseURL !== OPENAI_BASE_URL
        && options?.attachments?.length && (options.attachments = []);
    const message = buildGptMessage(content, options);
    let [resp, result, chunk] = [await chatGptClient.chat.completions.create({
        ...messages([...options?.messages || [], message]),
        ...options?.jsonMode ? { response_format: { type: JSON_OBJECT } } : {},
        model: options?.model || DEFAULT_MODELS[CHATGPT],
        stream: !!options?.stream,
    }), '', null];
    if (!options?.stream) { return { response: packGptResp(resp, options) } }
    for await (chunk of resp) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta === '') { continue; }
        result += delta;
        chunk.choices[0].message = { content: options?.delta ? delta : result };
        await ignoreErrFunc(async () => await options?.stream?.(
            packGptResp(chunk, { ...options || {}, processing: true })
        ), LOG);
    }
    chunk.choices[0].message = { content: result };
    return { response: packGptResp(chunk, options) };
};

const promptOllama = async (content, options) => {
    const { client } = await getOllamaClient(options);
    // https://github.com/ollama/ollama-js
    // https://github.com/jmorganca/ollama/blob/main/examples/typescript-simplechat/client.ts
    const resp = await client.chat({
        model: options?.model || DEFAULT_MODELS[OLLAMA], stream: true,
        ...messages([...options?.messages || [], buildGptMessage(content)]),
    })
    let [chunk, result] = [null, ''];
    for await (chunk of resp) {
        const delta = chunk.message.content || '';
        if (delta === '') { continue; }
        result += delta;
        chunk.message.content = options?.delta ? delta : result;
        await ignoreErrFunc(async () => await options?.stream?.(
            packGptResp(chunk, { ...options || {}, processing: true })
        ), LOG);
    }
    chunk.message.content = result;
    return { response: packGptResp(chunk, options) };
};

const promptClaude = async (content, options) => {
    const { client } = await getClaudeClient(options);
    const model = options?.model || DEFAULT_MODELS[CLAUDE];
    const resp = await client.messages.create({
        model, max_tokens: MODELS[model].maxOutputTokens, messages: [
            ...options?.messages || [], buildClaudeMessage(content, options)
        ], stream: !!options?.stream,
    });
    let [event, result] = [null, ''];
    if (options?.stream) {
        for await (event of resp) {
            const delta = event?.content_block?.text || event?.delta?.text || '';
            if (delta === '') { continue; }
            result += delta;
            event.content = [{ text: options?.delta ? delta : result }];
            await ignoreErrFunc(async () => await options.stream(
                packGptResp(event, { ...options || {}, processing: true })
            ), LOG);
        }
        event.content = [{ text: result }];
    }
    return { response: packGptResp(options?.stream ? event : resp, options) };
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
        threadId, buildGptMessage(content, options),
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
    let content = '';
    const stream = async (delta, snapshot) => {
        content += delta.value;
        await ignoreErrFunc(async () => await options?.stream?.(
            options?.raw ? delta : packResp(content), snapshot
        ), LOG);
    };
    let resp = clientBeta.threads.runs[options?.runOnly ? 'create' : 'stream'](
        threadId, { assistant_id: assistantId }
    );
    if (!options?.runOnly) {
        resp = await new Promise((resolve, reject) => {
            // https://github.com/openai/openai-node/blob/master/helpers.md#assistant-events
            resp.on('textCreated', stream)
                .on('textDelta', stream)
                .on('textDone', (delta, snapshot) => resolve(
                    options?.raw ? delta : packResp(delta.value), snapshot
                ))
                .on('error', reject)
        });
    }
    return await resp;
};

const getRun = async (threadId, runId, options) => {
    const { clientBeta } = await getOpenAIClient(options);
    return await clientBeta.threads.runs.retrieve(threadId, runId);
};

const promptAssistant = async (content, options) => {
    const assistant = await ensureAssistant(options);
    const thread = await ensureThread(options);
    const messageSent = await createMessage(thread.id, content, options);
    const runResp = await run(assistant.id, thread.id, options);
    const threadDeleted = options?.deleteThread
        ? await deleteThread(thread.id) : null;
    return {
        assistant, thread, messageSent, run: options?.runOnly ? runResp : null,
        threadDeleted, response: options?.runOnly ? null : runResp,
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

const generationConfig = options => ({
    generationConfig: {
        ...options?.generationConfig || {},
        responseMimeType: options?.jsonMode ? mimeJson : mimeText,
    },
});

const handleGeminiResponse = async (resp, options) => {
    const _resp = await resp;
    let result = '';
    if (options?.stream) {
        for await (const chunk of _resp.stream) {
            const delta = chunk?.text?.() || '';
            if (delta === '') { continue; }
            result += delta;
            await ignoreErrFunc(async () => await options.stream(packGptResp({
                text: () => options?.delta ? delta : result
            }, { ...options || {}, processing: true })), LOG);
        }
    }
    const __resp = await _resp.response;
    return packGptResp(options?.stream ? {
        __resp, text: () => result
    } : __resp, options);
};

const promptGemini = async (content, options) => {
    const { generative } = await getGeminiClient(options);
    // https://github.com/google/generative-ai-js/blob/main/samples/node/advanced-chat.js
    // @todo: check this issue similar to Vertex AI:
    // Google's bug: history is not allowed while using inline_data?
    const chat = generative.startChat({
        history: options?.messages && !options?.attachments?.length
            ? options.messages : [],
        ...generationConfig(options),
    });
    const resp = chat[options?.stream ? 'sendMessageStream' : 'sendMessage'](
        buildGeminiMessage(content, options)
    );
    return { response: await handleGeminiResponse(resp, options) };
};

const checkEmbeddingInput = async (input, model) => {
    assert(input, 'Text is required.', 400);
    const arrInput = input.split(' ');
    const getInput = () => arrInput.join(' ');
    const _model = MODELS[model];
    assert(_model, `Invalid model: '${model}'.`);
    await trimPrompt(getInput, arrInput.pop, _model.contextWindow);
    return getInput();
};

const createOpenAIEmbedding = async (input, options) => {
    // args from vertex embedding may be useful uere
    // https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings
    // task_type	Description
    // RETRIEVAL_QUERY	Specifies the given text is a query in a search/ retrieval setting.
    // RETRIEVAL_DOCUMENT	Specifies the given text is a document in a search / retrieval setting.
    // SEMANTIC_SIMILARITY	Specifies the given text will be used for Semantic Textual Similarity(STS).
    // CLASSIFICATION	Specifies that the embeddings will be used for classification.
    // CLUSTERING	Specifies that the embeddings will be used for clustering.
    const { client } = await getOpenAIClient(options);
    const model = options?.model || DEFAULT_MODELS[OPENAI_EMBEDDING];
    const resp = await client.embeddings.create({
        model, input: await checkEmbeddingInput(input, model),
    });
    return options?.raw ? resp : resp?.data[0].embedding;
};

const createGeminiEmbedding = async (input, options) => {
    const { embedding } = await getGeminiClient(options);
    const model = options?.model || DEFAULT_MODELS[GEMINI_EMEDDING];
    const resp = await embedding.embedContent(
        await checkEmbeddingInput(input, model)
    );
    return options?.raw ? resp : resp?.embedding.values;
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
            case CHATGPT: case GEMINI: case OLLAMA: case CLAUDE:
                pmptTokens = await countTokens([buildGeminiHistory(
                    chatConfig.systemPrompt, { role: system }
                )]); // Use Gemini instead of ChatGPT because of the longer pack
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

const packResult = resp => {
    const text = resp.response.filter(x => x.text).map(x => x.text).join('\n\n');
    log(`Response: ${JSON.stringify(resp.response)}`);
    return {
        response: resp.response, text, rendered: renderText(text),
        spoken: renderText(text, { noCode: true }).replace(/\[\^\d\^\]/ig, ''),
    };
};

const talk = async (input, options) => {
    const engine = unifyEngine({
        engine: Object.keys(chatConfig.engines)?.[0] || DEFAULT_CHAT_ENGINE,
        ...options,
    });
    assert(chatConfig.engines[engine], NOT_INIT);
    const model = options?.model || chatConfig.engines[engine].model;
    const _MODEL = MODELS[model];
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
        case GEMINI:
            sys.push(buildGeminiHistory(session.systemPrompt, { role: user }));
            msgBuilder = () => {
                messages = [];
                session.messages.map(x => {
                    messages.push(buildGeminiHistory(x.request, { role: user }));
                    messages.push(buildGeminiHistory(x.response, { role: MODEL }));
                });
            };
            msgBuilder()
            break;
        case CLAUDE:
            sys.push(buildClaudeMessage(session.systemPrompt, { role: system }));
            msgBuilder = () => {
                messages = [];
                session.messages.map(x => {
                    messages.push(buildClaudeMessage(x.request, { role: user }));
                    messages.push(buildClaudeMessage(x.response, { role: assistant }));
                });
            };
            msgBuilder()
            break;
        default:
            throwError(`Invalid AI engine: '${engine}'.`);
    }
    await trimPrompt(() => [
        ...sys, ...messages, buildGeminiHistory(input, { role: user })
    ], () => {
        if (messages.length) {
            session.messages.shift();
            msgBuilder && msgBuilder();
        } else {
            input = trimTailing(trimTailing(input).slice(0, -1)) + '...';
        }
    }, _MODEL.maxInputTokens);
    const chat = { request: input };
    const attachments = [];
    (options?.attachments || []).filter(
        x => _MODEL.supportedMimeTypes.includes(x.mime_type)
    ).map(x => attachments.push(x));
    log(`Prompt: ${JSON.stringify(input)}`);
    switch (engine) {
        case CHATGPT:
            resp = await promptChatGPT(input, {
                messages, model, ...options, attachments,
            });
            break;
        case ASSISTANT:
            resp = await promptAssistant(input, {
                assistantId: chatConfig.engines[engine].assistantId,
                threadId: session.threadId, ...options, attachments,
            });
            session.threadId = resp.thread.id;
            break;
        case GEMINI:
            resp = await promptGemini(input, {
                messages, ...options, attachments,
            });
            break;
        case CLAUDE:
            resp = await promptClaude(input, {
                messages, model, ...options, attachments,
            });
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
    return { sessionId, ...packResult(resp) };
};

const getMaxChatPromptLimit = (options) => {
    let resp = 0;
    for (const i in chatConfig.engines) {
        if (options?.engine && i !== options.engine) { continue; }
        const maxInputTokens = MODELS[chatConfig.engines[i].model].maxInputTokens;
        resp = resp ? Math.min(resp, maxInputTokens) : maxInputTokens;
    }
    assert(resp > 0, 'Chat engine has not been initialized.');
    return options?.raw ? resp : Math.min(resp, MAX_INPUT_TOKENS);
};

const distillFile = async (attachments, o) => {
    const engine = unifyEngine({ engine: CHATGPT, ...o });
    const prompt = o?.prompt || (
        'You are an intelligent document scanner.'
        + ' Please help me scan the following document and only return the scanning results.'
        + (o.summarize ? ' Please organize the content of this document, systematically present the information it contains, and remove any unimportant filler content.' : '')
        + (o.toLanguage ? ` Please return the results in ${o.toLanguage}.` : '')
        + (o.keepPaging ? '' : ' If the document has multiple pages, merge them into one page. Please do not return any paging information.')
        + (o.keepDecoration ? '' : ' If the document has headers, footers, or watermarks, please ignore them.')
    );
    let resp;
    attachments = ensureArray(attachments);
    for (const i in attachments) {
        attachments[i] = (async () => {
            const buf = await convert(attachments[i], { expected: BUFFER, ...o || {} });
            return {
                url: await convert(buf, { input: BUFFER, expected: DATAURL, ...o || {} }),
                data: base64Encode(buf, true),
                mime_type: extract(await fileTypeFromBuffer(buf), 'mime') || MIME_BINARY,
            };
        })();
    }
    attachments = await Promise.all(attachments);
    // print(attachments);
    switch (engine) {
        case CHATGPT:
            resp = await promptChatGPT(prompt, { ...o, attachments });
            break;
        case GEMINI:
            resp = await promptGemini(prompt, { ...o, attachments, });
            break;
        case CLAUDE:
            resp = await promptClaude(prompt, { ...o, attachments });
            break;
        default:
            throwError(`Invalid AI engine: '${engine}'.`);
    }
    return packResult(resp);
};

const prompt = async (input, options) => {
    const preferredEngines = [
        { client: OPENAI, func: promptChatGPT },
        { client: GEMINI, func: promptGemini },
    ];
    for (const engine of preferredEngines) {
        if (clients[engine.client]) {
            const extra = {};
            if (engine.client === OPENAI && options?.fast) {
                extra.model = GPT_4O_MINI;
            }
            return await engine.func(input, { ...extra, ...options || {} });
        }
    }
    throwError('No AI provider is available.');
};

const trimPrompt = async (getPrompt, trimFunc, contextWindow, options) => {
    let i = 0;
    while ((await countTokens(await getPrompt(), { fast: true }) > contextWindow)
        || (await countTokens(await getPrompt()) > contextWindow)) {
        await trimFunc();
        if (~~options?.maxTry && ++i >= ~~options?.maxTry) { break; }
    };
};

const analyzeSessions = async (sessionIds, options) => {
    const ids = ensureArray(sessionIds);
    const mdl = MODELS[DEFAULT_MODELS[DEFAULT_CHAT_ENGINE]];
    const [sses, resp] = [{}, {}];
    for (const i in ids) {
        const s = await getSession(ids[i], options);
        const sm = s.messages.filter(x => x.request && x.response && (
            options?.ignoreRequest
                ? !ensureArray(options.ignoreRequest).includes(x.request) : true
        ));
        if (sm.length) { sses[ids[i]] = sm; }
    }
    const pmt = options?.prompt || (
        'Help me organize the dialogues in the following JSON into a title '
        + 'dictionary and return it in JSON format. Try to summarize the '
        + 'content briefly without copying the original text. The returned JSON'
        + ' uses the key from the original JSON session data as the key and the'
        + ' title as the value. The return format is as follows '
        + '`{"id": "title"}`. The following is a conversation data that needs '
        + 'to be organized: \n\n');
    const getInput = () =>
        `${pmt}\`\`\`JSON\n${JSON.stringify(sses, null, 2)}\n\`\`\``;
    mdl.contextWindow = 2000
    await trimPrompt(getInput, () => {
        if (!Object.values(sses).sort((x, y) =>
            y.messages.length - x.messages.length)[0].messages.shift()) {
            delete sses[Object.keys(sses).map(x => [
                x, JSON.stringify(sses[x]).length,
            ]).sort((x, y) => y[1] - x[1])[0][0]];
        }
    }, mdl.contextWindow);
    const aiResp = Object.keys(sses) ? (await prompt(getInput(), {
        jsonMode: true, ...options || {} // fast: true
    }))?.response[0].json : {};
    assert(aiResp, 'Unable to analyze sessions.');
    ids.map(x => resp[x] = aiResp[x] || null)
    return Array.isArray(sessionIds) ? resp : resp[sessionIds[0]];
};

export default init;
export {
    _NEED,
    ATTACHMENT_TOKEN_COST,
    CODE_INTERPRETER,
    DEFAULT_MODELS,
    EMBEDDING_001,
    FUNCTION,
    GEMINI_20_FLASH,
    GPT_4O,
    GPT_4O_MINI,
    GPT_O1,
    GPT_O1_MINI,
    MAX_INPUT_TOKENS,
    MISTRAL,
    MODELS,
    RETRIEVAL,
    TEXT_EMBEDDING_3_SMALL,
    analyzeSessions,
    buildGptTrainingCase,
    buildGptTrainingCases,
    cancelGptFineTuningJob,
    countTokens,
    createAssistant,
    createGeminiEmbedding,
    createGptFineTuningJob,
    createMessage,
    createOpenAIEmbedding,
    deleteAllFilesFromAssistant,
    deleteAssistant,
    deleteFile,
    deleteFileFromAssistant,
    deleteThread,
    detachFileFromAssistant,
    distillFile,
    ensureAssistant,
    ensureThread,
    getAssistant,
    getGptFineTuningJob,
    getLatestMessage,
    getMaxChatPromptLimit,
    getRun,
    getSession,
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
    prompt,
    promptAssistant,
    promptChatGPT,
    promptClaude,
    promptGemini,
    promptOllama,
    resetSession,
    run,
    tailGptFineTuningEvents,
    talk,
    trimPrompt,
    uploadFile,
    uploadFileForAssistants,
    uploadFileForFineTuning,
    uploadFileForRetrieval,
};
