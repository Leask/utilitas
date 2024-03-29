import { getTempPath } from './storage.mjs';
import { hash } from './encryption.mjs';
import { need } from './utilitas.mjs';

const _NEED = [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe',
];

// https://codex.so/ffmpeg-node-js
const getFfmpeg = async (options) => {
    const ffmpeg = await need('fluent-ffmpeg');
    ffmpeg.setFfmpegPath((await need('@ffmpeg-installer/ffmpeg')).path);
    ffmpeg.setFfprobePath((await need('@ffprobe-installer/ffprobe')).path);
    return new ffmpeg(options);
};

const convertAudio = async (input, options) => {
    assert(input, 'Invalid audio input.', 400);
    const conv = await getFfmpeg(input);
    const output = options?.output || getTempPath({
        sub: options?.suffix
            ? `${hash(JSON.stringify({ input, options }))}.${options.suffix}`
            : null,
    });
    options?.frequency && conv.audioFrequency(options.frequency);
    options?.channels && conv.audioChannels(options.channels);
    options?.codec && conv.audioCodec(options?.codec);
    await new Promise((resolve, reject) => {
        conv.on('error', reject); // (err, stdout, stderr)
        conv.on('end', resolve);
        conv.save(output);
    });
    return output;
};

// Suitable for Whisper AI models: https://github.com/ggerganov/whisper.cpp
// > ffmpeg -i input.mp3 -ar 16000 -ac 1 -c:a pcm_s16le output.wav
const convertAudioTo16kNanoPcmWave = (input, options) => convertAudio(input, {
    channels: 1, codec: 'pcm_s16le', frequency: 16000, suffix: 'wav',
    ...options || {},
});

// Suitable for Telegram Voice: https://core.telegram.org/bots/api#sendvoice
// https://stackoverflow.com/questions/44615991/how-convert-ogg-file-to-telegram-voice-format
// ffmpeg -i input.mp3 -vn -acodec libopus -b:a 16k audio.ogg
const convertAudioTo16kNanoOpusOgg = (input, options) => convertAudio(input, {
    channels: 1, codec: 'libopus', frequency: 48000, suffix: 'ogg',
    ...options || {},
});

export {
    _NEED,
    convertAudioTo16kNanoOpusOgg,
    convertAudioTo16kNanoPcmWave,
    getFfmpeg,
};
