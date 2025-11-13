import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import * as utilitas from '../index.mjs';
import config from '../config.json' with { type: 'json' };

const { openrouter_key: OPENROUTER_KEY } = config ?? {};
const skipReason = !OPENROUTER_KEY
    && 'openrouter_key is missing from config.json';

if (!skipReason) {
    before(async () => {
        await utilitas.alan.init({
            apiKey: OPENROUTER_KEY,
            model: '*',
        });
    });
}

test('tool calling', { skip: skipReason, timeout: 120000 }, async () => {
    const response = await utilitas.alan.prompt(
        'What\'s the time?',
        { aiId: 'openrouter_google_gemini_2_5_flash_preview_09_2025' },
    );
    assert.equal(typeof response, 'object', 'Prompt should return an object');
    assert.equal(typeof response.text, 'string',
        'Prompt response should contain text');
    assert(response.text.length > 0,
        'Prompt response text should not be empty');
});
