import '../lib/horizon.mjs';
import { timeout } from '../lib/utilitas.mjs';
import { init as initTape, end as endTape } from '../lib/tape.mjs';
import { init as initBot, end as endBot } from '../lib/bot.mjs';
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
    await initBot({ ...TELEGRAM_CONFIG, provider: 'TELEGRAM' });
    await initTape({ provider: 'bot', chatId: TELEGRAM_CONFIG.chatId, level: 'verbose', redirect: true });
    console.log('A brown fox jumps over the lazy dog.');
    await endTape();
    await timeout(1000 * 1.5);
    await endBot();
});
