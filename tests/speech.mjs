import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { speech } from '../index.mjs';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const OPENAI_KEY = config?.openai_key;
const GOOGLE_KEY = config?.google_key;

const skipReasonOpenAI = !OPENAI_KEY && 'openai_key is missing from config.json';
const skipReasonGoogle = !GOOGLE_KEY && 'google_key is missing from config.json';

test('speech tts/stt openai', { skip: skipReasonOpenAI, timeout: 1000 * 60 }, async () => {
    await speech.init({ provider: 'OpenAI', tts: true, stt: true, apiKey: OPENAI_KEY });
    const audio = await speech.tts('testing, this is a test.', { expected: 'BUFFER' });
    assert.ok(Buffer.isBuffer(audio), 'Audio should be a buffer');
    assert.ok(audio.length > 0, 'Audio should not be empty');
    const text = await speech.stt(audio, { input: 'BUFFER' });
    assert.ok(typeof text === 'string', 'Text should be a string');
    assert.ok(text.length > 0, 'Text should not be empty');
});

test('speech tts/stt google', { skip: skipReasonGoogle, timeout: 1000 * 60 * 5 }, async () => {
    await speech.init({ provider: 'Google', tts: true, stt: true, apiKey: GOOGLE_KEY });
    const audio = await speech.tts('testing, this is a test.', { expected: 'BUFFER' });
    assert.ok(Buffer.isBuffer(audio), 'Audio should be a buffer');
    assert.ok(audio.length > 0, 'Audio should not be empty');
    const text = await speech.stt(audio, { input: 'BUFFER' });
    assert.ok(typeof text === 'string', 'Text should be a string');
    assert.ok(text.length > 0, 'Text should not be empty');
});
