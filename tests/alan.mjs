import { alan, web } from '../index.mjs';
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
const OPENAI_KEY = config?.openai_key;
const GOOGLE_CREDENTIALS = config?.google_credentials;
const GOOGLE_PROJECT = config?.google_project;
const skipReasonOpenRouter = !OPENROUTER_KEY && 'openrouter_key is missing from config.json';
const skipReasonGoogle = !GOOGLE_KEY && 'google_key is missing from config.json';
const skipReasonOpenAI = !OPENAI_KEY && 'openai_key is missing from config.json';
const skipReasonVertex = (!GOOGLE_CREDENTIALS || !GOOGLE_PROJECT)
    && 'google_credentials or google_project is missing from config.json';
const hasAlanProvider = !skipReasonOpenRouter || !skipReasonGoogle
    || !skipReasonVertex;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testJpgPath = path.join(__dirname, 'test.jpg');
const testAll = process.argv.includes('test-all') || process.env.TEST_ALL === '1';
const highCostModelIds = new Set([
    'lyria_3_pro_preview',
    'veo_3_1_generate_preview',
    'deep_research_max_preview_04_2026',
    'imagen_4_0_upscale_preview',
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
const countToolUses = (text) => (text.match(/\nName: /g) || []).length;

if (!skipReasonOpenRouter) {
    if (config.google_key && config.google_cx) {
        await web.initSearch({
            provider: 'Google', apiKey: config.google_key, cx: config.google_cx
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

if (!skipReasonVertex) {
    await alan.init({
        provider: 'Vertex',
        credentials: GOOGLE_CREDENTIALS,
        project: GOOGLE_PROJECT,
        model: '*',
    });
}

// if (!skipReasonOpenAI) {
//     await alan.init({ provider: 'OpenAI', apiKey: OPENAI_KEY, model: 'gpt-5.5' });
// }

const ais = hasAlanProvider ? await alan.getAi(null, { all: true, basic: true }) : [];
const skipReasonAlan = !ais.length && 'alan models are not initialized';
console.log('Alan models:', ais.map(ai => ai.id).join(', '));

describe('alan prompt by initialized model', {
    concurrency: true,
    skip: skipReasonAlan,
    timeout: 1000 * 60 * 5,
}, () => {
    for (const ai of ais) {
        const skipReasonHighCost = !testAll && highCostModelIds.has(ai.id)
            && 'high cost model; run alan test with test-all to include it';
        test(`prompt - ${ai.id || 'auto'}`, {
            skip: skipReasonHighCost,
        }, async () => {
            const response = await alan.prompt(
                'Use the getDateTime tool at most once. Then reply with '
                + 'a short confirmation: utilitas-ok.',
                { aiId: ai.id, tools: [smokeTool] },
            );
            assert.equal(typeof response, 'object', 'Prompt should return an object');
            assert.equal(typeof response.text, 'string',
                'Prompt response should contain text');
            assert.ok(countToolUses(response.text) <= 1,
                'Prompt should use at most one tool');
            assert(response.text.length > 0 || response.audio
                || response.images?.length > 0 || response.videos?.length > 0,
                'Prompt response content should not be empty');
        });
    }
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

const speechText = 'a brown fox jumps over the lazy dog';
const speechPrompt = `Read exactly and only this sentence aloud: ${speechText}.`;
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
    if (!testAll && highCostModelIds.has(ttsAi.id)) {
        t.skip('high cost TTS model selected; run alan test with test-all to include it');
        return;
    }

    const response = await alan.tts(speechPrompt, {
        raw: true,
    });
    const audio = response?.audio?.data;
    assert.ok(audio, 'TTS should return audio data');

    const transcription = await alan.stt(audio);
    assert.ok(typeof transcription === 'string', 'STT should return a string');
    assert.match(
        transcription.toLowerCase(), /fox|dog/,
        'Transcription should match original text'
    );
});
