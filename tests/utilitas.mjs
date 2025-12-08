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
    const distilled = utilitas.distill(obj, true);

    assert.equal(distilled.a, 123);
    assert.equal(distilled.b, undefined);
    assert.equal(distilled.r, undefined);
    assert.deepEqual(distilled.c, { x: 1, y: [{ a: 1, b: '1111' }] });
    assert.equal(distilled.x, undefined);
});

test('utilitas ensureString case', () => {
    const x = utilitas.ensureString('asdfasdfa', { case: 'up' });
    assert.equal(x, 'ASDFASDFA');
});

test('utilitas ensureDate', () => {
    const validDateStr = "2020-09-26T15:31:53.500Z";
    const x = utilitas.ensureDate(validDateStr, { asUnixtime: true });
    assert.equal(x, 1601134314);
});

test('utilitas mapKeys', () => {
    const obj = { a: 1, b: 2, c: { a: { asdfasdf: '1' } } };
    const mapped1 = utilitas.mapKeys(obj, { a: 'z', b: 'x', c: 'c_mapped' });
    assert.equal(mapped1.z, 1);
    assert.equal(mapped1.x, 2);
    assert.ok(mapped1.c_mapped);
    assert.equal(mapped1.c_mapped.z.asdfasdf, '1');

    const obj2 = { a: 1, b: 2, c: { a: { a: '1' } } };
    const mapped2 = utilitas.mapKeys(obj2, (key, val, path) => {
        return key + '___';
    });
    assert.equal(mapped2.a___, 1);
    assert.equal(mapped2.b___, 2);
    assert.equal(mapped2.c___.a___.a___, '1');
});

test('utilitas purgeEmoji', () => {
    const noEmoji = utilitas.purgeEmoji('***?!*...***', 'asdfasdf');
    assert.equal(noEmoji, '***?!*...***');

    const withEmoji = 'Hello 🌍';
    const purged = utilitas.purgeEmoji(withEmoji, '');
    assert.equal(purged.trim(), 'Hello');
});

test('utilitas ignoreErrFunc', async () => {
    const res = await utilitas.ignoreErrFunc(() => { throw new Error('fail'); });
    assert.equal(res, undefined);

    const res2 = await utilitas.ignoreErrFunc(() => 42);
    assert.equal(res2, 42);
});

test('utilitas log', () => {
    utilitas.log([1, 2, 3], 'F');
});

test('utilitas tryUntil', async () => {
    let count = 0;
    const result = await utilitas.tryUntil(async () => {
        count++;
        return count;
    }, {
        verify: async (_, r) => r === 2,
        interval: 10
    });
    assert.equal(result, 2);
    assert.equal(count, 2);
});

test('utilitas rotate', () => {
    const rotated = utilitas.rotate('1234567aaa', 2, { case: 'UP' });
    assert.equal(rotated, '34567AAA12');
});

test('utilitas renderBox', () => {
    const content = [
        'Mission: Explore the galaxy 🚀',
        'Status: All systems functional ✅',
        'Crew: 42 brave souls 👩‍🚀',
        'Next Stop: Mars Colony Alpha 🔴',
        'Quote: "To infinity and beyond!" ✨'
    ];
    const box = utilitas.renderBox(content, { title: 'Starship Log', noWrap: false });

    assert.ok(typeof box === 'string');
    assert.ok(box.includes('Starship Log'));
    assert.ok(box.includes('Mission: Explore the galaxy 🚀'));
    assert.ok(box.includes('╭')); // default style 'round' uses this corner
    assert.ok(box.includes('╯'));
});

test('utilitas uptime', () => {
    const uptime = utilitas.uptime();
    assert.match(uptime, /^(🕛|🕧|🕐|🕜|🕑|🕝|🕒|🕞|🕓|🕟|🕔|🕠|🕕|🕡|🕖|🕢|🕗|🕣|🕘|🕤|🕙|🕥|🕚|🕦)+ [\d]{2}:[\d]{2} up ([\d]+ days?, )?[\d]{2}:[\d]{2}:[\d]{2}$/u);
});
