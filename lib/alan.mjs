import { checkSearch, distill, search } from './web.mjs';
import { create as createUoid } from './uoid.mjs';
import { fileTypeFromBuffer } from 'file-type';
import { packPcmToWav } from './media.mjs';
import { v4 as uuidv4 } from 'uuid';

import {
    BASE64, BUFFER, DATAURL, MIME_BINARY, MIME_TEXT, MIME_PNG, MIME_JPEG,
    MIME_MOV, MIME_MPEG, MIME_MP4, MIME_MPG, MIME_AVI, MIME_WMV, MIME_MPEGPS,
    MIME_FLV, MIME_GIF, MIME_WEBP, MIME_PDF, MIME_AAC, MIME_FLAC, MIME_MP3,
    MIME_MPEGA, MIME_M4A, MIME_MPGA, MIME_OPUS, MIME_PCM, MIME_WAV, MIME_WEBM,
    MIME_TGPP, MIME_PCM16, MIME_OGG, convert, formatDataURL, decodeBase64DataURL,
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
- Unless requested, please use simple Markdown formatting, avoid complex nested formats that may reduce readability.
- Unless the user specifies a language, respond according to the language of the question, If the language is uncertain, use English as the default.

Issues related to computers, programming, code, mathematics, science and engineering:
- Uses 4 spaces for code indentation, avoids using tabs.

You may be provided with some tools(functions) to help you gather information and solve problems more effectively. Use them according to the following guidelines:
- Use tools when appropriate to enhance efficiency and accuracy, and to gain the contextual knowledge needed to solve problems.
- Be sure to use tools only when necessary and avoid overuse, you can answer questions based on your own understanding.
- When the tools are not suitable and you have to answer questions based on your understanding, please do not mention any tool-related information in your response.
- Unless otherwise specified to require the original result, in most cases, you may reorganize the information obtained after using the tool to solve the problem as needed.`;

const _NEED = ['js-tiktoken', 'OpenAI'];

const [
    OPENAI, GEMINI, OLLAMA, GEMINI_25_FLASH, NOVA, DEEPSEEK_R1, MD_CODE,
    CLOUD_SONNET_45, AUDIO, WAV, ATTACHMENTS, OPENAI_VOICE,
    GPT_REASONING_EFFORT, THINK, THINK_STR, THINK_END, TOOLS_STR, TOOLS_END,
    TOOLS, TEXT, OK, FUNC, GPT_51, GPT_51_CODEX, GPT_5_IMAGE, GEMMA_3_27B, ANTHROPIC, v8k, ais,
    MAX_TOOL_RECURSION, LOG, name, user, system, assistant, MODEL, JSON_OBJECT,
    tokenSafeRatio, CONTENT_IS_REQUIRED, OPENAI_HI_RES_SIZE, k, kT, m, minute,
    hour, gb, trimTailing, GEMINI_25_FLASH_IMAGE, IMAGE, JINA, JINA_DEEPSEARCH,
    GEMINI_30_PRO, SILICONFLOW, SF_DEEPSEEK_R1, MAX_TIRE, OPENROUTER_API,
    OPENROUTER, AUTO, TOOL, S_OPENAI, S_GOOGLE, S_ANTHROPIC,
] = [
        'OpenAI', 'Gemini', 'Ollama', 'gemini-2.5-flash',
        'nova', 'deepseek-r1', '```', 'claude-sonnet-4.5', 'audio',
        'wav', '[ATTACHMENTS]', 'OPENAI_VOICE', 'medium', 'think', '<think>',
        '</think>', '<tools>', '</tools>', 'tools', 'text', 'OK', 'function',
        'gpt-5.1', 'gpt-5.1-codex', 'gpt-5-image', 'gemma3:27b', 'Anthropic',
        7680 * 4320, [], 30, { log: true }, 'Alan', 'user', { role: 'system' },
        'assistant', 'model', 'json_object', 1.1, 'Content is required.',
        2048 * 2048, x => 1024 * x, x => 1000 * x, x => 1024 * 1024 * x,
        x => 60 * x, x => 60 * 60 * x, x => 1024 * 1024 * 1024 * x,
        x => x.replace(/[\.\s]*$/, ''), 'gemini-2.5-flash-image', 'image',
        'Jina', 'jina-deepsearch-v1', 'gemini-3-pro-preview', 'SiliconFlow',
        'Pro/deepseek-ai/DeepSeek-R1', 768 * 768,
        'https://openrouter.ai/api/v1', 'OpenRouter', 'openrouter/auto', 'tool',
        'openai', 'google', 'anthropic',
    ];

const [tool, messages, text]
    = [type => ({ type }), messages => ({ messages }), text => ({ text })];
