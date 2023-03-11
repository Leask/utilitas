import {
    base64Encode, log as _log, countKeys, ensureString, need
} from './utilitas.mjs';

import { readFile, writeFile, writeTempFile } from './storage.mjs';

const _NEED = ['@google-cloud/speech', '@google-cloud/text-to-speech'];
const log = (content) => _log(content, import.meta.url);
const [clients, languageCode, audioEncoding, suffix, encoding]
    = [{}, 'en-US', 'OGG_OPUS', 'OGG', { encoding: 'binary' }];

const getApiKeyCredentials = async (options) => {
    // Included in @google-cloud/speech or @google-cloud/text-to-speech
    const { GoogleAuth, grpc } = await need('google-gax');
    const authClient = new GoogleAuth().fromAPIKey(options?.apiKey);
    return grpc.credentials.combineChannelCredentials(
        grpc.credentials.createSsl(),
        grpc.credentials.createFromGoogleCredential(authClient)
    );
};

const init = async (options) => {
    if (options) {
        assert(options?.apiKey, 'Google Cloud API Key is required.', 500);
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
        input: { text },
        voice: { languageCode, name: 'en-US-Wavenet-F', ...options || {} },
        audioConfig: { audioEncoding },
    });
    switch (ensureString(options?.output, { case: 'UP' })) {
        case 'BASE64':
            return base64Encode(response.audioContent, true);
        case 'FILE':
            if (options?.file) {
                await writeFile(options?.file, response.audioContent, encoding);
                return options?.file;
            }
            return await writeTempFile(
                response.audioContent, { ...encoding, suffix }
            );
    }
    return response.audioContent;
};

const stt = async (audioFile, options) => {
    assert(clients.stt, 'Speech-to-Text API has not been initialized.', 500);
    assert(audioFile, 'Audio file is required.', 400);
    const content = await readFile(audioFile, { encoding: 'base64' });
    const [response] = await clients.stt.recognize({
        audio: { content },
        config: { encoding: audioEncoding, sampleRateHertz: 24000, languageCode },
    });
    return options?.raw ? response : response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
};

export default init;
export {
    _NEED,
    init,
    tts,
    stt,
};
