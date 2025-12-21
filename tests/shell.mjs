import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shell } from '../index.mjs';

test('shell exec standard', async () => {
    const result = await shell.exec('echo "hello"');
    assert.equal(result, 'hello');
});

test('shell exec streaming', async () => {
    let output = '';
    const stream = (data) => { output += data; };
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
