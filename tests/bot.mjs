import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, send, end } from '../lib/bot.mjs';
import { test } from 'node:test';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const TELEGRAM_CONFIG = config?.telegram;
const skipReason = !TELEGRAM_CONFIG && 'telegram config is missing from config.json';

test('send telegram message', { skip: skipReason, timeout: 1000 * 60 }, async () => {
    await init({ ...TELEGRAM_CONFIG, provider: 'TELEGRAM' });
    const response = await send(TELEGRAM_CONFIG.chatId, 'A brown fox jumps over the lazy dog.');
    assert.ok(response, 'Response should be present');
    assert.ok(response?.message_id, 'Response should have a message_id');
    await end();
});
