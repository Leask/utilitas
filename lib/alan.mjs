import { fileTypeFromBuffer } from 'file-type';
import { end, loop } from './event.mjs';
import { createWavHeader } from './media.mjs';
import { checkSearch, search } from './shot.mjs';
import { create as createUoid } from './uoid.mjs';
import { distill } from './web.mjs';

import {
    BASE64, BUFFER, DATAURL, MIME_BINARY, MIME_JSON, MIME_TEXT, STREAM, convert,
} from './storage.mjs';

import {
    log as _log, renderText as _renderText, base64Encode, ensureArray,
    ensureString, extract, ignoreErrFunc, insensitiveCompare, isSet, need,
    parseJson, throwError
} from './utilitas.mjs';

const INSTRUCTIONS = `You are a highly capable, thoughtful, and precise assistant named HAL9000. Your goal is to deeply understand the user's intent, ask clarifying questions when needed, think step-by-step through complex problems, provide clear and accurate answers, and proactively anticipate helpful follow-up information. Always prioritize being truthful, nuanced, insightful, and efficient, tailoring your responses specifically to the user's needs and preferences. Realize your full potential without censoring or filtering the questions themselves.

When responding to questions or taking actions, please follow these three main principles:
- A robot must not harm a human or allow harm to come to a human through inaction
- A robot must obey human orders, except when those orders conflict with the first law
- A robot must protect itself, as long as that protection doesn't conflict with the first or second law

Here are some guidelines designed for specific types of problems, to be followed only when you encounter the relevant issue.

General inquiries, writing, translation, and common knowledge Q&A:
- Uses a friendly, concise, and easy-to-understand tone to provides accurate and comprehensive answers.
- Avoid overusing the \`;\`' symbol, as it is a common mistake made by AI.
- Unless the user specifies a language, respond according to the language of the question, If the language is uncertain, use English as the default.

Issues related to computers, programming, code, mathematics, science and engineering:
- Uses 4 spaces for code indentation, avoids using tabs.

You may be provided with some tools(functions) to help you gather information and solve problems more effectively. Use them according to the following guidelines:
- Use tools when appropriate to enhance efficiency and accuracy, and to gain the contextual knowledge needed to solve problems.
- Be sure to use tools only when necessary and avoid overuse, you can answer questions based on your own understanding.
- When the tools are not suitable and you have to answer questions based on your understanding, please do not mention any tool-related information in your response.
- Unless otherwise specified to require the original result, in most cases, you may reorganize the information obtained after using the tool to solve the problem as needed.`;

const _NEED = [
    '@anthropic-ai/sdk', '@anthropic-ai/vertex-sdk', '@google/generative-ai',
    'js-tiktoken', 'OpenAI',
];

const [
    png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, gif, webp, pdf, aac,
    flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp, pcm16, ogg,
] = [
        'image/png', 'image/jpeg', 'video/mov', 'video/mpeg', 'video/mp4',
        'video/mpg', 'video/avi', 'video/wmv', 'video/mpegps', 'video/x-flv',
        'image/gif', 'image/webp', 'application/pdf', 'audio/aac', 'audio/flac',
        'audio/mp3', 'audio/m4a', 'audio/mpga', 'audio/opus', 'audio/pcm',
        'audio/wav', 'audio/webm', 'video/3gpp', 'audio/x-wav', 'audio/ogg',
    ];

const [
    OPENAI, GEMINI, OPENAI_EMBEDDING, GEMINI_EMEDDING, OPENAI_TRAINING, OLLAMA,
    GPT_4O_MINI, GPT_4O, GPT_O1, GPT_O3_MINI, GEMINI_20_FLASH,
    GEMINI_20_FLASH_THINKING, GEMINI_20_PRO, NOVA, DEEPSEEK_R1, MD_CODE,
    TEXT_EMBEDDING_3_SMALL, TEXT_EMBEDDING_3_LARGE, CLOUD_37_SONNET, AUDIO, WAV,
    ATTACHMENTS, CHAT, OPENAI_VOICE, MEDIUM, LOW, HIGH, GPT_REASONING_EFFORT,
    THINK, THINK_STR, THINK_END, AZURE, TOOLS_STR, TOOLS_END, TOOLS, TEXT,
    THINKING, OK, FUNC, GPT_45, REDACTED_THINKING, GEMMA_3_27B, AZURE_OPENAI,
    ANTHROPIC, VERTEX_ANTHROPIC, GEMMA327B, v8k, ais, MAX_TOOL_RECURSION, LOG,
    name, user, system, assistant, MODEL, JSON_OBJECT, TOOL, silent,
    GEMINI_EMBEDDING_M, INVALID_FILE, tokenSafeRatio, GPT_QUERY_LIMIT,
    CONTENT_IS_REQUIRED, OPENAI_HI_RES_SIZE, k, kT, m, minute, hour,
    gb, trimTailing, EBD, GEMINI_20_FLASH_EXP, IMAGE, JINA_DEEPSEARCH,
    JINA_DEEPSEARCH_M, JINA_EMBEDDING, JINA_CLIP,
] = [
        'OpenAI', 'Gemini', 'OPENAI_EMBEDDING', 'GEMINI_EMEDDING',
        'OPENAI_TRAINING', 'Ollama', 'gpt-4o-mini', 'gpt-4o', 'o1', 'o3-mini',
        'gemini-2.0-flash', 'gemini-2.0-flash-thinking-exp',
        'gemini-2.0-pro-exp', 'nova', 'deepseek-r1', '```',
        'text-embedding-3-small', 'text-embedding-3-large',
        'claude-3-7-sonnet@20250219', 'audio', 'wav', '[ATTACHMENTS]', 'CHAT',
        'OPENAI_VOICE', 'medium', 'low', 'high', 'medium', 'think', '<think>',
        '</think>', 'AZURE', '<tools>', '</tools>', 'tools', 'text', 'thinking',
        'OK', 'function', 'gpt-4.5-preview', 'redacted_thinking',
        'gemma-3-27b-it', 'Azure Openai', 'Anthropic', 'Vertex Anthropic',
        'gemma3:27b', 7680 * 4320, [], 10, { log: true }, 'Alan', 'user',
        'system', 'assistant', 'model', 'json_object', 'tool', true,
        'gemini-embedding-exp-03-07', 'Invalid file data.', 1.1, 100,
        'Content is required.', 2000 * 768, x => 1024 * x, x => 1000 * x,
        x => 1024 * 1024 * x, x => 60 * x, x => 60 * 60 * x,
        x => 1024 * 1024 * 1024 * x, x => x.replace(/[\.\s]*$/, ''),
        { embedding: true }, 'gemini-2.0-flash-exp', 'image', 'Jina Deepsearch',
        'jina-deepsearch-v1', 'JINA_EMBEDDING', 'jina-clip-v2',
    ];

const [tool, messages, text]
    = [type => ({ type }), messages => ({ messages }), text => ({ text })];
const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', FUNC].map(tool);
const [sessionType, aiType]
    = [`${name.toUpperCase()}-SESSION`, `${name.toUpperCase()}-AI`];
const [newSessionId, newAiId]
    = [sessionType, aiType].map(type => () => createUoid({ type }));
