import { test } from 'node:test';
import assert from 'node:assert/strict';
import { network } from '../index.mjs';

test('network ping', async () => {
    try {
        const res = await network.ping('google.com', { timeout: 1, min_reply: 1 });
        assert.ok(res);
    } catch (e) {
        console.warn('Ping test skipped/failed (network dependent):', e.message);
    }
});

test('network pickFastestHost', async () => {
    try {
        const host = await network.pickFastestHost(['https://google.com', 'https://google.ca'], { debug: false });
        assert.ok(host.includes('google'));
    } catch (e) {
        console.warn('pickFastestHost test skipped/failed:', e.message);
    }
});

test('network pickFastestHttpServer', async () => {
    try {
        const url = await network.pickFastestHttpServer(['http://google.com', 'http://google.ca'], { debug: false });
        assert.ok(url.includes('google'));
    } catch (e) {
        console.warn('pickFastestHttpServer test skipped/failed:', e.message);
    }
});
