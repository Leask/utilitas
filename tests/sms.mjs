import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, send } from '../lib/sms.mjs';
import { test } from 'node:test';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const TWILIO_CONFIG = config?.twilio;
const TELESIGN_CONFIG = config?.telesign;
const skipReasonTwilio = !TWILIO_CONFIG && 'twilio config is missing from config.json';
const skipReasonTelesign = !TELESIGN_CONFIG && 'telesign config is missing from config.json';

test('send sms via twilio', { skip: skipReasonTwilio, timeout: 1000 * 60 }, async () => {
    await init(TWILIO_CONFIG);
    const response = await send(TWILIO_CONFIG.recipient, 'testing message via twilio!');
    assert.ok(response, 'Response should be present');
    assert.ok(response?.sid, 'Response should have a sid');
});

test('send sms via telesign', { skip: skipReasonTelesign, timeout: 1000 * 60 }, async () => {
    await init(TELESIGN_CONFIG);
    const response = await send(TELESIGN_CONFIG.recipient, 'testing message via telesign!');
    assert.ok(response, 'Response should be present');
    assert.ok(response?.reference_id, 'Response should have a reference_id');
});
