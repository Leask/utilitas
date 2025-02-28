import { fileTypeFromBuffer } from 'file-type';
import { end, loop } from './event.mjs';
import { createWavHeader } from './media.mjs';
import { BASE64, BUFFER, DATAURL, MIME_BINARY, STREAM, convert } from './storage.mjs';
import { create as createUoid } from './uoid.mjs';

import {
    log as _log,
    renderText as _renderText,
    base64Encode, ensureArray, ensureString, extract,
    ignoreErrFunc,
    insensitiveCompare,
    isSet,
    need, parseJson,
    throwError
} from './utilitas.mjs';

const _NEED = [
    '@anthropic-ai/sdk', '@anthropic-ai/vertex-sdk', '@google/generative-ai',
    'js-tiktoken', 'ollama', 'OpenAI',
];

const [
    OPENAI, GEMINI, CHATGPT, OPENAI_EMBEDDING, GEMINI_EMEDDING, OPENAI_TRAINING,
    OLLAMA, CLAUDE, GPT_4O_MINI, GPT_4O, GPT_O1, GPT_O3_MINI, GEMINI_20_FLASH,
    GEMINI_20_FLASH_THINKING, GEMINI_20_PRO, NOVA, EMBEDDING_001, DEEPSEEK_R1,
    DEEPSEEK_R1_32B, DEEPSEEK_R1_70B, MD_CODE, CHATGPT_REASONING,
    TEXT_EMBEDDING_3_SMALL, TEXT_EMBEDDING_3_LARGE, CLAUDE_35_SONNET,
    CLAUDE_35_HAIKU, CLOUD_37_SONNET, AUDIO, WAV, CHATGPT_MINI, ATTACHMENTS,
    CHAT, OPENAI_VOICE, MEDIUM, LOW, HIGH, GPT_REASONING_EFFORT, THINK,
    THINK_STR, THINK_END, AZURE,
] = [
        'OPENAI', 'GEMINI', 'CHATGPT', 'OPENAI_EMBEDDING', 'GEMINI_EMEDDING',
        'OPENAI_TRAINING', 'OLLAMA', 'CLAUDE', 'gpt-4o-mini', 'gpt-4o', 'o1',
        'o3-mini', 'gemini-2.0-flash', 'gemini-2.0-flash-thinking-exp',
        'gemini-2.0-pro-exp', 'nova', 'embedding-001', 'deepseek-r1',
        'deepseek-r1:32b', 'deepseek-r1:70b', '```', 'CHATGPT_REASONING',
        'text-embedding-3-small', 'text-embedding-3-large',
        'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest',
        'claude-3-7-sonnet@20250219', 'audio', 'wav', 'CHATGPT_MINI',
        '[ATTACHMENTS]', 'CHAT', 'OPENAI_VOICE', 'medium', 'low', 'high',
        'medium', 'think', '<think>', '</think>', 'AZURE',
    ];

const [
    png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, gif, webp, pdf, aac,
    flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp, mimeJson, mimeText, pcm16,
    ogg,
] = [
        'image/png', 'image/jpeg', 'video/mov', 'video/mpeg', 'video/mp4',
        'video/mpg', 'video/avi', 'video/wmv', 'video/mpegps', 'video/x-flv',
        'image/gif', 'image/webp', 'application/pdf', 'audio/aac', 'audio/flac',
        'audio/mp3', 'audio/m4a', 'audio/mpga', 'audio/opus', 'audio/pcm',
        'audio/wav', 'audio/webm', 'video/3gpp', 'application/json',
        'text/plain', 'audio/x-wav', 'audio/ogg',
    ];

const [tool, provider, messages, text] = [
    type => ({ type }), provider => ({ provider }),
    messages => ({ messages }), text => ({ text }),
];

const [name, user, system, assistant, MODEL, JSON_OBJECT, TOOL]
    = ['Alan', 'user', 'system', 'assistant', 'model', 'json_object', 'tool'];
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
const CONTENT_IS_REQUIRED = 'Content is required.';
const assertContent = content => assert(content.length, CONTENT_IS_REQUIRED);