const [CODE_INTERPRETER, RETRIEVAL, FUNCTION]
    = ['code_interpreter', 'retrieval', FUNC].map(tool);
const _NO_RENDER = ['INSTRUCTIONS', 'MODELS', 'DEFAULT_MODELS'];
const sessionType = `${name.toUpperCase()}-SESSION`;
const newSessionId = () => createUoid({ type: sessionType });
const chatConfig = { sessions: new Map(), systemPrompt: INSTRUCTIONS };
const tokenSafe = count => Math.ceil(count * tokenSafeRatio);
const renderText = (t, o) => _renderText(t, { extraCodeBlock: 0, ...o || {} });
const log = (cnt, opt) => _log(cnt, import.meta.url, { time: 1, ...opt || {} });
const assertContent = content => assert(content.length, CONTENT_IS_REQUIRED);
const countToolCalls = r => r?.split('\n').filter(x => x === TOOLS_STR).length;
const assertApiKey = (p, o) => assert(o?.apiKey, `${p} api key is required.`);
const getProviderIcon = provider => PROVIDER_ICONS[provider] || '🔮';
const libOpenAi = async opts => await need('openai', { ...opts, raw: true });
const OpenAI = async opts => new (await libOpenAi(opts)).OpenAI(opts);
const OPENAI_RULES = {
    source: S_OPENAI, icon: '⚛️',
    contextWindow: kT(400), maxOutputTokens: k(128),
    imageCostTokens: ~~(OPENAI_HI_RES_SIZE / MAX_TIRE * 140 + 70),
    maxFileSize: m(50), maxImageSize: OPENAI_HI_RES_SIZE,
    supportedMimeTypes: [MIME_PNG, MIME_JPEG, MIME_GIF, MIME_WEBP],
    supportedDocTypes: [MIME_PDF],
    supportedAudioTypes: [MIME_WAV],
    // audio: 'gpt-4o-audio-preview',
    json: true, tools: true, vision: true,
    reasoning: true, defaultProvider: OPENROUTER,
};

const GEMINI_RULES = {
    source: S_GOOGLE, icon: '♊️',
    json: true, audioCostTokens: 1000 * 1000 * 1, // 8.4 hours => 1 million tokens
    imageCostTokens: ~~(v8k / MAX_TIRE * 258), maxAudioLength: hour(8.4),
    maxAudioPerPrompt: 1, maxFileSize: m(20), maxImagePerPrompt: 3000,
    maxImageSize: Infinity, maxUrlSize: gb(2), maxVideoLength: minute(45),
    maxVideoPerPrompt: 10, vision: true, supportedMimeTypes: [
        MIME_PNG, MIME_JPEG, MIME_MOV, MIME_MPEG, MIME_MP4, MIME_MPG, MIME_AVI,
        MIME_WMV, MIME_MPEGPS, MIME_FLV, MIME_PDF, MIME_AAC, MIME_FLAC,
        MIME_MP3, MIME_MPEGA, MIME_M4A, MIME_MPGA, MIME_OPUS, MIME_PCM,
        MIME_WAV, MIME_WEBM, MIME_TGPP,
    ], supportedAudioTypes: [MIME_WAV, MIME_OGG, MIME_OPUS],
    // audio: 'gemini-2.5-flash-exp-native-audio-thinking-dialog',
    // gemini-2.5-flash-preview-native-audio-dialog
    defaultProvider: OPENROUTER,
};

const DEEPSEEK_R1_RULES = {
    icon: '🐬', contextWindow: kT(128), maxOutputTokens: k(8),
    reasoning: true,
};