const chatConfig = { sessions: new Map(), systemPrompt: INSTRUCTIONS };
const tokenSafe = count => Math.ceil(count * tokenSafeRatio);
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 0, ...o || {} });
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const assertContent = content => assert(content.length, CONTENT_IS_REQUIRED);
const countToolCalls = r => r?.split('\n').filter(x => x === TOOLS_STR).length;
const assertApiKey = (p, o) => assert(o?.apiKey, `${p} api key is required.`);
const libOpenAi = async opts => await need('openai', { ...opts, raw: true });
const OpenAI = async opts => new (await libOpenAi(opts)).OpenAI(opts);
const AzureOpenAI = async opts => new (await libOpenAi(opts)).AzureOpenAI(opts);
const OPENAI_S1 = { contextWindow: kT(128), maxOutputTokens: k(16) };
const OPENAI_S2 = { contextWindow: kT(200), maxOutputTokens: kT(100) };
const OPENAI_EBD = { ...EBD, maxInputTokens: k(8) - 1 };
const OPENAI_AUDIO_TYPES = { supportedAudioTypes: [wav] };
const GPT_4O_AUDIO = { ...OPENAI_AUDIO_TYPES, audio: 'gpt-4o-audio-preview' };

const OPENAI_RULES = {
    imageCostTokens: ~~(OPENAI_HI_RES_SIZE / (512 * 512) * 170 + 85),
    maxFileSize: m(20), maxImageSize: OPENAI_HI_RES_SIZE,
    supportedMimeTypes: [png, jpeg, gif, webp],
    json: true, tools: true, vision: true,
};

const GEMINI_RULES = {
    audioCostTokens: 1000 * 1000 * 1, // 8.4 hours => 1 million tokens
    imageCostTokens: ~~(v8k / (768 * 768) * 258), maxAudioLength: hour(8.4),
    maxAudioPerPrompt: 1, maxFileSize: m(20), maxImagePerPrompt: 3000,
    maxImageSize: Infinity, maxUrlSize: gb(2), maxVideoLength: minute(45),
    maxVideoPerPrompt: 10, vision: true, supportedMimeTypes: [
        png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, pdf, aac,
        flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp,
    ],
};

// https://platform.openai.com/docs/models
// https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
const MODELS = {
    [GPT_4O]: { ...OPENAI_S1, ...OPENAI_RULES, ...GPT_4O_AUDIO },
    [GPT_45]: { ...OPENAI_S1, ...OPENAI_RULES, ...GPT_4O_AUDIO },
    [GPT_4O_MINI]: {
        ...OPENAI_S1, ...OPENAI_RULES, ...OPENAI_AUDIO_TYPES,
        audio: 'gpt-4o-mini-audio-preview', fast: true,
    },
    [GPT_O1]: {
        ...OPENAI_S2, ...OPENAI_RULES, ...GPT_4O_AUDIO,
        reasoning: true,
    },
    [GPT_O3_MINI]: {
        ...OPENAI_S2, ...OPENAI_RULES, ...GPT_4O_AUDIO,
        fast: true, reasoning: true,
    },
    [GEMINI_20_FLASH]: {
        ...GEMINI_RULES, contextWindow: m(1), maxOutputTokens: k(8),
        fast: true, json: true, tools: true,
    },
    [GEMINI_20_FLASH_THINKING]: {
        ...GEMINI_RULES, contextWindow: m(1), maxOutputTokens: k(64),
        reasoning: true,
    },
    [GEMINI_20_PRO]: {
        ...GEMINI_RULES, contextWindow: m(2), maxOutputTokens: k(8),
        json: true,
    },
    [GEMMA_3_27B]: {
        contextWindow: kT(128), maxOutputTokens: k(8),
        imageCostTokens: 256, maxImageSize: 896 * 896,
        supportedMimeTypes: [png, jpeg, gif],
        fast: true, json: true, vision: true,
    },
    [JINA_DEEPSEARCH_M]: {
        contextWindow: Infinity, maxInputTokens: Infinity,
        maxOutputTokens: Infinity, imageCostTokens: 0, maxImageSize: Infinity,
        supportedMimeTypes: [png, jpeg, MIME_TEXT, webp, pdf],
        reasoning: true, json: true, vision: true,
    },
    [DEEPSEEK_R1]: {
        contextWindow: kT(128), maxOutputTokens: k(32),
        reasoning: true,
    }, // ERROR: column cannot have more than 2000 dimensions for hnsw index
    [TEXT_EMBEDDING_3_LARGE]: { ...OPENAI_EBD, dimension: k(3) },
    [TEXT_EMBEDDING_3_SMALL]: { ...OPENAI_EBD, dimension: k(1.5) },
    [GEMINI_EMBEDDING_M]: { ...EBD, maxInputTokens: k(8), dimension: k(3) },
    [JINA_CLIP]: {
        maxInputTokens: k(8), maxImageSize: 512 * 512, dimension: k(1),
    },
    [CLOUD_37_SONNET]: { // 100 pages: https://docs.anthropic.com/en/docs/build-with-claude/pdf-support
        contextWindow: kT(200), maxOutputTokens: kT(64),
        documentCostTokens: 3000 * 100, maxDocumentFile: m(32),
        maxDocumentPages: 100, imageCostTokens: ~~(v8k / 750),
        maxImagePerPrompt: 100, maxImageSize: 2000 * 2000,
        supportedMimeTypes: [png, jpeg, gif, webp, pdf],
        json: true, reasoning: true, tools: true, vision: true,
    }, // https://docs.anthropic.com/en/docs/build-with-claude/vision
};

// Unifiy model configurations
let ATTACHMENT_TOKEN_COST = 0;
for (const n in MODELS) {
    MODELS[n]['name'] = n;
    if (!MODELS[n].embedding) {
        MODELS[n].supportedMimeTypes = MODELS[n].supportedMimeTypes || [];
        MODELS[n].maxOutputTokens = MODELS[n].maxOutputTokens
            || Math.ceil(MODELS[n].contextWindow * 0.4);
        MODELS[n].maxInputTokens = MODELS[n].maxInputTokens
            || (MODELS[n].contextWindow - MODELS[n].maxOutputTokens);
        ATTACHMENT_TOKEN_COST = ATTACHMENT_TOKEN_COST ? Math.max(
            ATTACHMENT_TOKEN_COST, MODELS[n].imageCostTokens || 0
        ) : MODELS[n].imageCostTokens;
    }
}
MODELS[GEMMA327B] = MODELS[GEMMA_3_27B]; // Ollama Alias
MODELS[GEMINI_20_FLASH].image = GEMINI_20_FLASH_EXP;
MODELS[GEMINI_20_FLASH_EXP] = {
    ...MODELS[GEMINI_20_FLASH],
    name: GEMINI_20_FLASH_EXP, image: true, tools: false,
};

// Default models for each provider
const DEFAULT_MODELS = {
    [OPENAI]: GPT_4O,
    [AZURE_OPENAI]: GPT_4O,
    [GEMINI]: GEMINI_20_FLASH,
    [ANTHROPIC]: CLOUD_37_SONNET,
    [VERTEX_ANTHROPIC]: CLOUD_37_SONNET,
    [JINA_DEEPSEARCH]: JINA_DEEPSEARCH_M,
    [OLLAMA]: GEMMA327B,
    [OPENAI_VOICE]: NOVA,
    [OPENAI_EMBEDDING]: TEXT_EMBEDDING_3_SMALL,
    [GEMINI_EMEDDING]: GEMINI_EMBEDDING_M,
    [JINA_EMBEDDING]: JINA_CLIP,
    [OPENAI_TRAINING]: GPT_4O_MINI, // https://platform.openai.com/docs/guides/fine-tuning
};
DEFAULT_MODELS[CHAT] = DEFAULT_MODELS[GEMINI];

