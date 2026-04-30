import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../index.mjs';

test('storage legalFilename', () => {
    const clean = storage.legalFilename('  my*cool?file_name  ');
    assert.equal(clean, 'my-cool-file_name');

    // Test empty string throws (based on implementation details or expectation)
    assert.throws(() => storage.legalFilename(''), {
        message: 'Invalid filename.',
    });
});

test('storage writeTempFile', async () => {
    const data = { x: 1, b: 2 };
    const tempPath = await storage.writeTempFile(data, { encoding: 'json', suffix: 'json' });
    assert.ok(tempPath.endsWith('.json'));
    const readBack = await storage.readJson(tempPath);
    assert.deepEqual(readBack, data);
});

test('storage detects file type from buffer', async () => {
    const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lY0uLgAAAABJRU5ErkJggg==',
        'base64',
    );
    assert.deepEqual(await storage.getMime(png), {
        mime: storage.MIME_PNG,
        extension: 'png',
    });
    const dataUrl = await storage.encodeBase64DataURL(null, png);
    assert.ok(dataUrl.startsWith(`data:${storage.MIME_PNG};base64,`));
});

test('storage config', async () => {
    const filename = await storage.getConfigFilename();
    assert.ok(filename, 'Config filename should be present');
    const config = { test: 'ok' };
    const setConfig = await storage.setConfig(config);
    assert.deepEqual(setConfig.config.test, config.test, 'Config should be set');
    const getConfig = await storage.getConfig();
    assert.deepEqual(getConfig.config.test, config.test, 'Config should be retrieved');
});
