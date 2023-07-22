import {
    base64Encode, log as _log, countKeys, ensureString, need, throwError
} from './utilitas.mjs';

import { getApiKeyCredentials } from './encryption.mjs';
import { input, writeFile, writeTempFile } from './storage.mjs';

const _NEED = [
    '@google-cloud/speech',
    '@google-cloud/text-to-speech',
    'whisper-node',
];

const log = (content) => _log(content, import.meta.url);
const [BUFFER, BASE64, FILE, clients, languageCode, audioEncoding, suffix, encoding]
    = ['BUFFER', 'BASE64', 'FILE', {}, 'en-US', 'OGG_OPUS', 'OGG', { encoding: 'binary' }];

const init = async (options) => {
    if (options) {
        assert(
            options?.whisper || options?.apiKey,
            'Whisper engine or Google Cloud API key is required.', 500
        );
        assert(
            options?.whisper || options?.tts || options?.stt,
            'At least one of Whisper, Google TTS or Google STT is selected.', 500
        );
        const sslCreds = await getApiKeyCredentials(options);
        if (options?.whisper) {
            clients.whisper = (await need('whisper-node')).default;
        }
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
    switch (ensureString(options?.output, { case: 'UP' })) {
        case BUFFER: case '': return response.audioContent;
        case BASE64: return base64Encode(response.audioContent, true);
        case FILE:
            if (options?.file) {
                await writeFile(options?.file, response.audioContent, encoding);
                return options?.file;
            }
            return await writeTempFile(
                response.audioContent, { ...encoding, suffix }
            );
        default: throwError('Invalid output format.', 400);
    }
};

const googleStt = async (audio, options) => {
    assert(clients.stt, 'Speech-to-Text API has not been initialized.', 500);
    assert(audio, 'Audio data is required.', 400);
    let content = await input(audio, { input: options?.input, expected: BASE64 });
    const [response] = await clients.stt.recognize({
        audio: { content, ...options?.audio || {} }, config: {
            encoding: audioEncoding, sampleRateHertz: 24000,
            languageCode, ...options?.config || {}
        },
    });
    return options?.raw ? response : response.results
        .map(result => result.alternatives[0].transcript).join('\n');
};

const whisperStt = async (audio, options) => {

};

const stt = async (audio, options) => {
    return await googleStt(audio, options);
};

export default init;
export {
    _NEED,
    init,
    googleStt,
    stt,
    tts,
};
