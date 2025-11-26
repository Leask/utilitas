import '../lib/horizon.mjs';
import assert from 'node:assert/strict';
import { init, ocr } from '../lib/vision.mjs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import * as path from 'node:path';

let config = {};
try {
    config = (await import('../config.json', { with: { type: 'json' } })).default;
} catch (error) {
    config = {};
}

const samplePdf = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'test.pdf',
);

const GOOGLE_CREDENTIALS = config?.google_credentials;
const GOOGLE_PROJECT = config?.google_project;
const skipReasonGoogle = (!GOOGLE_CREDENTIALS && !GOOGLE_PROJECT) && 'google_credentials or google_project is missing from config.json';

test('mistral ocr via vertex ai', { skip: skipReasonGoogle, timeout: 1000 * 60 * 5 }, async () => {
    await init({
        provider: 'GOOGLE_MISTRAL',
        credentials: GOOGLE_CREDENTIALS,
        project: GOOGLE_PROJECT,
    });
    // https://www.princexml.com/samples/textbook/somatosensory.pdf
    const response = await ocr(samplePdf, { input: 'FILE' });
    assert.ok(response, 'Response should be present');
    assert.ok(response?.pages?.length, 'Response should have pages array');
    assert.ok(response?.pages?.[0]?.images?.length, 'Response should have images array');
});