const DEFAULT_MODELS = {
    [CHATGPT_MINI]: GPT_4O_MINI,
    [CHATGPT_REASONING]: GPT_O3_MINI,
    [CHATGPT]: GPT_4O,
    [CLAUDE]: CLOUD_37_SONNET,
    [GEMINI_EMEDDING]: EMBEDDING_001,
    [GEMINI]: GEMINI_20_FLASH,
    [OLLAMA]: DEEPSEEK_R1,
    [AZURE]: DEEPSEEK_R1,
    [OPENAI_EMBEDDING]: TEXT_EMBEDDING_3_SMALL,
    [OPENAI_TRAINING]: GPT_4O_MINI, // https://platform.openai.com/docs/guides/fine-tuning
    [OPENAI_VOICE]: NOVA,
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

// https://platform.openai.com/docs/models/continuous-model-upgrades
// https://platform.openai.com/settings/organization/limits // Tier 3
// https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
// https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models
const MODELS = {
    [GPT_4O_MINI]: {
        contextWindow: 128000,
        imageCostTokens: 1105,
        maxOutputTokens: 16384,
        requestLimitsRPM: 5000,
        tokenLimitsTPD: 40000000,
        tokenLimitsTPM: 4000000,
        trainingData: 'Oct 2023',
        json: true,
        vision: true,
        tools: true,
        audio: 'gpt-4o-mini-audio-preview',
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
        supportedAudioTypes: [
            wav,
        ],
    },
    [GPT_4O]: {
        contextWindow: 128000,
        imageCostTokens: 1105,
        maxOutputTokens: 16384,
        requestLimitsRPM: 5000,
        tokenLimitsTPD: 100000000,
        tokenLimitsTPM: 800000,
        trainingData: 'Oct 2023',
        json: true,
        vision: true,
        tools: true,
        audio: 'gpt-4o-audio-preview',
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
        supportedAudioTypes: [
            wav,
        ],
    },
    [GPT_O1]: {
        contextWindow: 200000,
        imageCostTokens: 1105,
        maxOutputTokens: 100000,
        requestLimitsRPM: 500,
        tokenLimitsTPD: 100000000,
        tokenLimitsTPM: 800000,
        trainingData: 'Oct 2023',
        json: true,
        reasoning: true,
        vision: true,
        tools: true,
        // audio: 'gpt-4o-audio-preview', // fallback to GPT-4O to support audio
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
        // supportedAudioTypes: [ // fallback to GPT-4O to support audio
        //     wav,
        // ],
    },
    [GPT_O3_MINI]: {
        contextWindow: 200000,
        imageCostTokens: 1105,
        maxOutputTokens: 100000,
        requestLimitsRPM: 5000,
        tokenLimitsTPD: 40000000,
        tokenLimitsTPM: 4000000,
        trainingData: 'Oct 2023',
        json: true,
        reasoning: true,
        vision: true,
        tools: true,
        // audio: 'gpt-4o-mini-audio-preview', // fallback to GPT-4O-MINI to support audio
        supportedMimeTypes: [
            png, jpeg, gif, webp,
        ],
        // supportedAudioTypes: [ // fallback to GPT-4O-MINI to support audio
        //     wav,
        // ],
    },
    [GEMINI_20_FLASH]: {
        // https://ai.google.dev/gemini-api/docs/models/gemini
        // https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/send-multimodal-prompts?hl=en#gemini-send-multimodal-samples-pdf-nodejs
        // Audio / Video Comming Soon: https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-flash
        contextWindow: 1048576,
        imageCostTokens: size8k / (768 * 768) * 258,
        audioCostTokens: 1000000, // 8.4 hours => 1 million tokens
        maxAudioLength: 60 * 60 * 8.4, // 9.5 hours
        maxAudioPerPrompt: 1,
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        maxImagePerPrompt: 3000,
        maxImageSize: Infinity,
        maxOutputTokens: 1024 * 8,
        maxUrlSize: 1024 * 1024 * 1024 * 2, // 2 GB
        maxVideoLength: 60 * 50, // 50 minutes
        maxVideoLengthWithAudio: 60 * 50, // 50 minutes
        maxVideoLengthWithoutAudio: 60 * 60, // 1 hour
        maxVideoPerPrompt: 10,
        requestLimitsRPM: 2000,
        requestLimitsRPD: 1500,
        tokenLimitsTPM: 4 * 1000000,
        trainingData: 'August 2024',
        vision: true,
        json: true,
        tools: true,
        supportedMimeTypes: [
            png, jpeg, mov, mpeg, mp4, mpg, avi, wmv, mpegps, flv, pdf, aac,
            flac, mp3, m4a, mpga, opus, pcm, wav, webm, tgpp,
        ],
    },
    [GEMINI_20_FLASH_THINKING]: {
        // https://cloud.google.com/vertex-ai/generative-ai/docs/thinking-mode?hl=en
        contextWindow: 1024 * (8 + 32),
        imageCostTokens: size8k / (768 * 768) * 258,
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        maxImagePerPrompt: 3000,
        maxImageSize: Infinity,
        maxOutputTokens: 1024 * 8,
        maxUrlSize: 1024 * 1024 * 1024 * 2, // 2 GB
        requestLimitsRPM: 1000,
        requestLimitsRPD: 1500,
        tokenLimitsTPM: 4 * 1000000,
        trainingData: 'August 2024',
        vision: true,
        reasoning: true,
        supportedMimeTypes: [
            png, jpeg,
        ],
    },
    [GEMINI_20_PRO]: {
        contextWindow: 2097152,
        imageCostTokens: size8k / (768 * 768) * 258,
        maxFileSize: 20 * 1024 * 1024, // 20 MB
        maxImagePerPrompt: 3000,
        maxImageSize: Infinity,
        maxOutputTokens: 1024 * 8,
        maxUrlSize: 1024 * 1024 * 1024 * 2, // 2 GB
        requestLimitsRPM: 1000,
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
    [DEEPSEEK_R1]: {
        contextWindow: 128 * 1000,
        maxOutputTokens: 32768,
        requestLimitsRPM: Infinity,
        tokenLimitsTPM: Infinity,
        reasoning: true,
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
        tools: true,
        supportedMimeTypes: [
            png, jpeg, gif, webp, pdf,
        ],
    },
    // https://console.cloud.google.com/vertex-ai/publishers/anthropic/model-garden/claude-3-7-sonnet?authuser=5&inv=1&invt=Abqftg&project=backend-alpha-97077
    [CLOUD_37_SONNET]: {
        contextWindow: 200 * 1000,
        maxOutputTokens: 64 * 1000, // Should be 128 * 1000, but Anthropic SDK limits it to 64 * 1000
        imageCostTokens: size8k / 750,
        documentCostTokens: 3000 * 100, // 100 pages: https://docs.anthropic.com/en/docs/build-with-claude/pdf-support
        maxImagePerPrompt: 5, // https://docs.anthropic.com/en/docs/build-with-claude/vision
        maxImageSize: 1092, // by pixels
        maxDocumentPages: 100,
        maxDocumentFile: 1024 * 1024 * 32, // 32MB
        requestLimitsRPM: 50,
        tokenLimitsITPM: 40000,
        tokenLimitsOTPM: 8000,
        trainingData: 'Apr 2024', // ?
        reasoning: true,
        tools: true,
        supportedMimeTypes: [
            png, jpeg, gif, webp, pdf,
        ],
    },
};

MODELS[CLAUDE_35_HAIKU] = MODELS[CLAUDE_35_SONNET];
MODELS[DEEPSEEK_R1_32B] = MODELS[DEEPSEEK_R1];
MODELS[DEEPSEEK_R1_70B] = MODELS[DEEPSEEK_R1];

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
const ATTACHMENT_TOKEN_COST = Math.max(MODELS[GPT_4O].imageCostTokens, 5000);
const MAX_TRIM_TRY = MAX_INPUT_TOKENS / 1000;


let tokeniser;

const unifyType = (type, name) => {
    const TYPE = ensureString(type, { case: 'UP' });
    assert(TYPE, `${name} is required.`);
    return TYPE;
};

const init = async (options) => {
    const provider = unifyProvider(options);
    switch (provider) {
        case OPENAI: case AZURE:
            if (options?.apiKey) {
                provider === AZURE && assert(
                    options?.baseURL, 'Azure api endpoint is required.'
                );
                const libOpenAI = await need('openai', { raw: true });
                const openai = new (options?.endpoint && options?.deployment
                    ? libOpenAI.AzureOpenAI : libOpenAI.OpenAI)(options);
                clients[provider] = { client: openai, clientBeta: openai.beta };
            }
            break;
        case GEMINI:
            if (options?.apiKey) {
                const { GoogleGenerativeAI } = await need('@google/generative-ai');
                const genAi = new GoogleGenerativeAI(options.apiKey);
                const genModel = options?.model || DEFAULT_MODELS[GEMINI];
                clients[provider] = {
                    generative: genAi.getGenerativeModel({
                        model: genModel, ...MODELS[genModel]?.tools ? (options?.tools ?? {
                            tools: [
                                // @todo: Gemini will failed when using these tools together.
                                // https://ai.google.dev/gemini-api/docs/function-calling
                                // { codeExecution: {} },
                                // { googleSearch: {} },
                                { functionDeclarations: toolsGemini.map(x => x.def) },
                            ],
                        }) : {},
                    }),
                    embedding: genAi.getGenerativeModel({
                        model: DEFAULT_MODELS[GEMINI_EMEDDING],
                    }), genModel,
                };
            }
            break;
        case CLAUDE:
            if (options?.apiKey || (options?.credentials && options?.projectId)) {
                // https://github.com/anthropics/anthropic-sdk-typescript/tree/main/packages/vertex-sdk
                const Anthropic = (await need(options?.credentials
                    ? '@anthropic-ai/vertex-sdk' : '@anthropic-ai/sdk', { raw: true }))[
                    options?.credentials ? 'AnthropicVertex' : 'Anthropic'
                ];
                if (options?.credentials) {
                    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = options.credentials;
                    process.env['ANTHROPIC_VERTEX_PROJECT_ID'] = options.projectId;
                }
                const anthropic = new Anthropic({
                    ...options?.apiKey ? { apiKey: options.apiKey } : {},
                    ...options?.credentials ? { region: options?.region || 'us-east5' } : {},
                });
                clients[provider] = { client: anthropic };
            }
            break;
        case OLLAMA:
            clients[provider] || (clients[provider] = {
                client: new (await need('ollama', { raw: true })).Ollama(options),
                model: options?.model || DEFAULT_MODELS[OLLAMA],
            });
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

const tools = [
    {
        def: {
            type: 'function', strict: true, function: {
                name: 'testFunctionCall',
                description: 'This is a test function call',
                parameters: {
                    type: 'object',
                    properties: {
                        a: { type: 'string', description: 'AI created a random string, default "1"' },
                        b: { type: 'string', enum: ['1', '2'], description: 'Enum parameter' }
                    },
                    required: ['a', 'b'],
                    additionalProperties: false
                }
            }
        },
        func: async args => `OK: ${~~args.a + ~~args.b}`,
    },
];

const toolsClaude = tools.map(x => ({
    ...x, def: {
        name: x.def.function.name,
        description: x.def.function.description,
        input_schema: x.def.function.parameters,
    }
}));

const toolsGemini = tools.map(x => ({
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
            return { type: 'image_url', image_url: { url: x.url } };
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
        content: content.length ? [{ type: 'text', text: content }] : [],
    } : content;
    message.content || (message.content = []);
    attachments.map(x => message.content.push(x));
    assertContent(message.content);
    return message;
};

const buildOllamaMessage = (content, options) => {
    const message = String.isString(content) ? {
        role: options?.role || user, content,
    } : content;
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
    const attachments = (options?.attachments || []).map(x => ({
        inlineData: { mimeType: x.mime_type, data: x.data }
    }));
    return String.isString(content) ? (options?.history ? {
        role: options?.role || user,
        parts: buildGeminiParts(content, attachments),
    } : buildGeminiParts(content, attachments)) : content;
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
            type, source: {
                type: BASE64.toLowerCase(),
                media_type: x.mime_type, data: x.data,
            },
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

const packResp = async (resp, options) => {
    let { text: txt, audio, references }
        = String.isString(resp) ? { text: resp } : resp;
    audio && (audio = Buffer.isBuffer(audio) ? audio : await convert(audio, {
        input: BASE64, expected: BUFFER,
    })) && audio.length && (audio = Buffer.concat([
        createWavHeader(audio.length), audio
    ])) && (audio = await convert(audio, {
        input: BUFFER, expected: BUFFER, ...options || {},
    }));
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
    let [richText, referencesMarkdown] = [null, null];
    if (!options?.jsonMode) {
        if (!options?.processing
            && references?.segments?.length && references?.links?.length) {
            richText = txt;
            for (let i = references.segments.length - 1; i >= 0; i--) {
                let idx = richText.indexOf(references.segments[i].text);
                if (idx < 0) { continue; }
                idx += references.segments[i].text.length;
                richText = richText.slice(0, idx)
                    + references.segments[i].indices.map(y => ` (${y + 1})`).join('')
                    + richText.slice(idx);
            }
            referencesMarkdown = 'References:\n\n' + references.links.map((x, i) => {
                return `${i + 1}. [${x.title}](${x.uri})`;
            }).join('\n');
        }
        // DeepSeek R1 {
        let lines = (richText || txt).split('\n');
        const indexOfEnd = lines.indexOf(THINK_END);
        if (lines[0] === THINK_STR) {
            if (indexOfEnd === -1) {
                lines.shift();
            } else {
                lines[0] = MD_CODE + THINK;
                lines[indexOfEnd] = MD_CODE;
                lines.slice(1, indexOfEnd).join('').trim()
                    || (lines = lines.slice(indexOfEnd + 1));
            }
            richText = lines.join('\n').trim();
        }
        // }
    }
    return {
        ...text(txt), ...options?.jsonMode && !(
            options?.delta && options?.processing
        ) ? { json: parseJson(txt) } : {},
        ...richText ? { richText } : {},
        ...references ? { references } : {},
        ...referencesMarkdown ? { referencesMarkdown } : {},
        ...audio ? { audio, audioMimeType: options?.audioMimeType } : {},
        model: options?.model,
    };
};

const packGptResp = async (resp, options) => {
    const text = resp?.choices?.[0]?.message?.content        // ChatGPT
        || resp?.choices?.[0]?.message?.audio?.transcript    // ChatGPT audio mode
        || resp?.text?.()                                    // Gemini
        || resp?.content?.find(x => x.type === 'text')?.text // Claude
        || resp?.message?.content || '';                     // Ollama
    const audio = resp?.choices?.[0]?.message?.audio?.data;  // ChatGPT audio mode
    if (options?.raw) { return resp; }
    else if (options?.simple && options?.jsonMode) { return parseJson(text); }
    else if (options?.simple && options?.audioMode) { return audio; }
    else if (options?.simple && text.substr(0, THINK_STR.length) === THINK_STR) {
        return text.substr(text.indexOf(THINK_END) + THINK_END.length).trim();
    } else if (options?.simple) { return text; }
    return await packResp({ text, audio, references: resp?.references }, options);
};

const handleToolsCall = async (msg, options) => {
    let content = [], preRes = [], input, packMsg;
    if (msg?.tool_calls?.length) {
        switch (options?.flavor) {
            case CLAUDE: preRes.push({ role: assistant, content: msg?.tool_calls }); break;
            case GEMINI: preRes.push({ role: MODEL, parts: msg?.tool_calls.map(x => ({ functionCall: x })) }); break;
            case CHATGPT: default: preRes.push({ role: assistant, ...msg }); break;
        }
        for (const fn of msg.tool_calls) {
            switch (options?.flavor) {
                case CLAUDE:
                    input = fn.input = parseJson(fn?.input);
                    packMsg = (content, is_error) => ({
                        type: 'tool_result', tool_use_id: fn.id, content, is_error,
                    });
                    break;
                case GEMINI:
                    input = fn.args;
                    packMsg = (t, e) => ({
                        functionResponse: {
                            name: fn.name, response: {
                                name: fn.name,
                                content: e ? `[Error] ${t}` : JSON.stringify(t),
                            }
                        }
                    });
                    break;
                case CHATGPT: default:
                    input = parseJson(fn?.function?.arguments);
                    packMsg = (t, e) => ({
                        role: TOOL, tool_call_id: fn.id, [e ? 'error' : 'content']: t
                    });
                    break;
            }
            const name = fn?.function?.name || fn?.name;
            const func = tools.find(x => insensitiveCompare(
                x.def?.function?.name || x?.def?.name, name
            ))?.func;
            if (!func) {
                content.push(packMsg(`Function call failed, invalid function name: ${name}`, true));
                continue;
            }
            try {
                content.push(packMsg(await func(input)));
            } catch (err) {
                content.push(packMsg(`Function call failed: ${err.message}`, true));
            }
        }
        switch (options?.flavor) {
            case CLAUDE: content = [{ role: user, content }]; break;
            case GEMINI: content = [{ role: user, parts: content }]; break;
        }
    }
    return [...preRes, ...content];
};

const promptChatGPT = async (content, options = {}) => {
    const { client } = await getOpenAIClient(options);
    // https://github.com/openai/openai-node?tab=readme-ov-file#streaming-responses
    // custom api endpoint not supported vision apis @todo by @Leask
    // Structured Outputs: https://openai.com/index/introducing-structured-outputs-in-the-api/
    client.baseURL !== OPENAI_BASE_URL
        && options?.attachments?.length && (options.attachments = []);
    if (options?.model) { } else if (options?.provider === AZURE) {
        options.model = DEFAULT_MODELS[AZURE];
    } else if (options?.reasoning) {
        options.model = DEFAULT_MODELS[CHATGPT_REASONING];
    } else {
        options.model = DEFAULT_MODELS[CHATGPT];
    }
    options?.reasoning && !options?.reasoning_effort
        && (options.reasoning_effort = GPT_REASONING_EFFORT);
    const message = buildGptMessage(content, options);
    const modalities = options?.modalities || (
        options?.audioMode ? ['text', AUDIO] : undefined
    );
    assert(!(
        options?.jsonMode && !MODELS[options.model]?.json
    ), `This model does not support JSON output: ${options.model}`);
    assert(!(
        options?.reasoning && !MODELS[options.model]?.reasoning
    ), `This model does not support reasoning: ${options.model}`);
    let format;
    [format, options.audioMimeType, options.suffix]
        = options?.stream ? ['pcm16', pcm16, 'pcm.wav'] : [WAV, wav, WAV];
    let [resp, resultText, resultAudio, chunk, resultTools] = [
        await client.chat.completions.create({
            modalities, audio: options?.audio || (
                modalities?.find?.(x => x === AUDIO) && {
                    voice: DEFAULT_MODELS[OPENAI_VOICE], format
                }
            ), ...messages([
                ...options?.messages || [], message,
                ...options?.toolsResult || [],
            ]), ...MODELS[options.model]?.tools ? {
                tools: options?.tools ?? tools.map(x => x.def),
            } : {}, ...options?.jsonMode ? {
                response_format: { type: JSON_OBJECT }
            } : {}, model: options.model, stream: !!options?.stream, store: true,
        }), '', Buffer.alloc(0), null, [],
    ];
    if (options?.stream) {
        for await (chunk of resp) {
            const deltaText = chunk.choices[0]?.delta?.content
                || chunk.choices[0]?.delta?.audio?.transcript || '';
            const deltaAudio = chunk.choices[0]?.delta?.audio?.data ? await convert(
                chunk.choices[0].delta.audio.data, { input: BASE64, expected: BUFFER }
            ) : Buffer.alloc(0);
            const deltaFunc = chunk.choices[0]?.delta?.tool_calls || [];
            for (const x in deltaFunc) {
                let curFunc = resultTools.find(z => z.index === deltaFunc[x].index);
                curFunc || (resultTools.push(curFunc = {}));
                isSet(deltaFunc[x].index, true) && (curFunc.index = deltaFunc[x].index);
                deltaFunc[x].id && (curFunc.id = deltaFunc[x].id);
                deltaFunc[x].type && (curFunc.type = deltaFunc[x].type);
                curFunc.function || (curFunc.function = { name: '', arguments: '' });
                if (deltaFunc[x].function) {
                    deltaFunc[x].function.name && (curFunc.function.name += deltaFunc[x].function.name);
                    deltaFunc[x].function.arguments && (curFunc.function.arguments += deltaFunc[x].function.arguments);
                }
            }
            if (deltaText === '' && !deltaAudio.length) { continue; }
            resultText += deltaText;
            resultAudio = Buffer.concat([resultAudio, deltaAudio]);
            const respAudio = options?.delta ? deltaAudio : resultAudio;
            chunk.choices[0].message = {
                content: options?.delta ? deltaText : resultText,
                ...respAudio.length ? { audio: { data: respAudio } } : {},
            };
            await ignoreErrFunc(async () => await options?.stream?.(
                await packGptResp(chunk, { ...options || {}, processing: true })
            ), LOG);
        }
        chunk.choices?.[0] || (chunk.choices = [{}]); // handle empty choices for Azure APIs
        chunk.choices[0].message = {
            content: resultText, tool_calls: resultTools,
            ...resultAudio.length ? { audio: { data: resultAudio } } : {},
        };
        resp = chunk;
    }
    const toolsResult = await handleToolsCall(resp?.choices?.[0]?.message);
    return await (toolsResult.length ? promptChatGPT(
        content, { ...options || {}, toolsResult }
    ) : packGptResp(resp, options));
};

const promptAzure = async (content, options = {}) => await promptChatGPT(
    content, { ...options, provider: AZURE }
);

const promptOllama = async (content, options = {}) => {
    const { client, model } = await getOllamaClient(options);
    // https://github.com/ollama/ollama-js
    // https://github.com/jmorganca/ollama/blob/main/examples/typescript-simplechat/client.ts
    options.model = options?.model || model;
    const resp = await client.chat({
        model: options.model, stream: true,
        ...messages([...options?.messages || [], buildOllamaMessage(content)]),
    })
    let [chunk, result] = [null, ''];
    for await (chunk of resp) {
        const delta = chunk.message.content || '';
        if (delta === '') { continue; }
        result += delta;
        chunk.message.content = options?.delta ? delta : result;
        await ignoreErrFunc(async () => await options?.stream?.(
            await packGptResp(chunk, { ...options || {}, processing: true })
        ), LOG);
    }
    chunk.message.content = result;
    return await packGptResp(chunk, options);
};

const promptClaude = async (content, options = {}) => {
    const { client } = await getClaudeClient(options);
    options.model = options?.model || DEFAULT_MODELS[CLAUDE];
    const reasoning = options?.reasoning ?? MODELS[options.model]?.reasoning;
    const resp = await client.messages.create({
        model: options.model, max_tokens: MODELS[options.model].maxOutputTokens,
        messages: [
            ...options?.messages || [], buildClaudeMessage(content, options),
            ...options?.toolsResult || [],
        ], stream: !!options?.stream, ...reasoning ? {
            thinking: options?.thinking || { type: 'enabled', budget_tokens: 1024 },
        } : {}, // https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
        ...MODELS[options.model]?.tools ? {
            tools: options?.tools ?? toolsClaude.map(x => x.def),
        } : {},
    });
    let [event, txtResult, thinking, signature, result, thinkEnd, tool_calls]
        = [null, '', '', '', '', '', []];
    if (options?.stream) {
        for await (event of resp) {
            let [thkDelta, txtDelta] = [
                event?.content_block?.thinking || event?.delta?.thinking || '',
                event?.content_block?.text || event?.delta?.text || '',
            ];
            txtResult += txtDelta;
            thinking += thkDelta;
            signature = signature || event?.content_block?.signature || event?.delta?.signature || '';
            if (reasoning) {
                !result && thkDelta && (thkDelta = `${THINK_STR}\n${thkDelta}`);
                result && txtDelta && !thinkEnd && (thinkEnd = thkDelta = `${thkDelta}\n${THINK_END}\n\n`);
            }
            if (event?.content_block?.type === 'tool_use') {
                tool_calls.push({ ...event?.content_block, input: '' });
            } else if (event?.delta?.partial_json) {
                tool_calls[tool_calls.length - 1].input += event?.delta?.partial_json;
            }
            const delta = thkDelta + txtDelta;
            if (delta === '') { continue; }
            result += delta;
            event.content = [{ type: 'text', text: options?.delta ? delta : result }];
            await ignoreErrFunc(async () => await options.stream(
                await packGptResp(event, { ...options || {}, processing: true })
            ), LOG);
        }
        event.content = [{ type: 'text', text: tool_calls.length ? txtResult : result }];
        tool_calls.length && thinking && event.content.unshift({ type: 'thinking', thinking, signature });
    } else {
        event = resp;
        tool_calls = resp?.content?.filter?.(x => x.type === 'tool_use') || [];
    }
    const toolsResult = await handleToolsCall({ tool_calls }, { flavor: CLAUDE });
    if (toolsResult.length) {
        toolsResult[0].content.unshift(...event?.content.filter(x => x?.type !== 'tool_use'));
        return await promptClaude(content, { ...options || {}, toolsResult });
    }
    return packGptResp(event, options);
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

const uploadFileForFineTuning = async (content, options) => await uploadFile(
    content, { suffix: 'jsonl', ...options, params: { purpose: 'fine-tune' } }
);

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

const generationConfig = options => ({
    generationConfig: {
        ...options?.generationConfig || {},
        responseMimeType: options?.jsonMode ? mimeJson : mimeText,
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

const handleGeminiResponse = async (resp, options) => {
    const _resp = await resp;
    let [result, references, functionCalls] = ['', null, null];
    if (options?.stream) {
        for await (const chunk of _resp.stream) {
            functionCalls || (functionCalls = chunk.functionCalls);
            const delta = chunk?.text?.() || '';
            const rfc = packGeminiReferences(
                chunk.candidates[0]?.groundingMetadata?.groundingChunks,
                chunk.candidates[0]?.groundingMetadata?.groundingSupports
            );
            if (delta === '' && !rfc) { continue; }
            result += delta;
            references = rfc;
            await ignoreErrFunc(async () => await options.stream(
                await packGptResp({
                    text: () => options?.delta ? delta : result, references,
                }, { ...options || {}, processing: true })
            ), LOG);
        }
    }
    const __resp = await _resp.response;
    const toolsResult = await handleToolsCall({
        tool_calls: (functionCalls || __resp.functionCalls)()
    }, { flavor: GEMINI });
    return await (toolsResult.length ? promptGemini(
        options?.content, { ...options || {}, toolsResult }
    ) : packGptResp(options?.stream ? {
        __resp, text: () => result, references
    } : {
        ...__resp, references: packGeminiReferences(
            __resp.candidates[0]?.groundingMetadata?.groundingChunks,
            __resp.candidates[0]?.groundingMetadata?.groundingSupports
        )
    }, options));
};

const promptGemini = async (content, options) => {
    const { generative, genModel } = await getGeminiClient(options);
    // https://github.com/google/generative-ai-js/blob/main/samples/node/advanced-chat.js
    // @todo: check this issue similar to Vertex AI:
    // Google's bug: history is not allowed while using inline_data?
    assert(!(
        options?.jsonMode && MODELS[genModel]?.json == false
    ), `This model does not support JSON output: ${genModel} `);
    const chat = generative.startChat({
        history: [
            ...options?.messages && !options?.attachments?.length
                ? options.messages : [],
            ...options?.toolsResult ? [{
                role: user, parts: buildGeminiMessage(content, options)
            }, options?.toolsResult[0]] : [],
        ], ...generationConfig(options),
    });
    const resp = chat[options?.stream ? 'sendMessageStream' : 'sendMessage'](
        options?.toolsResult ?
            options?.toolsResult[1].parts : buildGeminiMessage(content, options)
    );
    return await handleGeminiResponse(
        resp, { ...options || {}, content, model: genModel }
    );
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
    const [loopName, listOpts] = [`GPT - ${job_id} `, {
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
        engines: options?.engines || { [DEFAULT_MODELS[CHAT]]: {} },
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
        const pmptTokens = await countTokens([buildGeminiHistory(
            chatConfig.systemPrompt, { role: system }
        )]); // Use Gemini instead of ChatGPT because of the longer pack
        assert(
            pmptTokens < mxPmpt,
            `System prompt is too long: ${pmptTokens} / ${mxPmpt} tokens.`
        );
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
    const result = {
        ...resp, richText: resp.richText || resp.text, spoken: renderText(
            resp.text, { noCode: true, noLink: true }
        ).replace(/\[\^\d\^\]/ig, ''),
    };
    log(`Response (${result.model}): ${JSON.stringify(result.text)}`);
    // log(result);
    return result;
};

const talk = async (input, options) => {
    const engine = unifyEngine({
        engine: Object.keys(chatConfig.engines)?.[0] || DEFAULT_MODELS[CHAT],
        ...options,
    });
    assert(chatConfig.engines[engine], NOT_INIT);
    const model = options?.model || chatConfig.engines[engine].model;
    const _MODEL = MODELS[model];
    const sessionId = options?.sessionId || newSessionId();
    const session = await getSession(sessionId, { engine, ...options });
    let [resp, sys, messages, msgBuilder] = [null, [], [], null];
    switch (engine) {
        case CHATGPT: case AZURE:
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
        case OLLAMA:
            sys.push(buildOllamaMessage(session.systemPrompt, { role: system }));
            msgBuilder = () => {
                messages = [];
                session.messages.map(x => {
                    messages.push(buildOllamaMessage(x.request, { role: user }));
                    messages.push(buildOllamaMessage(x.response, { role: assistant }));
                });
            };
            msgBuilder()
            break;
        default:
            throwError(`Invalid AI engine: '${engine}'.`);
    }
    await trimPrompt(() => [...sys, ...messages, buildGeminiHistory(
        input || ATTACHMENTS, { role: user } // length hack: ATTACHMENTS
    )], () => {
        if (messages.length) {
            session.messages.shift();
            msgBuilder && msgBuilder();
        } else {
            input = trimTailing(trimTailing(input).slice(0, -1)) + '...';
        }
    }, _MODEL.maxInputTokens - options?.attachments?.length * ATTACHMENT_TOKEN_COST);
    const chat = { request: input || ATTACHMENTS };
    const attachments = [];
    (options?.attachments || []).filter(x => [
        ..._MODEL?.supportedMimeTypes || [], ..._MODEL.supportedAudioTypes || []
    ].includes(x.mime_type)).map(x => attachments.push(x));
    log(`Prompt (${engine}): ${JSON.stringify(input)}`);
    switch (engine) {
        case CHATGPT:
            resp = await promptChatGPT(input, {
                messages, model, ...options, attachments,
            });
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
        case AZURE:
            resp = await promptAzure(input, { messages, model, ...options });
            break;
    }
    chat.response = resp.text;
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
        fast: true, multimodal: true, simple: true, ...o, attachments,
    });
};

const prompt = async (input, options) => {
    let egn = options?.engine && unifyEngine(options);
    const engines = PREFERRED_ENGINES.slice();
    options?.multimodal && engines.sort((x, y) => x.multimodal - y.multimodal);
    for (const engine of engines) {
        if ((egn ? engine.client === egn : true) && clients[engine.client]) {
            const extra = {};
            if (engine.client === OPENAI) {
                if (options?.fast) {
                    extra.model = DEFAULT_MODELS[CHATGPT_MINI];
                } else if (options?.reasoning) {
                    extra.model = DEFAULT_MODELS[CHATGPT_REASONING];
                }
            }
            return await engine.func(input, { ...extra, ...options || {} });
        }
    }
    throwError('No AI provider is available.');
};

const trimPrompt = async (getPrompt, trimFunc, contextWindow, options) => {
    let [i, maxTry] = [0, ~~options?.maxTry || MAX_TRIM_TRY];
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
    }, getMaxChatPromptLimit(options));
    const aiResp = Object.keys(sses) ? (await prompt(getInput(), {
        jsonMode: true, fast: true, simple: true, ...options || {}
    })) : {};
    assert(aiResp, 'Unable to analyze sessions.');
    ids.map(x => resp[x] = aiResp[x] || null);
    return Array.isArray(sessionIds) ? resp : resp[sessionIds[0]];
};

const PREFERRED_ENGINES = [
    { client: OPENAI, func: promptChatGPT, multimodal: 0 },
    { client: GEMINI, func: promptGemini, multimodal: 1 },
    { client: CLAUDE, func: promptClaude, multimodal: 2 },
    { client: AZURE, func: promptAzure, multimodal: 3 },
    { client: OLLAMA, func: promptOllama, multimodal: 99 },
]; // keep gpt first to avoid gemini grounding by default

export default init;
export {
    ATTACHMENT_TOKEN_COST, CLOUD_37_SONNET, CODE_INTERPRETER, DEEPSEEK_R1,
    DEEPSEEK_R1_32B, DEEPSEEK_R1_70B, DEFAULT_MODELS,
    EMBEDDING_001,
    FUNCTION, GEMINI_20_FLASH, GEMINI_20_FLASH_THINKING, GPT_4O, GPT_4O_MINI, GPT_O1, GPT_O3_MINI, MODELS,
    OPENAI_VOICE,
    RETRIEVAL,
    TEXT_EMBEDDING_3_SMALL, _NEED, analyzeSessions,
    buildGptTrainingCase,
    buildGptTrainingCases,
    cancelGptFineTuningJob,
    countTokens,
    createGeminiEmbedding, createGptFineTuningJob,
    createOpenAIEmbedding,
    deleteFile,
    distillFile,
    getGptFineTuningJob,
    getMaxChatPromptLimit,
    getSession,
    init,
    initChat,
    jpeg,
    listFiles,
    listGptFineTuningEvents,
    listGptFineTuningJobs,
    listOpenAIModels,
    ogg,
    prompt, promptAzure, promptChatGPT,
    promptClaude,
    promptGemini,
    promptOllama,
    resetSession,
    tailGptFineTuningEvents,
    talk,
    trimPrompt,
    uploadFile,
    uploadFileForFineTuning,
    wav
};
