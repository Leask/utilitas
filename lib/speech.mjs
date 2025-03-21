import { DEFAULT_MODELS, OPENAI_VOICE } from './alan.mjs';
import { getApiKeyCredentials, hash } from './encryption.mjs';
import { getFfmpeg } from './media.mjs';
import { get } from './web.mjs';
import { convert, getTempPath } from './storage.mjs';
import { ensureString } from './utilitas.mjs';

import {
    call, countKeys, ignoreErrFunc, inBrowser,
    need, throwError
} from './utilitas.mjs';

import {
    convertAudioTo16kNanoOpusOgg,
    convertAudioTo16kNanoPcmWave,
} from './media.mjs';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    'OpenAI',
    'whisper-node',
];

const WHISPER_DEFAULT_MODEL = 'base';
const errorMessage = 'Invalid audio data.';
const [BUFFER, STREAM, BASE64, FILE, clients, languageCode, audioEncoding, suffix, SPEAKER, cleanup]
    = ['BUFFER', 'STREAM', 'BASE64', 'FILE', {}, 'en-US', 'OGG_OPUS', 'ogg', 'SPEAKER', true];
const [GPT_4O_MIMI_TTS, GPT_4O_TRANSCRIBE, OPENAI_TTS_MAX_LENGTH]
    = ['gpt-4o-mini-tts', 'gpt-4o-transcribe', 4096];
const [defaultOpenAITtsModel, defaultOpenAISttModel]
    = [GPT_4O_MIMI_TTS, GPT_4O_TRANSCRIBE];

const WHISPER_MODELS = [
    // npx whisper-node download tiny.en
    // https://github.com/ggerganov/whisper.cpp/blob/master/models/download-ggml-model.sh
    // https://huggingface.co/ggerganov/whisper.cpp
    // Model               // Disk
    'tiny',                // 75 MB
    'tiny-q5_1',           // 31 MB
    'tiny-q8_0',           // 42 MB
    'tiny.en',             // 75 MB
    'tiny.en-q5_1',        // 31 MB
    'tiny.en-q8_0',        // 42 MB
    WHISPER_DEFAULT_MODEL, // 142 MB
    'base-q5_1',           // 57 MB
    'base-q8_0',           // 78 MB
    'base.en',             // 142 MB
    'base.en-q5_1',        // 57 MB
    'base.en-q8_0',        // 78 MB
    'small',               // 466 MB
    'small-q5_1',          // 181 MB
    'small-q8_0',          // 252 MB
    'small.en',            // 466 MB
    'small.en-q5_1',       // 181 MB
    'small.en-q8_0',       // 252 MB
    'small.en-tdrz',       // 465 MB
    'medium',              // 1.5 GB
    'medium-q5_0',         // 514 MB
    'medium-q8_0',         // 785 MB
    'medium.en',           // 1.5 GB
    'medium.en-q5_0',      // 514 MB
    'medium.en-q8_0',      // 785 MB
    'large-v1',            // 2.9 GB
    'large-v2',            // 2.9 GB
    'large-v2-q5_0',       // 1.1 GB
    'large-v2-q8_0',       // 1.5 GB
    'large-v3',            // 2.9 GB
    'large-v3-q5_0',       // 1.1 GB
    'large-v3-turbo',      // 1.5 GB
    'large-v3-turbo-q5_0', // 547 MB
    'large-v3-turbo-q8_0', // 834 MB
];

const getWhisperModelUrl = model => {
    assert(WHISPER_MODELS.includes(model), 'Invalid Whisper model.', 400);
    return `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin`;
};

const getWhisperModelReady = async (model, options) => {
    model = options?.model || WHISPER_DEFAULT_MODEL;
    return (await get(getWhisperModelUrl(model), { fuzzy: true }))?.cache?.content;
};

const init = async (options) => {
    if (options) {
        assert(
            options?.tts || options?.stt,
            'At least one of TTS or STT is selected.', 500
        );
        const provider = ensureString(options?.provider, { case: 'UP' });
        switch (provider) {
            case 'OPENAI':
                clients._provider = provider;
                const OpenAI = await need('openai');
                const openai = new OpenAI(options);
                if (options?.tts) {
                    clients.tts = openai.audio.speech;
                }
                if (options?.stt) {
                    clients.stt = openai.audio.transcriptions;
                    clients.toFile = OpenAI.toFile;
                }
                break;
            case 'GOOGLE':
                clients._provider = provider;
                const sslCreds = await getApiKeyCredentials(options);
                if (options?.tts) {
                    const tts = (await need('@google-cloud/text-to-speech')).default;
                    clients.tts = new tts.TextToSpeechClient({ sslCreds });
                }
                if (options?.stt) {
                    const stt = (await need('@google-cloud/speech')).default;
                    clients.stt = new stt.SpeechClient({ sslCreds });
                }
                break;
            case '':
                clients._provider = 'LOCAL';
                options?.tts && await checkSay({ assert: true });
                options?.stt && await checkWhisper({ assert: true });
                break;
            default:
                throwError('Invalid speech provider.', 500);
        }
    }
    assert(
        countKeys(clients), 'Speech API client has not been initialized.', 501
    );
    return clients;
};

const checkSay = async (options) => {
    const result = !!(await ignoreErrFunc(async () => (
        await Promise.all([need('node:os'), need('say'), getFfmpeg()])
    )[0].platform() === 'darwin'));
    options?.assert && assert(result, 'Say API is not available.', 500);
    return result;
};

const checkWhisper = async (options) => {
    const result = !!(await ignoreErrFunc(() => Promise.all([
        need('whisper-node'), getFfmpeg()
    ])));
    options?.assert && assert(result, 'Whisper API is not available.', 500);
    return result;
};

