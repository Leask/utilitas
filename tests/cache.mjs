import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, set, get, del, end } from '../lib/cache.mjs';
import { test } from 'node:test';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const CACHE_CONFIG = config?.cache;
const skipReason = !CACHE_CONFIG && 'cache config is missing from config.json';

test('redis cache', { skip: skipReason, timeout: 1000 * 60 }, async () => {
    await init({ ...CACHE_CONFIG, connectTimeout: 5000, maxRetriesPerRequest: 1 });
    const key = 'TEST_KEY';
    const value = { hello: 'world', timestamp: Date.now() };
    await set(key, value);
    const result = await get(key);
    assert.deepEqual(result, value, 'Cache value should match');
    await del(key);
    const deleted = await get(key);
    assert.equal(deleted, null, 'Cache value should be null after delete');
    await end();
});
