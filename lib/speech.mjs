import { get } from './web.mjs';
import { getFfmpeg } from './media.mjs';
import { getTempPath } from './storage.mjs';
import { hash } from './encryption.mjs';

import {
    call, ignoreErrFunc, inBrowser, need, throwError,
} from './utilitas.mjs';

import {
    convertAudioTo16kNanoOpusOgg, convertAudioTo16kNanoPcmWave,
} from './media.mjs';

const _NEED = ['whisper-node'];

const [FILE, suffix, SPEAKER, cleanup, WHISPER_DEFAULT_MODEL, errorMessage]
    = ['FILE', 'ogg', 'SPEAKER', true, 'base', 'Invalid audio data.'];

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

const checkSay = async () => {
    const result = !!(await ignoreErrFunc(async () => (
        await Promise.all([need('node:os'), need('say'), getFfmpeg()])
    )[0].platform() === 'darwin'));
    assert(result, 'Say API is not available.', 500);
    return result;
};

const checkWhisper = async () => {
    const result = !!(await ignoreErrFunc(() => Promise.all([
        need('whisper-node'), getFfmpeg()
    ])));
    assert(result, 'Whisper API is not available.', 500);
    return result;
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
    else if (await checkSay()) { engine = ttsSay; }
    else { throwError('Text-to-Speech engine is not available.', 500); }
    return await engine(text, options);
};

const stt = async (audio, options) => {
    let engine;
    if (await checkWhisper()) { engine = sttWhisper; }
    else { throwError('Speech-to-Text engine is not available.', 500); }
    return await engine(audio, options);
};

export {
    _NEED,
    checkSay,
    checkWhisper,
    stt,
    sttWhisper,
    tts,
    ttsSay,
};