const ttsOpenAI = async (input, options) => {
    assert(clients.tts, 'OpenAI TTS API has not been initialized.', 500);
    assert(input, 'Text is required.', 400);
    assert(input.length <= OPENAI_TTS_MAX_LENGTH, 'Text is too long.', 400);
    // https://platform.openai.com/docs/api-reference/audio/createSpeech
    const content = await clients.tts.create({
        model: defaultOpenAITtsModel, voice: DEFAULT_MODELS[OPENAI_VOICE],
        instructions: 'Speak in a friendly and sweet tone.',
        response_format: 'opus', input, ...options?.params || {},
    });
    const buffer = Buffer.from(await content.arrayBuffer());
    return await convert(buffer, { suffix, ...options || {} });
};

const ttsGoogle = async (text, options) => {
    assert(clients.tts, 'Google TTS API has not been initialized.', 500);
    assert(text, 'Text is required.', 400);
    const [response] = await clients.tts.synthesizeSpeech({
        input: { text, ...options?.input || {} },
        voice: { languageCode, name: 'en-US-Wavenet-F', ...options?.voice || {} },
        audioConfig: { audioEncoding, ...options?.audioConfig || {} },
    });
    return await convert(response.audioContent, { suffix, ...options || {} });
};

const ttsSay = async (text, options) => {
    const say = await need('say');
    assert(text, 'Text is required.', 400);
    // https://gist.github.com/mculp/4b95752e25c456d425c6
    let [func, file, args] = [
        null, null, [text, options?.voice || 'Samantha', options?.speed || 1]
    ];
    if (options?.expected === SPEAKER) { func = 'speak'; } else {
        func = 'export';
        file = getTempPath({ sub: `${hash(JSON.stringify(args))}.wav` });
        args.push(file);
    }
    await call([say[func], say], ...args);
    if (file && !options?.raw) {              // MacOS TTS Limitation: 22.05 kHz
        file = await convertAudioTo16kNanoOpusOgg(file, {
            frequency: 16000, cleanup, input: FILE, suffix, ...options || {},
        });
    }
    return file;
};

const ttsBrowser = async (text) => {
    assert(text, 'Text is required.', 400);
    return speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};

const sttOpenAI = async (audio, options) => {
    assert(clients.stt, 'OpenAI STT API has not been initialized.', 500);
    const input = ensureString(options?.input, { case: 'UP' });
    const { content, cleanup } = await convert(audio, {
        input: options?.input, ...options || {}, expected: STREAM, errorMessage,
        suffix: ['', BUFFER].includes(input) ? suffix : null,
        withCleanupFunc: true,
    });
    const result = await clients.stt.create({
        file: await clients.toFile(content), model: defaultOpenAISttModel,
        response_format: 'text', ...options?.params || {},
    });
    await cleanup();
    return result;
};

const sttGoogle = async (audio, options) => {
    assert(clients.stt, 'Google STT API has not been initialized.', 500);
    const content = await convert(audio, {
        input: options?.input, expected: BASE64, errorMessage,
    });
    const [response] = await clients.stt.recognize({
        audio: { content, ...options?.audio || {} }, config: {
            encoding: audioEncoding, sampleRateHertz: 48000,
            languageCode, ...options?.config || {}
        },
    });
    return options?.raw ? response : response.results
        .map(result => result.alternatives[0].transcript).join('\n');
};

// This function is not working properly, a pull request is filed:
// https://github.com/ariym/whisper-node/pull/58
const sttWhisper = async (audio, options) => {
    const whisper = (await need('whisper-node')).whisper;
    const sound = await convertAudioTo16kNanoPcmWave(audio, {
        input: options?.input, expected: FILE, errorMessage,
    });
    const modelPath = await getWhisperModelReady(options?.model, options);
    const raw = await whisper(sound, {
        // modelName: 'base',            // default
        modelPath,                       // use model in a custom directory
        ...options || {},
        whisperOptions: {
            //     language: 'auto',         // default (use 'auto' for auto detect)
            //     gen_file_txt: false,      // outputs .txt file
            //     gen_file_subtitle: false, // outputs .srt file
            //     gen_file_vtt: false,      // outputs .vtt file
            //     word_timestamps: true,    // timestamp for every word
            //     // timestamp_size: 0,     // cannot use along with word_timestamps:true
            ...options?.whisperOptions || {},
        },
    });
    assert(raw, 'Failed to recognize speech.', 500);
    return options?.raw ? raw : raw.map(x => x.speech).join('').trim();
};

const tts = async (text, options) => {
    let engine;
    if (inBrowser()) { engine = ttsBrowser }
    else if (clients?.tts && clients._provider === 'OPENAI') { engine = ttsOpenAI; }
    else if (clients?.tts && clients._provider === 'GOOGLE') { engine = ttsGoogle; }
    else if (await checkSay()) { engine = ttsSay; }
    else { throwError('Text-to-Speech engine has not been initialized.', 500); }
    return await engine(text, options);
};

const stt = async (audio, options) => {
    let engine;
    if (clients?.stt && clients._provider === 'OPENAI') { engine = sttOpenAI; }
    else if (clients?.stt && clients._provider === 'GOOGLE') { engine = sttGoogle; }
    else if (await checkWhisper()) { engine = sttWhisper; }
    else { throwError('Speech-to-Text engine has not been initialized.', 500); }
    return await engine(audio, options);
};

export default init;
export {
    _NEED,
    checkSay,
    checkWhisper,
    init, OPENAI_TTS_MAX_LENGTH, stt, sttGoogle,
    sttOpenAI,
    sttWhisper,
    tts,
    ttsGoogle,
    ttsOpenAI,
    ttsSay
};
