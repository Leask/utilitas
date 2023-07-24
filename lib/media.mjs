import { getTempPath } from './storage.mjs';
import { need } from './utilitas.mjs';
import { randomString } from './encryption.mjs';

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


// Suitable for Whisper AI models: https://github.com/ggerganov/whisper.cpp
// > ffmpeg -i input.mp3 -ar 16000 -ac 1 -c:a pcm_s16le output.wav
const convertAudioTo16kNanoWave = async (input, options) => {
    assert(input, 'Invalid audio input.', 400);
    const output = options?.output || getTempPath({ sub: `${randomString()}.wav` });
    const conv = (await getFfmpeg(input))
        .audioFrequency(16000)
        .audioChannels(1)
        .audioCodec('pcm_s16le');
    await new Promise((resolve, reject) => {
        conv.on('error', reject); // (err, stdout, stderr)
        conv.on('end', resolve);
        conv.save(output);
    });
    return output;
};

export {
    _NEED,
    convertAudioTo16kNanoWave,
    getFfmpeg,
};