// https://platform.openai.com/docs/models
// https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
// https://openrouter.ai/docs/features/multimodal/audio (only support input audio)
const MODELS = {
    // fast and balanced models
    [GEMINI_25_FLASH]: {
        ...GEMINI_RULES, contextWindow: m(1), maxOutputTokens: k(64),
        fast: true, reasoning: true, tools: true,
        json: false, // issue with json output via OpenRouter
        // https://gemini.google.com/app/c680748b3307790b
    },
    // strong and fast
    [GPT_51]: { ...OPENAI_RULES, fast: true },
    // stronger but slow
    [GEMINI_30_PRO]: {
        ...GEMINI_RULES, contextWindow: m(1), maxOutputTokens: k(64),
        reasoning: true, tools: true,
    },
    // models with unique capabilities
    [GEMINI_25_FLASH_IMAGE]: {
        ...GEMINI_RULES, icon: '🍌', label: 'Nano Banana',
        contextWindow: k(64), maxOutputTokens: k(32),
        fast: true, image: true,
    },
    [GPT_51_CODEX]: { ...OPENAI_RULES },
    [GPT_5_IMAGE]: { ...OPENAI_RULES, image: true },
    [JINA_DEEPSEARCH]: {
        label: '✴️', contextWindow: Infinity, maxInputTokens: Infinity,
        maxOutputTokens: Infinity, imageCostTokens: 0, maxImageSize: Infinity,
        supportedMimeTypes: [MIME_PNG, MIME_JPEG, MIME_TEXT, MIME_WEBP, MIME_PDF],
        reasoning: true, json: true, vision: true,
        deepsearch: true, defaultProvider: JINA,
    },
    [DEEPSEEK_R1]: DEEPSEEK_R1_RULES,
    [SF_DEEPSEEK_R1]: { ...DEEPSEEK_R1_RULES, defaultProvider: SILICONFLOW },
    [CLOUD_SONNET_45]: {
        source: S_ANTHROPIC, icon: '✳️',
        contextWindow: kT(200), maxOutputTokens: kT(64),
        documentCostTokens: 3000 * 10, maxDocumentFile: m(32),
        maxDocumentPages: 100, imageCostTokens: ~~(v8k / 750),
        maxImagePerPrompt: 100, maxFileSize: m(5), maxImageSize: 2000 * 2000,
        supportedMimeTypes: [MIME_TEXT, MIME_PNG, MIME_JPEG, MIME_GIF, MIME_WEBP, MIME_PDF],
        json: true, reasoning: true, tools: true, vision: true,
        defaultProvider: OPENROUTER,
    },
    // best local model
    [GEMMA_3_27B]: {
        label: '❇️', contextWindow: kT(128), maxOutputTokens: k(8),
        imageCostTokens: 256, maxImageSize: 896 * 896,
        supportedMimeTypes: [MIME_PNG, MIME_JPEG, MIME_GIF],
        fast: true, json: true, vision: true,
        defaultProvider: OLLAMA,
    },
    // https://docs.anthropic.com/en/docs/build-with-claude/vision
    // https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/sonnet-4-5
};

// Unifiy model configurations
let ATTACHMENT_TOKEN_COST = 0;
for (const n in MODELS) {
    MODELS[n]['name'] = n;
    MODELS[n].supportedMimeTypes = MODELS[n].supportedMimeTypes || [];
    MODELS[n].supportedDocTypes = MODELS[n].supportedDocTypes || [];
    MODELS[n].supportedAudioTypes = MODELS[n].supportedAudioTypes || [];
    MODELS[n].maxOutputTokens = MODELS[n].maxOutputTokens
        || Math.ceil(MODELS[n].contextWindow * 0.4);
    MODELS[n].maxInputTokens = MODELS[n].maxInputTokens
        || (MODELS[n].contextWindow - MODELS[n].maxOutputTokens);
    ATTACHMENT_TOKEN_COST = ATTACHMENT_TOKEN_COST ? Math.max(
        ATTACHMENT_TOKEN_COST, MODELS[n].imageCostTokens || 0
    ) : MODELS[n].imageCostTokens;
}
// Auto model have some issues with tools and reasoning, so we disable them here
// MODELS[AUTO] = { name: AUTO, defaultProvider: OPENROUTER, };
// for (const n of [GPT_51, GPT_51_CODEX, GEMINI_30_PRO, GEMINI_25_FLASH]) {
//     // get the most restrictive limits
//     for (const key of [
//         'contextWindow', 'maxInputTokens', 'maxDocumentFile', 'maxAudioLength',
//         'maxImagePerPrompt', 'maxFileSize', 'maxImageSize', 'maxOutputTokens',
//         'maxAudioPerPrompt', 'maxDocumentPages', 'maxUrlSize', 'maxVideoLength',
//         'maxVideoPerPrompt',
//     ]) {
//         MODELS[AUTO][key] = Math.min(
//             MODELS[AUTO][key] || Infinity, MODELS[n][key] || Infinity,
//         );
//     }
//     // get the most permissive costs
//     for (const key of [
//         'documentCostTokens', 'imageCostTokens', 'audioCostTokens',
//     ]) {
//         MODELS[AUTO][key] = Math.max(
//             MODELS[AUTO][key] || 0, MODELS[n][key] || 0,
//         );
//     }
//     // combine supported types
//     for (const key of [
//         'supportedAudioTypes', 'supportedDocTypes', 'supportedMimeTypes',
//     ]) {
//         MODELS[AUTO][key] = [...new Set(
//             [...MODELS[AUTO][key] || [], ...MODELS[n][key] || []]
//         )];
//     }
//     // for other features, if any model supports it, then AUTO supports it
//     for (const key of [
//         'json', 'reasoning', 'tools', 'vision', 'fast', 'deepsearch', 'image',
//     ]) {
//         MODELS[AUTO][key] = MODELS[AUTO][key] || MODELS[n][key];
//     }
//     // catch first possible support
//     for (const key of ['audio']) {
//         MODELS[AUTO][key] = MODELS[AUTO][key] || MODELS[n][key];
//     }
// };

