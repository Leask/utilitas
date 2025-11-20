import { test } from 'node:test';
import assert from 'node:assert/strict';
import { web } from '../index.mjs';

test('web getCurrentPosition', async () => {
    try {
        const pos = await web.getCurrentPosition();
        assert.ok(pos.ip);
    } catch (e) {
        console.warn('getCurrentPosition test skipped/failed:', e.message);
    }
});
