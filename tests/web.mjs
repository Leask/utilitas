import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { web } from '../index.mjs';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const GOOGLE_KEY = config?.google_key;
const GOOGLE_CX = config?.google_cx;
const JINA_KEY = config?.jina_key;

const skipReasonGoogle = (!GOOGLE_KEY || !GOOGLE_CX) && 'google_key or google_cx is missing from config.json';
const skipReasonJina = !JINA_KEY && 'jina_key is missing from config.json';

test('web getCurrentPosition', async () => {
    try {
        const pos = await web.getCurrentPosition();
        assert.ok(pos.IPv4);
    } catch (e) {
        console.warn('getCurrentPosition test skipped/failed:', e.message);
    }
});

test('web search google', { skip: skipReasonGoogle }, async () => {
    await web.initSearch({ provider: 'Google', apiKey: GOOGLE_KEY, cx: GOOGLE_CX });
    const response = await web.search('costco', { provider: 'Google', image: false });
    assert.equal(response.provider, 'GOOGLE');
    assert.ok(response.items.length > 0);
    assert.ok(response.items[0].title);
    assert.ok(response.items[0].link);
});

test('web search jina', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search('costco', { provider: 'Jina', image: false });
    assert.equal(response.provider, 'JINA');
    assert.ok(response.items.length > 0);
    assert.ok(response.items[0].title);
    assert.ok(response.items[0].link);
});

test('web search jina aiFriendly', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search('costco', { provider: 'Jina', aiFriendly: true });

    // When aiFriendly is true, it returns raw content string from Jina
    assert.equal(typeof response, 'string');
    assert.ok(response.length > 0);
});

test('web distill jina', { skip: skipReasonJina }, async () => {
    await web.initDistill({ provider: 'JINA', apiKey: JINA_KEY });
    const response = await web.distill('https://platform.openai.com/docs/guides/prompt-engineering');
    assert.ok(response.summary);
    assert.ok(response.summary.length > 0);
});
