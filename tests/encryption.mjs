import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as utilitas from '../index.mjs';

const testFile = path.join(import.meta.dirname, 'test.jpg');

test('encryption sha256File', async () => {
    const hash = await utilitas.encryption.sha256File(testFile);
    assert.equal(typeof hash, 'string', 'Hash should be a string');
    assert.equal(hash.length, 64, 'SHA256 hash should be 64 characters long');
    assert.match(hash, /^[a-f0-9]{64}$/, 'Hash should be a hex string');
});

test('encryption sha256 string', () => {
    const hash = utilitas.encryption.sha256('hello world');
    assert.equal(hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
});

test('encryption md5 string', () => {
    const hash = utilitas.encryption.md5('hello world');
    assert.equal(hash, '5eb63bbbe01eeed093cb22bb8f5acdc3');
});

test('encryption randomString', () => {
    const str = utilitas.encryption.randomString(10);
    assert.equal(str.length, 10);
    const strHex = utilitas.encryption.randomString(10, 'HEX');
    assert.match(strHex, /^[a-f0-9]{10}$/i);
});

test('encryption uniqueString', () => {
    const str1 = utilitas.encryption.uniqueString('a');
    const str2 = utilitas.encryption.uniqueString('b');
    assert.equal(typeof str1, 'string');
    assert.notEqual(str1, str2, 'Unique strings should differ for different inputs');
    const machineId = utilitas.encryption.uniqueString();
    assert.equal(typeof machineId, 'string');
});

test('encryption aes', () => {
    const text = 'secret message';
    const encrypted = utilitas.encryption.aesEncrypt(text);
    assert.ok(encrypted.key, 'Should return key');
    assert.ok(encrypted.iv, 'Should return IV');
    assert.ok(encrypted.encrypted, 'Should return encrypted data');
    assert.ok(encrypted.authTag, 'Should return authTag');

    const decrypted = utilitas.encryption.aesDecrypt(encrypted.encrypted, {
        key: encrypted.key,
        iv: encrypted.iv,
        authTag: encrypted.authTag
    });
    assert.equal(decrypted, text, 'Decrypted text should match original');
});