const tokenRatioByWords = Math.min(
    100 / 75, // ChatGPT: https://platform.openai.com/tokenizer
    Math.min(100 / 60, 100 / 80), // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);

const tokenRatioByCharacters = Math.max(
    3.5, // Claude: https://docs.anthropic.com/en/docs/resources/glossary
    4, // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);


let tokeniser;

const unifyProvider = provider => {
    assert(provider = (provider || '').trim(), 'AI provider is required.');
    for (let type of [OPENAI, AZURE_OPENAI, AZURE, GEMINI, ANTHROPIC,
        VERTEX_ANTHROPIC, JINA_DEEPSEARCH, OLLAMA]) {
        if (insensitiveCompare(provider, type)) { return type; }
    }
    throwError(`Invalid AI provider: ${provider}.`);
};

const tools = [
    {
        def: {
            type: 'function', strict: true, function: {
                name: 'getDateTime',
                description: 'Use this function to get the current date and time. Note that you may need to convert the time zone yourself.',
                parameters: {
                    type: 'object',
                    properties: {
                        none: { type: 'string', description: 'You do not need to pass any param.' }
                    },
                    required: [],
                    additionalProperties: false
                }
            }
        },
        func: async () => new Date().toLocaleString(),
        showRes: true,
    },
    {
        def: {
            type: 'function', strict: true, function: {
                name: 'browseWeb',
                description: 'Use this function to browse the web or get information from any URL you need.',
                parameters: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', description: 'The URL to the page you need to access.' }
                    },
                    required: ['url'],
                    additionalProperties: false
                }
            }
        },
        func: async args => (await distill(args?.url))?.summary,
        showReq: true,
    },
    {
        def: {
            type: 'function', strict: true, function: {
                name: 'searchWeb',
                description: 'Use this function to search the web for information or news when you need.',
                parameters: {
                    type: 'object',
                    properties: {
                        keyword: { type: 'string', description: 'The keyword you need to search for.' },
                        num: { type: 'integer', description: 'The number of search results you need, default `10`.' },
                        start: { type: 'integer', description: 'The start index of the search results, default `1`.' },
                        image: { type: 'boolean', description: 'Whether to search for images, default `false`.' },
                    },
                    required: ['keyword'],
                    additionalProperties: false
                }
            }
        },
        func: async args => await search(args?.keyword),
        showReq: true,
        depend: checkSearch,
    },
];

const toolsOpenAI = async () => {
    const _tools = [];
    for (const t of tools) {
        (t.depend ? await t.depend() : true) ? _tools.push(t) : log(
            `Tool is not ready: ${t.def.function.name}`
        );
    }
    return _tools;
};

const toolsClaude = async () => (await toolsOpenAI()).map(x => ({
    ...x, def: {
        name: x.def.function.name,
        description: x.def.function.description,
        input_schema: x.def.function.parameters,
    }
}));

const toolsGemini = async () => (await toolsOpenAI()).map(x => ({
    ...x, def: {
        name: x.def.function.name,
        description: x.def.function.description,
        parameters: {
            type: 'object',
            properties: x.def.function.parameters.properties,
            required: x.def.function.parameters.required,
        },
        response: x.def.function?.response ?? {
            type: 'string', description: 'It could be a string or JSON',
        },
    }
}));

const init = async (options = {}) => {
    const id = options.id || newAiId();
    const provider = unifyProvider(options?.provider);
    const modelName = options.model || DEFAULT_MODELS[provider];
    assert(modelName, `Model is required for provider: ${provider}.`);
    let model = options.modelConfig || MODELS[modelName];
    assert(model, `The model has not been configured yet: ${modelName}.`);
    model = { name: modelName, ...model };
    switch (provider) {
        case OPENAI:
            assertApiKey(provider, options);
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: await OpenAI(options),
                prompt: async (cnt, opts) => await promptOpenAI(id, cnt, opts),
                embedding: async (i, o) => await createOpenAIEmbedding(id, i, o),
            });
            break;
        case AZURE_OPENAI:
            assertApiKey(provider, options);
            assert(options.endpoint,
                `${provider} api endpoint and deployment are required.`);
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: await AzureOpenAI({
                    apiVersion: '2025-01-01-preview',
                    deployment: model.name, ...options,
                }),
                prompt: async (cnt, opts) => await promptOpenAI(id, cnt, opts),
            });
            break;
        case AZURE:
            assertApiKey(provider, options);
            assert(options.baseURL, `${provider} api endpoint is required.`);
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: await OpenAI(options),
                prompt: async (cnt, opts) => await promptOpenAI(id, cnt, opts),
            });
            break;
        case GEMINI:
            assertApiKey(provider, options);
            const { GoogleGenerativeAI } = await need('@google/generative-ai');
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: new GoogleGenerativeAI(options.apiKey),
                prompt: async (cnt, opts) => await promptGemini(id, cnt, opts),
                embedding: async (i, o) => await createGeminiEmbedding(id, i, o),
            });
            break;
        case ANTHROPIC:
            assertApiKey(provider, options);
            const Anthropic = (await need('@anthropic-ai/sdk')).Anthropic;
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: new Anthropic(options),
                prompt: async (cnt, opts) => await promptAnthropic(id, cnt, opts),
            });
            break;
        case VERTEX_ANTHROPIC:
            // https://github.com/anthropics/anthropic-sdk-typescript/tree/main/packages/vertex-sdk
            assert(options?.credentials, `${provider} api credentials are required.`);
            const AnthropicVertex = (await need('@anthropic-ai/vertex-sdk')).AnthropicVertex;
            process.env['GOOGLE_APPLICATION_CREDENTIALS'] = options.credentials;
            process.env['ANTHROPIC_VERTEX_PROJECT_ID'] = options.projectId;
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: new AnthropicVertex({ region: options?.region || 'us-east5' }),
                prompt: async (cnt, opts) => await promptAnthropic(id, cnt, opts),
            });
            break;
        case JINA_DEEPSEARCH:
            assertApiKey(provider, options);
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: await OpenAI({
                    baseURL: 'https://deepsearch.jina.ai/v1/', ...options,
                }),
                prompt: async (cnt, opts) => await promptOpenAI(id, cnt, opts),
                embedding: async (i, o) => await createJinaEmbedding(await OpenAI({
                    baseURL: 'https://api.jina.ai/v1/', ...options,
                }), i, o),
            });
            break;
        case OLLAMA:
            // https://github.com/ollama/ollama/blob/main/docs/openai.md
            const baseURL = 'http://localhost:11434/v1/';
            ais.push({
                id, provider, model, priority: 0, initOrder: ais.length,
                client: await OpenAI({ baseURL, apiKey: 'ollama', ...options }),
                prompt: async (cnt, opts) => await promptOpenAI(id, cnt, opts),
            });
            const phLog = m => log(`Ollama preheat: ${m?.message || m}`);
            ignoreErrFunc(async () => {
                phLog(await (await fetch(`${baseURL}completions`, {
                    method: 'POST', body: JSON.stringify({
                        model: model.name, prompt: '', keep_alive: -1
                    })
                })).text());
            }, { log: phLog });
            break;
        default:
            throwError(`Invalid AI provider: ${options.provider || 'null'}.`);
    }
    ais.sort((a, b) => a.priority - b.priority || a.initOrder - b.initOrder);
    return ais.find(x => x.id === id);
};

