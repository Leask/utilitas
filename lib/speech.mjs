import { convert, getTempPath } from './storage.mjs';
import { ensureString } from './utilitas.mjs';
import { get } from './shot.mjs';
import { getApiKeyCredentials, hash } from './encryption.mjs';
import { getFfmpeg } from './media.mjs';

import {
    call, countKeys, ignoreErrFunc, inBrowser, log as _log, need, throwError
} from './utilitas.mjs';

import {
    convertAudioTo16kNanoPcmWave,
    convertAudioTo16kNanoOpusOgg,
} from './media.mjs';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    'OpenAI',
    'whisper-node',
];

const WHISPER_DEFAULT_MODEL = 'tiny.en';
const errorMessage = 'Invalid audio data.';
const [BUFFER, STREAM, BASE64, FILE, clients, languageCode, audioEncoding, suffix, SPEAKER, cleanup]
    = ['BUFFER', 'STREAM', 'BASE64', 'FILE', {}, 'en-US', 'OGG_OPUS', 'ogg', 'SPEAKER', true];

// https://platform.openai.com/account/limits
const [TTS_1, TTS_1_HD] = ['tts-1', 'tts-1-hd']; // [100 RPM, 7 RPM]
const defaultOpenAITtsModel = TTS_1;

const WHISPER_MODELS = [
    // npx whisper-node download tiny.en
    // https://github.com/ggerganov/whisper.cpp/blob/master/models/download-ggml-model.sh
    // https://huggingface.co/ggerganov/whisper.cpp
    // Model               // Disk   // Mem
    'tiny',                // 75 MB  // ~390 MB
    WHISPER_DEFAULT_MODEL, // 75 MB  // ~390 MB
    'base',                // 142 MB // ~500 MB
    'base.en',             // 142 MB // ~500 MB
    'small',               // 466 MB // ~1.0 GB
    'small.en',            // 466 MB // ~1.0 GB
    'medium',              // 1.5 GB // ~2.6 GB
    'medium.en',           // 1.5 GB // ~2.6 GB
    'large-v1',            // 2.9 GB // ~4.7 GB
    'large',               // 2.9 GB // ~4.7 GB
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
    assert(clients.tts, 'Text-to-Speech API has not been initialized.', 500);
    assert(input, 'Text is required.', 400);
    // https://platform.openai.com/docs/api-reference/audio/createSpeech
    const content = await clients.tts.create({
        model: defaultOpenAITtsModel, voice: 'nova', response_format: 'opus',
        input, ...options?.params || {},
    });
    const buffer = Buffer.from(await content.arrayBuffer());
    return await convert(buffer, { suffix, ...options || {} });
};

const ttsGoogle = async (text, options) => {
    assert(clients.tts, 'Text-to-Speech API has not been initialized.', 500);
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
        file = await convertAudioTo16kNanoOpusOgg(file, { frequency: 16000 });
        file = await convert(file, { cleanup, input: FILE, suffix, ...options || {} });
    }
    return file;
};

const ttsBrowser = async (text) => {
    assert(text, 'Text is required.', 400);
    return speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};

const sttOpenAI = async (audio, options) => {
    assert(clients.stt, 'Speech-to-Text API has not been initialized.', 500);
    const input = ensureString(options?.input, { case: 'UP' });
    const { content, cleanup } = await convert(audio, {
        input: options?.input, ...options || {}, expected: STREAM, errorMessage,
        suffix: ['', BUFFER].includes(input) ? suffix : null,
        withCleanupFunc: true,
    });
    const result = await clients.stt.create({
        file: await clients.toFile(content), model: 'whisper-1',
        response_format: 'text', ...options?.params || {},
    });
    await cleanup();
    return result;
};

const sttGoogle = async (audio, options) => {
    assert(clients.stt, 'Speech-to-Text API has not been initialized.', 500);
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

const sttWhisper = async (audio, options) => {
    const whisper = (await need('whisper-node')).whisper;
    const { content, cleanup } = await convert(audio, {
        input: options?.input, expected: FILE, errorMessage,
        withCleanupFunc: true,
    });
    const sound = await convertAudioTo16kNanoPcmWave(content);
    await cleanup();
    const modelPath = await getWhisperModelReady(options?.model, options);
    const raw = await whisper(sound, {
        // modelName: 'tiny.en',         // default
        modelPath,                       // use model in a custom directory
        // whisperOptions: {
        //     gen_file_txt: false,      // outputs .txt file
        //     gen_file_subtitle: false, // outputs .srt file
        //     gen_file_vtt: false,      // outputs .vtt file
        //     timestamp_size: 10,       // amount of dialogue per timestamp pair
        //     word_timestamps: true     // timestamp for every word
        // },
        ...options || {},
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
    init,
    stt,
    sttGoogle,
    sttOpenAI,
    sttWhisper,
    tts,
    ttsGoogle,
    ttsOpenAI,
    ttsSay,
};