// Default models for each provider
const DEFAULT_MODELS = {
    [OPENROUTER]: AUTO,
    [SILICONFLOW]: SF_DEEPSEEK_R1,
    [JINA]: JINA_DEEPSEARCH,
    [OLLAMA]: GEMMA_3_27B,
    [OPENAI_VOICE]: NOVA,
};

const PROVIDER_ICONS = {
    [OPENROUTER]: '🔀', [OPENAI]: '⚛️', [JINA]: '✴️', [GEMINI]: '♊️',
    [OLLAMA]: '🦙', [ANTHROPIC]: '✳️', [SILICONFLOW]: '🧬',
};

const FEATURE_ICONS = {
    audio: '📣', deepsearch: '🔍', fast: '⚡️', finetune: '🔧', image: '🎨',
    json: '📊', reasoning: '🧠', tools: '🧰', vision: '👁️',
};

const tokenRatioByWords = Math.min(
    100 / 75, // ChatGPT: https://platform.openai.com/tokenizer
    Math.min(100 / 60, 100 / 80), // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);

const tokenRatioByCharacters = Math.max(
    3.5, // Claude: https://docs.anthropic.com/en/docs/resources/glossary
    4, // Gemini: https://ai.google.dev/gemini-api/docs/tokens?lang=node
);


let tokeniser, _tools;

const unifyProvider = provider => {
    assert(provider = (provider || '').trim(), 'AI provider is required.');
    for (let type of [OPENROUTER, JINA, OLLAMA, SILICONFLOW]) {
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

const packTools = async () => {
    const _tools = [];
    for (const t of tools) {
        (t.depend ? await t.depend() : true) ? _tools.push(t) : log(
            `Tool is not ready: ${t.def.function.name}`
        );
    }
    return _tools;
};

const buildAiId = (provider, model) => [
    provider, ...isOpenrouter(provider, model) ? [model.source] : [],
    model?.name
].map(x => ensureString(x, { case: 'SNAKE' })).join('_');

const buildAiName = (provider, model) => [
    model?.icon || getProviderIcon(provider), provider,
    `(${isOpenrouter(provider, model) ? `${model.source}/` : ''}${model.label || model.name})`
].join(' ');

const buildAiFeatures = model => Object.entries(FEATURE_ICONS).map(
    x => model[x[0]] ? x[1] : ''
).join('');

const setupAi = ai => {
    const id = buildAiId(ai.provider, ai.model);
    ais.push({
        id, name: buildAiName(ai.provider, ai.model),
        features: buildAiFeatures(ai.model), initOrder: ais.length,
        priority: DEFAULT_MODELS[ai.provider] === ai.model.name ? -1 : 0,
        ...ai, prompt: async (text, opts) => await ai.prompt(id, text, opts),
    });
};

const init = async (options = {}) => {
    if (options?.debug) {
        (await need('node:util')).inspect.defaultOptions.depth = null;
        options.logLevel = 'debug';
    }
    options.provider = options.provider || OPENROUTER;
    const provider = unifyProvider(options.provider);
    let models;
    if (options.model === '*') { // All models
        models = Object.values(MODELS).filter(
            x => ensureArray(x.defaultProvider).includes(provider)
        );
    } else if (options.model) { // Specific model
        models = Object.values(MODELS).filter(
            x => ensureArray(options.model).includes(x.name)
        );
    } else if (DEFAULT_MODELS[provider]) { // Default model
        models = [MODELS[DEFAULT_MODELS[provider]]];
    } else if (options.modelConfig) {
        models = ensureArray(options.modelConfig);
    }
    assert(models.length,
        `Model name or description is required for provider: ${provider}.`);
    _tools || (_tools = await packTools());
    switch (provider) {
        case JINA:
            assertApiKey(provider, options);
            var client = await OpenAI({
                baseURL: 'https://deepsearch.jina.ai/v1/', ...options,
            });
            for (let model of models) {
                setupAi({ provider, model, client, prompt: promptOpenAI });
            }
            break;
        case OLLAMA:
            // https://github.com/ollama/ollama/blob/main/docs/openai.md
            const baseURL = 'http://localhost:11434/v1/';
            const phLog = m => log(`Ollama preheat: ${m?.message || m}`);
            var client = await OpenAI({
                baseURL, apiKey: 'ollama', ...options,
            });
            for (let model of models) {
                setupAi({ provider, model, client, prompt: promptOpenAI });
                ignoreErrFunc(async () => {
                    phLog(await (await fetch(`${baseURL}completions`, {
                        method: 'POST', body: JSON.stringify({
                            model: model.name, prompt: '', keep_alive: -1
                        })
                    })).text());
                }, { log: phLog });
            }
            break;
        case SILICONFLOW:
            assertApiKey(provider, options);
            var client = await OpenAI({
                baseURL: 'https://api.siliconflow.cn/v1', ...options,
            });
            for (let model of models) {
                setupAi({ provider, model, client, prompt: promptOpenAI });
            }
            break;
        default:
            assertApiKey(provider, options);
            var client = await OpenAI({ baseURL: OPENROUTER_API, ...options || {} });
            for (let model of models) {
                setupAi({
                    provider: OPENROUTER || provider, model, client,
                    prompt: promptOpenAI,
                });
            }
    }
    ais.sort((a, b) => a.priority - b.priority || a.initOrder - b.initOrder);
    return ais;
};

const packAi = (ais, options = {}) => {
    const res = options.basic ? ais.map(x => ({
        id: x.id, name: x.name, features: x.features,
        initOrder: x.initOrder, priority: x.priority,
        provider: x.provider, model: x.model,
    })) : ais;
    return options.all ? res : res[0];
};

const getAi = async (id, options = {}) => {
    if (id) {
        const ai = ais.find(x => x.id === id);
        assert(ai, `AI not found: ${id}.`);
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
        if (best.length) { return packAi(best, options); }
        assert(res.length, 'AI not found.');
        log(`Best match AI not found, fallbacked: ${JSON.stringify(options.select)}.`);
        return packAi(res, options);
    }
    const result = packAi(ais, options);
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

const isOpenrouter = (provider, model) => insensitiveCompare(
    provider, OPENROUTER
) && (model ? model?.source : true);

const selectVisionModel = options => {
    assert(
        MODELS[options.model]?.vision,
        `Vision modality is not supported by model: ${options.model}`
    );
    return String.isString(MODELS[options.model].vision)
        ? MODELS[options.model].vision : null;
};

const selectAudioModel = options => {
    assert(
        MODELS[options.model]?.audio,
        `Audio modality is not supported by model: ${options.model}`
    );
    return String.isString(MODELS[options.model]?.audio)
        ? MODELS[options.model]?.audio : null;
};

const buildMessage = (content, options) => {
    content = content || '';
    let alterModel = options?.audioMode && selectAudioModel(options);
    const attachments = (options?.attachments || []).map(x => {
        assert(MODELS[options?.model], 'Model is required.');
        if (MODELS[options.model]?.supportedMimeTypes?.includes?.(x.mime_type)) {
            alterModel = selectVisionModel(options); // URL or Base64URL
            return {
                type: 'image_url',
                image_url: { url: x.url, detail: 'high' },
            };
        } else if (MODELS[options.model]?.supportedDocTypes?.includes?.(x.mime_type)) {
            alterModel = selectVisionModel(options);
            return {
                type: 'file',
                file: {
                    file_data: formatDataURL(x.mime_type, x.data),
                    filename: x.file_name
                        || `${uuidv4()}.${x.mime_type.split('/')[1]}`,
                },
            };
        } else if (MODELS[options.model]?.supportedAudioTypes?.includes?.(x.mime_type)) {
            alterModel = selectAudioModel(options);
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

const listOpenAIModels = async (aiId, options) => {
    const { client } = await getAi(aiId);
    const resp = await client.models.list();
    return options?.raw ? resp : resp.data;
};

const streamResp = async (resp, options) => {
    const msg = await packResp(resp, { ...options, processing: true });
    return options?.stream
        && (msg?.text || msg?.audio?.length || msg?.images?.length)
        && await ignoreErrFunc(async () => await options.stream(msg), LOG);
};

const getInfoEnd = text => Math.max(...[THINK_END, TOOLS_END].map(x => {
    const keyEnd = text.indexOf(text.endsWith(x) ? x : `${x}\n`);
    return keyEnd >= 0 ? (keyEnd + x.length) : 0;
}));

// @todo: escape ``` in think and tools
const packResp = async (resp, options) => {
    // print(resp);
    // return;
    if (options?.raw) { return resp; }
    let [
        txt, audio, images, references, simpleText, referencesMarkdown, end,
        json, audioMimeType,
    ] = [
            resp.text || '',                                                    // ChatGPT / Claude / Gemini / Ollama
            resp?.audio?.data,                                                  // ChatGPT audio mode
            resp?.images || [],                                                 // Gemini images via Openrouter
            resp?.references,                                                   // Gemini references
            '', '', '', null, MIME_PCM16
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
    audio = await ignoreErrFunc(async () => ({
        data: await packPcmToWav(audio, {
            input: BUFFER, expected: BUFFER, suffix: 'pcm.wav', ...options
        }), mime: audioMimeType,
    }));
    images = await Promise.all(
        images.map(async x => ({
            data: await convert(x.buffer, {
                input: BUFFER, expected: BUFFER, ...options
            }), mime: x.mime,
        }))
    );
    options?.jsonMode && !options?.delta && (json = parseJson(simpleText, null));
    if (options?.simple && options?.audioMode) { return audio; }
    else if (options?.simple && options?.jsonMode) { return json; }
    else if (options?.simple && options?.imageMode) { return images; }
    else if (options?.simple) { return simpleText; }
    else if (options?.jsonMode) { txt = simpleText; }
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
    const [reJinaStr, reJinaEnd]
        = [`^\s*(${THINK_STR})`, `(${THINK_END})\s*$`].map(x => new RegExp(x));
    const fixJina = [];
    for (let l of txt) {
        let catched = false;
        if (reJinaStr.test(l)) {
            fixJina.push(THINK_STR);
            l = l.replace(reJinaStr, '');
        }
        if (reJinaEnd.test(l)) {
            l = l.replace(reJinaEnd, '');
            catched = true;
        }
        fixJina.push(l, ...catched ? [THINK_END, ''] : []);
    }
    txt = fixJina;
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
        ...audio ? { audio } : {}, ...images?.length ? { images } : {},
        processing: !!options?.processing,
        model: [
            options.provider, options?.router?.provider,
            options?.router?.model || options?.model,
        ].filter(x => x).join('/'),
    };
};

const buildPrompts = async (model, input, options = {}) => {
    assert(!(
        options.jsonMode && !model?.json
    ), `This model does not support JSON output: ${options.model}`);
    assert(!(
        options.reasoning && !model?.reasoning
    ), `This model does not support reasoning: ${options.model}`);
    let [history, content, prompt, _model, _assistant, _history]
        = [null, input, null, { role: MODEL }, { role: assistant }, null];
    options.systemPrompt = options.systemPrompt || INSTRUCTIONS;
    options.attachments = (
        options.attachments?.length ? options.attachments : []
    ).filter(x => [
        ...model?.supportedMimeTypes,
        ...model?.supportedDocTypes,
        ...model?.supportedAudioTypes,
    ].includes(x.mime_type));
    const systemPrompt = buildMessage(options.systemPrompt, system);
    const msgBuilder = () => {
        [history, _history] = [[], []];
        (options.messages?.length ? options.messages : []).map((x, i) => {
            _history.push(buildMessage(x.request));
            _history.push(buildMessage(x.response, _assistant));
        });
        history = messages([
            systemPrompt, ..._history, buildMessage(content, options),
            ...options.toolsResult?.length ? options.toolsResult : []
        ]);
    };
    msgBuilder();
    await trimPrompt(() => [
        systemPrompt, _history, content, options.toolsResult
    ], () => {
        if (options.messages?.length) {
            options.messages?.shift();
            msgBuilder();
        } else {
            content = trimTailing(trimTailing(content).slice(0, -1)) + '...';
        } // @todo: audioCostTokens (needs to calculate the audio length):
    }, model.maxInputTokens - options.attachments?.length * model.imageCostTokens);
    return { history, prompt };
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
    const calls = msg.tool_calls || msg.content
        || (msg.parts ? msg.parts.filter(x => x.functionCall) : null) || [];
    if (calls.length) {
        preRes.push(msg);
        for (const fn of calls) {
            input = fn?.functionCall?.args;
            packMsg = (t, e) => ({
                role: 'tool',
                tool_call_id: fn.id,
                content: e ? `[Error] ${t}` : t
            });
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
        content = content.map(x => ({ role: TOOL, ...x }));
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
    let [
        result, resultAudio, resultImages, resultReasoning, event, resultTools,
        responded, modalities, source, reasoningEnd, reasoning_details,
    ] = [
            options.result ?? '', Buffer.alloc(0), [], '', null, [], false,
            options.modalities, model?.source, false, []
        ];
    options.provider = provider;
    options.model = options.model || model.name;
    const { history }
        = await buildPrompts(MODELS[options.model], content, options);
    model = MODELS[options.model];
    model?.reasoning && !options.reasoning_effort
        && (options.reasoning_effort = GPT_REASONING_EFFORT);
    if (!modalities && options.audioMode) {
        modalities = [TEXT, AUDIO];
    } else if (!modalities && model.image) {
        modalities = [TEXT, IMAGE];
    }
    const googleImageMode = source === S_GOOGLE && modalities?.has?.(IMAGE);
    const targetModel = `${isOpenrouter(provider, model) ? `${source}/` : ''}${options.model}`;
    const resp = await client.chat.completions.create({
        model: targetModel, ...history,
        ...options.jsonMode ? { response_format: { type: JSON_OBJECT } } : {},
        ...provider === OLLAMA ? { keep_alive: -1 } : {},
        modalities, audio: options.audio || (
            modalities?.find?.(x => x === AUDIO)
            && { voice: DEFAULT_MODELS[OPENAI_VOICE], format: 'pcm16' }
        ), ...model?.tools && !googleImageMode ? {
            tools: options.tools ?? _tools.map(x => x.def), tool_choice: 'auto',
        } : {},
        store: true, stream: true,
        reasoning_effort: options.reasoning_effort,
    });
    for await (event of resp) {
        // print(JSON.stringify(event, null, 2));
        event?.provider && event?.model && (options.router = {
            provider: event.provider, model: event.model,
        });
        event = event?.choices?.[0] || {};
        const delta = event.delta || {};
        let [delteReasoning, deltaText] = [
            delta.reasoning || '',
            delta.content || delta.audio?.transcript || ''
        ];
        const deltaImages = (delta?.images || []).map(
            x => decodeBase64DataURL(x.image_url.url)
        );
        const deltaAudio = delta.audio?.data ? await convert(
            delta.audio.data, { input: BASE64, expected: BUFFER }
        ) : Buffer.alloc(0);
        // for anthropic reasoning details need to be merged in streaming
        if (delta?.reasoning_details?.length) {
            reasoning_details.length || reasoning_details.push({});
            for (const item of delta.reasoning_details) {
                for (const key in item) {
                    if (key === 'text') {
                        reasoning_details[0][key] = (
                            reasoning_details[0][key] || ''
                        ) + item[key];
                        continue;
                    }
                    reasoning_details[0][key] = item[key];
                }
            }
        }
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
        resultReasoning += delteReasoning;
        // the \n\n is needed for Interleaved Thinking:
        // tools => reasoning => tools => reasoning ...
        delteReasoning && delteReasoning === resultReasoning
            && (delteReasoning = `${result ? '\n\n' : ''}${THINK_STR}\n${delteReasoning}`);
        resultReasoning && (deltaText || delta.tool_calls?.length) && !reasoningEnd && (
            reasoningEnd = delteReasoning = `${delteReasoning}${THINK_END}\n\n`
        );
        deltaText = delteReasoning + deltaText;
        result += deltaText;
        resultImages.push(...deltaImages);
        resultAudio = Buffer.concat([resultAudio, deltaAudio]);
        const respImages = options.delta ? deltaImages : resultImages;
        const respAudio = options.delta ? deltaAudio : resultAudio;
        (deltaText || deltaAudio?.length || deltaImages.length)
            && await streamResp({
                text: options.delta ? deltaText : result,
                ...respAudio.length ? { audio: { data: respAudio } } : {},
                ...respImages.length ? { images: respImages } : {},
            }, options);
    }
    event = {
        role: assistant, text: result, tool_calls: resultTools,
        ...resultImages.length ? { images: resultImages } : {},
        ...resultAudio.length ? { audio: { data: resultAudio } } : {},
    };
    switch (source) {
        case S_ANTHROPIC:
            event.content = reasoning_details.map(x => ({
                type: 'thinking', thinking: x.text,
                ...x.signature ? { signature: x.signature } : {},
            }));
            break;
        case S_GOOGLE:
            reasoning_details?.length
                && (event.reasoning_details = reasoning_details);
    }
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

// const packGeminiReferences = (chunks, supports) => {
//     let references = null;
//     if (chunks?.length && supports?.length) {
//         references = { segments: [], links: [] };
//         supports.map(s => references.segments.push({
//             ...s.segment, indices: s.groundingChunkIndices,
//             confidence: s.confidenceScores,
//         }));
//         chunks.map(c => references.links.push(c.web));
//     }
//     return references;
// };

// const promptGemini = async (aiId, content, options = {}) => {
//     let { provider, client, model } = await getAi(aiId);
//     let [
//         event, result, text, thinking, references, functionCalls, responded,
//         images, thinkEnd,
//     ] = [null, options.result ?? '', '', '', null, [], false, [], false];
//     options.model = options.model || model.name;
//     model?.image === true && (options.imageMode = true);
//     assert(!(options.imageMode && !model.image), 'Image mode is not supported.');
//     if (options.imageMode && String.isString(model.image)) {
//         options.model = model.image;
//         options.imageMode = true;
//         model = MODELS[options.model];
//     }
//     options.flavor = GEMINI;
//     const { systemPrompt: systemInstruction, history, prompt }
//         = await buildPrompts(model, content, options);
//     const responseModalities = options.modalities
//         || (options.imageMode ? [TEXT, IMAGE] : undefined)
//         || (options.audioMode ? [TEXT, AUDIO] : undefined);
//     const chat = client.chats.create({
//         model: options.model, history, config: {
//             responseMimeType: options.jsonMode ? MIME_JSON : MIME_TEXT,
//             ...model.reasoning ? {
//                 thinkingConfig: { includeThoughts: true },
//             } : {}, systemInstruction, responseModalities,
//             ...options?.config || {}, ...model?.tools && !options.jsonMode
//                 && ![GEMINI_25_FLASH_IMAGE].includes(options.model)
//                 ? (options.tools ?? {
//                     tools: [
//                         // @todo: Gemini will failed when using these tools together.
//                         // https://ai.google.dev/gemini-api/docs/function-calling
//                         // { codeExecution: {} },
//                         // { googleSearch: {} },
//                         // { urlContext: {} },
//                         // @todo: test these tools in next version 👆
//                         {
//                             functionDeclarations: (
//                                 await toolsGemini({ provider })
//                             ).map(x => x.def)
//                         },
//                     ], toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
//                 }) : {},
//         },
//     });
//     const resp = await chat.sendMessageStream({ message: prompt });
//     for await (const chunk of resp) {
//         assert(
//             !chunk?.promptFeedback?.blockReason,
//             chunk?.promptFeedback?.blockReason
//         );
//         event = chunk?.candidates?.[0];
//         let [deltaText, deltaThink, deltaImages] = ['', '', []];
//         event?.content?.parts?.map(x => {
//             if (x.text && x.thought) { deltaThink = x.text; }
//             else if (x.text) { deltaText = x.text; }
//             else if (x.functionCall) { functionCalls.push(x); }
//             else if (x.inlineData?.mimeType === MIME_PNG) {
//                 deltaImages.push(x.inlineData);
//                 images.push(x.inlineData);
//             }
//         });
//         text += deltaText;
//         thinking += deltaThink;
//         deltaThink && deltaThink === thinking
//             && (deltaThink = `${THINK_STR}\n${deltaThink}`);
//         thinking && deltaText && !thinkEnd
//             && (thinkEnd = deltaThink = `${deltaThink}${THINK_END}\n\n`);
//         deltaText = deltaThink + deltaText;
//         const rfc = packGeminiReferences(
//             event?.groundingMetadata?.groundingChunks,
//             event?.groundingMetadata?.groundingSupports
//         );
//         rfc && (references = rfc);
//         options.result && deltaText
//             && (responded = responded || (deltaText = `\n\n${deltaText}`));
//         result += deltaText;
//         (deltaText || deltaImages.length) && await streamResp({
//             text: options.delta ? deltaText : result,
//             images: options.delta ? deltaImages : images,
//         }, options);
//     }
//     event = {
//         role: MODEL, parts: [
//             ...thinking ? [{ thought: true, text: thinking }] : [],
//             ...text ? [{ text }] : [],
//             ...functionCalls,
//         ],
//     };
//     const { toolsResult, toolsResponse } = await handleToolsCall(
//         event, { ...options, result, flavor: GEMINI }
//     );
//     if (toolsResult.length
//         && countToolCalls(toolsResponse) < MAX_TOOL_RECURSION) {
//         return promptGemini(aiId, content, {
//             ...options || {}, result: toolsResponse,
//             toolsResult: [...options?.toolsResult || [], ...toolsResult],
//         });
//     }
//     return await packResp({
//         text: mergeMsgs(toolsResponse, toolsResult), images, references,
//     }, options);
// };

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
    const [spTokens, ais] = await Promise.all([countTokens([buildMessage(
        options.systemPrompt, system
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
        [{ request: input }, options.sessionId || newSessionId()];
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
    }, await getChatPromptLimit(options));
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
    _NO_RENDER,
    ATTACHMENTS,
    CLOUD_SONNET_45,
    CODE_INTERPRETER,
    DEEPSEEK_R1,
    DEFAULT_MODELS,
    FEATURE_ICONS,
    FUNCTION,
    GEMINI_25_FLASH,
    GEMINI_25_FLASH_IMAGE,
    GPT_51,
    INSTRUCTIONS,
    MODELS,
    OPENAI_VOICE,
    RETRIEVAL,
    analyzeSessions,
    countTokens,
    distillFile,
    getAi,
    getChatAttachmentCost,
    getChatPromptLimit,
    getSession,
    init,
    initChat,
    k,
    listOpenAIModels,
    prompt,
    promptOpenAI,
    resetSession,
    talk,
    trimPrompt,
};