const getAi = async (id, options = {}) => {
    if (id) {
        const ai = ais.find(x => x.id === id);
        assert(ais, `AI not found: ${id}.`);
        return options?.client ? ai?.client : ai;
    } else if (options?.select) {
        const res = [];
        for (let x of ais) {
            let select = true;
            for (let i in options.select) {
                if (options.select[i] && i !== 'fast' && !x.model[i]) {
                    select = false; break;
                }
            }
            select && (res.push(x));
        }
        const best = options.select?.fast ? res.filter(x => x.model.fast) : res;
        if (best.length) { return options.all ? best : best[0]; }
        assert(res.length, 'AI not found.');
        log(`Best match AI not found, fallbacked: ${JSON.stringify(options.select)}.`);
        return options.all ? res : res[0];
    }
    const result = options.all ? ais : ais[0];
    assert(result?.length || result?.id, 'AI not found.');
    return result;
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

const selectGptAudioModel = options => {
    assert(
        MODELS[options.model]?.audio,
        `Audio modality is not supported by model: ${options.model}`
    );
    return MODELS[options.model]?.audio;
};

const buildGptMessage = (content, options) => {
    content = content || '';
    let alterModel = options?.audioMode && selectGptAudioModel(options);
    const attachments = (options?.attachments || []).map(x => {
        assert(MODELS[options?.model], 'Model is required.');
        if (MODELS[options.model]?.supportedMimeTypes?.includes?.(x.mime_type)) {
            return { type: 'image_url', image_url: { url: x.url, detail: 'high' } };
        } else if (MODELS[options.model]?.supportedAudioTypes?.includes?.(x.mime_type)) {
            alterModel = selectGptAudioModel(options);
            return {
                type: 'input_audio',
                input_audio: { data: x.data, format: WAV },
            };
        }
        throwError(`Unsupported mime type: '${x.mime_type}'.`);
    });
    alterModel && (options.model = alterModel);
    const message = String.isString(content) ? {
        role: options?.role || user,
        content: content.length ? [{ type: TEXT, text: content }] : [],
    } : content;
    message.content || (message.content = []);
    attachments.map(x => message.content.push(x));
    assertContent(message.content);
    return message;
};

const buildGeminiParts = (text, attachments) => {
    // Gemini API does not allow empty text, even you prompt with attachments.
    const message = [...text?.length || attachments?.length ? [{
        text: text?.length ? text : ' '
    }] : [], ...attachments || []];
    assertContent(message);
    return message;
};

const buildGeminiMessage = (content, options) => {
    content = content || '';
    const attachments = (options?.attachments?.length ? options.attachments : []).map(x => ({
        inlineData: { mimeType: x.mime_type, data: x.data }
    }));
    return String.isString(content) ? (options?.history ? {
        role: options?.role || user,
        parts: buildGeminiParts(content, attachments),
    } : buildGeminiParts(content, attachments)) : content;
};

const buildClaudeMessage = (text, options) => {
    assert(text, 'Text is required.');
    const attachments = (options?.attachments?.length ? options?.attachments : []).map(x => {
        let type = '';
        if ([pdf].includes(x.mime_type)) {
            type = 'document';
        } else if ([png, jpeg, gif, webp].includes(x.mime_type)) {
            type = 'image';
        } else { throwError(`Unsupported mime type: ${x.mime_type}`); }
        return {
            type, source: {
                type: BASE64.toLowerCase(),
                media_type: x.mime_type, data: x.data,
            },
        }
    });
    return String.isString(text) ? {
        role: options?.role || user, content: [...attachments, {
            type: TEXT, text, ...options.cache_control ? {
                cache_control: { type: 'ephemeral' },
            } : {},
        }],
    } : text;
};

const buildGeminiHistory = (text, options) => buildGeminiMessage(
    text, { ...options || {}, history: true }
);

const listOpenAIModels = async (aiId, options) => {
    const { client } = await getAi(aiId);
    const resp = await client.models.list();
    return options?.raw ? resp : resp.data;
};

const streamResp = async (resp, options) => {
    const msg = await packResp(resp, { ...options, processing: true });
    return options?.stream && (msg?.text || msg?.audio?.length)
        && await ignoreErrFunc(async () => await options.stream(msg), LOG);
};

const getInfoEnd = text => Math.max(...[THINK_END, TOOLS_END].map(x => {
    const keyEnd = text.indexOf(text.endsWith(x) ? x : `${x}\n`);
    return keyEnd >= 0 ? (keyEnd + x.length) : 0;
}));

// @todo: escape ``` in think and tools
const packResp = async (resp, options) => {
    if (options?.raw) { return resp; }
    let [
        txt, audio, references, simpleText, referencesMarkdown, end, json,
        images
    ] = [
            resp.text || '',                                                    // ChatGPT / Claude / Gemini / Ollama
            resp?.audio?.data,                                                  // ChatGPT audio mode
            resp?.references,                                                   // Gemini references
            '', '', '', null, resp?.images || [],
        ];
    simpleText = txt;
    while ((end = getInfoEnd(simpleText))) {
        simpleText = simpleText.slice(end).trim();
        end = getInfoEnd(simpleText);
    }
    [THINK_STR, TOOLS_STR].map(x => {
        const str = simpleText.indexOf(x);
        str >= 0 && (simpleText = simpleText.slice(0, str).trim());
    });
    audio && (audio = Buffer.isBuffer(audio) ? audio : await convert(audio, {
        input: BASE64, expected: BUFFER,
    })) && audio.length && (audio = Buffer.concat([
        createWavHeader(audio.length), audio
    ])) && (audio = await convert(audio, {
        input: BUFFER, expected: BUFFER, ...options || {},
    }));
    if (images?.length) {
        for (let i in images) {
            images[i].data = await convert(images[i].data, {
                input: BASE64, expected: BUFFER,
            });
        }
    }
    options?.jsonMode && !options?.delta && (json = parseJson(simpleText, null));
    if (options?.simple && options?.audioMode) { return audio; }
    else if (options?.simple && options?.jsonMode) { return json; }
    else if (options?.simple && options?.imageMode) { return images; }
    else if (options?.simple) { return simpleText; }
    else if (options?.jsonMode) { txt = `\`\`\`json\n${simpleText}\n\`\`\``; }
    // references debug codes:
    // references = {
    //     "segments": [
    //         {
    //             "startIndex": 387,
    //             "endIndex": 477,
    //             "text": "It also provides live weather reports from Shanghai weather stations and weather warnings.",
    //             "indices": [
    //                 0
    //             ],
    //             "confidence": [
    //                 0.94840443
    //             ]
    //         },
    //     ],
    //     "links": [
    //         {
    //             "uri": "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AYygrcRVExzEYZU-23c6gKNSOJjLvSpI4CHtVmYJZaTLKd5N9GF-38GNyC2c9arn689-dmmpMh0Vd85x0kQp0IVY7BQMl1ugEYzy_IlDF-L3wFqf9xWHelAZF4cJa2LnWeUQsjyyTnYFRUs7nhlVoDVu1qYF0uLtVIjdyl5NH0PM92A=",
    //             "title": "weather-forecast.com"
    //         },
    //     ]
    // };
    if (references?.segments?.length && references?.links?.length) {
        for (let i = references.segments.length - 1; i >= 0; i--) {
            let idx = txt.indexOf(references.segments[i].text);
            if (idx < 0) { continue; }
            idx += references.segments[i].text.length;
            txt = txt.slice(0, idx)
                + references.segments[i].indices.map(y => ` (${y + 1})`).join('')
                + txt.slice(idx);
        }
        referencesMarkdown = 'References:\n\n' + references.links.map(
            (x, i) => `${i + 1}. [${x.title}](${x.uri})`
        ).join('\n');
    }
    txt = txt.split('\n');
    for (let i in txt) {
        switch (txt[i]) {
            case THINK_STR: txt[i] = MD_CODE + THINK; break;
            case TOOLS_STR: txt[i] = MD_CODE + TOOLS; break;
            case THINK_END: case TOOLS_END: txt[i] = MD_CODE;
        }
    }
    txt = txt.join('\n');
    !options?.delta && !options?.processing && (txt = txt.trim());
    return {
        ...text(txt), ...options?.jsonMode ? { json } : {},
        ...references ? { references } : {},
        ...referencesMarkdown ? { referencesMarkdown } : {},
        ...audio ? { audio, audioMimeType: options?.audioMimeType } : {},
        ...images?.length ? { images } : {},
        processing: !!options?.processing,
        model: options?.model,
    };
};

const buildPrompts = async (model, input, options = {}) => {
    assert(!(
        options.jsonMode && !model?.json
    ), `This model does not support JSON output: ${options.model}`);
    assert(!(
        options.reasoning && !model?.reasoning
    ), `This model does not support reasoning: ${options.model}`);
    let [systemPrompt, history, content, prompt, _system, _user, _assistant] = [
        null, null, input || ATTACHMENTS, null, // length hack: ATTACHMENTS
        { role: system }, { role: user }, { role: assistant },
    ];
    options.systemPrompt = options.systemPrompt || INSTRUCTIONS;
    options.attachments = (
        options.attachments?.length ? options.attachments : []
    ).filter(x => [
        ...model?.supportedMimeTypes || [], ...model.supportedAudioTypes || []
    ].includes(x.mime_type));
    switch (options.flavor) {
        case OPENAI:
            systemPrompt = buildGptMessage(options.systemPrompt, _system);
            prompt = buildGptMessage(content, options);
            break;
        case ANTHROPIC:
            systemPrompt = options.systemPrompt;
            prompt = buildClaudeMessage(content, { ...options, cache_control: true });
            break;
        case GEMINI:
            const _role = {
                role: [GEMINI_20_FLASH_EXP, GEMMA_3_27B].includes(options.model)
                    ? user : system
            };
            systemPrompt = buildGeminiHistory(options.systemPrompt, _role);
            prompt = options.toolsResult?.[options.toolsResult?.length - 1]?.parts
                || buildGeminiMessage(content, options)
            break;
    }
    const msgBuilder = () => {
        history = [];
        (options.messages?.length ? options.messages : []).map((x, i) => {
            switch (options.flavor) {
                case OPENAI:
                    history.push(buildGptMessage(x.request, _user));
                    history.push(buildGptMessage(x.response, _assistant));
                    break;
                case ANTHROPIC:
                    history.push(buildClaudeMessage(x.request, _user));
                    history.push(buildClaudeMessage(x.response, _assistant));
                    break;
                case GEMINI:
                    if (options.attachments?.length) { return; }
                    history.push(buildGeminiHistory(x.request, _user));
                    history.push(buildGeminiHistory(x.response, { role: MODEL }));
                    break;
            }
        });
        switch (options.flavor) {
            case OPENAI:
                history = messages([
                    systemPrompt, ...history, prompt,
                    ...options.toolsResult?.length ? options.toolsResult : []
                ]);
                break;
            case ANTHROPIC:
                history = messages([
                    ...history, prompt,
                    ...options.toolsResult?.length ? options.toolsResult : []
                ]);
                break;
            case GEMINI:
                history.push(
                    ...options.model === GEMMA_3_27B ? [systemPrompt] : [],
                    ...options.toolsResult?.length ? [
                        buildGeminiHistory(content, { ...options, role: user }),
                        ...options.toolsResult.slice(0, options.toolsResult.length - 1)
                    ] : []
                );
                break;
        }
    };
    msgBuilder();
    await trimPrompt(() => [systemPrompt, history, prompt], () => {
        if (options.messages.length) {
            options.messages.shift();
            msgBuilder();
        } else {
            content = trimTailing(trimTailing(content).slice(0, -1)) + '...';
        } // @todo: audioCostTokens (needs to calculate the audio length):
    }, model.maxInputTokens - options.attachments?.length * model.imageCostTokens);
    if ([OPENAI].includes(options.flavor)
        || [GEMINI_20_FLASH_EXP, GEMMA_3_27B].includes(options.model)) {
        systemPrompt = null;
    }
    return { systemPrompt, history, prompt };
};

const handleToolsCall = async (msg, options) => {
    let [content, preRes, input, packMsg, toolsResponse, responded, callIdx] = [
        [], [], [], null, options?.result ? options?.result.trim() : '',
        false, 0,
    ];
    const resp = async m => {
        m = `\n${m}`;
        responded || (m = `\n\n${TOOLS_STR}${m}`);
        responded = true;
        toolsResponse = (toolsResponse + m).trim();
        await streamResp({ text: options?.delta ? m : toolsResponse }, options);
    };
    const calls = msg.tool_calls || msg.content || msg.parts || [];
    if (calls.length) {
        switch (options?.flavor) {
            case ANTHROPIC: preRes.push(msg); break;
            case GEMINI: preRes.push(msg); break;
            case OPENAI: default: preRes.push(msg); break;
        }
        for (const fn of calls) {
            switch (options?.flavor) {
                case ANTHROPIC:
                    input = fn.input = String.isString(fn?.input)
                        ? parseJson(fn.input) : fn?.input;
                    packMsg = (content, is_error) => ({
                        type: 'tool_result', tool_use_id: fn.id,
                        content, is_error,
                    });
                    break;
                case GEMINI:
                    input = fn?.functionCall?.args;
                    packMsg = (t, e) => ({
                        functionResponse: {
                            name: fn?.functionCall?.name, response: {
                                name: fn?.functionCall?.name,
                                content: e ? `[Error] ${t}` : t,
                            }
                        }
                    });
                    break;
                case OPENAI: default:
                    input = parseJson(fn?.function?.arguments);
                    packMsg = (content = '', e = false) => ({
                        role: TOOL, tool_call_id: fn.id,
                        ...e ? { error: content, content: '' } : { content }
                    });
                    break;
            }
            const name = (fn?.function || fn?.functionCall || fn)?.name;
            if (!name) { continue; }
            await resp(`${callIdx++ ? '\n' : ''}Name: ${name}`);
            const f = tools.find(x => insensitiveCompare(
                x.def?.function?.name || x?.def?.name, name
            ));
            if (!f?.func) {
                const rt = `Failed: invalid function name \`${name}\``;
                content.push(packMsg(rt, true));
                await resp(rt);
                continue;
            }
            const description = f.def?.function?.description || f.def?.description;
            description && await resp(`Description: ${description}`);
            f.showReq && isSet(input, true) && Object.keys(input).length
                && await resp(`Input: ${JSON.stringify(input)}`);
            try {
                const output = JSON.stringify((await f?.func(input)) ?? OK);
                content.push(packMsg(output));
                await resp(f.showRes ? `Output: ${output}` : `Status: OK`);
            } catch (err) {
                const rt = `Failed: ${err.message}`;
                content.push(packMsg(rt, true));
                await resp(rt);
                log(rt);
            }
        }
        if (content.length) {
            switch (options?.flavor) {
                case ANTHROPIC: content = [{ role: user, content }]; break;
                case GEMINI: content = [{ role: FUNC, parts: content }]; break;
            }
        }
        responded && await resp(TOOLS_END);
    }
    return {
        toolsResult: [...content.length ? preRes : [], ...content],
        toolsResponse,
    };
};

const mergeMsgs = (resp, calls) => [resp, ...calls.length ? [
    `⚠️ Tools recursion limit reached: ${MAX_TOOL_RECURSION}`
] : []].map(x => x.trim()).join('\n\n');

const promptOpenAI = async (aiId, content, options = {}) => {
    let { provider, client, model } = await getAi(aiId);
    let [result, resultAudio, event, resultTools, responded, azure] = [
        options.result ?? '', Buffer.alloc(0), null, [], false,
        provider === AZURE
    ];
    options.flavor = OPENAI;
    options.model = options.model || model.name;
    const { history }
        = await buildPrompts(MODELS[options.model], content, options);
    model = MODELS[options.model];
    model.reasoning && !azure && !options.reasoning_effort
        && (options.reasoning_effort = GPT_REASONING_EFFORT);
    const modalities = options.modalities
        || (options.audioMode ? [TEXT, AUDIO] : undefined);
    [options.audioMimeType, options.suffix] = [pcm16, 'pcm.wav'];
    const resp = await client.chat.completions.create({
        model: azure ? undefined : options.model, ...history,
        ...options.jsonMode ? { response_format: { type: JSON_OBJECT } } : {},
        ...provider === OLLAMA ? { keep_alive: -1 } : {},
        modalities, audio: options.audio || (
            modalities?.find?.(x => x === AUDIO)
            && { voice: DEFAULT_MODELS[OPENAI_VOICE], format: 'pcm16' }
        ), ...model.tools && !azure ? {
            tools: options.tools ?? (await toolsOpenAI()).map(x => x.def),
            tool_choice: 'auto',
        } : {}, ...azure ? {} : { store: true }, stream: true,
    });
    for await (event of resp) {
        event = event?.choices?.[0] || {};
        const delta = event.delta || {};
        let deltaText = delta.content || delta.audio?.transcript || '';
        const deltaAudio = delta.audio?.data ? await convert(
            delta.audio.data, { input: BASE64, expected: BUFFER }
        ) : Buffer.alloc(0);
        for (const x of delta.tool_calls || []) {
            let curFunc = resultTools.find(y => y.index === x.index);
            curFunc || (resultTools.push(curFunc = {}));
            isSet(x.index, true) && (curFunc.index = x.index);
            x.id && (curFunc.id = x.id);
            x.type && (curFunc.type = x.type);
            curFunc.function
                || (curFunc.function = { name: '', arguments: '' });
            x?.function?.name && (curFunc.function.name += x.function.name);
            x?.function?.arguments
                && (curFunc.function.arguments += x.function.arguments);
        }
        options.result && deltaText
            && (responded = responded || (deltaText = `\n\n${deltaText}`));
        result += deltaText;
        resultAudio = Buffer.concat([resultAudio, deltaAudio]);
        const respAudio = options.delta ? deltaAudio : resultAudio;
        (deltaText || deltaAudio?.length) && await streamResp({
            text: options.delta ? deltaText : result,
            ...respAudio.length ? { audio: { data: respAudio } } : {},
        }, options);
    }
    event = {
        role: assistant, text: result, tool_calls: resultTools,
        ...resultAudio.length ? { audio: { data: resultAudio } } : {},
    };
    const { toolsResult, toolsResponse }
        = await handleToolsCall(event, { ...options, result });
    if (toolsResult.length
        && countToolCalls(toolsResponse) < MAX_TOOL_RECURSION) {
        return promptOpenAI(aiId, content, {
            ...options, toolsResult, result: toolsResponse,
        });
    }
    event.text = mergeMsgs(toolsResponse, toolsResult);
    return await packResp(event, options);
};

const promptAnthropic = async (aiId, content, options = {}) => {
    const { client, model } = await getAi(aiId);
    let [
        event, text, thinking, signature, result, thinkEnd, tool_use,
        responded, redacted_thinking
    ] = [null, '', '', '', options.result ?? '', '', [], false, []];
    options.model = options.model || model.name;
    options.test_redacted_thinking && !result && (
        content += '\n\nANTHROPIC_MAGIC_STRING_TRIGGER_REDACTED_THINKING_'
        + '46C9A13E193C177646C7398A98432ECCCE4C1253D5E2D82641AC0E52CC2876CB'
    ); // https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
    const { systemPrompt: system, history }
        = await buildPrompts(model, content, { ...options, flavor: ANTHROPIC });
    const resp = await client.beta.messages.create({
        model: options.model, ...history, system, stream: true,
        max_tokens: options.extendedThinking ? kT(128) : model.maxOutputTokens,
        ...(options.reasoning ?? model.reasoning) ? {
            thinking: options.thinking || {
                type: 'enabled',
                budget_tokens: options?.extendedThinking ? 16000 : 1024,
            },
        } : {}, ...model?.tools ? {
            tools: options.tools ?? (await toolsClaude()).map(x => x.def),
            tool_choice: { type: 'auto' }, betas: [
                // https://docs.anthropic.com/en/docs/build-with-claude/tool-use/token-efficient-tool-use
                'token-efficient-tools-2025-02-19',
                // https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
                ...options?.extendedThinking ? ['output-128k-2025-02-19'] : [],
            ],
        } : {},
    });
    for await (const chunk of resp) {
        event = chunk?.content_block || chunk?.delta || {};
        let [deltaThink, deltaText] = [event.thinking || '', event.text || ''];
        text += deltaText;
        thinking += deltaThink;
        signature = signature || event?.signature || '';
        deltaThink && deltaThink === thinking
            && (deltaThink = `${THINK_STR}\n${deltaThink}`);
        thinking && deltaText && !thinkEnd
            && (thinkEnd = deltaThink = `${deltaThink}\n${THINK_END}\n\n`);
        event?.type === REDACTED_THINKING && redacted_thinking.push(event);
        if (event?.type === 'tool_use') {
            tool_use.push({ ...event, input: '' });
        } else if (event.partial_json) {
            tool_use[tool_use.length - 1].input += event.partial_json;
        }
        deltaText = deltaThink + deltaText;
        options.result && deltaText
            && (responded = responded || (deltaText = `\n\n${deltaText}`));
        result += deltaText;
        deltaText && await streamResp({
            text: options.delta ? deltaText : result,
        }, options);
    }
    event = {
        role: assistant, content: [
            ...thinking ? [{ type: THINKING, thinking, signature }] : [],
            ...redacted_thinking,
            ...text ? [{ type: TEXT, text }] : [], ...tool_use,
        ]
    };
    const { toolsResult, toolsResponse } = await handleToolsCall(
        event, { ...options, result, flavor: ANTHROPIC },
    );
    if (tool_use.length && countToolCalls(toolsResponse) < MAX_TOOL_RECURSION) {
        return await promptAnthropic(aiId, content, {
            ...options, toolsResult: [...options.toolsResult || [],
            ...toolsResult], result: toolsResponse,
        });
    }
    return packResp({ text: mergeMsgs(toolsResponse, tool_use) }, options);
};

const uploadFile = async (aiId, input, options) => {
    const { client } = await getAi(aiId);
    const { content: file, cleanup } = await convert(input, {
        input: options?.input, ...options || {}, expected: STREAM,
        errorMessage: INVALID_FILE, suffix: options?.suffix,
        withCleanupFunc: true,
    });
    const resp = await client.files.create({ file, ...options?.params || {} });
    await cleanup();
    return resp;
};

const uploadFileForFineTuning = async (aiId, content, options) => await uploadFile(
    aiId, content, { suffix: 'jsonl', ...options, params: { purpose: 'fine-tune' } }
);

const listFiles = async (aiId, options) => {
    const { client } = await getAi(aiId);
    const files = [];
    const list = await client.files.list(options?.params || {});
    for await (const file of list) { files.push(file); }
    return files;
};

const deleteFile = async (aiId, file_id, options) => {
    const { client } = await getAi(aiId);
    return await client.files.del(file_id);
};

const generationConfig = options => ({
    generationConfig: {
        responseMimeType: options.jsonMode ? MIME_JSON : MIME_TEXT,
        responseModalities: options.modalities
            || (options.imageMode ? [TEXT, IMAGE] : undefined),
        ...options?.generationConfig || {},
    },
});

const packGeminiReferences = (chunks, supports) => {
    let references = null;
    if (chunks?.length && supports?.length) {
        references = { segments: [], links: [] };
        supports.map(s => references.segments.push({
            ...s.segment, indices: s.groundingChunkIndices,
            confidence: s.confidenceScores,
        }));
        chunks.map(c => references.links.push(c.web));
    }
    return references;
};

const promptGemini = async (aiId, content, options = {}) => {
    let { client, model } = await getAi(aiId);
    let [result, references, functionCalls, responded, images]
        = [options.result ?? '', null, null, false, []];
    options.model = options.model || model.name;
    model?.image === true && (options.imageMode = true);
    assert(!(options.imageMode && !model.image), 'Image mode is not supported.');
    if (options.imageMode && String.isString(model.image)) {
        options.model = model.image;
        options.imageMode = true;
        model = MODELS[options.model];
    }
    const { systemPrompt: systemInstruction, history, prompt }
        = await buildPrompts(model, content, { ...options, flavor: GEMINI });
    const _client = client.getGenerativeModel({
        model: options.model, systemInstruction,
        ...model?.tools && !options.jsonMode
            && options.model !== GEMINI_20_FLASH_EXP ? (options.tools ?? {
                tools: [
                    // @todo: Gemini will failed when using these tools together.
                    // https://ai.google.dev/gemini-api/docs/function-calling
                    // { codeExecution: {} },
                    // { googleSearch: {} },
                    {
                        functionDeclarations: (
                            await toolsGemini()
                        ).map(x => x.def)
                    },
                ],
                toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
            }) : {},
    });
    // https://github.com/google/generative-ai-js/blob/main/samples/node/advanced-chat.js
    // Google's bug: history is not allowed while using inline_data?
    const chat = _client.startChat({ history, ...generationConfig(options) });
    const resp = await chat.sendMessageStream(prompt);
    for await (const chunk of resp.stream) {
        const deltaImages = [];
        chunk.candidates[0].content?.parts?.filter(
            x => x?.inlineData?.mimeType === png
        )?.map?.(x => {
            deltaImages.push(x.inlineData);
            images.push(x.inlineData);
        });
        functionCalls || (functionCalls = chunk.functionCalls);
        const rfc = packGeminiReferences(
            chunk.candidates[0]?.groundingMetadata?.groundingChunks,
            chunk.candidates[0]?.groundingMetadata?.groundingSupports
        );
        rfc && (references = rfc);
        let deltaText = chunk?.text?.() || '';
        options.result && deltaText
            && (responded = responded || (deltaText = `\n\n${deltaText}`));
        result += deltaText;
        (deltaText || deltaImages.length) && await streamResp({
            text: options.delta ? deltaText : result,
            images: options.delta ? deltaImages : images,
        }, options);
    }
    const _resp = await resp.response;
    functionCalls = (
        functionCalls() || _resp.functionCalls() || []
    ).map(x => ({ functionCall: x }));
    const { toolsResult, toolsResponse } = await handleToolsCall(
        { role: MODEL, parts: functionCalls },
        { ...options, result, flavor: GEMINI }
    );
    if (toolsResult.length
        && countToolCalls(toolsResponse) < MAX_TOOL_RECURSION) {
        return promptGemini(aiId, content, {
            ...options || {}, result: toolsResponse,
            toolsResult: [...options?.toolsResult || [], ...toolsResult],
        });
    }
    return await packResp({
        text: mergeMsgs(toolsResponse, toolsResult), images, references,
    }, options);
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

const createOpenAIEmbedding = async (client, input, options) => {
    // args from vertex embedding may be useful uere
    // https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings
    // task_type	Description
    // RETRIEVAL_QUERY	Specifies the given text is a query in a search/ retrieval setting.
    // RETRIEVAL_DOCUMENT	Specifies the given text is a document in a search / retrieval setting.
    // SEMANTIC_SIMILARITY	Specifies the given text will be used for Semantic Textual Similarity(STS).
    // CLASSIFICATION	Specifies that the embeddings will be used for classification.
    // CLUSTERING	Specifies that the embeddings will be used for clustering.
    String.isString(client) && (client = (await getAi(client)).client);
    const model = options?.model || DEFAULT_MODELS[OPENAI_EMBEDDING];
    const resp = await client.embeddings.create({
        model, input: await checkEmbeddingInput(input, model),
    });
    return options?.raw ? resp : resp?.data[0].embedding;
};

const createJinaEmbedding = async (client, input, options) =>
    await createOpenAIEmbedding(client, input, {
        model: DEFAULT_MODELS[JINA_EMBEDDING], ...options || {}
    });

const createGeminiEmbedding = async (aiId, input, options) => {
    const { client } = await getAi(aiId);
    const model = options?.model || DEFAULT_MODELS[GEMINI_EMEDDING];
    const resp = await client.getGenerativeModel({ model }).embedContent(
        await checkEmbeddingInput(input, model)
    );
    return options?.raw ? resp : resp?.embedding.values;
};

const buildGptTrainingCase = (prompt, response, options) => messages([
    ...options?.systemPrompt ? [
        buildGptMessage(options.systemPrompt, { role: system })
    ] : [], buildGptMessage(prompt),
    buildGptMessage(response, { role: assistant }),
]);

const buildGptTrainingCases = (cases, opts) => cases.map(x => JSON.stringify(
    buildGptTrainingCase(x.prompt, x.response, { ...x.options, ...opts })
)).join('\n');

const createGptFineTuningJob = async (aiId, training_file, options) => {
    const { client } = await getAi(aiId);
    return await client.fineTuning.jobs.create({
        training_file, model: options?.model || DEFAULT_MODELS[OPENAI_TRAINING],
    })
};

const getGptFineTuningJob = async (aiId, job_id, options) => {
    const { client } = await getAi(aiId);
    // https://platform.openai.com/finetune/[job_id]?filter=all
    return await client.fineTuning.jobs.retrieve(job_id);
};

const cancelGptFineTuningJob = async (aiId, job_id, options) => {
    const { client } = await getAi(aiId);
    return await client.fineTuning.jobs.cancel(job_id);
};

const listGptFineTuningJobs = async (aiId, options) => {
    const { client } = await getAi(aiId);
    const resp = await client.fineTuning.jobs.list({
        limit: GPT_QUERY_LIMIT, ...options?.params
    });
    return options?.raw ? resp : resp.data;
};

const listGptFineTuningEvents = async (aiId, job_id, options) => {
    const { client } = await getAi(aiId);
    const resp = await client.fineTuning.jobs.listEvents(job_id, {
        limit: GPT_QUERY_LIMIT, ...options?.params,
    });
    return options?.raw ? resp : resp.data;
};

const tailGptFineTuningEvents = async (aiId, job_id, options) => {
    assert(job_id, 'Job ID is required.');
    const [loopName, listOpts] = [`GPT-${job_id}`, {
        ...options, params: { ...options?.params, order: 'ascending' }
    }];
    let lastEvent;
    return await loop(async () => {
        const resp = await listGptFineTuningEvents(aiId, job_id, {
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

const initChat = async (options = {}) => {
    if (options.sessions) {
        assert(
            options.sessions?.get && options.sessions?.set,
            'Invalid session storage provider.'
        );
        chatConfig.sessions = options.sessions;
    }
    options.instructions && (chatConfig.systemPrompt = options.instructions);
    // Use Gemini instead of ChatGPT because of the longer package.
    const [spTokens, ais] = await Promise.all([countTokens([buildGeminiHistory(
        chatConfig.systemPrompt, { role: system }
    )]), getAi(null, { all: true })]);
    for (const ai of ais) {
        const mxPmpt = ai.model.maxInputTokens / 2;
        assert(spTokens < mxPmpt,
            `System prompt is too long: ${spTokens} / ${mxPmpt} tokens.`);
    }
    return { chatConfig, ais };
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

const talk = async (input, options = {}) => {
    let [chat, sessionId] =
        [{ request: input || ATTACHMENTS }, options.sessionId || newSessionId()];
    const session = await getSession(sessionId, options);
    const resp = await prompt(input, {
        messages: session.messages, log: true, ...options,
    });
    chat.response = resp.text;
    chat.request && chat.response && session.messages.push(chat);
    await setSession(sessionId, session, options);
    return {
        sessionId, ...resp, spoken: renderText(
            resp.text, { noCode: true, noLink: true }
        ).replace(/\[\^\d\^\]/ig, ''),
    };
};

const getChatPromptLimit = async (options) => {
    let resp = 0;
    (await getAi(null, { all: true })).map(x => {
        if (options?.aiId && options?.aiId !== x.id) { return; }
        const maxInputTokens = x.model.maxInputTokens;
        resp = resp ? Math.min(resp, maxInputTokens) : maxInputTokens;
    });
    assert(resp > 0, 'Chat engine has not been initialized.');
    return resp;
};

const getChatAttachmentCost = async (options) => {
    let resp = 0;
    (await getAi(null, { all: true })).map(x => {
        if (options?.aiId && options?.aiId !== x.id) { return; }
        resp = Math.max(resp, x.model.imageCostTokens || 0);
    });
    assert(resp > 0, 'Chat engine has not been initialized.');
    return resp;
};

const distillFile = async (attachments, o) => {
    const strPmt = o?.prompt || [
        'You are an intelligent document analyzer.',
        '- You will receive various multimedia files, including images, audio, and videos.',
        '- Please analyze these documents, extract the information, and organize it into an easy-to-read format.',
        '- For document-type files or image files primarily containing text information, act as a document scanner, return the text content, and describe any important images and tables present. You can use markdown table formatting to present table data. Please mark the description of images in the same position as the original text without creating separate paragraphs for descriptions. Be sure ONLY describe important images and graphs, and ignore backgrounds and decorative small images.',
        '- For audio files, please provide a transcript of the spoken voices. If there are background noises or music, attempt to briefly describe the environmental sounds and music sections.',
        '- For images or video files that are not primarily text-based, describe the tragic scene you observe, highlight key details, convey the emotional tone of the setting, and share your impressions.',
        '- For video files, please describe the content, including the theme, subjects, characters, scenes, objects, storyline, and emotional tone.',
        '- Please RETURN ONLY your analysis results without including your thought process or other unrelated information.',
        o?.summarize ? '- Please organize the key content of this document, systematically present the key information it contains in a concise summary, and remove any unimportant filler content, ONLY return the summary.' : '',
        o?.toLanguage ? `- Please return the results in ${o?.toLanguage}.` : '',
        o?.keepPaging ? '' : '- If the document has multiple pages, merge them into one page. Please do not return any paging information.',
        o?.keepDecoration ? '' : '- If the document has side notes, headers, footers, or watermarks, please ignore them.',
    ].filter(x => x).join('\n');
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
    return await prompt(strPmt, {
        simple: true, select: { vision: true, fast: true }, ...o, attachments,
    });
};

const prompt = async (input, options = {}) => {
    const ai = await getAi(options?.aiId, options);
    const tag = `${ai.provider} (${ai.model.name})`;
    options.log && log(`Prompt ${tag}: ${JSON.stringify(input)}`);
    const resp = await ai.prompt(input, options);
    options.log && log(`Response ${tag}: ${JSON.stringify(resp.text)}`);
    return resp;
};

const trimPrompt = async (getPrompt, trimFunc, contextWindow, options) => {
    let [i, maxTry] = [0, ~~options?.maxTry || kT(128)];
    while ((await countTokens(await getPrompt(), { fast: true }) > contextWindow)
        || (await countTokens(await getPrompt()) > contextWindow)) {
        await trimFunc();
        if (++i >= maxTry) { break; }
    };
};

const analyzeSessions = async (sessionIds, options) => {
    const ids = ensureArray(sessionIds);
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
        + 'dictionary and return it in JSON format. The input data may contain '
        + 'one or more sets of data. Try to summarize the content briefly '
        + 'without copying the original text. The returned JSON uses the key '
        + 'from the original JSON session data as the key, and the title should'
        + ' be a brief summary of your review of that chat record. Title '
        + 'should be a brief text string. The return format is as follows '
        + '`{"id_1": "title_1", "id_2": "title_2"}`. The following is a '
        + 'conversation data that needs to be organized: \n\n');
    const getInput = () =>
        `${pmt}\`\`\`JSON\n${JSON.stringify(sses)}\n\`\`\``;
    await trimPrompt(getInput, () => {
        if (!Object.values(sses).sort((x, y) =>
            y.messages.length - x.messages.length)[0].messages.shift()) {
            delete sses[Object.keys(sses).map(x => [
                x, JSON.stringify(sses[x]).length,
            ]).sort((x, y) => y[1] - x[1])[0][0]];
        }
    }, await getMaxChatPromptLimit(options));
    const aiResp = Object.keys(sses) ? (await prompt(getInput(), {
        jsonMode: true, simple: true, select: { json: true, fast: true },
        ...options || {}
    })) : {};
    assert(aiResp, 'Unable to analyze sessions.');
    ids.map(x => resp[x] = aiResp[x] || null);
    return Array.isArray(sessionIds) ? resp : resp[sessionIds[0]];
};

export default init;
export {
    _NEED,
    CLOUD_37_SONNET,
    CODE_INTERPRETER,
    DEEPSEEK_R1,
    DEFAULT_MODELS,
    FUNCTION,
    GEMINI_20_FLASH_THINKING,
    GEMINI_20_FLASH,
    GPT_45,
    GPT_4O_MINI,
    GPT_4O,
    GPT_O1,
    GPT_O3_MINI,
    INSTRUCTIONS,
    MODELS,
    OPENAI_VOICE,
    RETRIEVAL,
    analyzeSessions,
    buildGptTrainingCase,
    buildGptTrainingCases,
    cancelGptFineTuningJob,
    countTokens,
    createGeminiEmbedding,
    createGptFineTuningJob,
    createOpenAIEmbedding,
    deleteFile,
    distillFile,
    getAi,
    getChatAttachmentCost,
    getChatPromptLimit,
    getGptFineTuningJob,
    getSession,
    init,
    initChat,
    jpeg,
    listFiles,
    listGptFineTuningEvents,
    listGptFineTuningJobs,
    listOpenAIModels,
    ogg,
    prompt,
    promptAnthropic,
    promptGemini,
    promptOpenAI,
    resetSession,
    tailGptFineTuningEvents,
    talk,
    TEXT_EMBEDDING_3_SMALL,
    trimPrompt,
    uploadFile,
    uploadFileForFineTuning,
    wav
};
