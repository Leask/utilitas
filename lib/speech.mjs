import { convert } from './storage.mjs';
import { convertAudioTo16kNanoWave } from './media.mjs';
import { countKeys, log as _log, need, throwError } from './utilitas.mjs';
import { get } from './shot.mjs';
import { getApiKeyCredentials } from './encryption.mjs';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    'whisper-node',
];

const WHISPER_DEFAULT_MODEL = 'tiny.en';
const errorMessage = 'Invalid audio data.';

const [BASE64, FILE, clients, languageCode, audioEncoding, suffix]
    = ['BASE64', 'FILE', {}, 'en-US', 'OGG_OPUS', 'OGG'];

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
        assert(options?.apiKey, 'Google Cloud API key is required.', 500);
        assert(options?.tts || options?.stt, 'At least one of TTS or STT is selected.', 500);
        const sslCreds = await getApiKeyCredentials(options);
        if (options?.tts) {
            const tts = (await need('@google-cloud/text-to-speech')).default;
            clients.tts = new tts.TextToSpeechClient({ sslCreds });
        }
        if (options?.stt) {
            const stt = (await need('@google-cloud/speech')).default;
            clients.stt = new stt.SpeechClient({ sslCreds });
        }
    }
    assert(countKeys(clients), 'Speech API client has not been initialized.', 501);
    return clients;
};

const tts = async (text, options) => {
    assert(clients.tts, 'Text-to-Speech API has not been initialized.', 500);
    assert(text, 'Text is required.', 400);
    const [response] = await clients.tts.synthesizeSpeech({
        input: { text, ...options?.input || {} },
        voice: { languageCode, name: 'en-US-Wavenet-F', ...options?.voice || {} },
        audioConfig: { audioEncoding, ...options?.audioConfig || {} },
    });
    return await convert(response.audioContent, { suffix, ...options || {} });
};

const sttGoogle = async (audio, options) => {
    assert(clients.stt, 'Speech-to-Text API has not been initialized.', 500);
    const content = await convert(audio, {
        input: options?.input, expected: BASE64, errorMessage,
    });
    const [response] = await clients.stt.recognize({
        audio: { content, ...options?.audio || {} }, config: {
            encoding: audioEncoding, sampleRateHertz: 24000,
            languageCode, ...options?.config || {}
        },
    });
    return options?.raw ? response : response.results
        .map(result => result.alternatives[0].transcript).join('\n');
};

const sttWhisper = async (audio, options) => {
    const whisper = (await need('whisper-node')).whisper;
    const content = await convertAudioTo16kNanoWave(await convert(audio, {
        input: options?.input, expected: FILE, errorMessage,
    }));
    const modelPath = await getWhisperModelReady(options?.model, options);
    const raw = await whisper(content, {
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

const stt = async (audio, options) => {
    if (clients?.stt) {
        return sttGoogle(audio, options);
    } else if (await need('whisper-node')) {
        return sttWhisper(audio, options);
    }
    throwError('Speech-to-Text engine has not been initialized.', 500);
};

export default init;
export {
    _NEED,
    init,
    stt,
    sttGoogle,
    sttWhisper,
    tts,
};
