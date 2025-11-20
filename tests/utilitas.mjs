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

test('utilitas distill', () => {
    const obj = {
        a: 123,
        x: [{ a: [{ x: [{}] }] }],
        b: undefined,
        r: null,
        c: { x: 1, y: [{ a: 1, b: '1111' }] }
    };
    // distill(obj, true) should remove undefined and null (strict mode)
    // It also recursively cleans arrays and objects.
    // x[0].a[0].x[0] is {}, which might be kept or removed depending on exact logic of distill for empty objects?
    // Let's check the behavior. Based on typical distill:
    const distilled = utilitas.distill(obj, true);
    
    assert.equal(distilled.a, 123);
    assert.equal(distilled.b, undefined);
    assert.equal(distilled.r, undefined); // null is removed in strict mode if isSet checks for null
    assert.deepEqual(distilled.c, { x: 1, y: [{ a: 1, b: '1111' }] });
    // Verify x is undefined because it recursively became empty
    assert.equal(distilled.x, undefined);
});

test('utilitas ensureString case', () => {
    const x = utilitas.ensureString('asdfasdfa', { case: 'up' });
    assert.equal(x, 'ASDFASDFA');
});

test('utilitas ensureDate', () => {
    // "2020-09-26T15:31:53.500Z" -> 1601134313500 ms -> 1601134313.5 s -> round -> 1601134314
    const validDateStr = "2020-09-26T15:31:53.500Z";
    const x = utilitas.ensureDate(validDateStr, { asUnixtime: true });
    assert.equal(x, 1601134314);
});

test('utilitas mapKeys', () => {
    const obj = { a: 1, b: 2, c: { a: { asdfasdf: '1' } } };
    
    // Map with object
    const mapped1 = utilitas.mapKeys(obj, { a: 'z', b: 'x', c: 'c_mapped' });
    assert.equal(mapped1.z, 1);
    assert.equal(mapped1.x, 2);
    // Nested keys are NOT automatically remapped by top-level map unless recursion handles it?
    // The mapKeys function recursively calls itself.
    // But the map object provided is { a: 'z', ... }.
    // When mapping c.a, it looks up 'a' in the map -> 'z'.
    assert.ok(mapped1.c_mapped);
    assert.equal(mapped1.c_mapped.z.asdfasdf, '1');

    // Map with function
    const obj2 = { a: 1, b: 2, c: { a: { a: '1' } } };
    const mapped2 = utilitas.mapKeys(obj2, (key, val, path) => {
        return key + '___';
    });
    assert.equal(mapped2.a___, 1);
    assert.equal(mapped2.b___, 2);
    assert.equal(mapped2.c___.a___.a___, '1');
});

test('utilitas purgeEmoji', () => {
    // The example '***?!*...***' has no emojis.
    const noEmoji = utilitas.purgeEmoji('***?!*...***', 'asdfasdf');
    assert.equal(noEmoji, '***?!*...***');
    
    const withEmoji = 'Hello 🌍';
    const purged = utilitas.purgeEmoji(withEmoji, '');
    assert.equal(purged.trim(), 'Hello');
});
