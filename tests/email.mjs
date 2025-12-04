import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, send } from '../lib/email.mjs';
import { test } from 'node:test';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const MAILGUN_CONFIG = config?.mailgun;
const MAILJET_CONFIG = config?.mailjet;
const skipReasonMailgun = !MAILGUN_CONFIG && 'mailgun config is missing from config.json';
const skipReasonMailjet = !MAILJET_CONFIG && 'mailjet config is missing from config.json';

test('send email via mailgun', { skip: skipReasonMailgun, timeout: 1000 * 60 }, async () => {
    await init(MAILGUN_CONFIG);
    const response = await send(MAILGUN_CONFIG.recipient, 'Test Email', 'This is a test email.');
    assert.ok(response, 'Response should be present');
    assert.ok(response?.id, 'Response should have an id');
});

test('send email via mailjet', { skip: skipReasonMailjet, timeout: 1000 * 60 }, async () => {
    await init(MAILJET_CONFIG);
    const response = await send(MAILJET_CONFIG.recipient, 'Test Email', 'This is a test email.');
    assert.ok(response, 'Response should be present');
    assert.ok(response?.body, 'Response should have a body');
});
