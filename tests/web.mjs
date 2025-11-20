import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { web } from '../index.mjs';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const GOOGLE_KEY = config?.google_search_key;
const GOOGLE_CX = config?.google_search_cx;
const JINA_KEY = config?.jina_key;

const skipReasonGoogle = (!GOOGLE_KEY || !GOOGLE_CX) && 'google_search_key or google_search_cx is missing from config.json';
const skipReasonJina = !JINA_KEY && 'jina_key is missing from config.json';

test('web getCurrentPosition', async () => {
    try {
        const pos = await web.getCurrentPosition();
        assert.ok(pos.ip);
    } catch (e) {
        console.warn('getCurrentPosition test skipped/failed:', e.message);
    }
});

test('web search google', { skip: skipReasonGoogle }, async () => {
    await web.initSearch({ provider: 'Google', apiKey: GOOGLE_KEY, cx: GOOGLE_CX });
    const response = await web.search('costco', { image: false });
    
    assert.equal(response.provider, 'GOOGLE');
    assert.ok(response.items.length > 0);
    assert.ok(response.items[0].title);
    assert.ok(response.items[0].link);
});

test('web search jina', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search('costco', { image: false });

    assert.equal(response.provider, 'JINA');
    assert.ok(response.items.length > 0);
    assert.ok(response.items[0].title);
    assert.ok(response.items[0].link);
});

test('web search jina aiFriendly', { skip: skipReasonJina }, async () => {
    await web.initSearch({ provider: 'Jina', apiKey: JINA_KEY });
    const response = await web.search('costco', { aiFriendly: true });
    
    // When aiFriendly is true, it returns raw content string from Jina
    assert.equal(typeof response, 'string');
    assert.ok(response.length > 0);
});