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
const GOOGLE_KEY = config?.google_key;
const OPENAI_KEY = config?.openai_key;
const skipReasonOpenRouter = !OPENROUTER_KEY && 'openrouter_key is missing from config.json';
const skipReasonGoogle = !GOOGLE_KEY && 'google_key is missing from config.json';
const skipReasonOpenAI = !OPENAI_KEY && 'openai_key is missing from config.json';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testJpgPath = path.join(__dirname, 'test.jpg');

if (!skipReasonOpenRouter) {
    if (config.google_key && config.google_cx) {
        await web.initSearch({
            provider: 'Google',
            apiKey: config.google_key,
            cx: config.google_cx
        });
    }
    await alan.init({
        apiKey: OPENROUTER_KEY,
        model: '*',
    });
}

if (!skipReasonGoogle) {
    await alan.init({
        provider: 'Google',
        apiKey: GOOGLE_KEY,
        model: '*',
    });
}

if (!skipReasonOpenAI) {
    await alan.init({
        provider: 'OpenAI',
        apiKey: OPENAI_KEY,
        model: '*',
    });
}

const ais = !skipReasonOpenRouter ? await alan.getAi(null, { all: true, basic: true }) : [];

describe('prompt with tool calling', { concurrency: true, skip: skipReasonOpenRouter, timeout: 1000 * 60 * 5 }, () => {
    for (const ai of [{ id: null }, ...ais]) {
        test(`prompt - ${ai.id || 'auto'}`, async () => {
            const response = await alan.prompt(
                'What\'s the time?',
                { aiId: ai.id },
            );
            assert.equal(typeof response, 'object', 'Prompt should return an object');
            assert.equal(typeof response.text, 'string',
                'Prompt response should contain text');
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

test('alan initChat', { skip: skipReasonOpenRouter, timeout: 120000 }, async () => {
    const response = await alan.initChat();
    assert.equal(typeof response, 'object', 'initChat should return an object');
    assert.ok(response.chatConfig, 'response should have chatConfig');
    assert.ok(response.ais, 'response should have ais');
});

test('alan tts/stt', { skip: skipReasonGoogle || skipReasonOpenAI, timeout: 1000 * 60 * 5 }, async () => {
    const text = 'a brown fox jumps over the lazy dog';
    const audio = await alan.tts(text);
    assert.ok(audio, 'TTS should return audio data');

    const transcription = await alan.stt(audio);
    assert.ok(typeof transcription === 'string', 'STT should return a string');
    assert.match(
        transcription.toLowerCase(), /fox|dog/,
        'Transcription should match original text'
    );
});
