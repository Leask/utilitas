import { alan, storage, web } from '../index.mjs';
import { fileURLToPath } from 'url';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const OPENROUTER_KEY = config?.openrouter_key;
const OPENROUTER_PRESET = config?.openrouter_preset;
const GOOGLE_KEY = config?.google_key;
const JINA_KEY = config?.jina_key;
const OPENAI_KEY = config?.openai_key;
const skipReasonOpenRouter = !OPENROUTER_KEY && 'openrouter_key is missing from config.json';
const skipReasonGoogle = !GOOGLE_KEY && 'google_key is missing from config.json';
const skipReasonOpenAI = !OPENAI_KEY && 'openai_key is missing from config.json';
const hasAlanProvider = !skipReasonOpenRouter || !skipReasonGoogle;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testJpgPath = path.join(__dirname, 'test.jpg');
const testAll = process.argv.includes('test-all') || process.env.TEST_ALL === '1';
const highCostModelIds = new Set([
    'lyria_3_pro_preview',
    'veo_3_1',
    'deep_research_max_preview_04_2026',
]);
const promptSkipModelIds = new Map([
    ['gemini_3_pro_image_preview', 'tool calling is unreliable for this model'],
]);
const smokeTool = {
    type: 'function',
    strict: true,
    function: {
        name: 'getDateTime',
        description: 'Use this function to get the current date and time.',
        parameters: {
            type: 'object',
            properties: {
                none: { type: 'string', description: 'No parameter is needed.' },
            },
            required: [],
            additionalProperties: false,
        },
    },
};
const browseWebTool = {
    type: 'function',
    strict: true,
    function: {
        name: 'browseWeb',
        description: 'Use this function to browse the web.',
        parameters: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'The URL to the page you need to access.',
                },
            },
            required: ['url'],
            additionalProperties: false,
        },
    },
};
const countToolUses = (text) => (text.match(/\nName: /g) || []).length;

if (!skipReasonOpenRouter) {
    if (JINA_KEY) {
        await web.initSearch({
            provider: 'Jina', apiKey: JINA_KEY,
        });
    }
    await alan.init({
        apiKey: OPENROUTER_KEY,
        ...OPENROUTER_PRESET ? { preset: OPENROUTER_PRESET } : {},
    });
}

if (!skipReasonGoogle) {
    await alan.init({ provider: 'Google', apiKey: GOOGLE_KEY, model: '*' });
}

// if (!skipReasonOpenAI) {
//     await alan.init({ provider: 'OpenAI', apiKey: OPENAI_KEY, model: 'gpt-5.5' });
// }

const ais = hasAlanProvider ? await alan.getAi(null, { all: true, basic: true }) : [];
const skipReasonAlan = !ais.length && 'alan models are not initialized';
const streamToolAi = ais.find(ai => ai.id === 'gpt_5_4_mini');
console.log('Alan models:', ais.map(ai => ai.id).join(', '));

describe('alan prompt by initialized model', {
    concurrency: true,
    skip: skipReasonAlan,
    timeout: 1000 * 60 * 5,
}, () => {
    for (const ai of ais) {
        const skipReasonHighCost = !testAll && highCostModelIds.has(ai.id)
            && 'high cost model; run alan test with test-all to include it';
        const skipReasonPrompt = promptSkipModelIds.get(ai.id);
        test(`prompt - ${ai.id || 'auto'}`, {
            skip: skipReasonHighCost || skipReasonPrompt,
        }, async (t) => {
            const response = await alan.prompt(
                ai.model.video
                    ? 'A blue sphere slowly rotating on a white table.'
                    : 'Use the getDateTime tool at most once. Then reply with '
                + 'a short confirmation: utilitas-ok.',
                {
                    aiId: ai.id, tools: [smokeTool],
                    ...ai.model.video ? { config: {
                        duration: 4, resolution: '720p', generate_audio: false,
                    } } : {},
                },
            );
            assert.equal(typeof response, 'object', 'Prompt should return an object');
            assert.equal(typeof response.text, 'string',
                'Prompt response should contain text');
            assert.ok(countToolUses(response.text) <= 1,
                'Prompt should use at most one tool');
            assert(response.text.length > 0 || response.audio
                || response.images?.length > 0 || response.videos?.length > 0,
                'Prompt response content should not be empty');
            if (ai.model.video) {
                assert.equal(ai.provider, 'OpenRouter');
                const video = response.videos[0];
                assert.ok(Buffer.isBuffer(video.data));
                assert.equal(video.mime_type, storage.MIME_MP4);
                assert.equal((await storage.getMime(video.data)).mime,
                    storage.MIME_MP4);
                assert.ok(video.jobId);
                t.diagnostic(`Video: ${video.jobId}, ${video.data.length} bytes`);
            }
        });
    }
});

