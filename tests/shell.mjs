import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shell } from '../index.mjs';

test('shell exec standard', async () => {
    const result = await shell.exec('echo "hello"');
    assert.equal(result, 'hello');
});

test('shell exec streaming', async () => {
    let output = '';
    const stream = (data) => { output += data.toString(); };
    await shell.exec('echo "stream"; sleep 0.1', { stream });
    assert.match(output, /stream/);
});

test('shell exec error', async () => {
    await assert.rejects(async () => {
        await shell.exec('exit 1');
    });
});

test('shell exec acceptError', async () => {
    const result = await shell.exec('echo "out"; echo "err" >&2; exit 1', { acceptError: true });
    // result should contain both stdout and stderr content joined by newline
    assert.ok(result.includes('out'));
    assert.ok(result.includes('err'));
});

test('shell exec 3000 lines limit', async () => {
    // Generate 3005 lines
    const result = await shell.exec('for i in {1..3005}; do echo "line $i"; done');
    const lines = result.split('\n');
    assert.equal(lines.length, 3000);
    assert.equal(lines[0], 'line 6');
    assert.equal(lines[2999], 'line 3005');
});
