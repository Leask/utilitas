import { test } from 'node:test';
import assert from 'node:assert/strict';
import { utilitas } from '../index.mjs';

test('utilitas ensureInt', () => {
    const int = utilitas.ensureInt(1, { pad: 2 });
    assert.equal(int, '01');
});

test('utilitas range', () => {
    const range = utilitas.range(12, 3, { noBoundary: true });
    assert.deepEqual(range, [11, 10, 9, 8, 7, 6, 5, 4]);
});

test('utilitas extract', () => {
    const obj = { a: { b: { x: 111 } } };
    const val = utilitas.extract(obj, 'a', 'b', 'x');
    assert.equal(val, 111);
    
    const valNull = utilitas.extract(null, 'a', 'b', 'x');
    assert.equal(valNull, null);
});

test('utilitas ensureString', () => {
    const str = utilitas.ensureString(null);
    assert.equal(str, '');
});

test('utilitas hexEncode/Decode', () => {
    const str = 'Hello World! 🌍';
    const hex = utilitas.hexEncode(str);
    assert.equal(hex, '48656c6c6f20576f726c642120f09f8c8d');
    const decoded = utilitas.hexDecode(hex);
    assert.equal(decoded, str);
});