test('alan video packaging', { skip: skipReasonOpenRouter }, async (t) => {
    const ai = await alan.getAi(null, { select: { video: true } });
    assert.equal(ai.provider, 'OpenRouter');
    assert.equal(ai.model.name, alan.VEO_31);
    const video = Buffer.from(
        '000000206674797069736f6d0000020069736f6d69736f32617663316d703431',
        'hex',
    );
    const submitted = { id: 'test-video', status: 'pending' };
    const completed = {
        ...submitted, status: 'completed', unsigned_urls: ['unused', 'unused'],
    };
    let result = completed, pending = 0;
    const requests = [];
    t.mock.method(ai.client, 'fetch', async (url, init) => {
        url = new URL(url);
        requests.push(`${init.method} ${url.pathname}`);
        const headers = new Headers(init.headers);
        assert.ok(headers.get('authorization')?.startsWith('Bearer '));
        if (init.method === 'POST') {
            assert.equal(url.pathname, '/api/v1/videos');
            assert.match(headers.get('content-type'), /application\/json/);
            const body = JSON.parse(init.body);
            assert.equal(body.model, 'google/veo-3.1');
            assert.equal(body.prompt, 'A blue sphere.');
            assert.equal(body.aspect_ratio, '16:9');
            assert.equal(body.duration, 4);
            assert.equal(body.resolution, '720p');
            assert.equal(body.generate_audio, false);
            return Response.json(submitted, { status: 202 });
        }
        if (url.pathname === '/api/v1/videos/test-video') {
            if (pending > 0) {
                pending--;
                return Response.json({ ...submitted, status: 'in_progress' });
            }
            return Response.json(result);
        }
        assert.equal(url.pathname, '/api/v1/videos/test-video/content');
        assert.ok(['0', '1'].includes(url.searchParams.get('index')));
        return new Response(video, { headers: {
            'Content-Type': storage.MIME_MP4,
        } });
    });
    const options = {
        aiId: ai.id,
        config: { duration: 4, resolution: '720p', generate_audio: false },
    };
    const events = [];
    const response = await alan.prompt('A blue sphere.', {
        ...options, stream: event => events.push(event),
    });
    assert.equal(response.text, '');
    assert.equal(response.processing, false);
    assert.match(response.model, /OpenRouter\/veo-3\.1$/);
    assert.equal(response.videos.length, 2);
    for (const item of response.videos) {
        assert.deepEqual(item, {
            data: video, mime_type: storage.MIME_MP4, jobId: 'test-video',
        });
    }
    assert.deepEqual(events, [{ ...response, processing: true }]);
    const base64 = await alan.prompt('A blue sphere.', {
        ...options, expected: storage.BASE64,
    });
    assert.equal(base64.videos[0].data, video.toString('base64'));
    const files = await alan.prompt('A blue sphere.', {
        ...options, expected: storage.FILE,
    });
    for (const { data } of files.videos) {
        t.after(() => storage.tryRm(data));
        assert.match(data, /\.mp4$/);
        assert.deepEqual(await storage.convert(data, {
            input: storage.FILE, expected: storage.BUFFER,
        }), video);
    }
    requests.length = 0;
    assert.deepEqual(await alan.prompt('A blue sphere.', {
        ...options, generateRaw: true,
    }), submitted);
    assert.deepEqual(requests, ['POST /api/v1/videos']);
    requests.length = 0;
    assert.deepEqual(await alan.prompt('A blue sphere.', {
        ...options, videoRaw: true,
    }), completed);
    assert.equal(requests.length, 2);
    for (const status of ['failed', 'cancelled', 'expired']) {
        result = { ...submitted, status, error: `Video ${status}` };
        requests.length = 0;
        await assert.rejects(alan.prompt('A blue sphere.', options), {
            message: `Video ${status}`,
        });
        assert.equal(requests.length, 2);
    }
    result = { ...completed, unsigned_urls: [] };
    await assert.rejects(alan.prompt('A blue sphere.', options), {
        message: 'Error generating content.',
    });
    await t.test('polls until completed', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        result = completed;
        pending = 1;
        requests.length = 0;
        const response = alan.prompt('A blue sphere.', options);
        await new Promise(setImmediate);
        assert.equal(requests.length, 2);
        t.mock.timers.tick(1000 * 30);
        assert.deepEqual((await response).videos[0].data, video);
        assert.equal(requests.length, 5);
    });
});

test('alan streaming tools block', {
    skip: !streamToolAi && 'gpt_5_4_mini is not initialized',
    timeout: 1000 * 60 * 2,
}, async () => {
    const streamEvents = [];
    const response = await alan.prompt(
        'Call browseWeb exactly once with url https://example.com/. '
        + 'Then reply exactly: utilitas-ok',
        {
            aiId: streamToolAi.id,
            tools: [browseWebTool],
            stream: msg => streamEvents.push(msg.text || ''),
        },
    );
    const finalStream = streamEvents.at(-1);
    const toolsBlock = [
        '```tools',
        'Name: browseWeb',
        'url: "https://example.com/"',
        'Status: OK',
        '```',
    ].join('\n');
    assert.ok(finalStream.includes(toolsBlock),
        'Stream should include the formatted tools block');
    assert.ok(response.text.includes(toolsBlock),
        'Final response should include the formatted tools block');
    assert.ok(!finalStream.includes('Description:'),
        'Stream tools block should not include tool descriptions');
    assert.ok(!finalStream.includes('Input:'),
        'Stream tools block should not include generic Input JSON');
});

