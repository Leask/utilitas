import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { alan } from '../index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const OPENROUTER_KEY = config?.openrouter_key;
const skipReason = !OPENROUTER_KEY && 'openrouter_key is missing from config.json';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testJpgPath = path.join(__dirname, 'test.jpg');

if (!skipReason) {
    before(async () => {
        await alan.init({
            apiKey: OPENROUTER_KEY,
            model: '*',
        });
    });
}

test('alan prompt auto model', { skip: skipReason, timeout: 120000 }, async () => {
    const response = await alan.prompt('Do you like me?');
    assert.equal(typeof response, 'object', 'Prompt should return an object');
    assert.equal(typeof response.text, 'string',
        'Prompt response should contain text');
    assert(response.text.length > 0,
        'Prompt response text should not be empty');
});

test('alan gemini tool calling', { skip: skipReason, timeout: 120000 }, async () => {
    const response = await alan.prompt(
        'What\'s the time?',
        { aiId: 'openrouter_google_gemini_2_5_flash_preview_09_2025' },
    );
    assert.equal(typeof response, 'object', 'Prompt should return an object');
    assert.equal(typeof response.text, 'string',
        'Prompt response should contain text');
    assert(response.text.length > 0,
        'Prompt response text should not be empty');
});

test('alan gpt tool calling', { skip: skipReason, timeout: 120000 }, async () => {
    const response = await alan.prompt(
        'What\'s the time?',
        { aiId: 'openrouter_openai_gpt_5_1' },
    );
    assert.equal(typeof response, 'object', 'Prompt should return an object');
    assert.equal(typeof response.text, 'string',
        'Prompt response should contain text');
    assert(response.text.length > 0,
        'Prompt response text should not be empty');
});

test('alan claude tool calling', { skip: skipReason, timeout: 120000 }, async () => {
    const response = await alan.prompt(
        'What\'s the time?',
        { aiId: 'openrouter_anthropic_claude_sonnet_4_5' },
    );
    assert.equal(typeof response, 'object', 'Prompt should return an object');
    assert.equal(typeof response.text, 'string',
        'Prompt response should contain text');
    assert(response.text.length > 0,
        'Prompt response text should not be empty');
});

test('alan distillFile', { skip: skipReason, timeout: 1000 * 60 * 5 }, async () => {
    // We can re-init specifically for this test if needed, but global init covers *
    const response = await alan.distillFile(testJpgPath, { input: 'FILE', aiId: 'openrouter_openai_gpt_5_1' });
    assert.ok(typeof response === 'string', 'Response should be a string');
    assert.ok(response.length > 0, 'Response should not be empty');
});

test('alan talk with webpage', { skip: skipReason, timeout: 1000 * 60 * 5 }, async () => {
    // Initialize chat with system prompt to avoid "Content is required" error during token counting in initChat
    await alan.initChat();
    const response = await alan.talk(
        'https://platform.openai.com/docs/guides/prompt-engineering 總結一下這個頁面的主要內容',
    );
    assert.equal(typeof response, 'object', 'Talk response should be an object');
    assert.ok(response.text, 'Response should have text');
    assert.ok(response.text.length > 0, 'Response text should not be empty');
    // Ensure it actually processed the URL (content should reflect prompt engineering)
    assert.ok(
        /prompt|engineering|model|instruction|summary|內容/i.test(response.text),
        'Response should be relevant to the URL content'
    );
});