test('alan distillFile', { skip: skipReasonOpenRouter, timeout: 1000 * 60 * 5 }, async () => {
    const response = await alan.distillFile(testJpgPath, { input: 'FILE' });
    assert.ok(typeof response === 'string', 'Response should be a string');
    assert.ok(response.length > 0, 'Response should not be empty');
});

test('alan talk with webpage', { skip: skipReasonOpenRouter, timeout: 1000 * 60 * 5 }, async () => {
    // Initialize chat with system prompt to avoid "Content is required" error during token counting in initChat
    await alan.initChat();
    const response = await alan.talk('https://leaskh.com what is this page about?');
    assert.equal(typeof response, 'object', 'Talk response should be an object');
    assert.ok(response.text, 'Response should have text');
    assert.ok(response.text.length > 0, 'Response text should not be empty');
    // Ensure it actually processed the URL (content should reflect prompt engineering)
    assert.ok(
        /blog|leask/i.test(response.text),
        'Response should be relevant to the URL content'
    );
});

test('alan upscale', { skip: skipReasonOpenRouter, timeout: 1000 * 60 * 5 }, async () => {
    const image = await alan.upscale(testJpgPath);
    assert.ok(Buffer.isBuffer(image), 'Upscale should return an image buffer');
    assert.ok(image.length > 0, 'Upscaled image should not be empty');
    const mime = await storage.getMime(image);
    assert.ok(
        [storage.MIME_JPEG, storage.MIME_PNG].includes(mime?.mime),
        `Unexpected upscaled image mime: ${mime?.mime}`,
    );
});

const speechText = 'a brown fox jumps over the lazy dog';
test('alan tts audio chunks', { skip: skipReasonOpenRouter }, async (t) => {
    const ai = await alan.getAi(null, { select: { audio: true, fast: true } });
    const pcm = Buffer.from([0, 0, 1, 0, 255, 127]);
    const events = [];
    t.mock.method(ai.client.chat.completions, 'create', () => {
        assert.fail('TTS must use the speech endpoint, not chat completions');
    });
    t.mock.method(ai.client.audio.speech, 'create', async request => {
        assert.equal(request.model, 'google/gemini-3.1-flash-tts-preview');
        assert.equal(request.voice, 'Kore');
        assert.equal(request.response_format, 'pcm');
        return new Response(new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(pcm.subarray(0, 2)));
                controller.enqueue(new Uint8Array(pcm.subarray(2)));
                controller.close();
            },
        }));
    });
    const audio = await alan.tts(speechText, {
        voice: 'Kore', stream: message => events.push(message),
    });
    assert.ok(Buffer.isBuffer(audio));
    assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
    assert.deepEqual(audio.subarray(44), pcm);
    assert.equal(events.length, 2);
    assert.deepEqual(events[0].audio.data.subarray(44), pcm.subarray(0, 2));
    assert.deepEqual(events[1].audio.data, audio);
    assert.deepEqual(await alan.tts(speechText, { voice: 'Kore' }), audio);
    assert.equal(await alan.tts(speechText, {
        voice: 'Kore', expected: storage.BASE64,
    }), audio.toString('base64'));
    const filename = await alan.tts(speechText, {
        voice: 'Kore', expected: storage.FILE,
    });
    assert.equal(typeof filename, 'string');
    t.after(() => storage.tryRm(filename));
    assert.match(filename, /\.wav$/);
    assert.deepEqual(await storage.convert(filename, {
        input: storage.FILE, expected: storage.BUFFER,
    }), audio);
});

test('alan tts/stt', {
    skip: skipReasonOpenRouter,
    timeout: 1000 * 60 * 5,
}, async (t) => {
    const ttsAi = await alan.getAi(null, {
        basic: true,
        select: { audio: true, fast: true },
    });
    const sttAi = await alan.getAi(null, {
        basic: true,
        select: { hearing: true, fast: true },
    });
    console.log(`TTS selected: ${ttsAi.id}; STT selected: ${sttAi.id}`);
    assert.equal(ttsAi.provider, 'OpenRouter');
    assert.equal(ttsAi.model.name, alan.GEMINI_31_FLASH_TTS);
    if (!testAll && highCostModelIds.has(ttsAi.id)) {
        t.skip('high cost TTS model selected; run alan test with test-all to include it');
        return;
    }

    const response = await alan.tts(speechText, {
        raw: true,
    });
    const audio = response?.audio?.data;
    assert.ok(Buffer.isBuffer(audio), 'TTS should return audio data');
    assert.equal(response.audio.mime_type, storage.MIME_WAV);
    assert.equal(audio.toString('ascii', 0, 4), 'RIFF');
    assert.equal(audio.toString('ascii', 8, 12), 'WAVE');
    assert.equal(audio.readUInt32LE(40), audio.length - 44);

    const transcription = await alan.stt(audio);
    assert.ok(typeof transcription === 'string', 'STT should return a string');
    t.diagnostic(`Transcription: ${transcription}`);
    assert.equal(
        transcription.toLowerCase().replace(/[^a-z\s]/g, '').trim(), speechText,
        'TTS should read the content without reading the instructions'
    );
});
